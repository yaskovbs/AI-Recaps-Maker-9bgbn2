import { ensureFreshSession } from './supabase';

export async function createResumableUploadToken(
  bucket: 'recap-assets' | 'video-originals',
  path: string
): Promise<string> {
  const session = await ensureFreshSession(180);
  if (!session?.access_token) throw new Error('Your session expired. Sign in again and retry.');

  const endpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-upload-token`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ bucket, path }),
  });
  const result = await response.json().catch(() => ({})) as { token?: string; error?: string };
  if (!response.ok || !result.token) {
    throw new Error(result.error || `Upload authorization failed (HTTP ${response.status}).`);
  }
  return result.token;
}
