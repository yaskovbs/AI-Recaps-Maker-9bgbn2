ALTER TABLE public.api_keys
  ADD COLUMN IF NOT EXISTS validation_status text DEFAULT 'untested'
    CHECK (validation_status IN ('untested', 'valid', 'invalid', 'forbidden', 'quota_exceeded', 'network_error', 'pair_required')),
  ADD COLUMN IF NOT EXISTS validation_message text,
  ADD COLUMN IF NOT EXISTS last_validated_at timestamptz;
