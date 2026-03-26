/*
  # Create Storage Buckets for Video Files

  1. Storage Buckets
    - `video-originals` - Private bucket for raw uploaded/downloaded video files
    - `video-processed` - Public bucket for processed output files (3D, summaries)
    - `recap-assets` - Already exists, used for recap media uploads

  2. Security
    - RLS policies for authenticated users to manage their own files
    - File size limits enforced at application level
    - Users can only access files in their own user_id prefixed paths
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'video-originals',
  'video-originals',
  false,
  524288000,
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'audio/mpeg', 'audio/mp4']
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'video-processed',
  'video-processed',
  true,
  1073741824,
  ARRAY['video/mp4', 'video/webm', 'application/pdf', 'image/png', 'image/jpeg']
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'recap-assets',
  'recap-assets',
  true,
  524288000,
  ARRAY['video/mp4', 'video/webm', 'audio/mpeg', 'audio/mp4', 'image/png', 'image/jpeg', 'text/plain']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload to own originals folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'video-originals'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view own originals"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'video-originals'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own originals"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'video-originals'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can upload to own processed folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'video-processed'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Anyone can view processed files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'video-processed');

CREATE POLICY "Users can delete own processed files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'video-processed'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can upload to own recap-assets folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'recap-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Anyone can view recap assets"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'recap-assets');

CREATE POLICY "Users can delete own recap assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'recap-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
