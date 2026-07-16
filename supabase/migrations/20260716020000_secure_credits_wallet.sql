-- Phase 4: database-authoritative credits, idempotent task charging, and ad rewards.
ALTER TABLE public.video_tasks
  ADD COLUMN IF NOT EXISTS credit_charged_at timestamptz,
  ADD COLUMN IF NOT EXISTS credit_refunded_at timestamptz;

ALTER TABLE public.ad_views
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'google_ad_manager',
  ADD COLUMN IF NOT EXISTS provider_event_id text,
  ADD COLUMN IF NOT EXISTS purpose text NOT NULL DEFAULT 'credit',
  ADD COLUMN IF NOT EXISTS granted_at timestamptz,
  ADD COLUMN IF NOT EXISTS consumed_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS ad_views_provider_event_unique
  ON public.ad_views(user_id, provider, provider_event_id)
  WHERE provider_event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS credits_transactions_user_created_idx
  ON public.credits_transactions(user_id, created_at DESC);

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname='supabase_realtime')
     AND NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='credits_wallet') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.credits_wallet;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname='supabase_realtime')
     AND NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='credits_transactions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.credits_transactions;
  END IF;
END $$;

-- Clients may read balances/history, but must never write currency rows directly.
DROP POLICY IF EXISTS "Users can insert own wallet" ON public.credits_wallet;
DROP POLICY IF EXISTS "Users can update own wallet" ON public.credits_wallet;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.credits_transactions;
DROP POLICY IF EXISTS "Users can create own ad views" ON public.ad_views;

INSERT INTO public.credits_transactions(user_id,amount,type,reason,metadata)
SELECT w.user_id,w.total_earned,'bonus','Welcome credits','{"source":"account_creation"}'::jsonb
FROM public.credits_wallet w
WHERE w.total_earned > 0 AND NOT EXISTS (SELECT 1 FROM public.credits_transactions t WHERE t.user_id=w.user_id);

CREATE OR REPLACE FUNCTION public.charge_task_credit(p_user_id uuid, p_task_id uuid)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE current_balance integer;
BEGIN
  IF auth.role() <> 'service_role' THEN RAISE EXCEPTION 'service role required'; END IF;
  IF NOT EXISTS (SELECT 1 FROM video_tasks WHERE id=p_task_id AND user_id=p_user_id) THEN
    RAISE EXCEPTION 'task not found';
  END IF;
  IF EXISTS (SELECT 1 FROM video_tasks WHERE id=p_task_id AND credit_charged_at IS NOT NULL AND credit_refunded_at IS NULL) THEN
    SELECT balance INTO current_balance FROM credits_wallet WHERE user_id=p_user_id;
    RETURN current_balance;
  END IF;
  UPDATE credits_wallet SET balance=balance-1, total_spent=total_spent+1, updated_at=now()
    WHERE user_id=p_user_id AND balance >= 1 RETURNING balance INTO current_balance;
  IF current_balance IS NULL THEN RAISE EXCEPTION 'insufficient credits' USING ERRCODE='P0001'; END IF;
  UPDATE video_tasks SET credit_charged_at=now(), credit_refunded_at=NULL WHERE id=p_task_id;
  INSERT INTO credits_transactions(user_id,amount,type,reason,metadata)
    VALUES(p_user_id,-1,'consume','Created recap',jsonb_build_object('task_id',p_task_id));
  RETURN current_balance;
END $$;

CREATE OR REPLACE FUNCTION public.refund_task_credit(p_task_id uuid, p_reason text DEFAULT 'Processing failed')
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE task_row video_tasks%ROWTYPE;
BEGIN
  IF auth.role() <> 'service_role' THEN RAISE EXCEPTION 'service role required'; END IF;
  SELECT * INTO task_row FROM video_tasks WHERE id=p_task_id FOR UPDATE;
  IF NOT FOUND OR task_row.credit_charged_at IS NULL OR task_row.credit_refunded_at IS NOT NULL THEN RETURN false; END IF;
  UPDATE credits_wallet SET balance=balance+1, total_spent=GREATEST(total_spent-1,0), updated_at=now() WHERE user_id=task_row.user_id;
  UPDATE video_tasks SET credit_refunded_at=now() WHERE id=p_task_id;
  INSERT INTO credits_transactions(user_id,amount,type,reason,metadata)
    VALUES(task_row.user_id,1,'refund',left(p_reason,300),jsonb_build_object('task_id',p_task_id));
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION public.claim_rewarded_ad_credit(p_event_id text)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE uid uuid := auth.uid(); current_balance integer;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'authentication required'; END IF;
  IF p_event_id IS NULL OR length(p_event_id) < 16 OR length(p_event_id) > 200 THEN RAISE EXCEPTION 'invalid reward event'; END IF;
  -- Limit abuse even if a browser event is forged. Production SSV should replace this RPC when configured.
  IF EXISTS (SELECT 1 FROM ad_views WHERE user_id=uid AND purpose='credit' AND granted_at > now()-interval '30 seconds') THEN
    RAISE EXCEPTION 'reward cooldown active';
  END IF;
  INSERT INTO ad_views(user_id,ad_type,reward_credits,provider,provider_event_id,purpose,granted_at)
    VALUES(uid,'rewarded',1,'google_ad_manager',p_event_id,'credit',now())
    ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN RAISE EXCEPTION 'reward already claimed'; END IF;
  INSERT INTO credits_wallet(user_id,balance,total_earned) VALUES(uid,1,1)
    ON CONFLICT(user_id) DO UPDATE SET balance=credits_wallet.balance+1,total_earned=credits_wallet.total_earned+1,updated_at=now()
    RETURNING balance INTO current_balance;
  INSERT INTO credits_transactions(user_id,amount,type,reason,metadata)
    VALUES(uid,1,'reward','Completed rewarded ad',jsonb_build_object('event_id',p_event_id,'provider','google_ad_manager'));
  RETURN current_balance;
