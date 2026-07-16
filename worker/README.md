# Recaps processing worker

This worker performs the long-running Phase 3 pipeline outside Supabase Edge Functions.

## Deployment

1. Apply all Supabase migrations, including `20260716010000_create_processing_queue.sql`.
2. Set Edge Function secrets: `PROCESSING_SECRET` (32+ random characters) and `ALLOWED_ORIGINS`.
3. Copy `worker/.env.example` to `worker/.env`. Use the same `PROCESSING_SECRET` and the Supabase service-role key. Never expose either value to the frontend.
4. Deploy the updated `process-video-task` Edge Function.
5. From this directory run `docker compose up -d --build`.

The worker requires enough disk for two copies of the largest permitted source plus temporary audio, and enough CPU/RAM for Whisper and FFmpeg. For production throughput, run multiple replicas with distinct `WORKER_ID` values; database claiming uses `FOR UPDATE SKIP LOCKED`.

## Pipeline

Queue claim → private/YouTube ingestion → ffprobe validation → Whisper transcript → Gemini summary/clip plan → validated non-overlapping clips → FFmpeg render → private Supabase upload → signed frontend download.

The worker never marks a task complete unless the rendered file was probed and uploaded successfully. Cancellation, timeouts, retries, and stale worker recovery are database-backed.
