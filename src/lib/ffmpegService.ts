/**
 * FFmpeg.wasm Service — in-browser video processing engine
 * Uses single-thread version (no SharedArrayBuffer / COOP headers required)
 */

export interface FFmpegProgress {
  ratio: number;      // 0–1
  time: number;       // seconds processed
  speed: string;      // e.g. "2.4x"
}

export interface FFmpegLogLine {
  type: 'info' | 'fferr' | 'stdout';
  message: string;
}

export interface ProcessOptions {
  /** Output format (default: 'mp4') */
  format?: 'mp4' | 'webm' | 'gif';
  /** Target duration in seconds. If set, trims the video to this length. */
  durationSeconds?: number;
  /** Video quality (CRF 18–28, default 23) */
  quality?: number;
  /** Callback on progress update */
  onProgress?: (p: FFmpegProgress) => void;
  /** Callback on new log line */
  onLog?: (line: FFmpegLogLine) => void;
}

let _ffmpeg: any = null;
let _loaded = false;
let _loading = false;

/** Lazily load the FFmpeg.wasm single-thread core */
export async function loadFFmpeg(onLog?: (l: FFmpegLogLine) => void): Promise<any> {
  if (_loaded && _ffmpeg) return _ffmpeg;
  if (_loading) {
    // wait for in-flight load
    await new Promise<void>(res => {
      const check = setInterval(() => { if (_loaded) { clearInterval(check); res(); } }, 100);
    });
    return _ffmpeg;
  }

  _loading = true;
  try {
    const { FFmpeg } = await import('@ffmpeg/ffmpeg');
    const { toBlobURL } = await import('@ffmpeg/util');

    const ff = new FFmpeg();

    ff.on('log', ({ type, message }: any) => {
      onLog?.({ type: type === 'fferr' ? 'fferr' : 'info', message });
    });

    // Single-thread core (no COOP/COEP headers needed)
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    await ff.load({
      coreURL:   await toBlobURL(`${baseURL}/ffmpeg-core.js`,   'text/javascript'),
      wasmURL:   await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    _ffmpeg = ff;
    _loaded = true;
    return ff;
  } finally {
    _loading = false;
  }
}

/**
 * Process a video File using FFmpeg.wasm.
 * Returns a Blob URL of the output video.
 */
export async function processVideo(
  inputFile: File,
  options: ProcessOptions = {}
): Promise<string> {
  const {
    format = 'mp4',
    durationSeconds,
    quality = 23,
    onProgress,
    onLog,
  } = options;

  const ff = await loadFFmpeg(onLog);
  const { fetchFile } = await import('@ffmpeg/util');

  const inputName  = `input.${inputFile.name.split('.').pop() || 'mp4'}`;
  const outputName = `output.${format}`;

  // Track progress
  let totalDuration = durationSeconds || 0;
  ff.on('log', ({ message }: any) => {
    // Parse Duration from ffmpeg stderr
    const durMatch = message.match(/Duration:\s*(\d+):(\d+):(\d+)/);
    if (durMatch && !totalDuration) {
      totalDuration =
        parseInt(durMatch[1]) * 3600 +
        parseInt(durMatch[2]) * 60 +
        parseInt(durMatch[3]);
    }
    // Parse time= progress
    const timeMatch = message.match(/time=(\d+):(\d+):(\d+)/);
    const speedMatch = message.match(/speed=\s*([\d.]+)x/);
    if (timeMatch && totalDuration > 0) {
      const cur =
        parseInt(timeMatch[1]) * 3600 +
        parseInt(timeMatch[2]) * 60 +
        parseInt(timeMatch[3]);
      onProgress?.({
        ratio: Math.min(1, cur / totalDuration),
        time: cur,
        speed: speedMatch ? `${speedMatch[1]}x` : '—',
      });
    }
  });

  // Write input
  await ff.writeFile(inputName, await fetchFile(inputFile));

  // Build FFmpeg args
  const args: string[] = ['-i', inputName];

  if (durationSeconds) {
    args.push('-t', String(durationSeconds));
  }

  // Video codec + quality
  args.push(
    '-c:v', 'libx264',
    '-crf', String(quality),
    '-preset', 'fast',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-movflags', '+faststart',
    '-y',
    outputName,
  );

  await ff.exec(args);

  // Read output
  const data = await ff.readFile(outputName) as Uint8Array;
  const blob = new Blob([data.buffer], { type: `video/${format}` });

  // Cleanup
  try { await ff.deleteFile(inputName); } catch {}
  try { await ff.deleteFile(outputName); } catch {}

  onProgress?.({ ratio: 1, time: totalDuration, speed: '—' });
  return URL.createObjectURL(blob);
}

/** Check if FFmpeg is already loaded */
export function isFFmpegLoaded() { return _loaded; }

/** Unload FFmpeg to free memory */
export function unloadFFmpeg() {
  _ffmpeg = null;
  _loaded = false;
}
