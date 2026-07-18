import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.51.0";

function corsHeaders(req: Request) {
  const allowed = (Deno.env.get("ALLOWED_ORIGINS") || "").split(",").map(v => v.trim()).filter(Boolean);
  const origin = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": allowed.includes(origin) ? origin : allowed[0] || "null",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
    "Vary": "Origin",
  };
}

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders(req), "Content-Type": "application/json" } });
}

async function encryptWorkerPayload(payload: object): Promise<string> {
  const secret = Deno.env.get("PROCESSING_SECRET");
  if (!secret || secret.length < 32) throw new Error("PROCESSING_SECRET must contain at least 32 characters");
  const keyBytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  const key = await crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(JSON.stringify(payload))));
  const combined = new Uint8Array(iv.length + ciphertext.length);
  combined.set(iv); combined.set(ciphertext, iv.length);
  return btoa(String.fromCharCode(...combined));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(req) });
  if (req.method !== "POST") return json(req, { error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json(req, { error: "Missing authorization" }, 401);
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return json(req, { error: "Unauthorized" }, 401);

    const body = await req.json();
    const taskId = typeof body.task_id === "string" ? body.task_id : "";
    if (!taskId) return json(req, { error: "Missing task_id" }, 400);

    const service = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: task } = await service.from("video_tasks").select("id,status,source_type,source_url,user_id").eq("id", taskId).eq("user_id", user.id).maybeSingle();
    if (!task) return json(req, { error: "Task not found" }, 404);
    if (!["pending", "error", "cancelled"].includes(task.status)) return json(req, { error: `Task cannot be queued from status ${task.status}` }, 409);
    const youtubeKey = typeof body.youtube_api_key === "string" ? body.youtube_api_key.trim() : "";
    const geminiKey = typeof body.gemini_api_key === "string" ? body.gemini_api_key.trim() : "";
    const googleSearchKey = typeof body.google_search_api_key === "string" ? body.google_search_api_key.trim() : "";
    const searchEngineId = typeof body.search_engine_id === "string" ? body.search_engine_id.trim().replace(/^cx=/, "") : "";
    const narrationAudioUrl = typeof body.narration_audio_url === "string" ? body.narration_audio_url.trim() : "";
    if (narrationAudioUrl && !narrationAudioUrl.startsWith(`storage://recap-assets/${user.id}/`)) {
      return json(req, { error: "Invalid narration audio path" }, 400);
    }
    if (task.source_type === "youtube" && !youtubeKey) return json(req, { error: "Add and validate your YouTube API key before processing this source" }, 400);
    if (!geminiKey) return json(req, { error: "Add and validate your Gemini API key before creating a recap" }, 400);
    if (body.web_search_enabled === true && (!googleSearchKey || !searchEngineId)) return json(req, { error: "Add and validate your Google Search API key and Search Engine ID, or disable web search" }, 400);

    const encryptedPayload = await encryptWorkerPayload({
      youtube_api_key: youtubeKey,
      gemini_api_key: geminiKey,
      credential_source: "byok",
      google_search_api_key: googleSearchKey,
      search_engine_id: searchEngineId,
      web_search_enabled: body.web_search_enabled === true && Boolean(googleSearchKey && searchEngineId),
      language: typeof body.language === "string" ? body.language : "en",
      recap_duration_seconds: Number(body.recap_duration_seconds || 0),
      narration_audio_url: narrationAudioUrl,
    });
    const { error: secretError } = await service.from("video_task_secrets").upsert({ task_id: taskId, encrypted_payload: encryptedPayload, updated_at: new Date().toISOString() });
    if (secretError) {
      throw secretError;
    }
    const { error: queueError } = await service.from("video_tasks").update({
      status: "pending", current_step: "Queued for processing", progress_percentage: 0,
      error_code: null, error_message: null, error_details: null, error_action: null,
      cancel_requested_at: null, worker_id: null, locked_at: null, heartbeat_at: null,
    }).eq("id", taskId).eq("user_id", user.id);
    if (queueError) {
      await service.from("video_task_secrets").delete().eq("task_id", taskId);
      throw queueError;
    }
    await service.from("task_logs").insert({ task_id: taskId, level: "info", message: "Task securely queued for processing" });
    return json(req, { status: "queued", task_id: taskId }, 202);
  } catch (error) {
    console.error("Queue request failed", error instanceof Error ? error.message : "Unknown error");
    return json(req, { error: "Unable to queue processing task" }, 500);
  }
});
