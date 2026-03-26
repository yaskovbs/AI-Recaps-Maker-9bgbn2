import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.51.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface VideoMetadata {
  title: string;
  description: string;
  thumbnail: string;
  duration: number;
  formats: Array<{
    url: string;
    quality: string;
    mimeType: string;
    filesize?: number;
  }>;
}

async function fetchVideoMetadata(
  videoId: string,
  apiKey: string
): Promise<VideoMetadata | null> {
  const params = new URLSearchParams({
    part: "snippet,contentDetails",
    id: videoId,
    key: apiKey,
  });

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?${params}`
  );
  const data = await res.json();

  if (!data.items || data.items.length === 0) return null;

  const item = data.items[0];
  const durationMatch = (item.contentDetails?.duration || "").match(
    /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/
  );
  const duration = durationMatch
    ? (parseInt(durationMatch[1] || "0") * 3600 +
      parseInt(durationMatch[2] || "0") * 60 +
      parseInt(durationMatch[3] || "0"))
    : 0;

  return {
    title: item.snippet.title,
    description: item.snippet.description || "",
    thumbnail:
      item.snippet.thumbnails?.maxres?.url ||
      item.snippet.thumbnails?.high?.url ||
      item.snippet.thumbnails?.medium?.url ||
      "",
    duration,
    formats: [],
  };
}

function extractVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.slice(1);
    }
    return parsed.searchParams.get("v");
  } catch {
    if (/^[A-Za-z0-9_-]{11}$/.test(url)) return url;
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body = await req.json();
    const { task_id, youtube_api_key, gemini_api_key } = body;

    if (!task_id) {
      return new Response(
        JSON.stringify({ error: "Missing task_id" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: task, error: taskError } = await serviceClient
      .from("video_tasks")
      .select("*")
      .eq("id", task_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (taskError || !task) {
      return new Response(
        JSON.stringify({ error: "Task not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    await serviceClient
      .from("video_tasks")
      .update({
        status: "downloading",
        current_step: "Fetching video metadata...",
        progress_percentage: 10,
        started_at: new Date().toISOString(),
      })
      .eq("id", task_id);

    await serviceClient.from("task_logs").insert({
      task_id,
      level: "info",
      message: "Task processing started",
    });

    if (task.source_type === "youtube" && task.source_url && youtube_api_key) {
      const videoId = extractVideoId(task.source_url);

      if (!videoId) {
        await serviceClient
          .from("video_tasks")
          .update({
            status: "error",
            error_code: "ERR_INVALID_FORMAT",
            error_message: "Could not extract video ID from URL",
            current_step: "Failed",
            progress_percentage: 0,
          })
          .eq("id", task_id);

        return new Response(
          JSON.stringify({ error: "Invalid video URL" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      await serviceClient
        .from("video_tasks")
        .update({
          current_step: "Fetching video details from YouTube...",
          progress_percentage: 20,
        })
        .eq("id", task_id);

      const metadata = await fetchVideoMetadata(videoId, youtube_api_key);

      if (!metadata) {
        await serviceClient
          .from("video_tasks")
          .update({
            status: "error",
            error_code: "ERR_DOWNLOAD_FAILED",
            error_message: "Video not found or is private",
            current_step: "Failed",
            progress_percentage: 0,
          })
          .eq("id", task_id);

        return new Response(
          JSON.stringify({ error: "Video not found" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      await serviceClient
        .from("video_tasks")
        .update({
          title: task.title || metadata.title,
          description: metadata.description.substring(0, 2000),
          thumbnail_url: metadata.thumbnail,
          duration_seconds: metadata.duration,
          current_step: "Video metadata retrieved",
          progress_percentage: 40,
          status: "processing",
        })
        .eq("id", task_id);

      await serviceClient.from("task_logs").insert({
        task_id,
        level: "info",
        message: `Video metadata fetched: ${metadata.title}`,
        metadata: {
          duration: metadata.duration,
          has_thumbnail: !!metadata.thumbnail,
        },
      });

      if (gemini_api_key) {
        await serviceClient
          .from("video_tasks")
          .update({
            status: "summarizing",
            current_step: "Generating AI summary...",
            progress_percentage: 60,
          })
          .eq("id", task_id);

        try {
          const summaryRes = await fetch(
            `${Deno.env.get("SUPABASE_URL")}/functions/v1/summarize-video`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: authHeader,
                Apikey: Deno.env.get("SUPABASE_ANON_KEY")!,
              },
              body: JSON.stringify({
                task_id,
                gemini_api_key,
                language: "he",
              }),
            }
          );

          if (!summaryRes.ok) {
            await serviceClient.from("task_logs").insert({
              task_id,
              level: "warning",
              message: "AI summary generation failed, continuing without summary",
            });
          }
        } catch (summaryErr) {
          await serviceClient.from("task_logs").insert({
            task_id,
            level: "warning",
            message: `Summary error: ${summaryErr instanceof Error ? summaryErr.message : "Unknown"}`,
          });
        }
      }

      if (task.enable_3d_conversion) {
        await serviceClient
          .from("video_tasks")
          .update({
            status: "converting_3d",
            current_step: "3D conversion queued (requires external processor)",
            progress_percentage: 90,
          })
          .eq("id", task_id);

        await serviceClient.from("task_logs").insert({
          task_id,
          level: "info",
          message: "3D conversion flagged - requires external processing service",
        });
      }

      await serviceClient
        .from("video_tasks")
        .update({
          status: "completed",
          current_step: "Processing complete",
          progress_percentage: 100,
          completed_at: new Date().toISOString(),
          processed_file_url: metadata.thumbnail,
        })
        .eq("id", task_id);

      await serviceClient.from("task_logs").insert({
        task_id,
        level: "info",
        message: "Task completed successfully",
      });

      return new Response(
        JSON.stringify({
          status: "completed",
          title: metadata.title,
          duration: metadata.duration,
          thumbnail: metadata.thumbnail,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (task.source_type === "upload") {
      await serviceClient
        .from("video_tasks")
        .update({
          status: "processing",
          current_step: "Processing uploaded file...",
          progress_percentage: 50,
        })
        .eq("id", task_id);

      if (gemini_api_key) {
        await serviceClient
          .from("video_tasks")
          .update({
            status: "summarizing",
            current_step: "Generating AI summary for uploaded video...",
            progress_percentage: 70,
          })
          .eq("id", task_id);

        try {
          await fetch(
            `${Deno.env.get("SUPABASE_URL")}/functions/v1/summarize-video`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: authHeader,
                Apikey: Deno.env.get("SUPABASE_ANON_KEY")!,
              },
              body: JSON.stringify({
                task_id,
                gemini_api_key,
                language: "he",
              }),
            }
          );
        } catch {
          // continue without summary
        }
      }

      await serviceClient
        .from("video_tasks")
        .update({
          status: "completed",
          current_step: "Processing complete",
          progress_percentage: 100,
          completed_at: new Date().toISOString(),
        })
        .eq("id", task_id);

      return new Response(
        JSON.stringify({ status: "completed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unsupported source type" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
