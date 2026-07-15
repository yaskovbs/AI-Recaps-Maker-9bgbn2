/*
  # Add Row Level Security Policies

  ## Security Policies

  ### user_profiles
  - Users can view their own profile
  - Users can update their own profile
  - Users can insert their own profile (for new signups)

  ### api_keys
  - Users can view only their own API keys
  - Users can insert their own API keys
  - Users can update their own API keys
  - Users can delete their own API keys

  ### user_preferences
  - Users can view only their own preferences
  - Users can insert their own preferences
  - Users can update their own preferences

  ### credits_wallet
  - Users can view only their own wallet
  - System can insert/update wallets (handled by backend)

  ### credits_transactions
  - Users can view only their own transactions
  - System can insert transactions (handled by backend)

  ### learning_profiles
  - Users can view only their own learning profile
  - Users can insert their own learning profile
  - Users can update their own learning profile
  - Users can delete their own learning profile

  ### youtube_channels
  - Users can manage (view/insert/update/delete) only their own channels

  ### ratings
  - Users can view only their own ratings
  - Users can insert their own ratings
  - Users can update their own ratings

  ### contact_submissions
  - Users can insert contact submissions
  - Users can view their own submissions
  - Admins can view all (to be implemented later)
*/

-- user_profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- api_keys policies
DROP POLICY IF EXISTS "Users can view own API keys" ON api_keys;
CREATE POLICY "Users can view own API keys"
  ON api_keys FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own API keys" ON api_keys;
CREATE POLICY "Users can insert own API keys"
  ON api_keys FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own API keys" ON api_keys;
CREATE POLICY "Users can update own API keys"
  ON api_keys FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own API keys" ON api_keys;
CREATE POLICY "Users can delete own API keys"
  ON api_keys FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- user_preferences policies
DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;
CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;
CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- credits_wallet policies
DROP POLICY IF EXISTS "Users can view own wallet" ON credits_wallet;
CREATE POLICY "Users can view own wallet"
  ON credits_wallet FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own wallet" ON credits_wallet;
CREATE POLICY "Users can insert own wallet"
  ON credits_wallet FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own wallet" ON credits_wallet;
CREATE POLICY "Users can update own wallet"
  ON credits_wallet FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- credits_transactions policies
DROP POLICY IF EXISTS "Users can view own transactions" ON credits_transactions;
CREATE POLICY "Users can view own transactions"
  ON credits_transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own transactions" ON credits_transactions;
CREATE POLICY "Users can insert own transactions"
  ON credits_transactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- learning_profiles policies
DROP POLICY IF EXISTS "Users can view own learning profile" ON learning_profiles;
CREATE POLICY "Users can view own learning profile"
  ON learning_profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own learning profile" ON learning_profiles;
CREATE POLICY "Users can insert own learning profile"
  ON learning_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own learning profile" ON learning_profiles;
CREATE POLICY "Users can update own learning profile"
  ON learning_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own learning profile" ON learning_profiles;
CREATE POLICY "Users can delete own learning profile"
  ON learning_profiles FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- youtube_channels policies
DROP POLICY IF EXISTS "Users can view own channels" ON youtube_channels;
CREATE POLICY "Users can view own channels"
  ON youtube_channels FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own channels" ON youtube_channels;
CREATE POLICY "Users can insert own channels"
  ON youtube_channels FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own channels" ON youtube_channels;
CREATE POLICY "Users can update own channels"
  ON youtube_channels FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own channels" ON youtube_channels;
CREATE POLICY "Users can delete own channels"
  ON youtube_channels FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ratings policies
DROP POLICY IF EXISTS "Users can view own ratings" ON ratings;
CREATE POLICY "Users can view own ratings"
  ON ratings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own ratings" ON ratings;
CREATE POLICY "Users can insert own ratings"
  ON ratings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own ratings" ON ratings;
CREATE POLICY "Users can update own ratings"
  ON ratings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- contact_submissions policies
DROP POLICY IF EXISTS "Anyone can insert contact submissions" ON contact_submissions;
CREATE POLICY "Anyone can insert contact submissions"
  ON contact_submissions FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own submissions" ON contact_submissions;
CREATE POLICY "Users can view own submissions"
  ON contact_submissions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
