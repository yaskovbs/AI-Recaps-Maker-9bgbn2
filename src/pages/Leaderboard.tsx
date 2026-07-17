import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useGamification } from '@/hooks/useGamification';
import XPBar from '@/components/gamification/XPBar';
import Achievements from '@/components/gamification/Achievements';
import DailyChallenges from '@/components/gamification/DailyChallenges';
import { Crown, Trophy } from 'lucide-react';

interface Row {user_id:string;username:string;avatar_url?:string;xp:number;level:number;completed_recaps:number;}
export default function Leaderboard(){
 const [rows,setRows]=useState<Row[]>([]); const [loading,setLoading]=useState(true);
 const [error,setError]=useState<string|null>(null);
 const {userLevel,achievements,dailyChallenges,streak,leaderboardOptIn,setLeaderboardOptIn}=useGamification();
 useEffect(()=>{(async()=>{setLoading(true);setError(null);const{data,error:requestError}=await supabase.rpc('get_leaderboard',{p_limit:25});if(requestError)setError(requestError.message);else setRows(data||[]);setLoading(false);})();},[leaderboardOptIn]);
 return <div className="min-h-screen py-8"><div className="container mx-auto px-4 max-w-5xl">
  <div className="flex flex-wrap items-center justify-between gap-4 mb-8"><div><h1 className="text-4xl font-bold text-brass-200 flex gap-3"><Trophy/>Leaderboard</h1><p className="text-brass-400">Only users who opt in are listed.</p></div>
  <label className="flex items-center gap-2 text-brass-200"><input type="checkbox" checked={leaderboardOptIn} onChange={e=>void setLeaderboardOptIn(e.target.checked)}/>Show me publicly</label></div>
  <div className="steampunk-card p-6 mb-6"><XPBar {...userLevel}/><p className="text-brass-300 mt-3">Current streak: {streak} day{streak===1?'':'s'}</p></div>
  <div className="grid lg:grid-cols-2 gap-6 mb-6"><Achievements achievements={achievements}/><DailyChallenges challenges={dailyChallenges}/></div>
  <div className="steampunk-card p-6"><h2 className="text-2xl text-brass-200 mb-4">Top creators</h2>{loading?<p>Loading…</p>:error?<p role="alert" className="text-red-300">Leaderboard is unavailable: {error}</p>:rows.length===0?<p className="text-brass-400">No creators have opted in yet.</p>:<div className="space-y-3">{rows.map((row,index)=><div key={row.user_id} className="flex items-center gap-4 p-4 bg-steam-800/40 rounded-lg"><div className="w-10 text-center">{index===0?<Crown className="text-yellow-400"/>:`#${index+1}`}</div><div className="flex-1"><div className="text-brass-100 font-semibold">{row.username}</div><div className="text-sm text-brass-400">Level {row.level} · {row.completed_recaps} recaps</div></div><div className="font-bold text-brass-200">{row.xp} XP</div></div>)}</div>}</div>
 </div></div>;
}
