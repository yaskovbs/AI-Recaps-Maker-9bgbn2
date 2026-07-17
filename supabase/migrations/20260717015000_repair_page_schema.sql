-- Consolidated repair for page-level database contracts on partially migrated projects.

ALTER TABLE public.youtube_channels ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'inspiration';
ALTER TABLE public.youtube_channels ADD COLUMN IF NOT EXISTS channel_handle text;
ALTER TABLE public.youtube_channels ADD COLUMN IF NOT EXISTS channel_name text NOT NULL DEFAULT '';
ALTER TABLE public.youtube_channels ADD COLUMN IF NOT EXISTS channel_description text NOT NULL DEFAULT '';
ALTER TABLE public.youtube_channels ADD COLUMN IF NOT EXISTS subscriber_count bigint NOT NULL DEFAULT 0;
ALTER TABLE public.youtube_channels ADD COLUMN IF NOT EXISTS video_count bigint NOT NULL DEFAULT 0;
ALTER TABLE public.youtube_channels ADD COLUMN IF NOT EXISTS slot_unlocked_at timestamptz;
ALTER TABLE public.youtube_channels ADD COLUMN IF NOT EXISTS slot_type text NOT NULL DEFAULT 'free';
ALTER TABLE public.youtube_channels ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;
ALTER TABLE public.youtube_channels ADD COLUMN IF NOT EXISTS learning_insights jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.youtube_channels ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE public.youtube_channels ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS notifications jsonb NOT NULL DEFAULT '{"browserPush":false,"email":false,"recapComplete":true,"weeklyDigest":false}'::jsonb;
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS learning jsonb NOT NULL DEFAULT '{"continuousLearning":true,"globalLearning":false}'::jsonb;
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'he';

CREATE TABLE IF NOT EXISTS public.video_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_url text, source_type text NOT NULL DEFAULT 'youtube', title text NOT NULL DEFAULT '', description text,
  thumbnail_url text, status text NOT NULL DEFAULT 'pending', priority text NOT NULL DEFAULT 'medium',
  progress_percentage integer NOT NULL DEFAULT 0, current_step text, error_code text, error_message text,
  error_details text, error_action text, original_file_url text, processed_file_url text, output_storage_path text,
  file_size_mb double precision NOT NULL DEFAULT 0, duration_seconds integer NOT NULL DEFAULT 0,
  enable_3d_conversion boolean NOT NULL DEFAULT false, processing_logs jsonb NOT NULL DEFAULT '[]',
  summary_text text NOT NULL DEFAULT '', summary_language text NOT NULL DEFAULT 'he', key_topics jsonb NOT NULL DEFAULT '[]',
  transcript_text text NOT NULL DEFAULT '', clip_plan jsonb NOT NULL DEFAULT '[]', attempts integer NOT NULL DEFAULT 0,
  locked_at timestamptz, locked_by text, next_attempt_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(), started_at timestamptz, completed_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now()+interval '44 days')
);
CREATE INDEX IF NOT EXISTS idx_video_tasks_user_created ON public.video_tasks(user_id,created_at DESC);

CREATE TABLE IF NOT EXISTS public.task_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), task_id uuid NOT NULL REFERENCES public.video_tasks(id) ON DELETE CASCADE,
  level text NOT NULL DEFAULT 'info', message text NOT NULL, metadata jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_task_logs_task_created ON public.task_logs(task_id,created_at);

CREATE TABLE IF NOT EXISTS public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '', status text NOT NULL DEFAULT 'idle', input_mode text NOT NULL DEFAULT 'text',
  script_text text, txt_asset_id text, mp3_asset_id text, video_asset_id text, youtube_url text,
  movie_title text, description text, genre text, recap_length_seconds integer NOT NULL DEFAULT 0,
  clip_length_seconds integer NOT NULL DEFAULT 0, gap_seconds integer NOT NULL DEFAULT 0,
  stages jsonb NOT NULL DEFAULT '[]', metadata jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recap_id uuid, rating integer NOT NULL CHECK(rating BETWEEN 1 AND 5), feedback text, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.youtube_learning_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  refresh_interval_seconds integer NOT NULL DEFAULT 86400, include_public boolean NOT NULL DEFAULT true,
  include_shorts boolean NOT NULL DEFAULT true, include_live boolean NOT NULL DEFAULT true,
  recent_90_days boolean NOT NULL DEFAULT true, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.youtube_slot_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source text NOT NULL, expires_at timestamptz NOT NULL DEFAULT now()+interval '7 days',
  consumed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL, p256dh text NOT NULL, auth text NOT NULL, user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id,endpoint)
);
CREATE TABLE IF NOT EXISTS public.gamification_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, xp integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1, streak integer NOT NULL DEFAULT 0, last_activity_date date,
  leaderboard_opt_in boolean NOT NULL DEFAULT false, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.user_achievements (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, achievement_id text NOT NULL,
  progress integer NOT NULL DEFAULT 0, unlocked_at timestamptz, PRIMARY KEY(user_id,achievement_id)
);
CREATE TABLE IF NOT EXISTS public.daily_challenge_progress (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, challenge_date date NOT NULL DEFAULT current_date,
  challenge_id text NOT NULL, progress integer NOT NULL DEFAULT 0, completed_at timestamptz,
  PRIMARY KEY(user_id,challenge_date,challenge_id)
);

