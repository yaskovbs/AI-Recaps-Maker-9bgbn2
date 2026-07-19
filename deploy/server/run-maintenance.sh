#!/usr/bin/env bash
set -euo pipefail

env_file=/var/www/recaps/worker/.env
operation="${1:-}"

[ -r "$env_file" ] || { echo "Worker environment is unavailable" >&2; exit 1; }
case "$operation" in
  cleanup-expired|send-digests) ;;
  *) echo "Unknown maintenance operation: $operation" >&2; exit 1 ;;
esac

supabase_url="$(sed -n 's/^SUPABASE_URL=//p' "$env_file" | head -n 1)"
cron_secret="$(sed -n 's/^CRON_SECRET=//p' "$env_file" | head -n 1)"
[ -n "$supabase_url" ] && [ -n "$cron_secret" ] || { echo "Maintenance credentials are missing" >&2; exit 1; }

curl --fail --silent --show-error --max-time 120 \
  --request POST \
  --header "x-cron-secret: $cron_secret" \
  "$supabase_url/functions/v1/$operation"
