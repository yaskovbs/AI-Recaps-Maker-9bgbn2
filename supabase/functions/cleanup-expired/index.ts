import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.51.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: expiredTasks, error: queryError } = await serviceClient
      .from("video_tasks")
      .select("id, user_id, original_file_url, processed_file_url")
      .lt("expires_at", new Date().toISOString())
      .neq("status", "expired");

    if (queryError) {
      throw new Error(`Query error: ${queryError.message}`);
    }

    if (!expiredTasks || expiredTasks.length === 0) {
      return new Response(
        JSON.stringify({ message: "No expired tasks found", cleaned: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let cleaned = 0;
    const errors: string[] = [];

    for (const task of expiredTasks) {
      try {
        const filePaths: string[] = [];

        if (
          task.original_file_url &&
          task.original_file_url.includes("supabase")
        ) {
          const path = extractStoragePath(task.original_file_url);
          if (path) filePaths.push(path);
        }

        if (
          task.processed_file_url &&
          task.processed_file_url.includes("supabase")
        ) {
          const path = extractStoragePath(task.processed_file_url);
          if (path) filePaths.push(path);
        }

        for (const filePath of filePaths) {
          const bucket = filePath.startsWith("video-originals")
            ? "video-originals"
            : "video-processed";
          const objectPath = filePath.replace(`${bucket}/`, "");

          await serviceClient.storage.from(bucket).remove([objectPath]);
        }

        await serviceClient
          .from("task_logs")
          .delete()
          .eq("task_id", task.id);

        await serviceClient
          .from("playlist_items")
          .delete()
          .eq("task_id", task.id);

        await serviceClient
          .from("video_tasks")
          .update({ status: "expired", current_step: "Files cleaned up" })
          .eq("id", task.id);

        cleaned++;
      } catch (taskErr) {
        errors.push(
          `Task ${task.id}: ${taskErr instanceof Error ? taskErr.message : "Unknown error"}`
        );
      }
    }

    return new Response(
      JSON.stringify({
        message: `Cleanup complete`,
        total_expired: expiredTasks.length,
        cleaned,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

function extractStoragePath(url: string): string | null {
  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/\/storage\/v1\/object\/(?:public\/)?(.+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}
