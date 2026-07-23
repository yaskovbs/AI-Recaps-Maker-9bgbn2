/*
  Large TUS uploads are finalized as upserts.  A bucket size increase alone is
  not enough: authenticated owners also need INSERT, SELECT, and UPDATE access
  to the object throughout the resumable upload.

  This is intentionally a new migration so projects that already applied
  20260721000000 still receive the policy repair.
*/

UPDATE storage.buckets
SET
  file_size_limit = 2147483648,
  allowed_mime_types = NULL
WHERE id = 'recap-assets';

DROP POLICY IF EXISTS "Users can insert own recap assets" ON storage.objects;
CREATE POLICY "Users can insert own recap assets"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'recap-assets'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS "Users can read own recap assets" ON storage.objects;
CREATE POLICY "Users can read own recap assets"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'recap-assets'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

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

DROP POLICY IF EXISTS "Users can delete own recap assets" ON storage.objects;
CREATE POLICY "Users can delete own recap assets"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'recap-assets'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

