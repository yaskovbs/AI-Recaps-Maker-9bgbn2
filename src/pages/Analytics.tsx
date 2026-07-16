import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useWallet } from '@/hooks/useWallet';
import { BarChart3, CheckCircle, Clock, Coins, Flame, Target, TrendingUp, XCircle } from 'lucide-react';

interface AnalyticsData { total_recaps:number; completed_recaps:number; failed_recaps:number; success_rate:number; average_duration_seconds:number; time_saved_seconds:number; topics:{topic:string;count:number}[]; }
const EMPTY: AnalyticsData={total_recaps:0,completed_recaps:0,failed_recaps:0,success_rate:0,average_duration_seconds:0,time_saved_seconds:0,topics:[]};

export default function Analytics() {
  const [data,setData]=useState(EMPTY); const [loading,setLoading]=useState(true); const [error,setError]=useState<string|null>(null);
  const { wallet }=useWallet();
  useEffect(()=>{ (async()=>{ const {data:result,error:rpcError}=await supabase.rpc('get_my_analytics'); setLoading(false); if(rpcError){setError(rpcError.message);return;} setData({...EMPTY,...result}); })(); },[]);
  const format=(seconds:number)=>`${Math.floor(seconds/60)}m ${Math.round(seconds%60)}s`;
  const cards=[
    {label:'Total recaps',value:data.total_recaps,icon:BarChart3}, {label:'Completed',value:data.completed_recaps,icon:CheckCircle},
    {label:'Success rate',value:`${data.success_rate}%`,icon:TrendingUp}, {label:'Failed',value:data.failed_recaps,icon:XCircle},
    {label:'Average recap',value:format(data.average_duration_seconds),icon:Clock}, {label:'Estimated time saved',value:format(data.time_saved_seconds),icon:Target},
    {label:'Credits earned',value:wallet.totalEarned,icon:Coins}, {label:'Credits spent',value:wallet.totalSpent,icon:Flame},
  ];
  return <div className="min-h-screen py-8"><div className="container mx-auto px-4 max-w-6xl">
    <h1 className="text-4xl font-bold text-brass-200 mb-2">Analytics</h1><p className="text-brass-300 mb-8">Live statistics calculated from your processing and wallet records.</p>
    {error&&<div className="p-4 rounded bg-red-950/40 text-red-300 mb-6">{error}</div>}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">{cards.map(({label,value,icon:Icon})=><div key={label} className="steampunk-card p-5"><Icon className="w-5 h-5 text-brass-400 mb-3"/><div className="text-2xl font-bold text-brass-100">{loading?'…':value}</div><div className="text-sm text-brass-400">{label}</div></div>)}</div>
    <div className="steampunk-card p-6"><h2 className="text-2xl text-brass-200 font-semibold mb-5">Popular topics</h2>{data.topics.length===0?<p className="text-brass-400">Topics will appear after completed recaps.</p>:<div className="space-y-3">{data.topics.map(topic=><div key={topic.topic}><div className="flex justify-between text-brass-200 mb-1"><span>{topic.topic}</span><span>{topic.count}</span></div><div className="h-2 bg-steam-800 rounded"><div className="h-2 bg-brass-500 rounded" style={{width:`${Math.max(5,100*topic.count/data.topics[0].count)}%`}}/></div></div>)}</div>}</div>
  </div></div>;
}
