import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useWallet } from '@/hooks/useWallet';
import { BarChart3, CheckCircle, Clock, Coins, Flame, Target, TrendingUp, XCircle } from 'lucide-react';

interface AnalyticsData { total_recaps:number; completed_recaps:number; failed_recaps:number; success_rate:number; average_duration_seconds:number; time_saved_seconds:number; topics:{topic:string;count:number}[]; }
const EMPTY: AnalyticsData={total_recaps:0,completed_recaps:0,failed_recaps:0,success_rate:0,average_duration_seconds:0,time_saved_seconds:0,topics:[]};

interface AnalyticsTask { status:string; duration_seconds:number|null; clip_plan:unknown; key_topics:unknown; }

function analyticsFromTasks(tasks:AnalyticsTask[]):AnalyticsData {
  const completed=tasks.filter(task=>task.status==='completed');
  const failed=tasks.filter(task=>task.status==='error');
  const topicCounts=new Map<string,number>();
  let outputSeconds=0;
  for(const task of completed){
    if(Array.isArray(task.clip_plan)) for(const clip of task.clip_plan){
      if(clip&&typeof clip==='object'){
        const value=clip as {start?:unknown;end?:unknown};
        const start=Number(value.start); const end=Number(value.end);
        if(Number.isFinite(start)&&Number.isFinite(end)&&end>start) outputSeconds+=end-start;
      }
    }
    if(Array.isArray(task.key_topics)) for(const topic of task.key_topics){
      if(typeof topic==='string'&&topic.trim()) topicCounts.set(topic,(topicCounts.get(topic)||0)+1);
    }
  }
  const durationTotal=completed.reduce((sum,task)=>sum+(task.duration_seconds||0),0);
  return {total_recaps:tasks.length,completed_recaps:completed.length,failed_recaps:failed.length,
    success_rate:tasks.length?Math.round(1000*completed.length/tasks.length)/10:0,
    average_duration_seconds:completed.length?Math.round(durationTotal/completed.length):0,
    time_saved_seconds:Math.max(0,Math.round(durationTotal-outputSeconds)),
    topics:[...topicCounts].sort((a,b)=>b[1]-a[1]).slice(0,10).map(([topic,count])=>({topic,count}))};
}

export default function Analytics() {
  const [data,setData]=useState(EMPTY); const [loading,setLoading]=useState(true); const [error,setError]=useState<string|null>(null);
  const [isAvailable,setIsAvailable]=useState(true); const [reloadToken,setReloadToken]=useState(0);
  const { wallet }=useWallet();
  useEffect(()=>{ (async()=>{
    setLoading(true); setError(null);
    const {data:result,error:rpcError}=await supabase.rpc('get_my_analytics');
    if(!rpcError){setData({...EMPTY,...result});setIsAvailable(true);setLoading(false);return;}
    const {data:tasks,error:queryError}=await supabase.from('video_tasks').select('status,duration_seconds,clip_plan,key_topics');
    setLoading(false);
    if(queryError){
      const schemaMissing=rpcError.code==='PGRST202'&&queryError.code==='42P01';
      setIsAvailable(!schemaMissing);
      setError(schemaMissing ? 'Analytics is not configured on this server yet.' : queryError.message);
      return;
    }
    setIsAvailable(true); setData(analyticsFromTasks((tasks||[]) as AnalyticsTask[]));
  })(); },[reloadToken]);
  const format=(seconds:number)=>`${Math.floor(seconds/60)}m ${Math.round(seconds%60)}s`;
  const cards=[
    {label:'Total recaps',value:data.total_recaps,icon:BarChart3}, {label:'Completed',value:data.completed_recaps,icon:CheckCircle},
    {label:'Success rate',value:`${data.success_rate}%`,icon:TrendingUp}, {label:'Failed',value:data.failed_recaps,icon:XCircle},
    {label:'Average recap',value:format(data.average_duration_seconds),icon:Clock}, {label:'Estimated time saved',value:format(data.time_saved_seconds),icon:Target},
    {label:'Credits earned',value:wallet.totalEarned,icon:Coins}, {label:'Credits spent',value:wallet.totalSpent,icon:Flame},
  ];
  return <div className="min-h-screen py-8"><div className="container mx-auto px-4 max-w-6xl">
    <h1 className="text-4xl font-bold text-brass-200 mb-2">Analytics</h1><p className="text-brass-300 mb-8">Live statistics calculated from your processing and wallet records.</p>
    {error&&<div role="alert" className="p-4 rounded bg-red-950/40 text-red-300 mb-6 flex items-center justify-between gap-4"><span>{error}</span><button onClick={()=>setReloadToken(value=>value+1)} className="underline hover:text-white">Retry</button></div>}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">{cards.map(({label,value,icon:Icon})=><div key={label} className="steampunk-card p-5"><Icon className="w-5 h-5 text-brass-400 mb-3"/><div className="text-2xl font-bold text-brass-100">{loading?'…':isAvailable?value:'—'}</div><div className="text-sm text-brass-400">{label}</div></div>)}</div>
    <div className="steampunk-card p-6"><h2 className="text-2xl text-brass-200 font-semibold mb-5">Popular topics</h2>{!isAvailable?<p className="text-brass-400">Topic analytics are unavailable.</p>:data.topics.length===0?<p className="text-brass-400">Topics will appear after completed recaps.</p>:<div className="space-y-3">{data.topics.map(topic=><div key={topic.topic}><div className="flex justify-between text-brass-200 mb-1"><span>{topic.topic}</span><span>{topic.count}</span></div><div className="h-2 bg-steam-800 rounded"><div className="h-2 bg-brass-500 rounded" style={{width:`${Math.max(5,100*topic.count/data.topics[0].count)}%`}}/></div></div>)}</div>}</div>
  </div></div>;
}
