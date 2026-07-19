FROM python:3.12-slim

ARG DENO_VERSION=2.8.1
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg ca-certificates curl unzip gosu \
    && curl --fail --silent --show-error --location https://deno.land/install.sh \
       | DENO_INSTALL=/usr/local sh -s "v${DENO_VERSION}" \
    && deno --version \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN yt-dlp --version
COPY processor.py .
COPY entrypoint.sh /usr/local/bin/worker-entrypoint
RUN useradd --create-home worker \
    && install -d -o worker -g worker /home/worker/.cache/huggingface \
    && chown -R worker:worker /app \
    && chmod 0755 /usr/local/bin/worker-entrypoint
ENV HOME=/home/worker \
    HF_HOME=/home/worker/.cache/huggingface \
    HUGGINGFACE_HUB_CACHE=/home/worker/.cache/huggingface/hub
ENV PYTHONUNBUFFERED=1
ENTRYPOINT ["worker-entrypoint"]
CMD ["python", "processor.py"]
