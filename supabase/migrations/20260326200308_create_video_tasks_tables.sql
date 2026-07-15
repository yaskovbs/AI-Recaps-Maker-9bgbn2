/*
  # Create Video Tasks System Tables

  1. New Tables
    - `video_tasks` - Main table for video download/processing tasks
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `source_url` (text, nullable) - YouTube URL or null for uploads
      - `source_type` (text) - 'youtube', 'upload', or 'playlist'
      - `title` (text)
      - `description` (text, nullable)
      - `thumbnail_url` (text, nullable)
      - `status` (text) - pending/downloading/processing/converting_3d/completed/error/cancelled
      - `priority` (text) - low/medium/high
      - `progress_percentage` (integer, 0-100)
      - `current_step` (text, nullable) - current processing step description
      - `error_code` (text, nullable) - error code for failed tasks
      - `error_message` (text, nullable) - human-readable error message
      - `error_details` (text, nullable) - detailed error explanation
      - `error_action` (text, nullable) - suggested action for the user
      - `original_file_url` (text, nullable)
      - `processed_file_url` (text, nullable)
      - `file_size_mb` (float, default 0)
      - `duration_seconds` (integer, default 0)
      - `enable_3d_conversion` (boolean, default false)
      - `processing_logs` (jsonb) - detailed log of each processing step
      - `created_at` (timestamptz)
      - `started_at` (timestamptz, nullable)
      - `completed_at` (timestamptz, nullable)
      - `expires_at` (timestamptz) - auto-set to created_at + 44 days

    - `playlist_items` - Items within a playlist task
      - `id` (uuid, primary key)
      - `task_id` (uuid, references video_tasks)
      - `video_id` (text) - YouTube video ID
      - `title` (text)
      - `thumbnail_url` (text, nullable)
      - `position` (integer)
      - `selected` (boolean, default true)
      - `created_at` (timestamptz)

    - `task_logs` - Detailed processing logs per task
      - `id` (uuid, primary key)
      - `task_id` (uuid, references video_tasks)
      - `level` (text) - info/warning/error
      - `message` (text)
      - `metadata` (jsonb, nullable)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can only access their own tasks
    - Users can only access logs for their own tasks

  3. Indexes
    - video_tasks: user_id, status, expires_at, created_at
    - task_logs: task_id, created_at
    - playlist_items: task_id
*/

-- Video Tasks table
CREATE TABLE IF NOT EXISTS video_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  source_url text,
  source_type text NOT NULL DEFAULT 'youtube' CHECK (source_type IN ('youtube', 'upload', 'playlist')),
  title text NOT NULL DEFAULT '',
  description text,
  thumbnail_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'downloading', 'processing', 'summarizing', 'converting_3d', 'completed', 'error', 'cancelled')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  progress_percentage integer NOT NULL DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  current_step text,
  error_code text,
  error_message text,
  error_details text,
  error_action text,
  original_file_url text,
  processed_file_url text,
  file_size_mb double precision NOT NULL DEFAULT 0,
  duration_seconds integer NOT NULL DEFAULT 0,
  enable_3d_conversion boolean NOT NULL DEFAULT false,
  processing_logs jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '44 days')
);

ALTER TABLE video_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own video tasks" ON video_tasks;
CREATE POLICY "Users can view own video tasks"
  ON video_tasks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own video tasks" ON video_tasks;
CREATE POLICY "Users can create own video tasks"
  ON video_tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own video tasks" ON video_tasks;
CREATE POLICY "Users can update own video tasks"
  ON video_tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own video tasks" ON video_tasks;
CREATE POLICY "Users can delete own video tasks"
  ON video_tasks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_video_tasks_user_id ON video_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_video_tasks_status ON video_tasks(status);
CREATE INDEX IF NOT EXISTS idx_video_tasks_expires_at ON video_tasks(expires_at);
CREATE INDEX IF NOT EXISTS idx_video_tasks_created_at ON video_tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_tasks_priority ON video_tasks(priority);

-- Playlist Items table
CREATE TABLE IF NOT EXISTS playlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES video_tasks(id) ON DELETE CASCADE,
  video_id text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  thumbnail_url text,
  position integer NOT NULL DEFAULT 0,
  selected boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE playlist_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own playlist items" ON playlist_items;
CREATE POLICY "Users can view own playlist items"
  ON playlist_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM video_tasks
      WHERE video_tasks.id = playlist_items.task_id
      AND video_tasks.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create playlist items for own tasks" ON playlist_items;
CREATE POLICY "Users can create playlist items for own tasks"
  ON playlist_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM video_tasks
      WHERE video_tasks.id = playlist_items.task_id
      AND video_tasks.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own playlist items" ON playlist_items;
CREATE POLICY "Users can update own playlist items"
  ON playlist_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM video_tasks
      WHERE video_tasks.id = playlist_items.task_id
      AND video_tasks.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM video_tasks
      WHERE video_tasks.id = playlist_items.task_id
      AND video_tasks.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own playlist items" ON playlist_items;
CREATE POLICY "Users can delete own playlist items"
  ON playlist_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM video_tasks
      WHERE video_tasks.id = playlist_items.task_id
      AND video_tasks.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_playlist_items_task_id ON playlist_items(task_id);

-- Task Logs table
CREATE TABLE IF NOT EXISTS task_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES video_tasks(id) ON DELETE CASCADE,
  level text NOT NULL DEFAULT 'info' CHECK (level IN ('info', 'warning', 'error')),
  message text NOT NULL DEFAULT '',
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE task_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view logs for own tasks" ON task_logs;
CREATE POLICY "Users can view logs for own tasks"
  ON task_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM video_tasks
      WHERE video_tasks.id = task_logs.task_id
      AND video_tasks.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create logs for own tasks" ON task_logs;
CREATE POLICY "Users can create logs for own tasks"
  ON task_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM video_tasks
      WHERE video_tasks.id = task_logs.task_id
      AND video_tasks.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_task_logs_task_id ON task_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_task_logs_created_at ON task_logs(created_at DESC);
