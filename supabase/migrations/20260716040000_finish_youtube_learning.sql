CREATE TABLE IF NOT EXISTS public.youtube_learning_settings (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, refresh_interval_seconds integer NOT NULL DEFAULT 86400 CHECK(refresh_interval_seconds BETWEEN 3600 AND 604800),
 include_public boolean NOT NULL DEFAULT true,include_shorts boolean NOT NULL DEFAULT true,include_live boolean NOT NULL DEFAULT true,recent_90_days boolean NOT NULL DEFAULT true,updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.youtube_slot_entitlements (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,source text NOT NULL CHECK(source IN('ads','credits')),
 expires_at timestamptz NOT NULL DEFAULT now()+interval '7 days',consumed_at timestamptz,created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.youtube_learning_settings ENABLE ROW LEVEL SECURITY; ALTER TABLE public.youtube_slot_entitlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own learning settings" ON public.youtube_learning_settings FOR ALL TO authenticated USING(auth.uid()=user_id) WITH CHECK(auth.uid()=user_id);
CREATE POLICY "Users read own slot entitlements" ON public.youtube_slot_entitlements FOR SELECT TO authenticated USING(auth.uid()=user_id);

CREATE OR REPLACE FUNCTION public.consume_rewarded_slot_views() RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid();selected_ids uuid[];
BEGIN SELECT array_agg(id) INTO selected_ids FROM(SELECT id FROM ad_views WHERE user_id=uid AND purpose='youtube_slot' AND consumed_at IS NULL ORDER BY granted_at LIMIT 2 FOR UPDATE SKIP LOCKED)s;
 IF COALESCE(array_length(selected_ids,1),0)<2 THEN RETURN false;END IF; UPDATE ad_views SET consumed_at=now() WHERE id=ANY(selected_ids);
 INSERT INTO youtube_slot_entitlements(user_id,source)VALUES(uid,'ads');RETURN true;END $$;

CREATE OR REPLACE FUNCTION public.purchase_youtube_slot_with_credits() RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid();new_balance integer;
BEGIN UPDATE credits_wallet SET balance=balance-2,total_spent=total_spent+2,updated_at=now() WHERE user_id=uid AND balance>=2 RETURNING balance INTO new_balance;
 IF new_balance IS NULL THEN RAISE EXCEPTION 'insufficient credits';END IF;
 INSERT INTO credits_transactions(user_id,amount,type,reason)VALUES(uid,-2,'consume','YouTube learning slot (7 days)');
 INSERT INTO youtube_slot_entitlements(user_id,source)VALUES(uid,'credits');RETURN true;END $$;
REVOKE ALL ON FUNCTION public.purchase_youtube_slot_with_credits() FROM PUBLIC,anon;GRANT EXECUTE ON FUNCTION public.purchase_youtube_slot_with_credits() TO authenticated;

CREATE OR REPLACE FUNCTION public.enforce_youtube_channel_slots() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE active_count integer;entitlement_id uuid;
BEGIN SELECT count(*) INTO active_count FROM youtube_channels WHERE user_id=NEW.user_id AND is_active=true;
 IF active_count<11 THEN RETURN NEW;END IF;
 SELECT id INTO entitlement_id FROM youtube_slot_entitlements WHERE user_id=NEW.user_id AND consumed_at IS NULL AND expires_at>now() ORDER BY created_at LIMIT 1 FOR UPDATE SKIP LOCKED;
 IF entitlement_id IS NULL THEN RAISE EXCEPTION 'A valid slot entitlement is required';END IF;
 UPDATE youtube_slot_entitlements SET consumed_at=now() WHERE id=entitlement_id;NEW.slot_unlocked_at:=now();RETURN NEW;END $$;
DROP TRIGGER IF EXISTS enforce_youtube_channel_slots_trigger ON public.youtube_channels;
CREATE TRIGGER enforce_youtube_channel_slots_trigger BEFORE INSERT ON public.youtube_channels FOR EACH ROW EXECUTE FUNCTION public.enforce_youtube_channel_slots();
