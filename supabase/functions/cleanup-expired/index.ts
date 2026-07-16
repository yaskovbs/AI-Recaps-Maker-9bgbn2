import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.51.0";

Deno.serve(async req => {
  if (req.method !== "POST") return new Response("Method not allowed",{status:405});
  if (!Deno.env.get("CRON_SECRET") || req.headers.get("x-cron-secret") !== Deno.env.get("CRON_SECRET")) return new Response("Unauthorized",{status:401});
  const service=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!); const now=new Date().toISOString(); let cleaned=0;
  const {data:tasks,error}=await service.from("video_tasks").select("id,source_url,output_storage_path").lt("expires_at",now).neq("status","expired");
  if(error)return Response.json({error:error.message},{status:500});
  for(const task of tasks||[]){
    if(task.source_url?.startsWith("storage://")){const location=task.source_url.slice(10);const slash=location.indexOf("/");await service.storage.from(location.slice(0,slash)).remove([location.slice(slash+1)]);}
    if(task.output_storage_path)await service.storage.from("video-processed").remove([task.output_storage_path]);
    await service.from("video_tasks").update({status:"expired",current_step:"Files expired and deleted",processed_file_url:null,output_storage_path:null}).eq("id",task.id);cleaned++;
  }
  const {data:expiredChannels}=await service.from("youtube_channels").update({is_active:false}).not("slot_unlocked_at","is",null).lt("slot_unlocked_at",new Date(Date.now()-7*86400000).toISOString()).select("id");
  return Response.json({cleaned_tasks:cleaned,expired_channel_slots:expiredChannels?.length||0});
});
