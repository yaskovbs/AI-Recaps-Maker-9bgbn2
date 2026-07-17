-- RPC compatibility for pages on partially migrated projects.
ALTER TABLE public.video_tasks ADD COLUMN IF NOT EXISTS cancel_requested_at timestamptz;
ALTER TABLE public.video_tasks ADD COLUMN IF NOT EXISTS credit_charged_at timestamptz;
ALTER TABLE public.video_tasks ADD COLUMN IF NOT EXISTS credit_refunded_at timestamptz;

CREATE OR REPLACE FUNCTION public.cancel_video_task(p_task_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE task_status text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'authentication required'; END IF;
  SELECT status INTO task_status FROM public.video_tasks WHERE id=p_task_id AND user_id=auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  IF task_status IN('completed','error','cancelled','expired') THEN RETURN task_status='cancelled'; END IF;
  UPDATE public.video_tasks SET status='cancelled',current_step='Cancellation requested',cancel_requested_at=now() WHERE id=p_task_id;
  RETURN true;
END; $$;

CREATE OR REPLACE FUNCTION public.purchase_youtube_slot_with_credits()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'authentication required'; END IF;
  UPDATE public.credits_wallet SET balance=balance-2,total_spent=total_spent+2,updated_at=now()
    WHERE user_id=uid AND balance>=2;
  IF NOT FOUND THEN RAISE EXCEPTION 'insufficient credits'; END IF;
  INSERT INTO public.credits_transactions(user_id,amount,type,reason)
    VALUES(uid,-2,'consume','YouTube learning slot');
  INSERT INTO public.youtube_slot_entitlements(user_id,source) VALUES(uid,'credits');
  RETURN true;
END; $$;

CREATE OR REPLACE FUNCTION public.get_leaderboard(p_limit integer DEFAULT 25)
RETURNS TABLE(user_id uuid,username text,avatar_url text,xp integer,level integer,completed_recaps bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT g.user_id,p.username,p.avatar_url,g.xp,g.level,count(v.id)
  FROM public.gamification_profiles g
  JOIN public.user_profiles p ON p.id=g.user_id
  LEFT JOIN public.video_tasks v ON v.user_id=g.user_id AND v.status='completed'
  WHERE g.leaderboard_opt_in=true
  GROUP BY g.user_id,p.username,p.avatar_url,g.xp,g.level
  ORDER BY g.xp DESC,count(v.id) DESC
  LIMIT LEAST(GREATEST(p_limit,1),100);
$$;

REVOKE ALL ON FUNCTION public.cancel_video_task(uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.purchase_youtube_slot_with_credits() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.cancel_video_task(uuid),public.purchase_youtube_slot_with_credits() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(integer) TO anon,authenticated;
NOTIFY pgrst, 'reload schema';
