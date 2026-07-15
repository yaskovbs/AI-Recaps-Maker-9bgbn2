import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables: VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Deduplicated session getter — prevents concurrent getSession() calls
// from causing auth token lock contention
let _sessionPromise: ReturnType<typeof supabase.auth.getSession> | null = null;

export async function getSessionOnce() {
  if (_sessionPromise) return _sessionPromise;
  _sessionPromise = supabase.auth.getSession();
  try {
    return await _sessionPromise;
  } finally {
    _sessionPromise = null;
  }
}

// Types
export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  user_id: string;
  title: string;
  status: 'idle' | 'processing' | 'completed' | 'failed';
  input_mode: 'text' | 'txt' | 'mp3';
  script_text?: string;
  txt_asset_id?: string;
  mp3_asset_id?: string;
  video_asset_id?: string;
  youtube_url?: string;
  movie_title?: string;
  description?: string;
  genre?: string;
  recap_length_seconds: number;
  clip_length_seconds: number;
  gap_seconds: number;
  stages: JobStage[];
  metadata: any;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface JobStage {
  stage: number;
  status: 'idle' | 'processing' | 'completed' | 'fallback' | 'failed';
  message: string;
  startedAt?: string;
  endedAt?: string;
}

export interface JobEvent {
  id: string;
  job_id: string;
  type: string;
  stage: number;
  status: string;
  reason?: string;
  created_at: string;
}

export interface CreditsWallet {
  user_id: string;
  balance: number;
  last_reward_at?: string;
  daily_reward_count: number;
  updated_at: string;
}

export interface CreditsTransaction {
  id: string;
  user_id: string;
  type: 'reward' | 'consume';
  amount: number;
  reason?: string;
  balance_after: number;
  created_at: string;
}

export interface Rating {
  id: string;
  user_id: string;
  job_id?: string;
  score: number;
  comment?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  created_at: string;
}

export interface LearningProfile {
  user_id: string;
  continuous_learning_enabled: boolean;
  continuous_learning_consent: boolean;
  global_learning_opt_in: boolean;
  global_learning_consented_at?: string;
  total_recaps: number;
  favorite_genres: string[];
  preferred_duration_seconds?: number;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  requirement_type: string;
  requirement_value: number;
  created_at: string;
}

export interface UserBadge {
  user_id: string;
  badge_id: string;
  earned_at: string;
  badge?: Badge;
}
