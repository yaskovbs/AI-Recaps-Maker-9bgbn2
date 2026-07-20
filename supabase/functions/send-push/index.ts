import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.51.0";
import webpush from "npm:web-push@3.6.7";

function response(body: unknown, status=200) { return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }); }

Deno.serve(async req => {
  if (req.method !== "POST") return response({ error: "Method not allowed" }, 405);
  const auth = req.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return response({ error: "Unauthorized" }, 401);
  try {
    const token = auth.slice(7),segment=token.split(".")[1];
    if(!segment)return response({error:"Invalid authorization"},401);
    const encoded=segment.replace(/-/g,"+").replace(/_/g,"/")+"=".repeat((4-segment.length%4)%4);
    const payload = JSON.parse(atob(encoded));
    const body = await req.json();
    const service = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    let userId = typeof body.user_id === "string" ? body.user_id : "";
    if (payload.role !== "service_role") {
      const client = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
      const { data: { user } } = await client.auth.getUser();
      if (!user || (userId && userId !== user.id)) return response({ error: "Forbidden" }, 403);
      userId = user.id;
    }
    if (!userId) return response({ error: "Missing user_id" }, 400);
    const type = String(body.type || "recap_complete");
    const { data: preferences } = await service.from("user_preferences").select("notifications").eq("user_id",userId).maybeSingle();
    const prefs = preferences?.notifications || {};
    const enabled = prefs.browserPush && ({ recap_complete:prefs.recapComplete, weekly_digest:prefs.weeklyDigest, learning_insight:prefs.learningInsights !== false }[type] ?? false);
    if (!enabled && !body.test) return response({ delivered: 0, skipped: "disabled" });
    webpush.setVapidDetails(Deno.env.get("VAPID_SUBJECT")!, Deno.env.get("VAPID_PUBLIC_KEY")!, Deno.env.get("VAPID_PRIVATE_KEY")!);
    const { data: subscriptions } = await service.from("push_subscriptions").select("id,endpoint,p256dh,auth").eq("user_id",userId);
    let delivered=0;
    await Promise.all((subscriptions || []).map(async sub => {
      try {
        await webpush.sendNotification({ endpoint:sub.endpoint,keys:{p256dh:sub.p256dh,auth:sub.auth} },JSON.stringify({ title:body.title || "AI Recaps",body:body.message || "",url:body.url || "/",tag:type })); delivered++;
      } catch (error:any) {
        if (error?.statusCode === 404 || error?.statusCode === 410) await service.from("push_subscriptions").delete().eq("id",sub.id);
      }
    }));
    return response({ delivered });
  } catch (error) { console.error(error); return response({ error: "Push delivery failed" }, 500); }
});
