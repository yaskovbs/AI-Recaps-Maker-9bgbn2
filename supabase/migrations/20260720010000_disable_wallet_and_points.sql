-- Wallet, credits, points, achievements, and leaderboard are disabled.
-- Historical rows are retained so these features can be restored later.

DROP FUNCTION IF EXISTS public.purchase_youtube_slot_with_credits();
DROP FUNCTION IF EXISTS public.get_leaderboard(integer);
DROP TRIGGER IF EXISTS initialize_gamification_profile_trigger ON auth.users;
DROP TRIGGER IF EXISTS rating_gamification_event_trigger ON public.ratings;
DROP TRIGGER IF EXISTS credit_milestone_event_trigger ON public.credits_transactions;
DROP FUNCTION IF EXISTS public.initialize_gamification_profile();
DROP FUNCTION IF EXISTS public.rating_gamification_event();
DROP FUNCTION IF EXISTS public.credit_milestone_event();
DROP FUNCTION IF EXISTS public.record_gamification_event(uuid, text, integer);

-- Keep processing workers compatible, but make charging and refunds no-ops.
CREATE OR REPLACE FUNCTION public.charge_task_credit(p_user_id uuid, p_task_id uuid)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN RAISE EXCEPTION 'service role required'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.video_tasks WHERE id = p_task_id AND user_id = p_user_id) THEN
    RAISE EXCEPTION 'task not found';
  END IF;
  RETURN 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.refund_task_credit(p_task_id uuid, p_reason text DEFAULT 'Processing failed')
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN RAISE EXCEPTION 'service role required'; END IF;
  RETURN false;
END;
$$;

-- Preserve recap-complete notifications without awarding points.
CREATE OR REPLACE FUNCTION public.video_task_completion_events()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
    INSERT INTO public.notification_events(user_id, type, title, body, url, metadata)
    VALUES(NEW.user_id, 'recap_complete', 'Your recap is ready', NEW.title || ' finished processing.', '/my-videos', jsonb_build_object('task_id', NEW.id));
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE new_username text;
BEGIN
  new_username := COALESCE(NULLIF(trim(new.raw_user_meta_data ->> 'username'), ''), NULLIF(trim(new.raw_user_meta_data ->> 'full_name'), ''), NULLIF(trim(new.raw_user_meta_data ->> 'name'), ''), split_part(COALESCE(new.email, ''), '@', 1), 'User');
  INSERT INTO public.user_profiles(id, email, username, display_name, avatar_url)
  VALUES(new.id, COALESCE(new.email, new.id::text || '@oauth.local'), new_username, new_username, COALESCE(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'))
  ON CONFLICT(id) DO NOTHING;
  INSERT INTO public.learning_profiles(user_id) VALUES(new.id) ON CONFLICT(user_id) DO NOTHING;
  INSERT INTO public.user_preferences(user_id) VALUES(new.id) ON CONFLICT(user_id) DO NOTHING;
  RETURN new;
END;
$$;

REVOKE ALL ON TABLE public.credits_wallet, public.credits_transactions,
  public.gamification_profiles, public.user_achievements, public.daily_challenge_progress
  FROM anon, authenticated;

DO $$
DECLARE row record;
BEGIN
  FOR row IN
    SELECT schemaname, tablename, policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename IN ('credits_wallet', 'credits_transactions', 'gamification_profiles', 'user_achievements', 'daily_challenge_progress')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', row.policyname, row.schemaname, row.tablename);
  END LOOP;
END $$;
