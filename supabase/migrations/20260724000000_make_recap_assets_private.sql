/*
  Source videos, narration, and scripts can contain private user content.
  Older migrations made recap-assets public and left permissive SELECT
  policies active. PostgreSQL policies are ORed, so the owner-only policy
  added later did not override those older policies.
*/

UPDATE storage.buckets
SET public = false
WHERE id = 'recap-assets';

ALTER TABLE public.video_tasks
  ADD COLUMN IF NOT EXISTS narration_storage_path text;

DROP POLICY IF EXISTS "Anyone can view recap assets" ON storage.objects;
DROP POLICY IF EXISTS "Repair users read own private files" ON storage.objects;

DROP POLICY IF EXISTS "Users can read own recap assets" ON storage.objects;
CREATE POLICY "Users can read own recap assets"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'recap-assets'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

/*
  Preserve private owner access to the other buckets that previously shared
  the broad repair policy.
*/
DROP POLICY IF EXISTS "Users can read own original videos" ON storage.objects;
CREATE POLICY "Users can read own original videos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'video-originals'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );
