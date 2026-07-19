#!/bin/sh
set -eu

# Named Docker volumes are initially owned by root and hide ownership set in
# the image. Repair only the dedicated model cache, then run without root.
install -d -o worker -g worker "${HF_HOME:-/home/worker/.cache/huggingface}"
chown -R worker:worker /home/worker/.cache

exec gosu worker "$@"
