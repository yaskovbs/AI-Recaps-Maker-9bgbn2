-- A task row is created before the authenticated queue function encrypts and
-- stores its BYOK credentials. Only expose tasks to workers after that
-- credential row exists, preventing workers from claiming half-queued tasks.
CREATE OR REPLACE FUNCTION public.claim_next_video_task(p_worker_id text)
RETURNS SETOF public.video_tasks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claimed_id uuid;
BEGIN
  SELECT task.id INTO claimed_id
  FROM public.video_tasks AS task
  WHERE task.status = 'pending'
    AND task.attempt_count < task.max_attempts
    AND EXISTS (
      SELECT 1
      FROM public.video_task_secrets AS secret
      WHERE secret.task_id = task.id
    )
  ORDER BY
    CASE task.priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
    task.created_at
  FOR UPDATE OF task SKIP LOCKED
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
