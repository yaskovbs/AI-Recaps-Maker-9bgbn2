/*
  # Add Missing Tables and Columns

  This migration fixes all discrepancies between the application code and the database schema.

  1. New Tables
    - `jobs` - Stores recap job data (referenced by Create.tsx, RecapView.tsx, Settings.tsx)
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `title` (text)
      - `description` (text)
      - `genre` (text)
      - `status` (text) - pending/processing/completed/failed
      - `video_url` (text)
      - `thumbnail_url` (text)
      - `source_text` (text)
      - `duration` (integer)
      - `metadata` (jsonb)
      - `created_at`, `updated_at` (timestamptz)

    - `public_recaps` - Public gallery of shared recaps (referenced by Gallery.tsx, RecapView.tsx)
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `job_id` (uuid, references jobs)
      - `title` (text)
      - `description` (text)
      - `genre` (text)
      - `video_url` (text)
      - `thumbnail_url` (text)
      - `username` (text)
      - `rating` (numeric)
      - `view_count` (integer)
      - `is_public` (boolean)
      - `created_at` (timestamptz)

    - `ad_views` - Tracks ad impressions for credit system (referenced by Create.tsx, useYouTubeChannels.ts)
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `ad_type` (text)
      - `reward_credits` (integer)
      - `created_at` (timestamptz)

  2. Modified Tables
    - `video_tasks` - Added columns for AI summary storage
      - `summary_text` (text)
      - `summary_language` (text)
      - `key_topics` (jsonb)
      - `transcript_text` (text)

    - `youtube_channels` - Added missing columns referenced by useYouTubeChannels.ts
      - `channel_handle` (text)
      - `channel_name` (text)
      - `channel_description` (text)
      - `subscriber_count` (integer)
      - `video_count` (integer)
      - `slot_unlocked_at` (timestamptz)
      - `slot_type` (text)
      - `last_synced_at` (timestamptz)
      - `learning_insights` (jsonb)
      - `updated_at` (timestamptz)

    - `api_keys` - Added `is_active` column

    - `user_profiles` - Added `username` column

  3. Security
    - RLS enabled on all new tables
    - Policies for authenticated user access to own data
    - Public read access for `public_recaps` where `is_public = true`
*/

-- ============================================
-- 1. Create `jobs` table
-- ============================================
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL DEFAULT '',
  description text DEFAULT '',
  genre text DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  video_url text DEFAULT '',
  thumbnail_url text DEFAULT '',
  source_text text DEFAULT '',
  duration integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own jobs"
  ON jobs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own jobs"
  ON jobs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own jobs"
  ON jobs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own jobs"
  ON jobs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);

-- ============================================
-- 2. Create `public_recaps` table
-- ============================================
CREATE TABLE IF NOT EXISTS public_recaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  job_id uuid REFERENCES jobs(id) ON DELETE SET NULL,
  title text NOT NULL DEFAULT '',
  description text DEFAULT '',
  genre text DEFAULT '',
  video_url text DEFAULT '',
  thumbnail_url text DEFAULT '',
  username text DEFAULT '',
  rating numeric DEFAULT 0,
  view_count integer DEFAULT 0,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public_recaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public recaps"
  ON public_recaps FOR SELECT
  TO authenticated
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can create own recaps"
  ON public_recaps FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recaps"
  ON public_recaps FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own recaps"
  ON public_recaps FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_public_recaps_user_id ON public_recaps(user_id);
CREATE INDEX IF NOT EXISTS idx_public_recaps_is_public ON public_recaps(is_public);
CREATE INDEX IF NOT EXISTS idx_public_recaps_genre ON public_recaps(genre);

-- ============================================
-- 3. Create `ad_views` table
-- ============================================
CREATE TABLE IF NOT EXISTS ad_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ad_type text NOT NULL DEFAULT 'rewarded',
  reward_credits integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ad_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ad views"
  ON ad_views FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own ad views"
  ON ad_views FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_ad_views_user_id ON ad_views(user_id);

-- ============================================
-- 4. Add missing columns to `video_tasks`
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_tasks' AND column_name = 'summary_text'
  ) THEN
    ALTER TABLE video_tasks ADD COLUMN summary_text text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_tasks' AND column_name = 'summary_language'
  ) THEN
    ALTER TABLE video_tasks ADD COLUMN summary_language text DEFAULT 'he';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_tasks' AND column_name = 'key_topics'
  ) THEN
    ALTER TABLE video_tasks ADD COLUMN key_topics jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_tasks' AND column_name = 'transcript_text'
  ) THEN
    ALTER TABLE video_tasks ADD COLUMN transcript_text text DEFAULT '';
  END IF;
END $$;

-- ============================================
-- 5. Add missing columns to `youtube_channels`
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'youtube_channels' AND column_name = 'channel_handle'
  ) THEN
    ALTER TABLE youtube_channels ADD COLUMN channel_handle text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'youtube_channels' AND column_name = 'channel_name'
  ) THEN
    ALTER TABLE youtube_channels ADD COLUMN channel_name text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'youtube_channels' AND column_name = 'channel_description'
  ) THEN
    ALTER TABLE youtube_channels ADD COLUMN channel_description text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'youtube_channels' AND column_name = 'subscriber_count'
  ) THEN
    ALTER TABLE youtube_channels ADD COLUMN subscriber_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'youtube_channels' AND column_name = 'video_count'
  ) THEN
    ALTER TABLE youtube_channels ADD COLUMN video_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'youtube_channels' AND column_name = 'slot_unlocked_at'
  ) THEN
    ALTER TABLE youtube_channels ADD COLUMN slot_unlocked_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'youtube_channels' AND column_name = 'slot_type'
  ) THEN
    ALTER TABLE youtube_channels ADD COLUMN slot_type text DEFAULT 'free';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'youtube_channels' AND column_name = 'last_synced_at'
  ) THEN
    ALTER TABLE youtube_channels ADD COLUMN last_synced_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'youtube_channels' AND column_name = 'learning_insights'
  ) THEN
    ALTER TABLE youtube_channels ADD COLUMN learning_insights jsonb DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'youtube_channels' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE youtube_channels ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- ============================================
-- 6. Add missing column to `api_keys`
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_keys' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE api_keys ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;

-- ============================================
-- 7. Add missing column to `user_profiles`
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'username'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN username text DEFAULT '';
  END IF;
END $$;

-- ============================================
-- 8. Add updated_at trigger for new tables
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'update_jobs_updated_at'
  ) THEN
    CREATE TRIGGER update_jobs_updated_at
      BEFORE UPDATE ON jobs
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
