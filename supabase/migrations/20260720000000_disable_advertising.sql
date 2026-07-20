-- Advertising is temporarily disabled across every backend entry point.
DROP TRIGGER IF EXISTS rewarded_ad_gamification_event_trigger ON public.ad_views;
DROP FUNCTION IF EXISTS public.rewarded_ad_gamification_event();
DROP FUNCTION IF EXISTS public.claim_rewarded_ad_credit(text);
DROP FUNCTION IF EXISTS public.record_rewarded_slot_view(text);
DROP FUNCTION IF EXISTS public.consume_rewarded_slot_views();

REVOKE ALL ON TABLE public.ad_views FROM anon, authenticated;

DO $$
DECLARE policy_name text;
BEGIN
  FOR policy_name IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ad_views'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.ad_views', policy_name);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.reject_advertising_activity()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'advertising is disabled';
END;
$$;

REVOKE ALL ON FUNCTION public.reject_advertising_activity() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS reject_advertising_activity_trigger ON public.ad_views;
CREATE TRIGGER reject_advertising_activity_trigger
BEFORE INSERT OR UPDATE ON public.ad_views
FOR EACH ROW EXECUTE FUNCTION public.reject_advertising_activity();

DELETE FROM public.daily_challenge_progress WHERE challenge_id = 'rewarded_ad';
