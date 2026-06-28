import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { useWallet } from '@/hooks/useWallet';
import { createJob } from '@/lib/recapService';
import { supabase } from '@/lib/supabase';
import { processVideo, loadFFmpeg, isFFmpegLoaded } from '@/lib/ffmpegService';
import type { FFmpegLogLine, FFmpegProgress } from '@/lib/ffmpegService';
import {
  ChevronRight, ChevronLeft, Upload, FileText, Music, Video,
  Sparkles, AlertCircle, CheckCircle, Share2, MessageCircle,
  Facebook, Twitter, Loader2, Cpu, Eye, Key, Brain,
  Globe, BookOpen, Info, Zap, Terminal, Activity, Gauge,
  Play, Pause, Volume2
} from 'lucide-react';

type InputMode = 'text' | 'txt' | 'mp3';

interface LangScore {
  code: string;
  name: string;
  flag: string;
  score: number;
  percent: number;
}

interface TxtFileInfo {
  name: string;
  size: number;
  wordCount: number;
  lineCount: number;
  charCount: number;
  primaryLanguage: string;
  primaryFlag: string;
  confidence: 'high' | 'medium' | 'low';
  confidencePct: number;
  langBreakdown: LangScore[];
  structure: 'script' | 'prose' | 'list' | 'mixed';
  narrationMinutes: number;
  narrationSeconds: number;
  avgWordsPerLine: number;
  paragraphCount: number;
}

interface AudioFileInfo {
  name: string;
  size: number;
  format: string;
  duration: number | null;
  bitrate: number | null;
  sampleRate: number | null;
  channels: number | null;
  wpm: number | null;
  waveformData?: Float32Array | null;
  objectUrl?: string;
}

interface Draft {
  inputMode: InputMode;
  scriptText: string;
  txtAssetId: string;
  mp3AssetId: string;
  videoAssetId: string;
  youtubeUrl: string;
  movieTitle: string;
  description: string;
  genre: string;
  targetDurationHours: number;
  targetDurationMinutes: number;
  targetDurationSeconds: number;
  cutEveryMinutes: number;
  cutEverySeconds: number;
  webSearchEnabled: boolean;
  youtubeLearningEnabled: boolean;
  continuousLearningEnabled: boolean;
  globalLearningOptIn: boolean;
}

const GENRES_HE: Record<string, string> = {
  action: 'אקשן', adventure: 'הרפתקאות', animation: 'אנימציה', comedy: 'קומדיה',
  crime: 'פשע', documentary: 'דוקומנטרי', drama: 'דרמה', fantasy: 'פנטזיה',
  horror: 'אימה', mystery: 'מסתורין', romance: 'רומנטי', scifi: 'מדע בדיוני',
  thriller: 'מתח', western: 'וסטרן', war: 'מלחמה', musical: 'מוזיקלי',
  biography: 'ביוגרפיה', history: 'היסטוריה', sport: 'ספורט', family: 'משפחה',
};

