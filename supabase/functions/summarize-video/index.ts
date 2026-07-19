import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.51.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
  error?: {
    code: number;
    message: string;
  };
}

async function callGemini(
  apiKey: string,
  prompt: string,
  language: string
): Promise<{ summary: string; topics: string[] }> {
  const langInstructions =
    language === "he"
      ? "Respond entirely in Hebrew."
      : language === "ar"
        ? "Respond entirely in Arabic."
        : "Respond entirely in English.";

  const fullPrompt = `${langInstructions}

You are an expert video content analyst. Analyze the following video information and provide:

1. A comprehensive summary (3-5 paragraphs)
2. A list of 5-10 key topics/themes discussed

Format your response as JSON:
{
  "summary": "...",
  "topics": ["topic1", "topic2", ...]
}

Video information:
${prompt}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  const data: GeminiResponse = await res.json();

  if (data.error) {
    throw new Error(`Gemini API error: ${data.error.message}`);
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  try {
    const parsed = JSON.parse(text);
    return {
      summary: parsed.summary || text,
      topics: Array.isArray(parsed.topics) ? parsed.topics : [],
    };
  } catch {
    return { summary: text, topics: [] };
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
    const { task_id, gemini_api_key, language } = body;

    if (!task_id || !gemini_api_key) {
      return new Response(
        JSON.stringify({ error: "Missing task_id or gemini_api_key" }),
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
        status: "summarizing",
        current_step: "Generating AI summary...",
        progress_percentage: 70,
      })
      .eq("id", task_id);

    await serviceClient.from("task_logs").insert({
      task_id,
      level: "info",
      message: "Starting AI summary generation",
      metadata: { model: "gemini-3.5-flash", language: language || "he" },
    });

    const videoInfo = `
Title: ${task.title || "Unknown"}
Description: ${task.description || "No description available"}
Source URL: ${task.source_url || "N/A"}
Duration: ${task.duration_seconds ? `${Math.floor(task.duration_seconds / 60)} minutes` : "Unknown"}
${task.transcript_text ? `Transcript: ${task.transcript_text.substring(0, 10000)}` : ""}
    `.trim();

    const result = await callGemini(
      gemini_api_key,
      videoInfo,
      language || "he"
    );

    await serviceClient
      .from("video_tasks")
      .update({
        summary_text: result.summary,
        key_topics: result.topics,
        summary_language: language || "he",
        current_step: "Summary generated",
        progress_percentage: 85,
      })
      .eq("id", task_id);

    await serviceClient.from("task_logs").insert({
      task_id,
      level: "info",
      message: "AI summary generated successfully",
      metadata: {
        topics_count: result.topics.length,
        summary_length: result.summary.length,
      },
    });

    return new Response(
      JSON.stringify({
        summary: result.summary,
        topics: result.topics,
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
