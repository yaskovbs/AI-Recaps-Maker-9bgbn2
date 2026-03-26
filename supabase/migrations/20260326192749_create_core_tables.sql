/*
  # Create Core Tables for AI Recaps Maker

  ## New Tables
  
  ### 1. user_profiles
  - `id` (uuid, primary key) - matches auth.users.id
  - `email` (text, unique)
  - `display_name` (text, nullable)
  - `avatar_url` (text, nullable)
  - `metadata` (jsonb) - for flexible user data like frozen status
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. api_keys
  - `id` (uuid, primary key)
  - `user_id` (uuid, references user_profiles)
  - `provider` (text) - youtube, google_search, search_engine_id, gemini
  - `encrypted_key` (text) - encrypted API key
  - `key_hint` (text) - last 4 chars for display
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. user_preferences
  - `id` (uuid, primary key)
  - `user_id` (uuid, references user_profiles, unique)
  - `notifications` (jsonb) - notification settings
  - `learning` (jsonb) - learning preferences
  - `language` (text, default 'he')
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. credits_wallet
  - `id` (uuid, primary key)
  - `user_id` (uuid, references user_profiles, unique)
  - `balance` (integer, default 0)
  - `total_earned` (integer, default 0)
  - `total_spent` (integer, default 0)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 5. credits_transactions
  - `id` (uuid, primary key)
  - `user_id` (uuid, references user_profiles)
  - `amount` (integer) - positive for earned, negative for spent
  - `type` (text) - 'reward', 'consume', 'bonus', 'refund'
  - `reason` (text, nullable)
  - `metadata` (jsonb, nullable)
  - `created_at` (timestamptz)

  ### 6. learning_profiles
  - `id` (uuid, primary key)
  - `user_id` (uuid, references user_profiles, unique)
  - `continuous_learning` (boolean, default true)
  - `global_learning` (boolean, default false)
  - `preferences_data` (jsonb) - stores learned preferences
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 7. youtube_channels
  - `id` (uuid, primary key)
  - `user_id` (uuid, references user_profiles)
  - `channel_id` (text)
  - `channel_title` (text, nullable)
  - `channel_url` (text)
  - `category` (text) - 'personal' or 'inspiration'
  - `last_synced` (timestamptz, nullable)
  - `is_active` (boolean, default true)
  - `created_at` (timestamptz)

  ### 8. ratings
  - `id` (uuid, primary key)
  - `user_id` (uuid, references user_profiles)
  - `recap_id` (uuid, nullable) - if rating a specific recap
  - `rating` (integer) - 1-5
  - `feedback` (text, nullable)
  - `created_at` (timestamptz)

  ### 9. contact_submissions
  - `id` (uuid, primary key)
  - `user_id` (uuid, references user_profiles, nullable) - null if guest
  - `name` (text)
  - `email` (text)
  - `subject` (text, nullable)
  - `message` (text)
  - `status` (text, default 'new') - 'new', 'read', 'replied', 'archived'
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Add policies for authenticated users to manage their own data
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  display_name text,
  avatar_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create api_keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  provider text NOT NULL,
  encrypted_key text NOT NULL,
  key_hint text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  notifications jsonb DEFAULT '{"browserPush": false, "email": false, "recapComplete": true, "weeklyDigest": false}'::jsonb,
  learning jsonb DEFAULT '{"continuousLearning": true, "globalLearning": false}'::jsonb,
  language text DEFAULT 'he',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create credits_wallet table
CREATE TABLE IF NOT EXISTS credits_wallet (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  balance integer DEFAULT 0 CHECK (balance >= 0),
  total_earned integer DEFAULT 0,
  total_spent integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create credits_transactions table
CREATE TABLE IF NOT EXISTS credits_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  amount integer NOT NULL,
  type text NOT NULL CHECK (type IN ('reward', 'consume', 'bonus', 'refund')),
  reason text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create learning_profiles table
CREATE TABLE IF NOT EXISTS learning_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  continuous_learning boolean DEFAULT true,
  global_learning boolean DEFAULT false,
  preferences_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create youtube_channels table
CREATE TABLE IF NOT EXISTS youtube_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  channel_id text NOT NULL,
  channel_title text,
  channel_url text NOT NULL,
  category text DEFAULT 'inspiration' CHECK (category IN ('personal', 'inspiration')),
  last_synced timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, channel_id)
);

-- Create ratings table
CREATE TABLE IF NOT EXISTS ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  recap_id uuid,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback text,
  created_at timestamptz DEFAULT now()
);

-- Create contact_submissions table
CREATE TABLE IF NOT EXISTS contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  subject text,
  message text NOT NULL,
  status text DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE youtube_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_credits_wallet_user_id ON credits_wallet(user_id);
CREATE INDEX IF NOT EXISTS idx_credits_transactions_user_id ON credits_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_profiles_user_id ON learning_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_youtube_channels_user_id ON youtube_channels(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_user_id ON contact_submissions(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_profiles_updated_at') THEN
    CREATE TRIGGER update_user_profiles_updated_at
      BEFORE UPDATE ON user_profiles
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_api_keys_updated_at') THEN
    CREATE TRIGGER update_api_keys_updated_at
      BEFORE UPDATE ON api_keys
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_preferences_updated_at') THEN
    CREATE TRIGGER update_user_preferences_updated_at
      BEFORE UPDATE ON user_preferences
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_credits_wallet_updated_at') THEN
    CREATE TRIGGER update_credits_wallet_updated_at
      BEFORE UPDATE ON credits_wallet
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_learning_profiles_updated_at') THEN
    CREATE TRIGGER update_learning_profiles_updated_at
      BEFORE UPDATE ON learning_profiles
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;