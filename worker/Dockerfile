FROM python:3.12-slim

ARG DENO_VERSION=2.8.1
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg ca-certificates curl unzip \
    && curl --fail --silent --show-error --location https://deno.land/install.sh \
       | DENO_INSTALL=/usr/local sh -s "v${DENO_VERSION}" \
    && deno --version \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN yt-dlp --version
COPY processor.py .
RUN useradd --create-home worker && chown -R worker:worker /app
USER worker
ENV PYTHONUNBUFFERED=1
CMD ["python", "processor.py"]