ALTER TABLE public.youtube_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.youtube_learning_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.youtube_slot_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_challenge_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own youtube channels" ON public.youtube_channels;
CREATE POLICY "Users manage own youtube channels" ON public.youtube_channels FOR ALL TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
DROP POLICY IF EXISTS "Users manage own video tasks" ON public.video_tasks;
CREATE POLICY "Users manage own video tasks" ON public.video_tasks FOR ALL TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
DROP POLICY IF EXISTS "Users read own task logs" ON public.task_logs;
CREATE POLICY "Users read own task logs" ON public.task_logs FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.video_tasks t WHERE t.id=task_id AND t.user_id=auth.uid()));
DROP POLICY IF EXISTS "Users insert own task logs" ON public.task_logs;
CREATE POLICY "Users insert own task logs" ON public.task_logs FOR INSERT TO authenticated WITH CHECK(EXISTS(SELECT 1 FROM public.video_tasks t WHERE t.id=task_id AND t.user_id=auth.uid()));
DROP POLICY IF EXISTS "Users manage own jobs" ON public.jobs;
CREATE POLICY "Users manage own jobs" ON public.jobs FOR ALL TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
DROP POLICY IF EXISTS "Users manage own ratings" ON public.ratings;
CREATE POLICY "Users manage own ratings" ON public.ratings FOR ALL TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
DROP POLICY IF EXISTS "Users manage own youtube settings" ON public.youtube_learning_settings;
CREATE POLICY "Users manage own youtube settings" ON public.youtube_learning_settings FOR ALL TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
DROP POLICY IF EXISTS "Users read own youtube entitlements" ON public.youtube_slot_entitlements;
CREATE POLICY "Users read own youtube entitlements" ON public.youtube_slot_entitlements FOR SELECT TO authenticated USING(user_id=auth.uid());
DROP POLICY IF EXISTS "Users manage own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users manage own push subscriptions" ON public.push_subscriptions FOR ALL TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
DROP POLICY IF EXISTS "Users read own gamification" ON public.gamification_profiles;
CREATE POLICY "Users read own gamification" ON public.gamification_profiles FOR SELECT TO authenticated USING(user_id=auth.uid());
DROP POLICY IF EXISTS "Users update own gamification" ON public.gamification_profiles;
CREATE POLICY "Users update own gamification" ON public.gamification_profiles FOR UPDATE TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
DROP POLICY IF EXISTS "Users read own achievements repair" ON public.user_achievements;
CREATE POLICY "Users read own achievements repair" ON public.user_achievements FOR SELECT TO authenticated USING(user_id=auth.uid());
DROP POLICY IF EXISTS "Users read own challenges repair" ON public.daily_challenge_progress;
CREATE POLICY "Users read own challenges repair" ON public.daily_challenge_progress FOR SELECT TO authenticated USING(user_id=auth.uid());

GRANT SELECT,INSERT,UPDATE,DELETE ON public.youtube_channels,public.video_tasks,public.task_logs,public.jobs,public.ratings,public.youtube_learning_settings,public.push_subscriptions TO authenticated;
GRANT SELECT ON public.youtube_slot_entitlements,public.gamification_profiles,public.user_achievements,public.daily_challenge_progress TO authenticated;
GRANT UPDATE(leaderboard_opt_in) ON public.gamification_profiles TO authenticated;

INSERT INTO public.gamification_profiles(user_id) SELECT id FROM auth.users ON CONFLICT(user_id) DO NOTHING;
INSERT INTO public.youtube_learning_settings(user_id) SELECT id FROM auth.users ON CONFLICT(user_id) DO NOTHING;

INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types) VALUES
 ('video-originals','video-originals',false,2147483648,ARRAY['video/mp4','video/quicktime','video/x-msvideo','video/webm']),
 ('video-processed','video-processed',false,2147483648,ARRAY['video/mp4','video/webm']),
 ('recap-assets','recap-assets',true,2147483648,NULL)
ON CONFLICT(id) DO UPDATE SET file_size_limit=EXCLUDED.file_size_limit;

DROP POLICY IF EXISTS "Repair users upload own files" ON storage.objects;
CREATE POLICY "Repair users upload own files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK(bucket_id IN('video-originals','video-processed','recap-assets') AND (storage.foldername(name))[1]=auth.uid()::text);
DROP POLICY IF EXISTS "Repair users read own private files" ON storage.objects;
CREATE POLICY "Repair users read own private files" ON storage.objects FOR SELECT TO authenticated
  USING((bucket_id='video-originals' AND (storage.foldername(name))[1]=auth.uid()::text) OR bucket_id IN('video-processed','recap-assets'));
DROP POLICY IF EXISTS "Repair users delete own files" ON storage.objects;
CREATE POLICY "Repair users delete own files" ON storage.objects FOR DELETE TO authenticated
  USING(bucket_id IN('video-originals','video-processed','recap-assets') AND (storage.foldername(name))[1]=auth.uid()::text);

NOTIFY pgrst, 'reload schema';
