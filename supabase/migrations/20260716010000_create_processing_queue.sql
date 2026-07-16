CREATE TABLE IF NOT EXISTS public.video_task_secrets (
  task_id uuid PRIMARY KEY REFERENCES public.video_tasks(id) ON DELETE CASCADE,
  encrypted_payload text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.video_task_secrets ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.video_tasks
  ADD COLUMN IF NOT EXISTS attempt_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_attempts integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS worker_id text,
  ADD COLUMN IF NOT EXISTS locked_at timestamptz,
  ADD COLUMN IF NOT EXISTS heartbeat_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS source_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS clip_plan jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS output_storage_path text;

CREATE INDEX IF NOT EXISTS idx_video_tasks_worker_queue
  ON public.video_tasks (priority, created_at)
  WHERE status = 'pending';

CREATE OR REPLACE FUNCTION public.claim_next_video_task(p_worker_id text)
RETURNS SETOF public.video_tasks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claimed_id uuid;
BEGIN
  SELECT id INTO claimed_id
  FROM public.video_tasks
  WHERE status = 'pending'
    AND attempt_count < max_attempts
  ORDER BY
    CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
    created_at
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF claimed_id IS NULL THEN RETURN; END IF;

  RETURN QUERY
  UPDATE public.video_tasks
  SET status = 'downloading',
      worker_id = p_worker_id,
      locked_at = now(),
      heartbeat_at = now(),
      started_at = COALESCE(started_at, now()),
      attempt_count = attempt_count + 1,
      current_step = 'Worker claimed task',
      progress_percentage = 1
  WHERE id = claimed_id
  RETURNING *;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_next_video_task(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_next_video_task(text) TO service_role;

CREATE OR REPLACE FUNCTION public.requeue_stale_video_tasks(p_stale_minutes integer DEFAULT 10)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE affected integer;
BEGIN
  UPDATE public.video_tasks
  SET status = CASE WHEN attempt_count < max_attempts THEN 'pending' ELSE 'error' END,
      current_step = CASE WHEN attempt_count < max_attempts THEN 'Worker heartbeat expired; queued for retry' ELSE 'Worker heartbeat expired' END,
      error_code = CASE WHEN attempt_count < max_attempts THEN NULL ELSE 'ERR_WORKER_LOST' END,
      error_message = CASE WHEN attempt_count < max_attempts THEN NULL ELSE 'The processing worker stopped responding' END,
      worker_id = NULL, locked_at = NULL, heartbeat_at = NULL
  WHERE status IN ('downloading','processing','summarizing','converting_3d')
    AND COALESCE(heartbeat_at, locked_at, started_at) < now() - make_interval(mins => p_stale_minutes);
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;
REVOKE ALL ON FUNCTION public.requeue_stale_video_tasks(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.requeue_stale_video_tasks(integer) TO service_role;

-- Processed videos are private and downloaded through signed URLs.
UPDATE storage.buckets SET public = false WHERE id = 'video-processed';
DROP POLICY IF EXISTS "Anyone can view processed files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own processed files" ON storage.objects;
CREATE POLICY "Users can view own processed files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'video-processed' AND (storage.foldername(name))[1] = auth.uid()::text);
