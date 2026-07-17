-- Restore the exact zero-argument RPC used by the Analytics page.
ALTER TABLE public.video_tasks ADD COLUMN IF NOT EXISTS duration_seconds integer NOT NULL DEFAULT 0;
ALTER TABLE public.video_tasks ADD COLUMN IF NOT EXISTS clip_plan jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.video_tasks ADD COLUMN IF NOT EXISTS key_topics jsonb NOT NULL DEFAULT '[]'::jsonb;

DROP FUNCTION IF EXISTS public.get_my_analytics();
CREATE FUNCTION public.get_my_analytics()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total_recaps', count(*),
    'completed_recaps', count(*) FILTER (WHERE status = 'completed'),
    'failed_recaps', count(*) FILTER (WHERE status = 'error'),
    'success_rate', COALESCE(round(100.0 * count(*) FILTER (WHERE status = 'completed') / NULLIF(count(*), 0), 1), 0),
    'average_duration_seconds', COALESCE(round(avg(duration_seconds) FILTER (WHERE status = 'completed')), 0),
    'time_saved_seconds', COALESCE(sum(GREATEST(duration_seconds - COALESCE(
      (SELECT sum((clip->>'end')::numeric - (clip->>'start')::numeric)
       FROM jsonb_array_elements(COALESCE(clip_plan, '[]'::jsonb)) clip), 0), 0)
      ) FILTER (WHERE status = 'completed'), 0),
    'topics', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('topic', topic, 'count', topic_count) ORDER BY topic_count DESC)
      FROM (
        SELECT topic, count(*) AS topic_count
        FROM public.video_tasks task
        CROSS JOIN LATERAL jsonb_array_elements_text(COALESCE(task.key_topics, '[]'::jsonb)) topic
        WHERE task.user_id = auth.uid()
        GROUP BY topic
        ORDER BY topic_count DESC
        LIMIT 10
      ) popular_topics
    ), '[]'::jsonb)
  )
  FROM public.video_tasks
  WHERE user_id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.get_my_analytics() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_analytics() TO authenticated;
NOTIFY pgrst, 'reload schema';