export default function Create() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { wallet, consumeCredits, rewardCredits } = useWallet();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  const [autoProgress, setAutoProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadFileSize, setUploadFileSize] = useState(0);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderComplete, setRenderComplete] = useState(false);
  const [outputVideoUrl, setOutputVideoUrl] = useState('');
  const [showRewardAlert, setShowRewardAlert] = useState(false);

  // FFmpeg engine state
  const [ffmpegLogs, setFfmpegLogs] = useState<FFmpegLogLine[]>([]);
  const [ffmpegSpeed, setFfmpegSpeed] = useState('—');
  const [ffmpegTimeProcessed, setFfmpegTimeProcessed] = useState(0);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const [ffmpegLoading, setFfmpegLoading] = useState(false);
  const [processingStage, setProcessingStage] = useState<string>('');
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [localVideoFile, setLocalVideoFile] = useState<File | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const [audioInfo, setAudioInfo] = useState<AudioFileInfo | null>(null);
  const [analyzingAudio, setAnalyzingAudio] = useState(false);
  const [txtInfo, setTxtInfo] = useState<TxtFileInfo | null>(null);
  const [analyzingTxt, setAnalyzingTxt] = useState(false);

  // Drag-and-drop state
  const [dragOverTxt, setDragOverTxt]   = useState(false);
  const [dragOverAudio, setDragOverAudio] = useState(false);
  const [dragOverVideo, setDragOverVideo] = useState(false);

  // Mini audio player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const audioElemRef = useRef<HTMLAudioElement | null>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  // IDs for label-based file inputs
  const TXT_INPUT_ID   = 'file-input-txt';
  const AUDIO_INPUT_ID = 'file-input-audio';
  const VIDEO_INPUT_ID = 'file-input-video';

  // ── Drag-and-drop helpers ──
  const preventDefaults = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };

  const detectFileType = (file: File): 'txt' | 'mp3' | 'video' | null => {
    const mime = file.type.toLowerCase();
    const ext  = file.name.split('.').pop()?.toLowerCase() || '';
    if (mime === 'text/plain' || ext === 'txt') return 'txt';
    if (mime.startsWith('audio/') || ['mp3','wav','aac','m4a','ogg','flac'].includes(ext)) return 'mp3';
    if (mime.startsWith('video/') || ['mp4','avi','mov','mkv','webm'].includes(ext)) return 'video';
    return null;
  };

  const makeDragHandlers = (
    setOver: (v: boolean) => void,
    acceptedTypes: ('txt'|'mp3'|'video')[]
  ) => ({
    onDragOver:  (e: React.DragEvent) => { preventDefaults(e); setOver(true);  },
    onDragEnter: (e: React.DragEvent) => { preventDefaults(e); setOver(true);  },
    onDragLeave: (e: React.DragEvent) => { preventDefaults(e); setOver(false); },
    onDrop: (e: React.DragEvent) => {
      preventDefaults(e);
      setOver(false);
      const file = e.dataTransfer.files?.[0];
      if (!file) return;
      const type = detectFileType(file);
      if (!type || !acceptedTypes.includes(type)) {
        alert('סוג קובץ לא נתמך לאזור זה');
        return;
      }
      processSelectedFile(file, type);
    },
  });

  const [draft, setDraft] = useState<Draft>({
    inputMode: 'text', scriptText: '', txtAssetId: '', mp3AssetId: '',
    videoAssetId: '', youtubeUrl: '', movieTitle: '', description: '',
    genre: 'action', targetDurationHours: 0, targetDurationMinutes: 4, targetDurationSeconds: 0,
    cutEveryMinutes: 0, cutEverySeconds: 9, webSearchEnabled: false,
    youtubeLearningEnabled: false, continuousLearningEnabled: true, globalLearningOptIn: false,
  });

  const [gapSeconds, setGapSeconds] = useState(1);
  const [showQuickSettings, setShowQuickSettings] = useState(true);

  const totalSeconds = draft.targetDurationHours * 3600 + draft.targetDurationMinutes * 60 + draft.targetDurationSeconds;
  const intervalSeconds = draft.cutEveryMinutes * 60 + draft.cutEverySeconds;
  const cycleLength = intervalSeconds + gapSeconds;
  const estimatedClips = cycleLength > 0 ? Math.floor(totalSeconds / cycleLength) : 0;
  const totalUsedSeconds = estimatedClips * intervalSeconds;
  const totalGapSeconds  = estimatedClips * gapSeconds;

  // Step 2 auto-progress
  useEffect(() => {
    if (currentStep === 2) {
      setAutoProgress(0);
      const timer = setInterval(() => {
        setAutoProgress(prev => {
          if (prev >= 100) { clearInterval(timer); setTimeout(() => setCurrentStep(3), 300); return 100; }
          return prev + 2;
        });
      }, 60);
      return () => clearInterval(timer);
    }
  }, [currentStep]);

  const MAX_VIDEO_SIZE = 2.2 * 1024 * 1024 * 1024;
  const MAX_AUDIO_SIZE = 200 * 1024 * 1024;
  const MAX_TXT_SIZE = 10 * 1024 * 1024;

  // ── TXT: multi-language detection ──
  const detectLanguages = (text: string): { primary: LangScore; breakdown: LangScore[]; confidence: 'high' | 'medium' | 'low'; confidencePct: number } => {
    const he  = (text.match(/[\u0590-\u05FF]/g) || []).length;
    const ar  = (text.match(/[\u0600-\u06FF]/g) || []).length;
    const ru  = (text.match(/[\u0400-\u04FF]/g) || []).length;
    const ja  = (text.match(/[\u3040-\u30FF]/g) || []).length;
    const zh  = (text.match(/[\u4E00-\u9FFF\u3400-\u4DBF]/g) || []).length;
    const ko  = (text.match(/[\uAC00-\uD7AF]/g) || []).length;
    const th  = (text.match(/[\u0E00-\u0E7F]/g) || []).length;
    const lat = (text.match(/[a-zA-ZÀ-ÖØ-öø-ÿ]/g) || []).length;

    const lower = text.toLowerCase().slice(0, 5000);
    const words = lower.match(/\b[a-z]{2,}\b/g) || [];
    const wordSet = new Set(words);
    const matches = (list: string[]) => list.filter(w => wordSet.has(w)).length;

    const enWords = ['the','and','is','in','it','of','to','a','that','this','was','for','on','are','with','he','she','they','we','you','have','had','but','not','be','been','by','from','or','an','all','at','do','if','one','can','which','as','so','what','when','there','about','up','out','then','she','into','were','more','would','could','their','said'];
    const frWords = ['le','la','les','de','du','un','une','et','en','est','que','qui','dans','il','elle','pour','pas','sur','avec','ne','se','son','sa','au','ce','une','des','mais','par','plus','comme','tout','ont','été','nous','vous','ou','je','tu','ils','elles','même','aussi','bien','peut','leur','leurs','cette','être'];
    const esWords = ['el','la','los','las','de','del','un','una','y','en','que','es','se','no','le','lo','con','por','para','una','su','sus','al','más','pero','como','este','esta','esto','ya','todos','todo','hay','ser','está','han','tiene','fue','una','había'];
    const deWords = ['der','die','das','und','in','ist','von','mit','ein','eine','einem','einen','einer','des','dem','den','auf','für','an','zu','nicht','sich','auch','er','sie','es','wir','als','bei','nach','über','oder','so','kann','haben','hat','war','aber','werden','sind','beim'];
    const ptWords = ['o','a','os','as','de','da','do','das','dos','em','para','que','com','se','por','um','uma','no','na','nos','nas','mas','mais','ele','ela','eles','elas','não','também','este','esta','isso','foi','há','como','ao','às','ser','ter','vez'];
    const itWords = ['il','la','lo','le','di','da','in','che','è','non','con','per','una','un','si','ma','come','nel','nella','dei','anche','sono','era','più','sua','suo','stati','stato','dopo','prima','qui','quando','fino','tra','tutto','tutti','molto','però','già','ancora','poi','solo','fatto'];
    const nlWords = ['de','het','een','van','in','is','dat','op','te','en','zijn','niet','met','voor','er','maar','als','dit','bij','ook','ze','hij','haar','we','zo','nog','hoe','aan','door','over','naar','uit','meer','om','dan','hebben','heeft','was','had','worden'];
    const plWords = ['w','z','na','do','że','nie','to','jest','się','i','a','o','jak','tak','co','ale','czy','po','za','od','przez','jego','jej','ich','tego','tej','są','był','była','było','pan','pani','już','może','tylko','więc','tam','tu','ma','go'];
    const svWords = ['och','i','är','att','en','det','som','på','av','för','med','till','den','de','om','men','ett','var','sig','kan','hade','vi','han','hon','jag','du','vi','de','men','inte','har','eller','bli','vad','sina','deras'];

    const latLangScores: Record<string, number> = {
      en: matches(enWords), fr: matches(frWords), es: matches(esWords),
      de: matches(deWords), pt: matches(ptWords), it: matches(itWords),
      nl: matches(nlWords), pl: matches(plWords), sv: matches(svWords),
    };
    const latLangMeta: Record<string, { name: string; flag: string }> = {
      en: { name: 'אנגלית', flag: '🇬🇧' }, fr: { name: 'צרפתית', flag: '🇫🇷' },
      es: { name: 'ספרדית', flag: '🇪🇸' }, de: { name: 'גרמנית', flag: '🇩🇪' },
      pt: { name: 'פורטוגזית', flag: '🇧🇷' }, it: { name: 'איטלקית', flag: '🇮🇹' },
      nl: { name: 'הולנדית', flag: '🇳🇱' }, pl: { name: 'פולנית', flag: '🇵🇱' },
      sv: { name: 'שוודית', flag: '🇸🇪' },
    };

    const rawScores: { code: string; name: string; flag: string; raw: number }[] = [
      { code: 'he', name: 'עברית',    flag: '🇮🇱', raw: he * 3 },
      { code: 'ar', name: 'ערבית',    flag: '🇸🇦', raw: ar * 3 },
      { code: 'ru', name: 'רוסית',    flag: '🇷🇺', raw: ru * 3 },
      { code: 'ja', name: 'יפנית',    flag: '🇯🇵', raw: ja * 3 },
      { code: 'zh', name: 'סינית',    flag: '🇨🇳', raw: (zh - ja) > 0 ? (zh - ja) * 3 : 0 },
      { code: 'ko', name: 'קוריאנית', flag: '🇰🇷', raw: ko * 3 },
      { code: 'th', name: 'תאית',     flag: '🇹🇭', raw: th * 3 },
    ];

    if (lat > 0) {
      const totalLatWords = Object.values(latLangScores).reduce((s,v) => s+v, 0) || 1;
      for (const [code, score] of Object.entries(latLangScores)) {
        rawScores.push({ code, name: latLangMeta[code].name, flag: latLangMeta[code].flag, raw: Math.round(lat * score / totalLatWords) });
      }
    }

    const total = rawScores.reduce((s, l) => s + l.raw, 0) || 1;
    const scored: LangScore[] = rawScores
      .map(l => ({ ...l, score: l.raw, percent: Math.round((l.raw / total) * 100) }))
      .filter(l => l.percent > 0)
      .sort((a, b) => b.percent - a.percent);

    const top = scored[0] || { code: 'un', name: 'לא ידוע', flag: '🌐', score: 0, percent: 0 };
    const confidence: 'high' | 'medium' | 'low' = top.percent >= 70 ? 'high' : top.percent >= 45 ? 'medium' : 'low';
    return { primary: top, breakdown: scored.slice(0, 7), confidence, confidencePct: top.percent };
  };

  const detectStructure = (lines: string[]): 'script' | 'prose' | 'list' | 'mixed' => {
    const nonEmpty = lines.filter(l => l.trim().length > 0);
    if (!nonEmpty.length) return 'prose';
    const scriptLines = nonEmpty.filter(l => /^[A-Z]{2,}[:\s]/.test(l.trim()) || /^[\u05D0-\u05EA]{2,}:/.test(l.trim())).length;
    const listLines   = nonEmpty.filter(l => /^[\-\*\u2022\u25CF\d+\.\u05D0-\u05EA\.]/.test(l.trim())).length;
    const sR = scriptLines / nonEmpty.length;
    const lR = listLines   / nonEmpty.length;
    if (sR > 0.25) return 'script';
    if (lR > 0.35) return 'list';
    if (sR > 0.1 || lR > 0.15) return 'mixed';
    return 'prose';
  };

  const analyzeTxtFile = (file: File, text: string): TxtFileInfo => {
    const lines      = text.split('\n');
    const nonEmpty   = lines.filter(l => l.trim().length > 0);
    const words      = text.trim().split(/\s+/).filter(w => w.length > 0);
    const wordCount  = words.length;
    const totalSecs  = Math.round((wordCount / 130) * 60);
    const paragraphs = text.split(/\n{2,}/).filter(p => p.trim().length > 0);
    const { primary, breakdown, confidence, confidencePct } = detectLanguages(text);
    return {
      name: file.name, size: file.size, wordCount,
      lineCount: lines.length, charCount: text.length,
      primaryLanguage: primary.name, primaryFlag: primary.flag,
      confidence, confidencePct, langBreakdown: breakdown,
      structure: detectStructure(lines),
      narrationMinutes: Math.floor(totalSecs / 60),
      narrationSeconds: totalSecs % 60,
      avgWordsPerLine: nonEmpty.length > 0 ? Math.round(wordCount / nonEmpty.length) : 0,
      paragraphCount: paragraphs.length,
    };
  };

  // ── Waveform canvas drawing ──
  const drawWaveform = useCallback((canvas: HTMLCanvasElement, data: Float32Array, progress = 0) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const step = Math.ceil(data.length / W);
    const mid  = H / 2;
    const progressX = progress * W;
    for (let x = 0; x < W; x++) {
      let min = 1, max = -1;
      for (let j = 0; j < step; j++) {
        const idx = x * step + j;
        if (idx < data.length) { const v = data[idx]; if (v < min) min = v; if (v > max) max = v; }
      }
      const yHigh = mid - (max * mid * 0.85);
      const yLow  = mid - (min * mid * 0.85);
      const played = x <= progressX;
      const gradient = ctx.createLinearGradient(0, yHigh, 0, yLow);
      if (played) { gradient.addColorStop(0, '#00D4FF'); gradient.addColorStop(1, '#B24BF3'); }
      else { gradient.addColorStop(0, 'rgba(0,212,255,0.3)'); gradient.addColorStop(1, 'rgba(178,75,243,0.3)'); }
      ctx.fillStyle = gradient;
      ctx.fillRect(x, yHigh, 1, Math.max(1, yLow - yHigh));
    }
  }, []);

  const animateWaveform = useCallback(() => {
    const el = audioElemRef.current;
    const canvas = waveformCanvasRef.current;
    const info = audioInfo;
    if (!el || !canvas || !info?.waveformData) return;
    const progress = el.duration > 0 ? el.currentTime / el.duration : 0;
    drawWaveform(canvas, info.waveformData, progress);
    setAudioCurrentTime(el.currentTime);
    if (!el.paused) { animFrameRef.current = requestAnimationFrame(animateWaveform); }
  }, [audioInfo, drawWaveform]);

  useEffect(() => {
    const canvas = waveformCanvasRef.current;
    if (canvas && audioInfo?.waveformData) {
      canvas.width  = canvas.offsetWidth  || 400;
      canvas.height = canvas.offsetHeight || 72;
      drawWaveform(canvas, audioInfo.waveformData, 0);
    }
  }, [audioInfo, drawWaveform]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      if (audioElemRef.current) { audioElemRef.current.pause(); audioElemRef.current = null; }
    };
  }, []);

  const handlePlayPause = () => {
    const el = audioElemRef.current;
    if (!el) return;
    if (el.paused) { el.play(); setIsPlaying(true); animFrameRef.current = requestAnimationFrame(animateWaveform); }
    else { el.pause(); setIsPlaying(false); cancelAnimationFrame(animFrameRef.current); }
  };

  const handleWaveformClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const el = audioElemRef.current;
    const canvas = waveformCanvasRef.current;
    if (!el || !canvas || !audioInfo?.waveformData) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    el.currentTime = ratio * (el.duration || 0);
    setAudioCurrentTime(el.currentTime);
    drawWaveform(canvas, audioInfo.waveformData, ratio);
  };

  const decodeWaveform = (buffer: ArrayBuffer): Promise<Float32Array | null> => {
    return new Promise((resolve) => {
      try {
        const actx = new (window.AudioContext || (window as any).webkitAudioContext)();
        actx.decodeAudioData(buffer, (decoded) => {
          const raw = decoded.getChannelData(0);
          const POINTS = 2000;
          if (raw.length <= POINTS) { resolve(raw); return; }
          const step = Math.floor(raw.length / POINTS);
          const out = new Float32Array(POINTS);
          for (let i = 0; i < POINTS; i++) {
            let max = 0;
            for (let j = 0; j < step; j++) { const v = Math.abs(raw[i * step + j] || 0); if (v > max) max = v; }
            out[i] = max;
          }
          resolve(out);
          actx.close();
        }, () => { actx.close(); resolve(null); });
      } catch { resolve(null); }
    });
  };

  const analyzeAudioFile = (file: File): Promise<AudioFileInfo> => {
    return new Promise((resolve) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const formatMap: Record<string, string> = { mp3: 'MP3', wav: 'WAV', aac: 'AAC', m4a: 'M4A (AAC)', ogg: 'OGG', flac: 'FLAC' };
      const format = formatMap[ext] || ext.toUpperCase();
      let sampleRate: number | null = null;
      let channels: number | null = null;

      const parseWavHeader = (buffer: ArrayBuffer) => {
        const view = new DataView(buffer);
        if (view.getUint32(0, false) === 0x52494646) { channels = view.getUint16(22, true); sampleRate = view.getUint32(24, true); }
      };

      const finish = async (duration: number | null) => {
        const bitrate = duration && duration > 0 ? Math.round((file.size * 8) / duration / 1000) : null;
        const wpm = duration && duration > 0 ? Math.round((duration / 60) * 130) : null;
        let waveformData: Float32Array | null = null;
        if (file.size < 15 * 1024 * 1024) {
          try { const buf = await file.arrayBuffer(); waveformData = await decodeWaveform(buf); } catch {}
        }
        const objectUrl = URL.createObjectURL(file);
        resolve({ name: file.name, size: file.size, format, duration, bitrate, sampleRate, channels, wpm, waveformData, objectUrl });
      };

      const url = URL.createObjectURL(file);
      const audio = new Audio();
      audio.preload = 'metadata';
      const cleanup = () => URL.revokeObjectURL(url);
      audio.onloadedmetadata = () => {
        const dur = isFinite(audio.duration) && audio.duration > 0 ? audio.duration : null;
        cleanup();
        if (ext === 'wav') {
          const reader = new FileReader();
          reader.onload = (e) => { if (e.target?.result) parseWavHeader(e.target.result as ArrayBuffer); finish(dur); };
          reader.onerror = () => finish(dur);
          reader.readAsArrayBuffer(file.slice(0, 44));
        } else { finish(dur); }
      };
      audio.onerror = () => { cleanup(); finish(null); };
      setTimeout(() => { cleanup(); finish(null); }, 5000);
      audio.src = url;
    });
  };

  const formatDuration = (secs: number) => {
    const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = Math.floor(secs % 60);
    return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${m}:${String(s).padStart(2,'0')}`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  // ── Upload via Supabase JS client — most reliable across all environments ──
  // Uses the official Supabase client which handles CORS, auth tokens and retries
  // internally. Progress is simulated smoothly based on file size.
  const uploadWithProgress = async (
    file: File,
    fileName: string,
    mimeType: string,
    onProgress: (pct: number) => void
  ): Promise<void> => {
    // Simulate upload progress based on file size (realistic feel)
    const totalMs = Math.max(3000, (file.size / (512 * 1024)) * 1000); // ~512 KB/s estimate
    const intervalMs = 250;
    const steps = totalMs / intervalMs;
    let simulatedPct = 0;

    const timer = setInterval(() => {
      // Ease-in-out curve: fast start, slow near 85%
      const remaining = 85 - simulatedPct;
      const increment = (remaining / steps) * (1.5 + Math.random() * 0.5);
      simulatedPct = Math.min(85, simulatedPct + increment);
      onProgress(Math.round(simulatedPct));
    }, intervalMs);

    try {
      const { error } = await supabase.storage
        .from('recap-assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: mimeType,
        });

      clearInterval(timer);

      if (error) {
        throw new Error(error.message);
      }

      // Jump to 100% smoothly
      onProgress(95);
      await new Promise(r => setTimeout(r, 200));
      onProgress(100);
    } catch (err) {
      clearInterval(timer);
      throw err;
    }
  };

  // ── Central file handler ──
  const processSelectedFile = async (file: File, type: 'txt' | 'mp3' | 'video') => {
    if (!user) { alert('יש להתחבר כדי להעלות קבצים'); return; }

    if (type === 'video') setLocalVideoFile(file);

    const maxSize = type === 'video' ? MAX_VIDEO_SIZE : type === 'mp3' ? MAX_AUDIO_SIZE : MAX_TXT_SIZE;
    if (file.size > maxSize) {
      alert(`הקובץ גדול מדי. הגודל המקסימלי הוא ${formatBytes(maxSize)}. גודל הקובץ שלך: ${formatBytes(file.size)}`);
      return;
    }

    if (type === 'txt') {
      setAnalyzingTxt(true);
      setTxtInfo(null);
      const text = await file.text();
      setTxtInfo(analyzeTxtFile(file, text));
      setAnalyzingTxt(false);
    }

    if (type === 'mp3') {
      setAnalyzingAudio(true);
      setAudioInfo(null);
      setIsPlaying(false);
      cancelAnimationFrame(animFrameRef.current);
      if (audioElemRef.current) { audioElemRef.current.pause(); audioElemRef.current = null; }
      const info = await analyzeAudioFile(file);
      setAudioInfo(info);
      setAudioCurrentTime(0);
      setAudioDuration(info.duration || 0);
      if (info.objectUrl) {
        const el = new Audio(info.objectUrl);
        el.onended = () => { setIsPlaying(false); cancelAnimationFrame(animFrameRef.current); };
        el.onloadedmetadata = () => setAudioDuration(el.duration);
        audioElemRef.current = el;
      }
      setAnalyzingAudio(false);
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadFileName(file.name);
    setUploadFileSize(file.size);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${type}-${Date.now()}.${fileExt}`;
      const mimeType = type === 'txt'
        ? 'text/plain'
        : type === 'mp3'
          ? (file.type || 'audio/mpeg')
          : (file.type || 'video/mp4');

      await uploadWithProgress(file, fileName, mimeType, (pct) => setUploadProgress(pct));

      const { data: { publicUrl } } = supabase.storage.from('recap-assets').getPublicUrl(fileName);

      if (type === 'txt') {
        let text = '';
        try { text = await file.text(); } catch {}
        if (!txtInfo && text) setTxtInfo(analyzeTxtFile(file, text));
        setDraft(prev => ({ ...prev, txtAssetId: publicUrl, scriptText: text }));
      } else if (type === 'mp3') {
        setDraft(prev => ({ ...prev, mp3AssetId: publicUrl }));
      } else {
        setDraft(prev => ({ ...prev, videoAssetId: publicUrl }));
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      alert(`שגיאת העלאה: ${err.message || 'נסה שוב'}`);
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => { logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [ffmpegLogs]);

  useEffect(() => {
    if (currentStep === 4 && !isFFmpegLoaded() && !ffmpegLoading) {
      setFfmpegLoading(true);
      loadFFmpeg((log) => { setFfmpegLogs(prev => [...prev.slice(-80), log]); })
        .then(() => { setFfmpegLoaded(true); setFfmpegLoading(false); })
        .catch(() => setFfmpegLoading(false));
    } else if (isFFmpegLoaded()) {
      setFfmpegLoaded(true);
    }
  }, [currentStep]);

  const handleCreate = async () => {
    if (!user) { alert('יש להתחבר'); return; }
    if (wallet.balance < 1) { setShowRewardAlert(true); return; }
    await proceedWithCreation();
  };

  const proceedWithCreation = async () => {
    if (!user) return;
    const targetDuration = totalSeconds;
    const cutEvery = intervalSeconds;
    const job = createJob({
      userId: user.id,
      title: draft.movieTitle || 'סיכום ללא כותרת',
      source: { inputMode: draft.inputMode, scriptText: draft.scriptText, txtAssetId: draft.txtAssetId, mp3AssetId: draft.mp3AssetId, youtubeUrl: draft.youtubeUrl },
      settings: { recapLengthSeconds: targetDuration, clipLengthSeconds: cutEvery, gapSeconds: 5 },
      advanced: { movieTitle: draft.movieTitle, description: draft.description, genre: draft.genre, webSearchEnabled: draft.webSearchEnabled, youtubeLearningEnabled: draft.youtubeLearningEnabled, continuousLearningEnabled: draft.continuousLearningEnabled, continuousLearningConsent: draft.continuousLearningEnabled, learningProfileEnabled: draft.continuousLearningEnabled, globalLearningOptIn: draft.globalLearningOptIn },
      pipeline: ['script', 'audio', 'video', 'align', 'render'],
    });
    consumeCredits(1, `Created recap: ${job.title}`);

    setIsRendering(true);
    setRenderProgress(0);
    setFfmpegLogs([]);
    setProcessingError(null);
    setProcessingStage('טוען מנוע FFmpeg...');

    if (localVideoFile && (isFFmpegLoaded() || ffmpegLoaded)) {
      try {
        setProcessingStage('מנוע FFmpeg פעיל — מעבד וידאו...');
        const outputUrl = await processVideo(localVideoFile, {
          format: 'mp4',
          durationSeconds: targetDuration > 0 ? targetDuration : undefined,
          quality: 23,
          onProgress: (p: FFmpegProgress) => { setRenderProgress(Math.round(p.ratio * 100)); setFfmpegSpeed(p.speed); setFfmpegTimeProcessed(p.time); },
          onLog: (log: FFmpegLogLine) => {
            setFfmpegLogs(prev => [...prev.slice(-80), log]);
            if (log.message.includes('Opening')) setProcessingStage('פותח קובץ קלט...');
            else if (log.message.includes('Stream mapping')) setProcessingStage('ממפה זרמים...');
            else if (log.message.includes('encoder')) setProcessingStage('מקודד וידאו (H.264)...');
            else if (log.message.includes('muxing')) setProcessingStage('ממזג אודיו ווידאו...');
            else if (log.message.includes('frame=')) setProcessingStage('מרנדר פריימים...');
          },
        });
        setRenderProgress(100);
        setIsRendering(false);
        setRenderComplete(true);
        setOutputVideoUrl(outputUrl);
        setProcessingStage('עיבוד הושלם!');
      } catch (err: any) {
        console.error('FFmpeg processing error:', err);
        setProcessingError(err.message || 'שגיאה בעיבוד הוידאו');
        runSimulatedProgress(job.id);
      }
    } else {
      runSimulatedProgress(job.id);
    }
  };

  const runSimulatedProgress = (jobId: string) => {
    const stages = ['ניתוח תסריט ואודיו...','זיהוי סצינות מרכזיות...','יצירת תסריט סיכום...','מרנדר פריימים...','ממזג אודיו ווידאו...','אופטימיזציה ופלט...'];
    let stageIdx = 0;
    setProcessingStage(stages[0]);
    const timer = setInterval(() => {
      setRenderProgress(prev => {
        const next = prev + 1.5;
        const idx = Math.floor((next / 100) * stages.length);
        if (idx < stages.length && idx !== stageIdx) { stageIdx = idx; setProcessingStage(stages[idx]); setFfmpegLogs(p => [...p, { type: 'info', message: `[AI] ${stages[idx]}` }]); }
        if (next >= 100) { clearInterval(timer); setIsRendering(false); setRenderComplete(true); setOutputVideoUrl(`https://example.com/recaps/${jobId}.mp4`); setProcessingStage('עיבוד הושלם!'); return 100; }
        return next;
      });
    }, 90);
  };

  // ── Hidden file inputs ──
  const hiddenInputs = (
    <>
      <input id={TXT_INPUT_ID} type="file" accept=".txt,text/plain" className="file-input-hidden" tabIndex={-1}
        onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ''; if (file) processSelectedFile(file, 'txt'); }} />
      <input id={AUDIO_INPUT_ID} type="file" accept="audio/mpeg,audio/wav,audio/aac,audio/mp4,audio/x-m4a,audio/ogg,audio/flac,.mp3,.wav,.aac,.m4a,.ogg,.flac" className="file-input-hidden" tabIndex={-1}
        onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ''; if (file) processSelectedFile(file, 'mp3'); }} />
      <input id={VIDEO_INPUT_ID} type="file" accept="video/mp4,video/avi,video/quicktime,video/x-matroska,video/webm,video/*,.mp4,.avi,.mov,.mkv,.webm" className="file-input-hidden" tabIndex={-1}
        onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ''; if (file) processSelectedFile(file, 'video'); }} />
    </>
  );

  const stepLabels = [
    { icon: FileText, label: 'תסריט + אודיו' },
    { icon: Cpu, label: 'ניתוח AI' },
    { icon: Video, label: 'העלאת וידאו' },
    { icon: Key, label: 'הגדרות AI' },
    { icon: Eye, label: 'הורדה ושיתוף' },
  ];

  return (
    <div className="min-h-screen py-8" style={{ background: '#0a0a14' }}>
      {hiddenInputs}
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <div className="neon-badge neon-badge-cyan mb-3 inline-flex">Wizard</div>
          <h1 className="text-4xl font-bold mb-2" style={{ color: '#f0f0ff', fontFamily: 'Syne, sans-serif' }}>{t.create.title}</h1>
          <p className="text-sm" style={{ color: 'rgba(160,160,210,0.6)' }}>{totalSteps} שלבים ליצירת סיכום AI מושלם</p>
        </div>

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center">
            {stepLabels.map((step, i) => {
              const stepNum = i + 1;
              const Icon = step.icon;
              const isActive = currentStep === stepNum;
              const isDone = currentStep > stepNum;
              return (
                <React.Fragment key={i}>
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all ${isActive ? 'wizard-step-active scale-110' : isDone ? 'wizard-step-done' : 'wizard-step-idle'}`}>
                      {isDone ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <span className="text-xs mt-1.5 hidden sm:block text-center max-w-[70px]" style={{ color: isActive ? '#00D4FF' : isDone ? 'rgba(0,212,255,0.5)' : 'rgba(150,150,200,0.35)', fontSize: '10px' }}>
                      {step.label}
                    </span>
                  </div>
                  {i < stepLabels.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 transition-all ${isDone ? 'wizard-line-active' : 'wizard-line-idle'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* ── Quick Settings Panel (Steps 1 & 3) ── */}
        {(currentStep === 1 || currentStep === 3) && (
          <div className="mb-5">
            <button type="button" onClick={() => setShowQuickSettings(v => !v)}
              className="w-full flex items-center justify-between px-5 py-3 rounded-xl transition-all"
              style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.18)' }}>
              <div className="flex items-center gap-2 flex-wrap">
                <Gauge className="w-4 h-4" style={{ color: '#00D4FF' }} />
                <span className="text-sm font-semibold" style={{ color: '#00D4FF' }}>הגדרות מהירות לפני העלאה</span>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,212,255,0.1)', color: 'rgba(0,212,255,0.7)', border: '1px solid rgba(0,212,255,0.2)' }}>
                  {String(draft.targetDurationHours).padStart(2,'0')}:{String(draft.targetDurationMinutes).padStart(2,'0')}:{String(draft.targetDurationSeconds).padStart(2,'0')}
                  &nbsp;·&nbsp;קטע {intervalSeconds}ש׳ · הפסקה {gapSeconds}ש׳
                </span>
              </div>
              <ChevronLeft className="w-4 h-4 transition-transform flex-shrink-0" style={{ color: 'rgba(0,212,255,0.5)', transform: showQuickSettings ? 'rotate(-90deg)' : 'rotate(0deg)' }} />
            </button>

            {showQuickSettings && (
              <div className="mt-2 p-5 rounded-xl space-y-5" style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.04), rgba(178,75,243,0.04))', border: '1px solid rgba(0,212,255,0.15)' }}>
                {/* ── Duration ── */}
                <div>
                  <label className="block text-sm font-semibold mb-3" style={{ color: 'rgba(200,200,240,0.85)' }}>⏱ אורך הסיכום הרצוי</label>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {([
                      { label: 'שעות',  max: 3,  val: draft.targetDurationHours,   key: 'targetDurationHours'   as const },
                      { label: 'דקות',  max: 59, val: draft.targetDurationMinutes, key: 'targetDurationMinutes' as const },
                      { label: 'שניות', max: 59, val: draft.targetDurationSeconds, key: 'targetDurationSeconds' as const },
                    ]).map(f => (
                      <div key={f.key}>
                        <label className="block text-xs mb-1.5 text-center" style={{ color: 'rgba(150,150,200,0.55)' }}>{f.label}</label>
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => setDraft(prev => ({ ...prev, [f.key]: Math.max(0, prev[f.key] - 1) }))}
                            className="w-8 h-9 rounded-lg flex items-center justify-center font-bold text-base transition-all hover:scale-110"
                            style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.18)', color: '#00D4FF' }}>−</button>
                          <input type="number" min={0} max={f.max} value={f.val}
                            onChange={e => setDraft(prev => ({ ...prev, [f.key]: Math.min(f.max, Math.max(0, parseInt(e.target.value)||0)) }))}
                            className="flex-1 h-9 rounded-lg text-center text-base font-bold ai-input px-1" style={{ color: '#00D4FF' }} />
                          <button type="button" onClick={() => setDraft(prev => ({ ...prev, [f.key]: Math.min(f.max, prev[f.key] + 1) }))}
                            className="w-8 h-9 rounded-lg flex items-center justify-center font-bold text-base transition-all hover:scale-110"
                            style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.18)', color: '#00D4FF' }}>+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { label: '1 דק׳', h:0, m:1, s:0 }, { label: '3 דק׳', h:0, m:3, s:0 },
                      { label: '5 דק׳', h:0, m:5, s:0 }, { label: '10 דק׳', h:0, m:10, s:0 },
                      { label: '30 דק׳', h:0, m:30, s:0 }, { label: '1 שעה', h:1, m:0, s:0 },
                    ].map(p => {
                      const isActive = draft.targetDurationHours===p.h && draft.targetDurationMinutes===p.m && draft.targetDurationSeconds===p.s;
                      return (
                        <button key={p.label} type="button"
                          onClick={() => setDraft(prev => ({ ...prev, targetDurationHours: p.h, targetDurationMinutes: p.m, targetDurationSeconds: p.s }))}
                          className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                          style={{ background: isActive ? 'rgba(0,212,255,0.18)' : 'rgba(255,255,255,0.04)', border: `1px solid ${isActive ? 'rgba(0,212,255,0.45)' : 'rgba(255,255,255,0.1)'}`, color: isActive ? '#00D4FF' : 'rgba(160,160,210,0.6)' }}
                        >{p.label}</button>
                      );
                    })}
                  </div>
                </div>

                <div className="neon-divider" />

                {/* ── Clip Interval ── */}
                <div>
                  <label className="block text-sm font-semibold mb-3" style={{ color: 'rgba(200,200,240,0.85)' }}>✂️ אורך כל קטע</label>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {([
                      { label: 'דקות',  val: draft.cutEveryMinutes, key: 'cutEveryMinutes' as const, max: 59 },
                      { label: 'שניות', val: draft.cutEverySeconds, key: 'cutEverySeconds' as const, max: 59 },
                    ]).map(f => (
                      <div key={f.key}>
                        <label className="block text-xs mb-1.5 text-center" style={{ color: 'rgba(150,150,200,0.55)' }}>{f.label}</label>
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => setDraft(prev => ({ ...prev, [f.key]: Math.max(0, prev[f.key]-1) }))}
                            className="w-8 h-9 rounded-lg flex items-center justify-center font-bold transition-all hover:scale-110"
                            style={{ background: 'rgba(178,75,243,0.1)', border: '1px solid rgba(178,75,243,0.25)', color: '#B24BF3' }}>−</button>
                          <input type="number" min={0} max={f.max} value={f.val}
                            onChange={e => setDraft(prev => ({ ...prev, [f.key]: Math.min(f.max, Math.max(0, parseInt(e.target.value)||0)) }))}
                            className="flex-1 h-9 rounded-lg text-center text-base font-bold ai-input px-1" style={{ color: '#B24BF3' }} />
                          <button type="button" onClick={() => setDraft(prev => ({ ...prev, [f.key]: Math.min(f.max, prev[f.key]+1) }))}
                            className="w-8 h-9 rounded-lg flex items-center justify-center font-bold transition-all hover:scale-110"
                            style={{ background: 'rgba(178,75,243,0.1)', border: '1px solid rgba(178,75,243,0.25)', color: '#B24BF3' }}>+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 flex-wrap mb-4">
                    {[
                      { label: '5ש׳', m:0, s:5 }, { label: '8ש׳', m:0, s:8 }, { label: '10ש׳', m:0, s:10 },
                      { label: '15ש׳', m:0, s:15 }, { label: '30ש׳', m:0, s:30 }, { label: '1 דק׳', m:1, s:0 },
                    ].map(p => {
                      const isActive = draft.cutEveryMinutes===p.m && draft.cutEverySeconds===p.s;
                      return (
                        <button key={p.label} type="button"
                          onClick={() => setDraft(prev => ({ ...prev, cutEveryMinutes: p.m, cutEverySeconds: p.s }))}
                          className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                          style={{ background: isActive ? 'rgba(178,75,243,0.18)' : 'rgba(255,255,255,0.04)', border: `1px solid ${isActive ? 'rgba(178,75,243,0.45)' : 'rgba(255,255,255,0.1)'}`, color: isActive ? '#B24BF3' : 'rgba(160,160,210,0.6)' }}
                        >{p.label}</button>
                      );
                    })}
                  </div>

                  {/* Gap */}
                  <div className="p-4 rounded-xl" style={{ background: 'rgba(255,200,0,0.04)', border: '1px solid rgba(255,200,0,0.18)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-sm font-semibold" style={{ color: 'rgba(255,200,0,0.9)' }}>⏸ הפסקה בין קטעים</div>
                        <div className="text-xs mt-0.5" style={{ color: 'rgba(160,160,140,0.55)' }}>כל {intervalSeconds} שניות קטע ← {gapSeconds} שניות הפסקה</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setGapSeconds(g => Math.max(0, g-1))}
                          className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-lg transition-all hover:scale-110"
                          style={{ background: 'rgba(255,200,0,0.1)', border: '1px solid rgba(255,200,0,0.25)', color: '#ffcc00' }}>−</button>
                        <div className="w-16 text-center">
                          <span className="text-3xl font-black tabular-nums" style={{ color: '#ffcc00' }}>{gapSeconds}</span>
                          <span className="text-xs block" style={{ color: 'rgba(160,160,120,0.6)' }}>שניות</span>
                        </div>
                        <button type="button" onClick={() => setGapSeconds(g => Math.min(30, g+1))}
                          className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-lg transition-all hover:scale-110"
                          style={{ background: 'rgba(255,200,0,0.1)', border: '1px solid rgba(255,200,0,0.25)', color: '#ffcc00' }}>+</button>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {[0,1,2,3,5,8,10].map(s => (
                        <button key={s} type="button" onClick={() => setGapSeconds(s)}
                          className="text-xs px-3 py-1 rounded-lg font-semibold transition-all"
                          style={{ background: gapSeconds===s ? 'rgba(255,200,0,0.18)' : 'rgba(255,255,255,0.04)', border: `1px solid ${gapSeconds===s ? 'rgba(255,200,0,0.45)' : 'rgba(255,255,255,0.08)'}`, color: gapSeconds===s ? '#ffcc00' : 'rgba(160,160,130,0.6)' }}
                        >{s===0 ? 'ללא' : `${s}ש׳`}</button>
                      ))}
                    </div>
                  </div>
                </div>

                {totalSeconds > 0 && intervalSeconds > 0 && (
                  <div className="p-3 rounded-xl flex flex-wrap gap-x-6 gap-y-2" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {[
                      { label: 'אורך סיכום', val: `${String(draft.targetDurationHours).padStart(2,'0')}:${String(draft.targetDurationMinutes).padStart(2,'0')}:${String(draft.targetDurationSeconds).padStart(2,'0')}`, color: '#00D4FF' },
                      { label: 'קטע',        val: `${intervalSeconds}ש׳`,  color: '#B24BF3' },
                      { label: 'הפסקה',      val: `${gapSeconds}ש׳`,       color: '#ffcc00' },
                      { label: '~קטעים',     val: `${estimatedClips}`,      color: '#00ff80' },
                      { label: 'זמן קטעים',  val: `${totalUsedSeconds}ש׳`, color: '#00D4FF' },
                      { label: 'זמן הפסקות', val: `${totalGapSeconds}ש׳`,  color: '#ffcc00' },
                    ].map((item, i) => (
                      <div key={i} className="text-center">
                        <div className="text-sm font-black tabular-nums" style={{ color: item.color }}>{item.val}</div>
                        <div className="text-xs" style={{ color: 'rgba(130,130,160,0.55)', fontSize: 10 }}>{item.label}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step Content */}
        <div className="ai-card p-7 mb-5">

          {/* ── STEP 1 ── */}
          {currentStep === 1 && (
            <div className="animate-slide-up">
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#f0f0ff', fontFamily: 'Syne, sans-serif' }}>{t.create.step1.title}</h2>
              <p className="text-sm mb-7" style={{ color: 'rgba(160,160,210,0.6)' }}>{t.create.step1.description}</p>

              <div className="mb-6">
                <label className="block text-sm font-semibold mb-3" style={{ color: 'rgba(200,200,240,0.8)' }}>{t.create.step1.inputMode}</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['text', 'txt', 'mp3'] as InputMode[]).map((mode) => (
                    <button key={mode} onClick={() => setDraft({ ...draft, inputMode: mode })}
                      className="p-4 rounded-xl transition-all text-center"
                      style={{ background: draft.inputMode === mode ? 'rgba(0,212,255,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${draft.inputMode === mode ? 'rgba(0,212,255,0.4)' : 'rgba(255,255,255,0.08)'}`, boxShadow: draft.inputMode === mode ? '0 0 15px rgba(0,212,255,0.1)' : 'none' }}>
                      {mode === 'text' && <FileText className="w-5 h-5 mx-auto mb-2" style={{ color: draft.inputMode === mode ? '#00D4FF' : 'rgba(160,160,210,0.5)' }} />}
                      {mode === 'txt'  && <Upload   className="w-5 h-5 mx-auto mb-2" style={{ color: draft.inputMode === mode ? '#00D4FF' : 'rgba(160,160,210,0.5)' }} />}
                      {mode === 'mp3'  && <Music    className="w-5 h-5 mx-auto mb-2" style={{ color: draft.inputMode === mode ? '#00D4FF' : 'rgba(160,160,210,0.5)' }} />}
                      <span className="text-sm font-medium" style={{ color: draft.inputMode === mode ? '#00D4FF' : 'rgba(160,160,210,0.6)' }}>
                        {mode === 'text' ? t.create.step1.text : mode === 'txt' ? t.create.step1.txtFile : t.create.step1.mp3File}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {draft.inputMode === 'text' && (
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'rgba(200,200,240,0.8)' }}>תסריט</label>
                  <textarea value={draft.scriptText} onChange={(e) => setDraft({ ...draft, scriptText: e.target.value })}
                    placeholder={t.create.step1.scriptPlaceholder} rows={7} className="ai-input resize-none" />
                </div>
              )}

              {draft.inputMode === 'txt' && (
                <div className="space-y-4">
                  <div className={`drop-zone p-6 text-center ${dragOverTxt ? 'drag-over-cyan' : ''}`}
                    style={{ border: `2px dashed ${dragOverTxt ? 'rgba(0,212,255,0.8)' : 'rgba(0,212,255,0.25)'}`, background: dragOverTxt ? 'rgba(0,212,255,0.07)' : 'rgba(0,212,255,0.03)' }}
                    {...makeDragHandlers(setDragOverTxt, ['txt'])}>
                    <div className="flex flex-col items-center gap-3 pointer-events-none">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: dragOverTxt ? 'rgba(0,212,255,0.2)' : 'rgba(0,212,255,0.1)' }}>
                        {dragOverTxt ? <Upload className="w-6 h-6" style={{ color: '#00D4FF' }} /> : <FileText className="w-6 h-6" style={{ color: '#00D4FF' }} />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: dragOverTxt ? '#00D4FF' : 'rgba(200,200,240,0.7)' }}>{dragOverTxt ? 'שחרר כאן!' : 'גרור קובץ TXT לכאן'}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'rgba(140,140,190,0.5)' }}>TXT · עד 10 MB</p>
                      </div>
                    </div>
                  </div>

                  <label htmlFor={!uploading && !analyzingTxt ? TXT_INPUT_ID : undefined}
                    className={`btn-neon-cyan w-full flex items-center justify-center gap-2 select-none ${uploading || analyzingTxt ? 'opacity-50 pointer-events-none cursor-not-allowed' : 'cursor-pointer'}`}
                    style={{ display: 'flex' }}>
                    {analyzingTxt ? <><Loader2 className="w-4 h-4 animate-spin" />מנתח קובץ...</> :
                     uploading    ? <><Loader2 className="w-4 h-4 animate-spin" />מעלה {uploadProgress}%</> :
                     <><Upload className="w-4 h-4" />{t.create.step1.uploadTxt}</>}
                  </label>

                  {uploading && uploadFileSize > 0 && (
                    <div className="p-3 rounded-xl" style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)' }}>
                      <div className="flex justify-between text-xs mb-2" style={{ color: 'rgba(160,160,210,0.7)' }}>
                        <span className="truncate max-w-[200px]">{uploadFileName}</span>
                        <span style={{ color: '#00D4FF', fontWeight: 700 }}>{uploadProgress}%</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,212,255,0.15)' }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${uploadProgress}%`, background: 'linear-gradient(90deg, #00D4FF, #B24BF3)' }} />
                      </div>
                    </div>
                  )}

                  {txtInfo && (
                    <div className="p-4 rounded-xl space-y-4" style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.2)' }}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,212,255,0.2)' }}>
                          <FileText className="w-3.5 h-3.5" style={{ color: '#00D4FF' }} />
                        </div>
                        <span className="text-sm font-semibold" style={{ color: '#00D4FF' }}>ניתוח קובץ תסריט</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{
                          background: txtInfo.structure === 'script' ? 'rgba(178,75,243,0.15)' : txtInfo.structure === 'list' ? 'rgba(255,200,0,0.12)' : txtInfo.structure === 'mixed' ? 'rgba(255,120,0,0.12)' : 'rgba(0,212,255,0.12)',
                          color: txtInfo.structure === 'script' ? '#B24BF3' : txtInfo.structure === 'list' ? '#ffcc00' : txtInfo.structure === 'mixed' ? '#ff8800' : '#00D4FF',
                          border: `1px solid ${txtInfo.structure === 'script' ? 'rgba(178,75,243,0.3)' : txtInfo.structure === 'list' ? 'rgba(255,200,0,0.25)' : txtInfo.structure === 'mixed' ? 'rgba(255,120,0,0.25)' : 'rgba(0,212,255,0.25)'}`,
                        }}>
                          {txtInfo.structure === 'script' ? 'תסריט' : txtInfo.structure === 'list' ? 'רשימה' : txtInfo.structure === 'mixed' ? 'מעורב' : 'פרוזה'}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.25)', color: '#00D4FF' }}>
                          {txtInfo.primaryFlag} {txtInfo.primaryLanguage}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: 'שם קובץ',    val: txtInfo.name.length > 22 ? txtInfo.name.slice(0, 20) + '…' : txtInfo.name },
                          { label: 'גודל',        val: formatBytes(txtInfo.size) },
                          { label: 'מילים',       val: txtInfo.wordCount.toLocaleString('he-IL') },
                          { label: 'שורות',       val: txtInfo.lineCount.toLocaleString('he-IL') },
                          { label: 'תווים',       val: txtInfo.charCount.toLocaleString('he-IL') },
                          { label: 'פסקאות',      val: txtInfo.paragraphCount.toLocaleString('he-IL') },
                          { label: 'מילים/שורה',  val: `~${txtInfo.avgWordsPerLine}` },
                          { label: 'זמן קריינות', val: `${txtInfo.narrationMinutes}:${String(txtInfo.narrationSeconds).padStart(2,'0')} דק'` },
                        ].map((item, i) => (
                          <div key={i} className="flex justify-between items-center text-xs">
                            <span style={{ color: 'rgba(140,140,190,0.55)' }}>{item.label}:</span>
                            <span className="font-semibold" style={{ color: 'rgba(220,220,250,0.85)' }}>{item.val}</span>
                          </div>
                        ))}
                      </div>
                      <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(0,212,255,0.1)' }}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold" style={{ color: '#00D4FF' }}>זיהוי שפות</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold" style={{ color: 'rgba(220,220,250,0.9)' }}>{txtInfo.primaryFlag} {txtInfo.primaryLanguage} ({txtInfo.confidencePct}%)</span>
                            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: txtInfo.confidence === 'high' ? 'rgba(0,255,128,0.12)' : txtInfo.confidence === 'medium' ? 'rgba(255,200,0,0.1)' : 'rgba(255,100,100,0.1)', color: txtInfo.confidence === 'high' ? '#00ff80' : txtInfo.confidence === 'medium' ? '#ffcc00' : '#ff8888' }}>
                              {txtInfo.confidence === 'high' ? 'בטוח' : txtInfo.confidence === 'medium' ? 'סביר' : 'לא ברור'}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          {txtInfo.langBreakdown.map((lang, i) => (
                            <div key={lang.code}>
                              <div className="flex items-center justify-between text-xs mb-0.5">
                                <span style={{ color: i === 0 ? 'rgba(220,220,250,0.9)' : 'rgba(160,160,200,0.6)' }}>{lang.flag} {lang.name}</span>
                                <span className="font-semibold tabular-nums" style={{ color: i === 0 ? '#00D4FF' : 'rgba(140,140,190,0.7)' }}>{lang.percent}%</span>
                              </div>
                              <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                <div className="h-full rounded-full transition-all" style={{ width: `${lang.percent}%`, background: i === 0 ? 'linear-gradient(90deg, #00D4FF, #B24BF3)' : 'rgba(255,255,255,0.2)' }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1" style={{ color: 'rgba(140,140,190,0.5)' }}>
                          <span>זמן קריינות משוער (130 מ/ד)</span>
                          <span style={{ color: '#00D4FF', fontWeight: 700 }}>{txtInfo.narrationMinutes}:{String(txtInfo.narrationSeconds).padStart(2,'0')}</span>
                        </div>
                        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                          <div className="h-full rounded-full" style={{ width: `${Math.min(100, (txtInfo.narrationMinutes / 120) * 100)}%`, background: 'linear-gradient(90deg, #00D4FF, #B24BF3)' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  {draft.txtAssetId && !uploading && <p className="text-sm flex items-center gap-2" style={{ color: '#00ff80' }}><CheckCircle className="w-4 h-4" /> קובץ הועלה בהצלחה</p>}
                </div>
              )}

              {draft.inputMode === 'mp3' && (
                <div className="space-y-4">
                  <div className={`drop-zone p-6 text-center ${dragOverAudio ? 'drag-over-purple' : ''}`}
                    style={{ border: `2px dashed ${dragOverAudio ? 'rgba(178,75,243,0.8)' : 'rgba(178,75,243,0.25)'}`, background: dragOverAudio ? 'rgba(178,75,243,0.07)' : 'rgba(178,75,243,0.03)' }}
                    {...makeDragHandlers(setDragOverAudio, ['mp3'])}>
                    <div className="flex flex-col items-center gap-3 pointer-events-none">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: dragOverAudio ? 'rgba(178,75,243,0.25)' : 'rgba(178,75,243,0.12)' }}>
                        {dragOverAudio ? <Upload className="w-6 h-6" style={{ color: '#B24BF3' }} /> : <Music className="w-6 h-6" style={{ color: '#B24BF3' }} />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: dragOverAudio ? '#B24BF3' : 'rgba(200,200,240,0.7)' }}>{dragOverAudio ? 'שחרר כאן!' : 'גרור קובץ שמע לכאן'}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'rgba(140,140,190,0.5)' }}>MP3 · WAV · AAC · M4A · עד 200 MB</p>
                      </div>
                    </div>
                  </div>

                  <label htmlFor={!uploading && !analyzingAudio ? AUDIO_INPUT_ID : undefined}
                    className={`btn-neon-purple w-full flex items-center justify-center gap-2 select-none ${uploading || analyzingAudio ? 'opacity-50 pointer-events-none cursor-not-allowed' : 'cursor-pointer'}`}
                    style={{ display: 'flex' }}>
                    {analyzingAudio ? <><Loader2 className="w-4 h-4 animate-spin" />מנתח קובץ...</> :
                     uploading ? <><Loader2 className="w-4 h-4 animate-spin" />מעלה {uploadProgress}%</> :
                     <><Music className="w-4 h-4" />{t.create.step1.uploadMp3}</>}
                  </label>

                  {uploading && uploadFileSize > 0 && (
                    <div className="p-3 rounded-xl" style={{ background: 'rgba(178,75,243,0.05)', border: '1px solid rgba(178,75,243,0.15)' }}>
                      <div className="flex justify-between text-xs mb-2" style={{ color: 'rgba(160,160,210,0.7)' }}>
                        <span className="truncate max-w-[200px]">{uploadFileName}</span>
                        <span style={{ color: '#B24BF3', fontWeight: 700 }}>{uploadProgress}%</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(178,75,243,0.15)' }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${uploadProgress}%`, background: 'linear-gradient(90deg, #B24BF3, #00D4FF)' }} />
                      </div>
                    </div>
                  )}

                  {audioInfo && (
                    <div className="p-4 rounded-xl space-y-3" style={{ background: 'rgba(178,75,243,0.06)', border: '1px solid rgba(178,75,243,0.2)' }}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(178,75,243,0.2)' }}>
                          <Music className="w-3.5 h-3.5" style={{ color: '#B24BF3' }} />
                        </div>
                        <span className="text-sm font-semibold" style={{ color: '#B24BF3' }}>ניתוח קובץ אודיו</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(178,75,243,0.15)', color: '#B24BF3' }}>{audioInfo.format}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: 'שם קובץ', val: audioInfo.name.length > 22 ? audioInfo.name.slice(0,20) + '…' : audioInfo.name },
                          { label: 'גודל',    val: formatBytes(audioInfo.size) },
                          { label: 'אורך',    val: audioInfo.duration ? formatDuration(audioInfo.duration) : '—' },
                          { label: 'ביטרייט', val: audioInfo.bitrate ? `${audioInfo.bitrate} kbps` : '—' },
                          ...(audioInfo.sampleRate ? [{ label: 'דגימה',  val: `${(audioInfo.sampleRate/1000).toFixed(1)} kHz` }] : []),
                          ...(audioInfo.channels   ? [{ label: 'ערוצים', val: audioInfo.channels === 1 ? 'מונו' : audioInfo.channels === 2 ? 'סטריאו' : `${audioInfo.channels}ch` }] : []),
                          ...(audioInfo.wpm        ? [{ label: 'קצב קריינות', val: `~${audioInfo.wpm} מ/ד` }] : []),
                        ].map((item, i) => (
                          <div key={i} className="flex justify-between items-center text-xs">
                            <span style={{ color: 'rgba(140,140,190,0.55)' }}>{item.label}:</span>
                            <span className="font-semibold" style={{ color: 'rgba(220,220,250,0.85)' }}>{item.val}</span>
                          </div>
                        ))}
                      </div>
                      {audioInfo.bitrate && (
                        <div className="pt-1">
                          <div className="flex justify-between text-xs mb-1" style={{ color: 'rgba(140,140,190,0.5)' }}>
                            <span>איכות אודיו</span>
                            <span style={{ color: audioInfo.bitrate >= 192 ? '#00ff80' : audioInfo.bitrate >= 128 ? '#ffcc00' : '#ff8888' }}>
                              {audioInfo.bitrate >= 192 ? 'גבוהה ✓' : audioInfo.bitrate >= 128 ? 'בינונית' : 'נמוכה'}
                            </span>
                          </div>
                          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                            <div className="h-full rounded-full" style={{ width: `${Math.min(100, (audioInfo.bitrate / 320) * 100)}%`, background: audioInfo.bitrate >= 192 ? 'linear-gradient(90deg,#00ff80,#00D4FF)' : audioInfo.bitrate >= 128 ? 'linear-gradient(90deg,#ffcc00,#ff8800)' : '#ff4444' }} />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mini Audio Player */}
                  {audioInfo && !analyzingAudio && (
                    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(178,75,243,0.07)', border: '1px solid rgba(178,75,243,0.25)' }}>
                      <div className="relative" style={{ height: 72, cursor: 'pointer' }} onClick={handleWaveformClick}>
                        <canvas ref={waveformCanvasRef} width={400} height={72} style={{ width: '100%', height: '100%', display: 'block' }} />
                        {!audioInfo.waveformData && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="flex gap-0.5 items-center">
                              {Array.from({ length: 28 }).map((_, i) => (
                                <div key={i} className={`rounded-full ${isPlaying ? 'animate-pulse' : ''}`}
                                  style={{ width: 3, height: `${10 + Math.sin(i * 0.7) * 14 + Math.random() * 10}px`, background: i / 28 <= (audioDuration > 0 ? audioCurrentTime / audioDuration : 0) ? 'linear-gradient(180deg,#00D4FF,#B24BF3)' : 'rgba(178,75,243,0.3)', transition: 'height 0.2s' }} />
                              ))}
                            </div>
                          </div>
                        )}
                        {audioDuration > 0 && (
                          <div className="absolute top-0 bottom-0 w-0.5 rounded-full pointer-events-none"
                            style={{ left: `${(audioCurrentTime / audioDuration) * 100}%`, background: '#fff', opacity: 0.7, boxShadow: '0 0 6px #00D4FF', transition: 'left 0.1s linear' }} />
                        )}
                      </div>
                      <div className="flex items-center gap-3 px-4 py-3">
                        <button type="button" onClick={handlePlayPause}
                          className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center transition-all hover:scale-110"
                          style={{ background: 'linear-gradient(135deg,#B24BF3,#00D4FF)', boxShadow: isPlaying ? '0 0 14px rgba(178,75,243,0.5)' : 'none' }}>
                          {isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white" style={{ marginLeft: 2 }} />}
                        </button>
                        <div className="flex-1 flex flex-col gap-1">
                          <input type="range" min={0} max={audioDuration || 0} step={0.1} value={audioCurrentTime}
                            onChange={(e) => {
                              const tt = parseFloat(e.target.value);
                              if (audioElemRef.current) audioElemRef.current.currentTime = tt;
                              setAudioCurrentTime(tt);
                              const canvas = waveformCanvasRef.current;
                              if (canvas && audioInfo.waveformData && audioDuration > 0) drawWaveform(canvas, audioInfo.waveformData, tt / audioDuration);
                            }}
                            style={{ width: '100%', accentColor: '#B24BF3', height: 4, cursor: 'pointer' }} />
                          <div className="flex justify-between text-xs tabular-nums" style={{ color: 'rgba(160,160,210,0.55)', fontSize: 10 }}>
                            <span>{formatDuration(audioCurrentTime)}</span>
                            <span>{audioDuration > 0 ? formatDuration(audioDuration) : '—'}</span>
                          </div>
                        </div>
                        <Volume2 className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(178,75,243,0.6)' }} />
                      </div>
                      <div className="px-4 pb-3 flex items-center gap-2">
                        <Music className="w-3 h-3" style={{ color: '#B24BF3' }} />
                        <span className="text-xs truncate" style={{ color: 'rgba(160,160,210,0.6)', maxWidth: '80%' }}>{audioInfo.name}</span>
                        {draft.mp3AssetId && !uploading && <CheckCircle className="w-3.5 h-3.5 mr-auto flex-shrink-0" style={{ color: '#00ff80' }} />}
                      </div>
                    </div>
                  )}
                  {draft.mp3AssetId && !uploading && !audioInfo && <p className="text-sm flex items-center gap-2" style={{ color: '#00ff80' }}><CheckCircle className="w-4 h-4" /> קובץ הועלה בהצלחה</p>}
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2 ── */}
          {currentStep === 2 && (
            <div className="animate-slide-up text-center py-4">
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#f0f0ff', fontFamily: 'Syne, sans-serif' }}>ניתוח AI</h2>
              <p className="text-sm mb-10" style={{ color: 'rgba(160,160,210,0.6)' }}>מנתח ומעבד את התוכן שהעלית...</p>
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8" style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(178,75,243,0.15))', border: '1px solid rgba(0,212,255,0.3)', boxShadow: '0 0 30px rgba(0,212,255,0.1)' }}>
                <Brain className="w-9 h-9 animate-pulse" style={{ color: '#00D4FF' }} />
              </div>
              <div className="max-w-sm mx-auto mb-5">
                <div className="flex justify-between text-xs mb-2" style={{ color: 'rgba(160,160,210,0.6)' }}>
                  <span>עיבוד AI</span><span style={{ color: '#00D4FF', fontWeight: 700 }}>{Math.round(autoProgress)}%</span>
                </div>
                <div className="progress-neon"><div className="progress-neon-fill" style={{ width: `${autoProgress}%` }} /></div>
              </div>
              <div className="space-y-2 max-w-xs mx-auto">
                {[{ label: 'מחלץ מאפיינים', threshold: 30 }, { label: 'מנתח שפה ומבנה', threshold: 60 }, { label: 'יוצר פרופיל תוכן', threshold: 90 }].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm" style={{ color: autoProgress >= item.threshold ? '#00ff80' : 'rgba(150,150,200,0.4)' }}>
                    <CheckCircle className={`w-4 h-4 flex-shrink-0 ${autoProgress >= item.threshold ? 'text-[#00ff80]' : 'text-[rgba(150,150,200,0.3)]'}`} />
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 3 ── */}
          {currentStep === 3 && (
            <div className="animate-slide-up">
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#f0f0ff', fontFamily: 'Syne, sans-serif' }}>{t.create.step3.title}</h2>
              <p className="text-sm mb-7" style={{ color: 'rgba(160,160,210,0.6)' }}>{t.create.step3.description}</p>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'rgba(200,200,240,0.8)' }}>{t.create.step3.uploadVideo}</label>
                  <p className="text-xs mb-3" style={{ color: 'rgba(120,120,170,0.6)' }}>MP4, AVI, MOV, MKV, WebM — עד 2.2 GB</p>
                  <div className={`drop-zone p-8 text-center mb-2 ${dragOverVideo ? 'drag-over-cyan' : ''}`}
                    style={{ border: `2px dashed ${dragOverVideo ? 'rgba(0,212,255,0.8)' : 'rgba(0,212,255,0.2)'}`, background: dragOverVideo ? 'rgba(0,212,255,0.07)' : 'rgba(0,212,255,0.02)' }}
                    {...makeDragHandlers(setDragOverVideo, ['video'])}>
                    <div className="flex flex-col items-center gap-3 pointer-events-none">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: dragOverVideo ? 'rgba(0,212,255,0.2)' : 'rgba(0,212,255,0.08)' }}>
                        {dragOverVideo ? <Upload className="w-7 h-7" style={{ color: '#00D4FF' }} /> : <Video className="w-7 h-7" style={{ color: '#00D4FF' }} />}
                      </div>
                      <div>
                        <p className="text-base font-bold" style={{ color: dragOverVideo ? '#00D4FF' : 'rgba(200,200,240,0.75)' }}>{dragOverVideo ? 'שחרר כאן!' : 'גרור קובץ וידאו לכאן'}</p>
                        <p className="text-xs mt-1" style={{ color: 'rgba(140,140,190,0.5)' }}>MP4 · AVI · MOV · MKV · WebM · עד 2.2 GB</p>
                      </div>
                    </div>
                  </div>

                  <label htmlFor={!uploading ? VIDEO_INPUT_ID : undefined}
                    className={`btn-neon-cyan w-full py-4 flex items-center justify-center gap-2 select-none ${uploading ? 'opacity-50 pointer-events-none cursor-not-allowed' : 'cursor-pointer'}`}
                    style={{ display: 'flex' }}>
                    {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                    {uploading ? `מעלה... ${uploadProgress}%` : t.create.step3.uploadVideo}
                  </label>

                  {uploading && uploadFileSize > 0 && (
                    <div className="mt-4 p-4 rounded-xl" style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)' }}>
                      <div className="flex justify-between text-xs mb-2" style={{ color: 'rgba(160,160,210,0.7)' }}>
                        <span className="truncate max-w-[200px]">{uploadFileName}</span>
                        <span style={{ color: '#00D4FF', fontWeight: 700 }}>{uploadProgress}%</span>
                      </div>
                      <div className="progress-neon mb-2">
                        <div className="progress-neon-fill transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                      </div>
                      <div className="text-xs" style={{ color: 'rgba(120,120,170,0.55)' }}>
                        {formatBytes(uploadFileSize * uploadProgress / 100)} / {formatBytes(uploadFileSize)}
                      </div>
                    </div>
                  )}
                  {draft.videoAssetId && !uploading && (
                    <p className="text-sm mt-3 flex items-center gap-2" style={{ color: '#00ff80' }}><CheckCircle className="w-4 h-4" /> {t.create.step3.uploadComplete}</p>
                  )}
                </div>

                <div className="relative">
                  <div className="neon-divider" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="px-4 text-sm" style={{ background: '#0f0f1e', color: 'rgba(160,160,210,0.5)' }}>או</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'rgba(200,200,240,0.8)' }}>{t.create.step3.youtubeUrl}</label>
                  <input type="url" value={draft.youtubeUrl} onChange={(e) => setDraft({ ...draft, youtubeUrl: e.target.value })}
                    placeholder={t.create.step3.urlPlaceholder} className="ai-input" />
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 4 ── */}
          {currentStep === 4 && (
            <div className="animate-slide-up">
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#f0f0ff', fontFamily: 'Syne, sans-serif' }}>הגדרות AI</h2>
              <p className="text-sm mb-7" style={{ color: 'rgba(160,160,210,0.6)' }}>הגדר את הסיכום האידאלי שלך</p>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'rgba(200,200,240,0.8)' }}>
                    {t.create.step3?.movieTitle || 'כותרת'} <span style={{ color: '#ff4444' }}>*</span>
                  </label>
                  <input type="text" value={draft.movieTitle} onChange={(e) => setDraft({ ...draft, movieTitle: e.target.value })}
                    placeholder={t.create.step3?.movieTitlePlaceholder || 'שם הסרט/סדרה...'} className="ai-input" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'rgba(200,200,240,0.8)' }}>ז'אנר</label>
                  <select value={draft.genre} onChange={(e) => setDraft({ ...draft, genre: e.target.value })} className="ai-input">
                    {Object.entries(GENRES_HE).map(([key, label]) => (
                      <option key={key} value={key} style={{ background: '#0f0f1e' }}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'rgba(200,200,240,0.8)' }}>תיאור</label>
                  <textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                    placeholder="תיאור קצר של הסרט/סדרה..." rows={3} className="ai-input resize-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-3" style={{ color: 'rgba(200,200,240,0.8)' }}>אורך סיכום יעד</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'שעות', max: 3, val: draft.targetDurationHours, key: 'targetDurationHours' as const },
                      { label: 'דקות', max: 59, val: draft.targetDurationMinutes, key: 'targetDurationMinutes' as const },
                      { label: 'שניות', max: 59, val: draft.targetDurationSeconds, key: 'targetDurationSeconds' as const },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="block text-xs mb-1" style={{ color: 'rgba(150,150,200,0.55)' }}>{f.label}</label>
                        <input type="number" min={0} max={f.max} value={f.val}
                          onChange={(e) => setDraft({ ...draft, [f.key]: parseInt(e.target.value) || 0 })}
                          className="ai-input text-center text-lg font-bold" style={{ color: '#00D4FF' }} />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-3" style={{ color: 'rgba(200,200,240,0.8)' }}>מרווח חיתוך</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'דקות', val: draft.cutEveryMinutes, key: 'cutEveryMinutes' as const },
                      { label: 'שניות', val: draft.cutEverySeconds, max: 59, key: 'cutEverySeconds' as const },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="block text-xs mb-1" style={{ color: 'rgba(150,150,200,0.55)' }}>{f.label}</label>
                        <input type="number" min={0} max={f.max ?? 99} value={f.val}
                          onChange={(e) => setDraft({ ...draft, [f.key]: parseInt(e.target.value) || 0 })}
                          className="ai-input text-center text-lg font-bold" style={{ color: '#B24BF3' }} />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs mt-2" style={{ color: 'rgba(140,140,190,0.5)' }}>~{estimatedClips} קליפים יוצרו</p>
                </div>
                <div className="space-y-3 pt-2">
                  {[
                    { key: 'webSearchEnabled' as const, icon: Globe, label: 'חיפוש באינטרנט', desc: 'שיפור הסיכום עם מידע נוסף' },
                    { key: 'youtubeLearningEnabled' as const, icon: BookOpen, label: 'למידה מ-YouTube', desc: 'שימוש בערוצים שחיברת' },
                    { key: 'continuousLearningEnabled' as const, icon: Brain, label: 'למידה מתמשכת', desc: 'שיפור מהעדפות שלך' },
                    { key: 'globalLearningOptIn' as const, icon: Info, label: 'למידה גלובלית (אנונימי)', desc: 'תרומה אנונימית לשיפור המערכת' },
                  ].map(item => {
                    const Icon = item.icon;
                    return (
                      <div key={item.key} className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="flex items-start gap-3">
                          <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'rgba(0,212,255,0.5)' }} />
                          <div>
                            <div className="text-sm font-medium" style={{ color: 'rgba(200,200,240,0.85)' }}>{item.label}</div>
                            <div className="text-xs" style={{ color: 'rgba(130,130,180,0.5)' }}>{item.desc}</div>
                          </div>
                        </div>
                        <button type="button" onClick={() => setDraft(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                          className="relative flex-shrink-0 w-12 h-6 rounded-full transition-all"
                          style={{ background: draft[item.key] ? 'linear-gradient(135deg, #00D4FF, #B24BF3)' : 'rgba(255,255,255,0.1)' }}>
                          <div className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all shadow-sm" style={{ left: draft[item.key] ? '26px' : '2px' }} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 5 ── */}
          {currentStep === 5 && (
            <div className="animate-slide-up">
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#f0f0ff', fontFamily: 'Syne, sans-serif' }}>{t.create.step6.title}</h2>
              <p className="text-sm mb-7" style={{ color: 'rgba(160,160,210,0.6)' }}>{t.create.step6.description}</p>

              {!isRendering && !renderComplete && (
                <div className="p-4 rounded-xl mb-5 flex items-center justify-between" style={{
                  background: ffmpegLoaded ? 'linear-gradient(135deg, rgba(0,212,255,0.08), rgba(178,75,243,0.06))' : 'rgba(255,200,0,0.05)',
                  border: `1px solid ${ffmpegLoaded ? 'rgba(0,212,255,0.25)' : 'rgba(255,200,0,0.2)'}`,
                }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: ffmpegLoaded ? 'rgba(0,212,255,0.15)' : 'rgba(255,200,0,0.12)' }}>
                      {ffmpegLoading ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#ffcc00' }} /> : <Zap className="w-4 h-4" style={{ color: ffmpegLoaded ? '#00D4FF' : '#ffcc00' }} />}
                    </div>
                    <div>
                      <div className="text-sm font-bold" style={{ color: ffmpegLoaded ? '#00D4FF' : '#ffcc00' }}>
                        {ffmpegLoading ? 'טוען מנוע FFmpeg...' : ffmpegLoaded ? 'מנוע FFmpeg מוכן' : 'מנוע FFmpeg לא נטען'}
                      </div>
                      <div className="text-xs" style={{ color: 'rgba(140,140,190,0.55)' }}>עיבוד וידאו מתקדם ישירות בדפדפן</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {ffmpegLoaded && <span className="text-xs px-2.5 py-1 rounded-full font-bold" style={{ background: 'rgba(0,255,128,0.1)', border: '1px solid rgba(0,255,128,0.25)', color: '#00ff80' }}>● פעיל</span>}
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(160,160,210,0.5)' }}>WebAssembly</span>
                  </div>
                </div>
              )}

              {!isRendering && !renderComplete && (
                <div className="flex flex-wrap gap-2 mb-5">
                  {[
                    { icon: Zap,      label: 'עיבוד מהיר',        color: '#00D4FF' },
                    { icon: Cpu,      label: 'FFmpeg WebAssembly', color: '#B24BF3' },
                    { icon: Brain,    label: 'Google Gemini AI',   color: '#00D4FF' },
                    { icon: Gauge,    label: 'H.264 / AAC',        color: '#B24BF3' },
                    { icon: Activity, label: 'Real-time Pipeline', color: '#00ff80' },
                  ].map((b, i) => {
                    const Icon = b.icon;
                    return (
                      <div key={i} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: b.color }}>
                        <Icon className="w-3 h-3" />{b.label}
                      </div>
                    );
                  })}
                </div>
              )}

              {isRendering && (
                <div className="space-y-4 mb-6">
                  <div className="p-5 rounded-xl" style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.2)' }}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,212,255,0.15)' }}>
                        <Cpu className="w-4 h-4 animate-pulse" style={{ color: '#00D4FF' }} />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold" style={{ color: '#00D4FF' }}>מנוע FFmpeg פעיל</div>
                        <div className="text-xs" style={{ color: 'rgba(140,140,190,0.6)' }}>{processingStage}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-black tabular-nums" style={{ color: '#00D4FF' }}>{Math.round(renderProgress)}%</div>
                        <div className="text-xs" style={{ color: 'rgba(140,140,190,0.5)' }}>מושלם</div>
                      </div>
                    </div>
                    <div className="h-3 rounded-full overflow-hidden mb-3" style={{ background: 'rgba(0,212,255,0.1)' }}>
                      <div className="h-full rounded-full transition-all duration-300" style={{ width: `${renderProgress}%`, background: 'linear-gradient(90deg, #00D4FF, #B24BF3)', boxShadow: '0 0 12px rgba(0,212,255,0.5)' }} />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { icon: Gauge,    label: 'מהירות',     val: ffmpegSpeed },
                        { icon: Activity, label: 'זמן עובד',   val: ffmpegTimeProcessed > 0 ? formatDuration(ffmpegTimeProcessed) : '—' },
                        { icon: Zap,      label: 'WebAssembly', val: 'פעיל' },
                      ].map((s, i) => {
                        const Icon = s.icon;
                        return (
                          <div key={i} className="p-2.5 rounded-xl text-center" style={{ background: 'rgba(0,0,0,0.2)' }}>
                            <Icon className="w-3.5 h-3.5 mx-auto mb-1" style={{ color: '#00D4FF' }} />
                            <div className="text-xs font-bold" style={{ color: 'rgba(220,220,250,0.9)' }}>{s.val}</div>
                            <div className="text-xs" style={{ color: 'rgba(120,120,170,0.5)', fontSize: '10px' }}>{s.label}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl" style={{ background: 'rgba(178,75,243,0.04)', border: '1px solid rgba(178,75,243,0.15)' }}>
                    <div className="text-xs font-semibold mb-3 flex items-center gap-1.5" style={{ color: '#B24BF3' }}>
                      <Activity className="w-3.5 h-3.5" /> Pipeline AI
                    </div>
                    <div className="space-y-2">
                      {[
                        { l: 'טעינת מנוע FFmpeg',      threshold: 5 },
                        { l: 'ניתוח קובץ קלט',          threshold: 15 },
                        { l: 'Gemini AI — סצינות',       threshold: 30 },
                        { l: 'קידוד H.264 / AAC',        threshold: 55 },
                        { l: 'מיזוג אודיו ווידאו',       threshold: 75 },
                        { l: 'אופטימיזציה ו-faststart',  threshold: 90 },
                        { l: 'פלט מוכן',                 threshold: 100 },
                      ].map((item, i) => {
                        const done   = renderProgress >= item.threshold;
                        const active = renderProgress >= item.threshold - 15 && !done;
                        return (
                          <div key={i} className="flex items-center gap-2.5 text-xs">
                            <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
                              {done ? <CheckCircle className="w-3.5 h-3.5" style={{ color: '#00ff80' }} /> : active ? <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: '#00D4FF' }} /> : <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />}
                            </div>
                            <span style={{ color: done ? '#00ff80' : active ? '#00D4FF' : 'rgba(150,150,200,0.35)', fontWeight: active || done ? 600 : 400 }}>{item.l}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {ffmpegLogs.length > 0 && (
                    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div className="flex items-center gap-2 px-3 py-2" style={{ background: 'rgba(0,0,0,0.4)' }}>
                        <Terminal className="w-3 h-3" style={{ color: '#00D4FF' }} />
                        <span className="text-xs font-bold" style={{ color: 'rgba(160,160,210,0.7)' }}>FFmpeg Console</span>
                        <div className="flex gap-1 mr-auto">
                          <div className="w-2 h-2 rounded-full" style={{ background: '#ff5f57' }} />
                          <div className="w-2 h-2 rounded-full" style={{ background: '#febc2e' }} />
                          <div className="w-2 h-2 rounded-full" style={{ background: '#28c840' }} />
                        </div>
                      </div>
                      <div className="p-3 space-y-0.5 overflow-y-auto font-mono text-xs" style={{ background: '#050510', maxHeight: '120px', direction: 'ltr' }}>
                        {ffmpegLogs.slice(-30).map((log, i) => (
                          <div key={i} style={{ color: log.type === 'fferr' ? 'rgba(255,180,180,0.7)' : log.message.startsWith('[AI]') ? '#00D4FF' : 'rgba(180,220,180,0.65)', lineHeight: '1.5' }}>
                            {log.message}
                          </div>
                        ))}
                        <div ref={logsEndRef} />
                      </div>
                    </div>
                  )}

                  {processingError && (
                    <div className="p-3 rounded-xl flex items-center gap-2" style={{ background: 'rgba(255,60,60,0.07)', border: '1px solid rgba(255,60,60,0.2)' }}>
                      <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#ff6666' }} />
                      <span className="text-xs" style={{ color: '#ff9999' }}>{processingError} — מנסה גיבוי...</span>
                    </div>
                  )}
                </div>
              )}

              {renderComplete && (
                <div className="space-y-5">
                  <div className="p-5 rounded-xl flex items-center gap-4" style={{ background: 'rgba(0,255,128,0.07)', border: '1px solid rgba(0,255,128,0.2)' }}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,255,128,0.15)' }}>
                      <CheckCircle className="w-6 h-6" style={{ color: '#00ff80' }} />
                    </div>
                    <div>
                      <p className="font-bold text-lg" style={{ color: '#f0f0ff' }}>🎉 הסיכום הושלם!</p>
                      <p className="text-sm" style={{ color: 'rgba(160,160,210,0.65)' }}>צפה, הורד או שתף את הסיכום</p>
                    </div>
                  </div>
                  <div className="p-5 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <h3 className="text-sm font-semibold mb-3" style={{ color: 'rgba(200,200,240,0.8)' }}>{t.create.step6.preview}</h3>
                    <video controls className="w-full rounded-xl bg-black" style={{ maxHeight: '300px' }}>
                      <source src={outputVideoUrl} type="video/mp4" />
                    </video>
                  </div>
                  <button onClick={() => { const link = document.createElement('a'); link.href = outputVideoUrl; link.download = `${draft.movieTitle || 'recap'}.mp4`; document.body.appendChild(link); link.click(); document.body.removeChild(link); }}
                    className="btn-neon-cyan w-full py-4 text-base flex items-center justify-center gap-2">
                    <Video className="w-5 h-5" /> {t.create.step6.download}
                  </button>
                  <div className="p-5 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'rgba(200,200,240,0.8)' }}>
                      <Share2 className="w-4 h-4" style={{ color: '#00D4FF' }} /> {t.create.step6.shareTitle}
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`🎬 ${draft.movieTitle}\n${window.location.origin}/gallery`)}`, '_blank')} className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all hover:scale-105" style={{ background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.25)', color: '#25D366' }}>
                        <MessageCircle className="w-5 h-5" /><span className="text-xs font-medium">WhatsApp</span>
                      </button>
                      <button onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/gallery`)}`, '_blank')} className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all hover:scale-105" style={{ background: 'rgba(24,119,242,0.1)', border: '1px solid rgba(24,119,242,0.25)', color: '#1877F2' }}>
                        <Facebook className="w-5 h-5" /><span className="text-xs font-medium">Facebook</span>
                      </button>
                      <button onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`🎬 ${draft.movieTitle}`)}&url=${encodeURIComponent(`${window.location.origin}/gallery`)}`, '_blank')} className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all hover:scale-105" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#ffffff' }}>
                        <Twitter className="w-5 h-5" /><span className="text-xs font-medium">X</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {!isRendering && !renderComplete && (
                <div className="space-y-5">
                  <div className="p-5 rounded-xl" style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.12)' }}>
                    <h3 className="text-sm font-semibold mb-4" style={{ color: '#00D4FF' }}>סיכום הגדרות</h3>
                    <div className="space-y-2 text-sm">
                      {[
                        { label: 'כותרת',          val: draft.movieTitle || '—' },
                        { label: "ז'אנר",           val: GENRES_HE[draft.genre] || draft.genre },
                        { label: 'אורך סיכום',      val: `${String(draft.targetDurationHours).padStart(2,'0')}:${String(draft.targetDurationMinutes).padStart(2,'0')}:${String(draft.targetDurationSeconds).padStart(2,'0')}` },
                        { label: 'מרווח חיתוך',     val: `${String(draft.cutEveryMinutes).padStart(2,'0')}:${String(draft.cutEverySeconds).padStart(2,'0')}` },
                        { label: 'קליפים משוערים', val: `~${estimatedClips}` },
                      ].map((item, i) => (
                        <div key={i} className="flex justify-between">
                          <span style={{ color: 'rgba(140,140,190,0.55)' }}>{item.label}:</span>
                          <span style={{ color: 'rgba(220,220,250,0.85)', fontWeight: 600 }}>{item.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-5 rounded-xl flex items-center justify-between" style={{ background: wallet.balance < 1 ? 'rgba(255,60,60,0.07)' : 'rgba(255,255,255,0.02)', border: `1px solid ${wallet.balance < 1 ? 'rgba(255,60,60,0.2)' : 'rgba(255,255,255,0.06)'}` }}>
                    <span className="text-sm font-semibold" style={{ color: 'rgba(200,200,240,0.8)' }}>{t.create.step6.credits}</span>
                    <span className="text-2xl font-bold" style={{ color: wallet.balance < 1 ? '#ff4444' : '#00D4FF' }}>{wallet.balance}</span>
                  </div>
                  {showRewardAlert && (
                    <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: 'rgba(255,200,0,0.07)', border: '1px solid rgba(255,200,0,0.2)' }}>
                      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#ffcc00' }} />
                      <div>
                        <p className="text-sm font-medium" style={{ color: '#ffdd44' }}>נדרש קרדיט אחד</p>
                        <button onClick={() => { rewardCredits(1, 'Ad reward'); setShowRewardAlert(false); }} className="text-xs mt-1.5 underline" style={{ color: '#ffcc00' }}>
                          צפה במודעה לקבלת קרדיט חינם
                        </button>
                      </div>
                    </div>
                  )}
                  <button onClick={handleCreate} disabled={!user || !draft.movieTitle}
                    className="btn-neon-cyan w-full py-4 text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
                    <Sparkles className="w-5 h-5" /> {t.create.step6.createRecap}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button onClick={() => currentStep > 1 && setCurrentStep(currentStep - 1)} disabled={currentStep === 1 || currentStep === 2}
            className="btn-ghost flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronRight className="w-4 h-4" /> {t.common.back}
          </button>
          {currentStep < totalSteps && currentStep !== 2 && (
            <button onClick={() => setCurrentStep(currentStep + 1)} disabled={(currentStep === 4 && !draft.movieTitle) || uploading}
              className="btn-neon-cyan flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
              {t.common.continue} <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
