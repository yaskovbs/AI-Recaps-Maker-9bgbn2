# Production deployment

## GitHub Actions secrets

Frontend build (public values despite being stored as Actions secrets):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VAPID_PUBLIC_KEY` — also injected as `VITE_VAPID_PUBLIC_KEY`

Supabase deployment:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_ID`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_DB_URL` — optional alternative for direct PostgreSQL migration deployment
- `PROCESSING_SECRET` — random value of at least 32 characters; must match the worker
- `ALLOWED_ORIGINS` — comma-separated production web origins
- `VAPID_SUBJECT` — normally `mailto:operations@example.com` or the production origin
- `VAPID_PRIVATE_KEY`
- `CRON_SECRET` — random value used by the scheduled cleanup request

Web hosting:

- `HOSTINGER_SSH_KEY`

## Worker-only secrets

Store these in the worker host secret manager, not in the frontend build:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PROCESSING_SECRET`

Copy the non-secret limits from `worker/.env.example`. Deploy the worker with `worker/docker-compose.yml` and keep it running continuously.

## External console setup

- Supabase/OnSpace Auth: configure the production site URL, redirect URLs, and Google OAuth provider.
- Google Cloud OAuth: add the Supabase callback URL.
- Google AdSense: enable standard display or Auto ads for the production domain. Regular ads never grant credits or unlock features.
- Web Push: generate one VAPID key pair and use the same public key in the frontend and Edge Function.
- Apply every migration and deploy all Edge Functions before deploying the frontend.

Users supply their own YouTube, Gemini, Google Search, and Search Engine ID values inside the app. Those BYOK values are encrypted, isolated per user, and are not GitHub secrets. There is no platform-key fallback.
