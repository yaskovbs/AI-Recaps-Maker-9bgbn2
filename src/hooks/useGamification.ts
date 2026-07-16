import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';

export interface Achievement { id:string; name:string; description:string; icon:string; xpReward:number; unlockedAt?:string; progress:number; maxProgress:number; }
export interface DailyChallenge { id:string; title:string; description:string; xpReward:number; completed:boolean; progress:number; maxProgress:number; expiresAt:string; }
export interface UserLevel { level:number; currentXP:number; xpForNextLevel:number; title:string; }
const DEFINITIONS:Record<string,Omit<Achievement,'id'|'unlockedAt'|'progress'>>={
 first_recap:{name:'First recap',description:'Complete your first recap',icon:'🌟',xpReward:50,maxProgress:1},
 ten_recaps:{name:'Creator',description:'Complete 10 recaps',icon:'⭐',xpReward:100,maxProgress:10},
 fifty_recaps:{name:'Recap master',description:'Complete 50 recaps',icon:'🏆',xpReward:250,maxProgress:50},
 daily_streak_3:{name:'Consistent creator',description:'Be active for 3 consecutive days',icon:'🔥',xpReward:75,maxProgress:3},
};
export function useGamification(){
 const {user}=useAuth(); const [xp,setXp]=useState(0); const [level,setLevel]=useState(1); const [streak,setStreak]=useState(0); const [leaderboardOptIn,setOptIn]=useState(false);
 const [achievements,setAchievements]=useState<Achievement[]>([]); const [dailyChallenges,setChallenges]=useState<DailyChallenge[]>([]); const [isLoading,setLoading]=useState(true);
 const refresh=useCallback(async()=>{ if(!user){setLoading(false);return;} setLoading(true); const [p,a,c]=await Promise.all([
  supabase.from('gamification_profiles').select('*').eq('user_id',user.id).maybeSingle(), supabase.from('user_achievements').select('*').eq('user_id',user.id),
  supabase.from('daily_challenge_progress').select('*').eq('user_id',user.id).eq('challenge_date',new Date().toISOString().slice(0,10))]);
  if(p.data){setXp(p.data.xp);setLevel(p.data.level);setStreak(p.data.streak);setOptIn(p.data.leaderboard_opt_in);}
  setAchievements(Object.entries(DEFINITIONS).map(([id,d])=>{const row=a.data?.find(x=>x.achievement_id===id);return{id,...d,progress:row?.progress||0,unlockedAt:row?.unlocked_at||undefined};}));
  const expiry=new Date(); expiry.setHours(23,59,59,999); const challenges=[{id:'create_recap',title:'Create a recap',description:'Complete one recap today',xpReward:25,maxProgress:1},{id:'rewarded_ad',title:'Earn an ad reward',description:'Complete one rewarded ad today',xpReward:5,maxProgress:1}];
  setChallenges(challenges.map(d=>{const row=c.data?.find(x=>x.challenge_id===d.id);return{...d,progress:row?.progress||0,completed:!!row?.completed_at,expiresAt:expiry.toISOString()};})); setLoading(false);
 },[user]);
 useEffect(()=>{void refresh();},[refresh]);
 const setLeaderboardOptIn=async(value:boolean)=>{if(!user)return false;const{error}=await supabase.from('gamification_profiles').update({leaderboard_opt_in:value,updated_at:new Date().toISOString()}).eq('user_id',user.id);if(!error)setOptIn(value);return !error;};
 const xpAtLevel=(level-1)*(level-1)*100, next=level*level*100;
 return{userLevel:{level,currentXP:Math.max(0,xp-xpAtLevel),xpForNextLevel:next-xpAtLevel,title:level>=10?'Master':level>=5?'Expert':'Creator'},achievements,dailyChallenges,streak,leaderboardOptIn,isLoading,refresh,setLeaderboardOptIn};
}
