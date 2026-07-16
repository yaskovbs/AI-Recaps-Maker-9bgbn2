FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY processor.py .
RUN useradd --create-home worker && chown -R worker:worker /app
USER worker
ENV PYTHONUNBUFFERED=1
CMD ["python", "processor.py"]
