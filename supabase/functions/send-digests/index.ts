import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.51.0";
Deno.serve(async req=>{
 if(req.method!=="POST")return new Response("Method not allowed",{status:405});
 if(req.headers.get("x-cron-secret")!==Deno.env.get("CRON_SECRET"))return new Response("Unauthorized",{status:401});
 const url=Deno.env.get("SUPABASE_URL")!,key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,service=createClient(url,key);
 const{data:preferences}=await service.from("user_preferences").select("user_id,notifications");let delivered=0;
 for(const pref of preferences||[]){if(!pref.notifications?.browserPush||!pref.notifications?.weeklyDigest)continue;
  const since=new Date(Date.now()-7*86400000).toISOString();const{count}=await service.from("video_tasks").select("id",{head:true,count:"exact"}).eq("user_id",pref.user_id).eq("status","completed").gte("completed_at",since);
  const response=await fetch(`${url}/functions/v1/send-push`,{method:"POST",headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},body:JSON.stringify({user_id:pref.user_id,type:"weekly_digest",title:"Your weekly recap digest",message:`You completed ${count||0} recaps this week.`,url:"/analytics"})});if(response.ok)delivered++;
 }
 return Response.json({delivered});
});