END $$;

CREATE OR REPLACE FUNCTION public.cancel_video_task(p_task_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE task_row video_tasks%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'authentication required'; END IF;
  SELECT * INTO task_row FROM video_tasks WHERE id=p_task_id AND user_id=auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  IF task_row.status IN ('completed','error','cancelled') THEN RETURN task_row.status='cancelled'; END IF;
  UPDATE video_tasks SET status='cancelled',current_step='Cancellation requested',cancel_requested_at=now() WHERE id=p_task_id;
  IF task_row.credit_charged_at IS NOT NULL AND task_row.credit_refunded_at IS NULL THEN
    UPDATE credits_wallet SET balance=balance+1,total_spent=GREATEST(total_spent-1,0),updated_at=now() WHERE user_id=auth.uid();
    UPDATE video_tasks SET credit_refunded_at=now() WHERE id=p_task_id;
    INSERT INTO credits_transactions(user_id,amount,type,reason,metadata)
      VALUES(auth.uid(),1,'refund','Task cancelled',jsonb_build_object('task_id',p_task_id));
  END IF;
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION public.record_rewarded_slot_view(p_event_id text)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE uid uuid:=auth.uid(); view_count integer;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'authentication required'; END IF;
  IF p_event_id IS NULL OR length(p_event_id)<16 OR length(p_event_id)>200 THEN RAISE EXCEPTION 'invalid reward event'; END IF;
  INSERT INTO ad_views(user_id,ad_type,reward_credits,provider,provider_event_id,purpose,granted_at)
    VALUES(uid,'rewarded',0,'google_ad_manager',p_event_id,'youtube_slot',now()) ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN RAISE EXCEPTION 'reward already recorded'; END IF;
  SELECT count(*) INTO view_count FROM ad_views WHERE user_id=uid AND purpose='youtube_slot' AND consumed_at IS NULL;
  RETURN view_count;
END $$;

CREATE OR REPLACE FUNCTION public.consume_rewarded_slot_views()
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE uid uuid:=auth.uid(); selected_ids uuid[];
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'authentication required'; END IF;
  SELECT array_agg(id) INTO selected_ids FROM (
    SELECT id FROM ad_views WHERE user_id=uid AND purpose='youtube_slot' AND consumed_at IS NULL
    ORDER BY granted_at LIMIT 2 FOR UPDATE SKIP LOCKED
  ) available;
  IF COALESCE(array_length(selected_ids,1),0)<2 THEN RETURN false; END IF;
  UPDATE ad_views SET consumed_at=now() WHERE id=ANY(selected_ids);
  RETURN true;
END $$;

DROP POLICY IF EXISTS "Users can delete own video tasks" ON public.video_tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON public.video_tasks;
CREATE POLICY "Users can delete terminal video tasks" ON public.video_tasks FOR DELETE TO authenticated
  USING (auth.uid()=user_id AND status IN ('completed','error','cancelled'));

REVOKE ALL ON FUNCTION public.charge_task_credit(uuid,uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.refund_task_credit(uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.charge_task_credit(uuid,uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.refund_task_credit(uuid,text) TO service_role;
REVOKE ALL ON FUNCTION public.claim_rewarded_ad_credit(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_rewarded_ad_credit(text) TO authenticated;
REVOKE ALL ON FUNCTION public.cancel_video_task(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_video_task(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.record_rewarded_slot_view(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_rewarded_slot_view(text) TO authenticated;
REVOKE ALL ON FUNCTION public.consume_rewarded_slot_views() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_rewarded_slot_views() TO authenticated;
