import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.51.0";

const ALLOWED_BUCKETS = new Set(["recap-assets", "video-originals"]);

function corsHeaders(req: Request) {
  const allowed = (Deno.env.get("ALLOWED_ORIGINS") || "").split(",").map(value => value.trim()).filter(Boolean);
  const origin = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": allowed.includes(origin) ? origin : allowed[0] || "null",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, Apikey, X-Client-Info",
    "Vary": "Origin",
  };
}

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(req) });
  if (req.method !== "POST") return json(req, { error: "Method not allowed" }, 405);

  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization) return json(req, { error: "Missing authorization" }, 401);

    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authorization } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return json(req, { error: "Unauthorized" }, 401);

    const body = await req.json();
    const bucket = typeof body.bucket === "string" ? body.bucket : "";
    const path = typeof body.path === "string" ? body.path : "";
    if (!ALLOWED_BUCKETS.has(bucket)) return json(req, { error: "Unsupported upload bucket" }, 400);
    if (!path.startsWith(`${user.id}/`) || path.includes("..") || path.includes("\\")) {
      return json(req, { error: "Upload path must be inside your own folder" }, 403);
    }

    const service = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data, error } = await service.storage.from(bucket).createSignedUploadUrl(path, { upsert: true });
    if (error || !data?.token) {
      console.error("Unable to create upload token", error?.message || "No token returned");
      return json(req, { error: "Unable to authorize resumable upload" }, 500);
    }

    return json(req, { token: data.token });
  } catch (error) {
    console.error("Upload token request failed", error instanceof Error ? error.message : "Unknown error");
    return json(req, { error: "Unable to authorize resumable upload" }, 500);
  }
});
