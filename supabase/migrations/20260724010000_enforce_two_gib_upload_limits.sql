/*
  Keep the database bucket limits aligned with the application's advertised
  maximum video size: 2 GiB (2,147,483,648 bytes).

  The hosted Supabase global Storage limit must also be at least this value;
  the global setting takes precedence over these per-bucket limits.
*/

UPDATE storage.buckets
SET file_size_limit = 2147483648
WHERE id IN ('recap-assets', 'video-originals', 'video-processed');
