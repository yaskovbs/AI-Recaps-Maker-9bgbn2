-- Repair installations where early migrations were recorded but core account
-- objects were never created. This migration is intentionally idempotent.

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  username text NOT NULL DEFAULT '',
  display_name text,
  avatar_url text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS username text NOT NULL DEFAULT '';
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.credits_wallet (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance integer NOT NULL DEFAULT 0 CHECK (balance >= 0),
  total_earned integer NOT NULL DEFAULT 0 CHECK (total_earned >= 0),
  total_spent integer NOT NULL DEFAULT 0 CHECK (total_spent >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.credits_wallet ADD COLUMN IF NOT EXISTS total_earned integer NOT NULL DEFAULT 0;
ALTER TABLE public.credits_wallet ADD COLUMN IF NOT EXISTS total_spent integer NOT NULL DEFAULT 0;
ALTER TABLE public.credits_wallet ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.credits_wallet ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE UNIQUE INDEX IF NOT EXISTS credits_wallet_user_id_key ON public.credits_wallet(user_id);

CREATE TABLE IF NOT EXISTS public.credits_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  type text NOT NULL CHECK (type IN ('reward', 'consume', 'bonus', 'refund')),
  reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_credits_transactions_user_id ON public.credits_transactions(user_id);

CREATE TABLE IF NOT EXISTS public.user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  notifications jsonb NOT NULL DEFAULT '{"browserPush":false,"email":false,"recapComplete":true,"weeklyDigest":false}'::jsonb,
  learning jsonb NOT NULL DEFAULT '{"continuousLearning":true,"globalLearning":false}'::jsonb,
  language text NOT NULL DEFAULT 'he',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.learning_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  continuous_learning boolean NOT NULL DEFAULT true,
  global_learning boolean NOT NULL DEFAULT false,
  preferences_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credits_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credits_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own wallet" ON public.credits_wallet;
CREATE POLICY "Users can view own wallet" ON public.credits_wallet
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own transactions" ON public.credits_transactions;
CREATE POLICY "Users can view own transactions" ON public.credits_transactions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT TO authenticated USING (id = auth.uid());
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
CREATE POLICY "Users can view own preferences" ON public.user_preferences
  FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
CREATE POLICY "Users can insert own preferences" ON public.user_preferences
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
CREATE POLICY "Users can update own preferences" ON public.user_preferences
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own learning profile" ON public.learning_profiles;
CREATE POLICY "Users can view own learning profile" ON public.learning_profiles
  FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can insert own learning profile" ON public.learning_profiles;
CREATE POLICY "Users can insert own learning profile" ON public.learning_profiles
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can update own learning profile" ON public.learning_profiles;
CREATE POLICY "Users can update own learning profile" ON public.learning_profiles
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Recreate/backfill account records after all repaired tables exist.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_username text;
BEGIN
  new_username := COALESCE(NULLIF(trim(new.raw_user_meta_data->>'username'), ''),
    NULLIF(trim(new.raw_user_meta_data->>'full_name'), ''),
    NULLIF(trim(new.raw_user_meta_data->>'name'), ''),
    NULLIF(split_part(COALESCE(new.email, ''), '@', 1), ''), 'User');
  INSERT INTO public.user_profiles(id,email,username,display_name,avatar_url)
    VALUES(new.id,COALESCE(new.email,new.id::text||'@oauth.local'),new_username,new_username,
      COALESCE(new.raw_user_meta_data->>'avatar_url',new.raw_user_meta_data->>'picture'))
    ON CONFLICT(id) DO UPDATE SET email=EXCLUDED.email,
      username=CASE WHEN public.user_profiles.username='' THEN EXCLUDED.username ELSE public.user_profiles.username END;
  INSERT INTO public.credits_wallet(user_id,balance,total_earned) VALUES(new.id,5,5) ON CONFLICT(user_id) DO NOTHING;
  INSERT INTO public.user_preferences(user_id) VALUES(new.id) ON CONFLICT(user_id) DO NOTHING;
  INSERT INTO public.learning_profiles(user_id) VALUES(new.id) ON CONFLICT(user_id) DO NOTHING;
  RETURN new;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

INSERT INTO public.user_profiles(id,email,username,display_name,avatar_url)
SELECT u.id,COALESCE(u.email,u.id::text||'@oauth.local'),
  COALESCE(NULLIF(trim(u.raw_user_meta_data->>'username'),''),NULLIF(trim(u.raw_user_meta_data->>'full_name'),''),NULLIF(split_part(COALESCE(u.email,''),'@',1),''),'User'),
  COALESCE(NULLIF(trim(u.raw_user_meta_data->>'full_name'),''),NULLIF(split_part(COALESCE(u.email,''),'@',1),''),'User'),
  COALESCE(u.raw_user_meta_data->>'avatar_url',u.raw_user_meta_data->>'picture')
FROM auth.users u ON CONFLICT(id) DO NOTHING;
INSERT INTO public.credits_wallet(user_id,balance,total_earned) SELECT id,5,5 FROM auth.users ON CONFLICT(user_id) DO NOTHING;
INSERT INTO public.user_preferences(user_id) SELECT id FROM auth.users ON CONFLICT(user_id) DO NOTHING;
INSERT INTO public.learning_profiles(user_id) SELECT id FROM auth.users ON CONFLICT(user_id) DO NOTHING;

GRANT SELECT ON public.credits_wallet, public.credits_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_preferences, public.learning_profiles TO authenticated;
GRANT SELECT, UPDATE ON public.user_profiles TO authenticated;

NOTIFY pgrst, 'reload schema';
