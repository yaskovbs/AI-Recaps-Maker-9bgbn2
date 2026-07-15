-- Create all required application records as part of Auth user creation.
-- SECURITY DEFINER is required because email-confirmation signups do not yet
-- have an authenticated client session with which to satisfy RLS policies.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_username text;
BEGIN
  new_username := COALESCE(
    NULLIF(trim(new.raw_user_meta_data ->> 'username'), ''),
    NULLIF(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    NULLIF(trim(new.raw_user_meta_data ->> 'name'), ''),
    split_part(COALESCE(new.email, ''), '@', 1),
    'User'
  );

  INSERT INTO public.user_profiles (id, email, username, display_name, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.email, new.id::text || '@oauth.local'),
    new_username,
    new_username,
    COALESCE(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.credits_wallet (user_id, balance, total_earned)
  VALUES (new.id, 5, 5)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.learning_profiles (user_id)
  VALUES (new.id)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_preferences (user_id)
  VALUES (new.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- Backfill accounts created before this trigger existed.
INSERT INTO public.user_profiles (id, email, username, display_name, avatar_url)
SELECT
  u.id,
  COALESCE(u.email, u.id::text || '@oauth.local'),
  COALESCE(NULLIF(trim(u.raw_user_meta_data ->> 'username'), ''), NULLIF(trim(u.raw_user_meta_data ->> 'full_name'), ''), split_part(COALESCE(u.email, ''), '@', 1), 'User'),
  COALESCE(NULLIF(trim(u.raw_user_meta_data ->> 'full_name'), ''), NULLIF(trim(u.raw_user_meta_data ->> 'username'), ''), split_part(COALESCE(u.email, ''), '@', 1), 'User'),
  COALESCE(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture')
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.credits_wallet (user_id, balance, total_earned)
SELECT id, 5, 5 FROM auth.users ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.learning_profiles (user_id)
SELECT id FROM auth.users ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.user_preferences (user_id)
SELECT id FROM auth.users ON CONFLICT (user_id) DO NOTHING;
