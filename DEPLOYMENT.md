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
- `SUPABASE_SERVICE_ROLE_KEY` — required by the private processing worker; never expose it to the frontend
- `PROCESSING_SECRET` — random value of at least 32 characters; must match the worker
- `ALLOWED_ORIGINS` — comma-separated production web origins
- `VAPID_SUBJECT` — normally `mailto:operations@example.com` or the production origin
- `VAPID_PRIVATE_KEY`
- `CRON_SECRET` — random value used by the scheduled cleanup request

Web hosting:

- `HOSTINGER_SSH_KEY`
- `HOSTINGER_SSH_HOST`
- `HOSTINGER_SSH_PORT` — use the SSH port shown in Hostinger, which may not be port 22
- `HOSTINGER_SSH_USER`
- `HOSTINGER_SSH_KNOWN_HOSTS` — required for a host other than the pinned production server
- `PRODUCTION_URL` — optional post-deployment health-check URL; defaults to `https://making-a-recap-with-ai.com`
- `YOUTUBE_COOKIES_B64` — optional but commonly required for YouTube downloads from server IPs; base64-encoded Netscape `cookies.txt` from a dedicated account

## Worker-only secrets

Store these in the worker host secret manager, not in the frontend build:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PROCESSING_SECRET`

The GitHub deployment creates `/var/www/recaps/worker/.env`, installs Docker on a fresh Ubuntu/Debian host when necessary, builds the worker, starts it with `restart: unless-stopped`, and waits for the `recaps-worker-1 ready` log before succeeding. The worker directory is separate from the public frontend at `/var/www/recaps/current`. It also installs `/etc/cron.d/recaps-maintenance` for hourly expired-file cleanup and Monday morning digest delivery.

The SSH deployment user must be root or have passwordless `sudo`; this is required to provision Docker and manage `/var/www/recaps`. The server must provide at least 8 GB RAM plus enough temporary disk for source and rendered video files.

To inspect production worker health manually:

```bash
cd /var/www/recaps/worker
sudo docker compose ps
sudo docker compose logs --tail=200 processor
```

## External console setup

- Supabase/OnSpace Auth: configure the production site URL, redirect URLs, and Google OAuth provider.
- Google Cloud OAuth: add the Supabase callback URL.
- To enable Google sign-in, open Supabase Dashboard > Authentication > Sign In / Providers > Google, enable it, and enter the Google OAuth Client ID and Client Secret. In Google Cloud Console, add `https://<project-ref>.supabase.co/auth/v1/callback` as an authorized redirect URI. In Supabase URL Configuration, set the production site URL and allow `https://<production-domain>/dashboard` as a redirect URL.
- Web Push: generate one VAPID key pair and use the same public key in the frontend and Edge Function.
- Apply every migration and deploy all Edge Functions before deploying the frontend.

Users supply their own YouTube, Gemini, Google Search, and Search Engine ID values inside the app. Those BYOK values are encrypted, isolated per user, and are not GitHub secrets. There is no platform-key fallback.
