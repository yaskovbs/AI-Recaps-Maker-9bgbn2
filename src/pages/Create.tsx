import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { useWallet } from '@/hooks/useWallet';
import { createJob } from '@/lib/recapService';
import { supabase } from '@/lib/supabase';
import {
  ChevronRight, ChevronLeft, Upload, FileText, Music, Video,
  Sparkles, AlertCircle, CheckCircle, Share2, MessageCircle,
  Facebook, Twitter, Loader2, Cpu, Eye, Layers, Key, Brain,
  Globe, BookOpen, Info
} from 'lucide-react';

type InputMode = 'text' | 'txt' | 'mp3';

interface AudioFileInfo {
  name: string;
  size: number;
  format: string;
  duration: number | null;  // seconds
  bitrate: number | null;   // kbps
  sampleRate: number | null;
  channels: number | null;
  wpm: number | null;       // estimated words per minute
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
  const [audioInfo, setAudioInfo] = useState<AudioFileInfo | null>(null);
  const [analyzingAudio, setAnalyzingAudio] = useState(false);

  const [draft, setDraft] = useState<Draft>({
    inputMode: 'text', scriptText: '', txtAssetId: '', mp3AssetId: '',
    videoAssetId: '', youtubeUrl: '', movieTitle: '', description: '',
    genre: 'action', targetDurationHours: 0, targetDurationMinutes: 4, targetDurationSeconds: 0,
    cutEveryMinutes: 0, cutEverySeconds: 9, webSearchEnabled: false,
    youtubeLearningEnabled: false, continuousLearningEnabled: true, globalLearningOptIn: false,
  });

  const totalSeconds = draft.targetDurationHours * 3600 + draft.targetDurationMinutes * 60 + draft.targetDurationSeconds;
  const intervalSeconds = draft.cutEveryMinutes * 60 + draft.cutEverySeconds;
  const estimatedClips = intervalSeconds > 0 ? Math.floor(totalSeconds / intervalSeconds) : 0;

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

  const MAX_VIDEO_SIZE = 2.2 * 1024 * 1024 * 1024; // 2.2 GB
  const MAX_AUDIO_SIZE = 200 * 1024 * 1024; // 200 MB
  const MAX_TXT_SIZE = 10 * 1024 * 1024; // 10 MB

  // Analyze audio file metadata client-side before upload
  const analyzeAudioFile = (file: File): Promise<AudioFileInfo> => {
    return new Promise((resolve) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const formatMap: Record<string, string> = { mp3: 'MP3', wav: 'WAV', aac: 'AAC', m4a: 'M4A (AAC)', ogg: 'OGG', flac: 'FLAC' };
      const format = formatMap[ext] || ext.toUpperCase();

      // Parse WAV header for sample rate / channels
      let sampleRate: number | null = null;
      let channels: number | null = null;

      const parseWavHeader = (buffer: ArrayBuffer) => {
        const view = new DataView(buffer);
        // WAV header: channels @ 22, sampleRate @ 24
        if (view.getUint32(0, false) === 0x52494646) { // 'RIFF'
          channels = view.getUint16(22, true);
          sampleRate = view.getUint32(24, true);
        }
      };

      const finish = (duration: number | null) => {
        const bitrate = duration && duration > 0
          ? Math.round((file.size * 8) / duration / 1000)
          : null;
        const wpm = duration && duration > 0
          ? Math.round((duration / 60) * 130) // avg 130 wpm narration rate
          : null;
        resolve({ name: file.name, size: file.size, format, duration, bitrate, sampleRate, channels, wpm });
      };

      // Try Web Audio API for duration
      const url = URL.createObjectURL(file);
      const audio = new Audio();
      audio.preload = 'metadata';

      const cleanup = () => URL.revokeObjectURL(url);

      audio.onloadedmetadata = () => {
        const dur = isFinite(audio.duration) && audio.duration > 0 ? audio.duration : null;
        cleanup();
        // For WAV, also parse header
        if (ext === 'wav') {
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result) parseWavHeader(e.target.result as ArrayBuffer);
            finish(dur);
          };
          reader.onerror = () => finish(dur);
          reader.readAsArrayBuffer(file.slice(0, 44)); // WAV header is 44 bytes
        } else {
          finish(dur);
        }
      };

