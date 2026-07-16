-- The product uses standard non-incentivized ads only. Remove all reward grants.
DROP TRIGGER IF EXISTS rewarded_ad_gamification_event_trigger ON public.ad_views;
DROP FUNCTION IF EXISTS public.rewarded_ad_gamification_event();
DROP FUNCTION IF EXISTS public.claim_rewarded_ad_credit(text);
DROP FUNCTION IF EXISTS public.record_rewarded_slot_view(text);
DROP FUNCTION IF EXISTS public.consume_rewarded_slot_views();

-- Remove obsolete unfinished ad challenges; historical wallet transactions remain auditable.
DELETE FROM public.daily_challenge_progress WHERE challenge_id='rewarded_ad';
