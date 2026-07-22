/*
  Allow authenticated users to continue and resume uploads only inside their
  own top-level folder. Supabase Storage upserts/resumable uploads need UPDATE
  in addition to INSERT; without it, the first chunk can create an object and
  the next chunk is rejected by row-level security.
*/

UPDATE storage.buckets
SET file_size_limit = 2147483648
WHERE id = 'recap-assets';

DROP POLICY IF EXISTS "Users can update own recap assets" ON storage.objects;
CREATE POLICY "Users can update own recap assets"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'recap-assets'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'recap-assets'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

-- Recreate INSERT explicitly for the authenticated role so a deployment does
-- not depend on older broad policies from a previous backend.
DROP POLICY IF EXISTS "Users can insert own recap assets" ON storage.objects;
CREATE POLICY "Users can insert own recap assets"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'recap-assets'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

-- Upsert checks may also read the existing object before updating it.
DROP POLICY IF EXISTS "Users can read own recap assets" ON storage.objects;
CREATE POLICY "Users can read own recap assets"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'recap-assets'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