      audio.onerror = () => { cleanup(); finish(null); };
      // Timeout fallback
      setTimeout(() => { cleanup(); finish(null); }, 4000);
      audio.src = url;
    });
  };

  const formatDuration = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    return h > 0
      ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
      : `${m}:${String(s).padStart(2,'0')}`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  const handleFileUpload = async (type: 'txt' | 'mp3' | 'video') => {
    if (!user) { alert('יש להתחבר כדי להעלות קבצים'); return; }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = type === 'txt' ? '.txt' : type === 'mp3' ? 'audio/mpeg,audio/wav,audio/aac,audio/mp4,audio/x-m4a,.mp3,.wav,.aac,.m4a,.ogg,.flac' : 'video/mp4,video/avi,video/quicktime,video/x-matroska,video/webm,video/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // Validate file size
      const maxSize = type === 'video' ? MAX_VIDEO_SIZE : type === 'mp3' ? MAX_AUDIO_SIZE : MAX_TXT_SIZE;
      if (file.size > maxSize) {
        alert(`הקובץ גדול מדי. הגודל המקסימלי הוא ${formatBytes(maxSize)}. גודל הקובץ שלך: ${formatBytes(file.size)}`);
        return;
      }

      // Analyze audio before upload
      if (type === 'mp3') {
        setAnalyzingAudio(true);
        setAudioInfo(null);
        const info = await analyzeAudioFile(file);
        setAudioInfo(info);
        setAnalyzingAudio(false);
      }

      setUploading(true);
      setUploadProgress(0);
      setUploadFileName(file.name);
      setUploadFileSize(file.size);

      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${type}-${Date.now()}.${fileExt}`;

        // Get fresh session token for auth
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY || '';
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';

        // Direct REST upload via XHR — works for all file types and sizes
        const uploadWithProgress = (): Promise<void> => {
          return new Promise((resolve, reject) => {
            const uploadUrl = `${supabaseUrl}/storage/v1/object/recap-assets/${fileName}`;

            const xhr = new XMLHttpRequest();
            xhr.upload.addEventListener('progress', (e) => {
              if (e.lengthComputable) {
                setUploadProgress(Math.round((e.loaded / e.total) * 100));
              }
            });

            xhr.addEventListener('load', () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                resolve();
              } else {
                let errMsg = `שגיאת שרת (${xhr.status})`;
                try {
                  const body = JSON.parse(xhr.responseText);
                  errMsg = body.message || body.error || errMsg;
                } catch {}
                reject(new Error(errMsg));
              }
            });

            xhr.addEventListener('error', () => reject(new Error('חיבור נכשל. בדוק את החיבור לאינטרנט ונסה שוב.')));
            xhr.addEventListener('abort', () => reject(new Error('ההעלאה בוטלה.')));

            xhr.open('POST', uploadUrl);
            xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
            xhr.setRequestHeader('x-upsert', 'true');
            xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
            xhr.send(file);
          });
        };

        await uploadWithProgress();
        const { data: { publicUrl } } = supabase.storage.from('recap-assets').getPublicUrl(fileName);

        if (type === 'txt') {
          const text = await file.text();
          setDraft(prev => ({ ...prev, txtAssetId: publicUrl, scriptText: text }));
        } else if (type === 'mp3') {
          setDraft(prev => ({ ...prev, mp3AssetId: publicUrl }));
        } else {
          setDraft(prev => ({ ...prev, videoAssetId: publicUrl }));
        }
        setUploadProgress(100);
      } catch (err: any) {
        console.error('Upload error:', err);
        alert(`שגיאת העלאה: ${err.message || 'נסה שוב'}`);
        setUploadProgress(0);
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

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
    const timer = setInterval(() => {
      setRenderProgress(prev => {
        if (prev >= 100) { clearInterval(timer); setIsRendering(false); setRenderComplete(true); setOutputVideoUrl(`https://example.com/recaps/${job.id}.mp4`); return 100; }
        return prev + 1.5;
      });
    }, 90);
  };

  const stepLabels = [
    { icon: FileText, label: 'תסריט + אודיו' },
    { icon: Cpu, label: 'ניתוח AI' },
    { icon: Video, label: 'העלאת וידאו' },
    { icon: Key, label: 'הגדרות AI' },
    { icon: Eye, label: 'הורדה ושיתוף' },
  ];

  return (
    <div className="min-h-screen py-8" style={{ background: '#0a0a14' }}>
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <div className="neon-badge neon-badge-cyan mb-3 inline-flex">Wizard</div>
          <h1 className="text-4xl font-bold mb-2" style={{ color: '#f0f0ff', fontFamily: 'Syne, sans-serif' }}>
            {t.create.title}
          </h1>
          <p className="text-sm" style={{ color: 'rgba(160,160,210,0.6)' }}>
            {totalSteps} שלבים ליצירת סיכום AI מושלם
          </p>
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
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all ${
                        isActive ? 'wizard-step-active scale-110' : isDone ? 'wizard-step-done' : 'wizard-step-idle'
                      }`}
                    >
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

        {/* Step Content */}
        <div className="ai-card p-7 mb-5">

          {/* ── STEP 1: Script + Audio ── */}
          {currentStep === 1 && (
            <div className="animate-slide-up">
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#f0f0ff', fontFamily: 'Syne, sans-serif' }}>{t.create.step1.title}</h2>
              <p className="text-sm mb-7" style={{ color: 'rgba(160,160,210,0.6)' }}>{t.create.step1.description}</p>

              {/* Input Mode */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-3" style={{ color: 'rgba(200,200,240,0.8)' }}>{t.create.step1.inputMode}</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['text', 'txt', 'mp3'] as InputMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setDraft({ ...draft, inputMode: mode })}
                      className="p-4 rounded-xl transition-all text-center"
                      style={{
                        background: draft.inputMode === mode ? 'rgba(0,212,255,0.1)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${draft.inputMode === mode ? 'rgba(0,212,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
                        boxShadow: draft.inputMode === mode ? '0 0 15px rgba(0,212,255,0.1)' : 'none',
                      }}
                    >
                      {mode === 'text' && <FileText className="w-5 h-5 mx-auto mb-2" style={{ color: draft.inputMode === mode ? '#00D4FF' : 'rgba(160,160,210,0.5)' }} />}
                      {mode === 'txt' && <Upload className="w-5 h-5 mx-auto mb-2" style={{ color: draft.inputMode === mode ? '#00D4FF' : 'rgba(160,160,210,0.5)' }} />}
                      {mode === 'mp3' && <Music className="w-5 h-5 mx-auto mb-2" style={{ color: draft.inputMode === mode ? '#00D4FF' : 'rgba(160,160,210,0.5)' }} />}
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
                  <textarea
                    value={draft.scriptText}
                    onChange={(e) => setDraft({ ...draft, scriptText: e.target.value })}
                    placeholder={t.create.step1.scriptPlaceholder}
                    rows={7}
                    className="ai-input resize-none"
                  />
                </div>
              )}

              {draft.inputMode === 'txt' && (
                <div>
                  <button onClick={() => handleFileUpload('txt')} disabled={uploading} className="btn-neon-cyan w-full flex items-center justify-center gap-2 disabled:opacity-50">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {t.create.step1.uploadTxt}
                  </button>
                  {draft.txtAssetId && <p className="text-sm mt-3 flex items-center gap-2" style={{ color: '#00ff80' }}><CheckCircle className="w-4 h-4" /> קובץ הועלה בהצלחה</p>}
                </div>
              )}

              {draft.inputMode === 'mp3' && (
                <div className="space-y-4">
                  {/* Format badges */}
                  <div className="flex flex-wrap gap-2">
                    {['MP3', 'WAV', 'AAC', 'M4A'].map(fmt => (
                      <span key={fmt} className="text-xs px-2.5 py-1 rounded-lg font-semibold" style={{ background: 'rgba(178,75,243,0.12)', border: '1px solid rgba(178,75,243,0.25)', color: '#B24BF3' }}>
                        {fmt}
                      </span>
                    ))}
                    <span className="text-xs px-2.5 py-1 rounded-lg" style={{ color: 'rgba(140,140,190,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}>עד 200 MB</span>
                  </div>

                  <button
                    onClick={() => handleFileUpload('mp3')}
                    disabled={uploading || analyzingAudio}
                    className="btn-neon-purple w-full flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {analyzingAudio ? <><Loader2 className="w-4 h-4 animate-spin" />מנתח קובץ...</> :
                     uploading ? <><Loader2 className="w-4 h-4 animate-spin" />מעלה {uploadProgress}%</> :
                     <><Music className="w-4 h-4" />{t.create.step1.uploadMp3}</>}
                  </button>

                  {/* Upload progress bar */}
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

                  {/* Audio Analysis Results */}
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
                          { label: 'גודל', val: formatBytes(audioInfo.size) },
                          { label: 'אורך', val: audioInfo.duration ? formatDuration(audioInfo.duration) : '—' },
                          { label: 'ביטרייט', val: audioInfo.bitrate ? `${audioInfo.bitrate} kbps` : '—' },
                          ...(audioInfo.sampleRate ? [{ label: 'דגימה', val: `${(audioInfo.sampleRate/1000).toFixed(1)} kHz` }] : []),
                          ...(audioInfo.channels ? [{ label: 'ערוצים', val: audioInfo.channels === 1 ? 'מונו' : audioInfo.channels === 2 ? 'סטריאו' : `${audioInfo.channels}ch` }] : []),
                          ...(audioInfo.wpm ? [{ label: 'קצב קריינות', val: `~${audioInfo.wpm} מ/ד` }] : []),
                          ...(audioInfo.duration ? [{ label: 'זמן קריינות', val: formatDuration(audioInfo.duration) }] : []),
                        ].map((item, i) => (
                          <div key={i} className="flex justify-between items-center text-xs">
                            <span style={{ color: 'rgba(140,140,190,0.55)' }}>{item.label}:</span>
                            <span className="font-semibold" style={{ color: 'rgba(220,220,250,0.85)' }}>{item.val}</span>
                          </div>
                        ))}
                      </div>

                      {/* Quality indicator */}
                      {audioInfo.bitrate && (
                        <div className="pt-1">
                          <div className="flex justify-between text-xs mb-1" style={{ color: 'rgba(140,140,190,0.5)' }}>
                            <span>איכות אודיו</span>
                            <span style={{ color: audioInfo.bitrate >= 192 ? '#00ff80' : audioInfo.bitrate >= 128 ? '#ffcc00' : '#ff8888' }}>
                              {audioInfo.bitrate >= 192 ? 'גבוהה ✓' : audioInfo.bitrate >= 128 ? 'בינונית' : 'נמוכה'}
                            </span>
                          </div>
                          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                            <div className="h-full rounded-full" style={{
                              width: `${Math.min(100, (audioInfo.bitrate / 320) * 100)}%`,
                              background: audioInfo.bitrate >= 192 ? 'linear-gradient(90deg,#00ff80,#00D4FF)' : audioInfo.bitrate >= 128 ? 'linear-gradient(90deg,#ffcc00,#ff8800)' : '#ff4444'
                            }} />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {draft.mp3AssetId && !uploading && (
                    <p className="text-sm flex items-center gap-2" style={{ color: '#00ff80' }}>
                      <CheckCircle className="w-4 h-4" /> קובץ הועלה בהצלחה
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2: AI Analysis (auto-advance) ── */}
          {currentStep === 2 && (
            <div className="animate-slide-up text-center py-4">
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#f0f0ff', fontFamily: 'Syne, sans-serif' }}>ניתוח AI</h2>
              <p className="text-sm mb-10" style={{ color: 'rgba(160,160,210,0.6)' }}>מנתח ומעבד את התוכן שהעלית...</p>

              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8" style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(178,75,243,0.15))', border: '1px solid rgba(0,212,255,0.3)', boxShadow: '0 0 30px rgba(0,212,255,0.1)' }}>
                <Brain className="w-9 h-9 animate-pulse" style={{ color: '#00D4FF' }} />
              </div>

              <div className="max-w-sm mx-auto mb-5">
                <div className="flex justify-between text-xs mb-2" style={{ color: 'rgba(160,160,210,0.6)' }}>
                  <span>עיבוד AI</span>
                  <span style={{ color: '#00D4FF', fontWeight: 700 }}>{Math.round(autoProgress)}%</span>
                </div>
                <div className="progress-neon">
                  <div className="progress-neon-fill" style={{ width: `${autoProgress}%` }} />
                </div>
              </div>

              <div className="space-y-2 max-w-xs mx-auto">
                {[
                  { label: 'מחלץ מאפיינים', threshold: 30 },
                  { label: 'מנתח שפה ומבנה', threshold: 60 },
                  { label: 'יוצר פרופיל תוכן', threshold: 90 },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm" style={{ color: autoProgress >= item.threshold ? '#00ff80' : 'rgba(150,150,200,0.4)' }}>
                    <CheckCircle className={`w-4 h-4 flex-shrink-0 ${autoProgress >= item.threshold ? 'text-[#00ff80]' : 'text-[rgba(150,150,200,0.3)]'}`} />
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 3: Upload Video ── */}
          {currentStep === 3 && (
            <div className="animate-slide-up">
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#f0f0ff', fontFamily: 'Syne, sans-serif' }}>{t.create.step3.title}</h2>
              <p className="text-sm mb-7" style={{ color: 'rgba(160,160,210,0.6)' }}>{t.create.step3.description}</p>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'rgba(200,200,240,0.8)' }}>{t.create.step3.uploadVideo}</label>
                  <p className="text-xs mb-3" style={{ color: 'rgba(120,120,170,0.6)' }}>MP4, AVI, MOV, MKV, WebM — עד 2.2 GB</p>
                  <button
                    onClick={() => handleFileUpload('video')}
                    disabled={uploading}
                    className="btn-neon-cyan w-full py-4 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                    {uploading ? `מעלה... ${uploadProgress}%` : t.create.step3.uploadVideo}
                  </button>

                  {/* Upload Progress */}
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
                  <input
                    type="url"
                    value={draft.youtubeUrl}
                    onChange={(e) => setDraft({ ...draft, youtubeUrl: e.target.value })}
                    placeholder={t.create.step3.urlPlaceholder}
                    className="ai-input"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 4: AI Settings ── */}
          {currentStep === 4 && (
            <div className="animate-slide-up">
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#f0f0ff', fontFamily: 'Syne, sans-serif' }}>הגדרות AI</h2>
              <p className="text-sm mb-7" style={{ color: 'rgba(160,160,210,0.6)' }}>הגדר את הסיכום האידאלי שלך</p>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'rgba(200,200,240,0.8)' }}>
                    {t.create.step3?.movieTitle || 'כותרת'} <span style={{ color: '#ff4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={draft.movieTitle}
                    onChange={(e) => setDraft({ ...draft, movieTitle: e.target.value })}
                    placeholder={t.create.step3?.movieTitlePlaceholder || 'שם הסרט/סדרה...'}
                    className="ai-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'rgba(200,200,240,0.8)' }}>ז'אנר</label>
                  <select
                    value={draft.genre}
                    onChange={(e) => setDraft({ ...draft, genre: e.target.value })}
                    className="ai-input"
                  >
                    {Object.entries(GENRES_HE).map(([key, label]) => (
                      <option key={key} value={key} style={{ background: '#0f0f1e' }}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'rgba(200,200,240,0.8)' }}>תיאור</label>
                  <textarea
                    value={draft.description}
                    onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                    placeholder="תיאור קצר של הסרט/סדרה (יעזור ל-AI לייצר סיכום מדויק יותר)..."
                    rows={3}
                    className="ai-input resize-none"
                  />
                </div>

                {/* Duration */}
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
                        <input
                          type="number" min={0} max={f.max}
                          value={f.val}
                          onChange={(e) => setDraft({ ...draft, [f.key]: parseInt(e.target.value) || 0 })}
                          className="ai-input text-center text-lg font-bold"
                          style={{ color: '#00D4FF' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cut Interval */}
                <div>
                  <label className="block text-sm font-semibold mb-3" style={{ color: 'rgba(200,200,240,0.8)' }}>מרווח חיתוך</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'דקות', val: draft.cutEveryMinutes, key: 'cutEveryMinutes' as const },
                      { label: 'שניות', val: draft.cutEverySeconds, max: 59, key: 'cutEverySeconds' as const },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="block text-xs mb-1" style={{ color: 'rgba(150,150,200,0.55)' }}>{f.label}</label>
                        <input
                          type="number" min={0} max={f.max ?? 99}
                          value={f.val}
                          onChange={(e) => setDraft({ ...draft, [f.key]: parseInt(e.target.value) || 0 })}
                          className="ai-input text-center text-lg font-bold"
                          style={{ color: '#B24BF3' }}
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs mt-2" style={{ color: 'rgba(140,140,190,0.5)' }}>
                    ~{estimatedClips} קליפים יוצרו
                  </p>
                </div>

                {/* Toggle settings */}
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
                        <button
                          type="button"
                          onClick={() => setDraft(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                          className="relative flex-shrink-0 w-12 h-6 rounded-full transition-all"
                          style={{ background: draft[item.key] ? 'linear-gradient(135deg, #00D4FF, #B24BF3)' : 'rgba(255,255,255,0.1)' }}
                        >
                          <div className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all shadow-sm" style={{ left: draft[item.key] ? '26px' : '2px' }} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 5: Process + Download ── */}
          {currentStep === 5 && (
            <div className="animate-slide-up">
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#f0f0ff', fontFamily: 'Syne, sans-serif' }}>{t.create.step6.title}</h2>
              <p className="text-sm mb-7" style={{ color: 'rgba(160,160,210,0.6)' }}>{t.create.step6.description}</p>

              {isRendering && (
                <div className="p-6 rounded-xl mb-6 text-center" style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.2)' }}>
                  <Sparkles className="w-10 h-10 mx-auto mb-4 animate-pulse" style={{ color: '#00D4FF' }} />
                  <p className="text-base font-semibold mb-4" style={{ color: '#f0f0ff' }}>מעבד את הסיכום שלך...</p>
                  <div className="progress-neon mb-2">
                    <div className="progress-neon-fill" style={{ width: `${renderProgress}%` }} />
                  </div>
                  <div className="flex justify-between text-xs" style={{ color: 'rgba(160,160,210,0.5)' }}>
                    <span>מרנדר</span>
                    <span style={{ color: '#00D4FF', fontWeight: 700 }}>{Math.round(renderProgress)}%</span>
                  </div>
                  <div className="mt-4 space-y-2">
                    {[{ l: 'מרנדר וידאו', t: 30 }, { l: 'ממזג אודיו ווידאו', t: 60 }, { l: 'משלים עיבוד', t: 90 }].map((item, i) => (
                      <p key={i} className="text-sm flex items-center justify-center gap-2" style={{ color: renderProgress >= item.t ? '#00ff80' : 'rgba(150,150,200,0.4)' }}>
                        <CheckCircle className="w-4 h-4" /> {item.l}
                      </p>
                    ))}
                  </div>
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

                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = outputVideoUrl;
                      link.download = `${draft.movieTitle || 'recap'}.mp4`;
                      document.body.appendChild(link); link.click(); document.body.removeChild(link);
                    }}
                    className="btn-neon-cyan w-full py-4 text-base flex items-center justify-center gap-2"
                  >
                    <Video className="w-5 h-5" /> {t.create.step6.download}
                  </button>

                  {/* Social Share */}
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
                  {/* Summary */}
                  <div className="p-5 rounded-xl" style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.12)' }}>
                    <h3 className="text-sm font-semibold mb-4" style={{ color: '#00D4FF' }}>סיכום הגדרות</h3>
                    <div className="space-y-2 text-sm">
                      {[
                        { label: 'כותרת', val: draft.movieTitle || '—' },
                        { label: "ז'אנר", val: GENRES_HE[draft.genre] || draft.genre },
                        { label: 'אורך סיכום', val: `${String(draft.targetDurationHours).padStart(2,'0')}:${String(draft.targetDurationMinutes).padStart(2,'0')}:${String(draft.targetDurationSeconds).padStart(2,'0')}` },
                        { label: 'מרווח חיתוך', val: `${String(draft.cutEveryMinutes).padStart(2,'0')}:${String(draft.cutEverySeconds).padStart(2,'0')}` },
                        { label: 'קליפים משוערים', val: `~${estimatedClips}` },
                      ].map((item, i) => (
                        <div key={i} className="flex justify-between">
                          <span style={{ color: 'rgba(140,140,190,0.55)' }}>{item.label}:</span>
                          <span style={{ color: 'rgba(220,220,250,0.85)', fontWeight: 600 }}>{item.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Credits check */}
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

                  <button
                    onClick={handleCreate}
                    disabled={!user || !draft.movieTitle}
                    className="btn-neon-cyan w-full py-4 text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <Sparkles className="w-5 h-5" /> {t.create.step6.createRecap}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => currentStep > 1 && setCurrentStep(currentStep - 1)}
            disabled={currentStep === 1 || currentStep === 2}
            className="btn-ghost flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" /> {t.common.back}
          </button>

          {currentStep < totalSteps && currentStep !== 2 && (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={(currentStep === 4 && !draft.movieTitle) || uploading}
              className="btn-neon-cyan flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {t.common.continue} <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
