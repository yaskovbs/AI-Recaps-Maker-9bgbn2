
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { useWallet } from '@/hooks/useWallet';
import { RewardedAd, InterstitialAd } from '@/components/ads/AdSenseUnit';
import AdSenseUnit from '@/components/ads/AdSenseUnit';
import { createJob } from '@/lib/recapService';
import { supabase } from '@/lib/supabase';
import { ChevronRight, ChevronLeft, Upload, FileText, Music, Video, Sparkles, AlertCircle, CheckCircle, Share2 } from 'lucide-react';
import { MessageCircle, Facebook, Twitter } from 'lucide-react';

type InputMode = 'text' | 'txt' | 'mp3';

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

export default function Create() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { wallet, consumeCredits, rewardCredits, loadWallet } = useWallet();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;
  const [showRewardedAd, setShowRewardedAd] = useState(false);
  const [showInterstitialAd, setShowInterstitialAd] = useState(false);
  const [autoProgress, setAutoProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderComplete, setRenderComplete] = useState(false);
  const [outputVideoUrl, setOutputVideoUrl] = useState<string>('');
  const [draft, setDraft] = useState<Draft>({
    inputMode: 'text',
    scriptText: '',
    txtAssetId: '',
    mp3AssetId: '',
    videoAssetId: '',
    youtubeUrl: '',
    movieTitle: '',
    description: '',
    genre: 'action',
    targetDurationHours: 0,
    targetDurationMinutes: 4,
    targetDurationSeconds: 0,
    cutEveryMinutes: 0,
    cutEverySeconds: 9,
    webSearchEnabled: false,
    youtubeLearningEnabled: false,
    continuousLearningEnabled: true,
    globalLearningOptIn: false,
  });

  const genres = [
    'action', 'adventure', 'animation', 'comedy', 'crime', 'documentary',
    'drama', 'fantasy', 'horror', 'mystery', 'romance', 'scifi',
    'thriller', 'western', 'war', 'musical', 'biography', 'history',
    'sport', 'family'
  ];

  // Calculate estimated clips
  const totalSeconds = draft.targetDurationHours * 3600 + draft.targetDurationMinutes * 60 + draft.targetDurationSeconds;
  const intervalSeconds = draft.cutEveryMinutes * 60 + draft.cutEverySeconds;
  const estimatedClips = intervalSeconds > 0 ? Math.floor(totalSeconds / intervalSeconds) : 0;
  const clipDuration = 1; // 1 second per clip

  // Auto-advance for processing steps (2 and 5)
  useEffect(() => {
    if (currentStep === 2 || currentStep === 5) {
      setAutoProgress(0);
      
      const duration = 4000; // 4 seconds
      const interval = 50; // Update every 50ms
      const increment = (100 / duration) * interval;
      
      const timer = setInterval(() => {
        setAutoProgress(prev => {
          const newProgress = prev + increment;
          if (newProgress >= 100) {
            clearInterval(timer);
            // Auto-advance to next step
            setTimeout(() => {
              setCurrentStep(currentStep + 1);
            }, 300);
            return 100;
          }
          return newProgress;
        });
      }, interval);
      
      return () => clearInterval(timer);
    }
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleFileUpload = async (type: 'txt' | 'mp3' | 'video') => {
    if (!user) {
      toast.error('יש להתחבר כדי להעלות קבצים');
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = type === 'txt' ? '.txt' : type === 'mp3' ? '.mp3,.wav' : 'video/*';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setUploading(true);
      try {
        // Upload to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${type}-${Date.now()}.${fileExt}`;
        const bucketName = 'recap-assets';

        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from(bucketName)
          .getPublicUrl(fileName);

        // Update draft with the URL
        if (type === 'txt') {
          setDraft({ ...draft, txtAssetId: publicUrl });
          // Read text content
          const text = await file.text();
          setDraft(prev => ({ ...prev, scriptText: text }));
        } else if (type === 'mp3') {
          setDraft({ ...draft, mp3AssetId: publicUrl });
        } else if (type === 'video') {
          setDraft({ ...draft, videoAssetId: publicUrl });
        }

        toast.success(`קובץ ${file.name} הועלה בהצלחה!`);
      } catch (error: any) {
        console.error('Upload error:', error);
        toast.error(`שגיאה בהעלאת הקובץ: ${error.message}`);
      } finally {
        setUploading(false);
      }
    };
    
    input.click();
  };

  const handleCreate = async () => {
    if (!user) {
      toast.error('יש להתחבר כדי ליצור סיכום');
      return;
    }

    // Check credits
    if (wallet.balance < 1) {
      setShowRewardedAd(true);
      return;
    }

    // Show interstitial ad before final creation
    setShowInterstitialAd(true);
  };

  const handleAdReward = async () => {
    // Record ad view
    if (user) {
      await supabase.from('ad_views').insert({
        user_id: user.id,
        ad_unit_id: 'ca-pub-9953179201685717',
        ad_type: 'rewarded',
        purpose: 'credit',
        reward_granted: true,
      });
    }

    // Grant credit
    rewardCredits(1, 'Watched rewarded ad for recap creation');
    setShowRewardedAd(false);
    
    // Reload wallet
    await loadWallet();
  };

  const handleInterstitialClose = async () => {
    setShowInterstitialAd(false);

    // Record ad view
    if (user) {
      await supabase.from('ad_views').insert({
        user_id: user.id,
        ad_unit_id: 'ca-pub-9953179201685717',
        ad_type: 'interstitial',
        purpose: 'recap_creation',
        reward_granted: false,
      });
    }

    // Proceed with creation
    await proceedWithCreation();
  };

  const proceedWithCreation = async () => {
    if (!user) return;

    const targetDuration =
      draft.targetDurationHours * 3600 +
      draft.targetDurationMinutes * 60 +
      draft.targetDurationSeconds;

    const cutEvery = draft.cutEveryMinutes * 60 + draft.cutEverySeconds;

    const job = createJob({
      userId: user.id,
      title: draft.movieTitle || 'סיכום ללא כותרת',
      source: {
        inputMode: draft.inputMode,
        scriptText: draft.scriptText,
        txtAssetId: draft.txtAssetId,
        mp3AssetId: draft.mp3AssetId,
        youtubeUrl: draft.youtubeUrl,
      },
      settings: {
        recapLengthSeconds: targetDuration,
        clipLengthSeconds: cutEvery,
        gapSeconds: 5,
      },
      advanced: {
        movieTitle: draft.movieTitle,
        description: draft.description,
        genre: draft.genre,
        webSearchEnabled: draft.webSearchEnabled,
        youtubeLearningEnabled: draft.youtubeLearningEnabled,
        continuousLearningEnabled: draft.continuousLearningEnabled,
        continuousLearningConsent: draft.continuousLearningEnabled,
        learningProfileEnabled: draft.continuousLearningEnabled,
        globalLearningOptIn: draft.globalLearningOptIn,
        globalLearningConsentedAt: draft.globalLearningOptIn ? new Date().toISOString() : undefined,
      },
      pipeline: ['script', 'audio', 'video', 'align', 'render'],
    });

    consumeCredits(1, `Created recap: ${job.title}`);
    localStorage.setItem('lastJobId', job.id);
    
    // Save to database
    await supabase.from('jobs').insert({
      id: job.id,
      user_id: user.id,
      title: job.title,
      status: job.status,
      youtube_url: draft.youtubeUrl,
      movie_title: draft.movieTitle,
      description: draft.description,
      genre: draft.genre,
      recap_length_seconds: targetDuration,
      metadata: {
        source: job.source,
        settings: job.settings,
        advanced: job.advanced,
      },
    });

    // Start rendering simulation
    setIsRendering(true);
    setRenderProgress(0);
    
    // Simulate rendering progress (6 seconds)
    const duration = 6000;
    const interval = 100;
    const increment = (100 / duration) * interval;
    
    const timer = setInterval(() => {
      setRenderProgress(prev => {
        const newProgress = prev + increment;
        if (newProgress >= 100) {
          clearInterval(timer);
          setIsRendering(false);
          setRenderComplete(true);
          // In real app, this would be the actual rendered video URL from backend
          setOutputVideoUrl(`https://example.com/recaps/${job.id}.mp4`);
          return 100;
        }
        return newProgress;
      });
    }, interval);
  };

  const handleDownloadVideo = () => {
    if (!outputVideoUrl) return;
    
    // In real app, trigger actual download
    // For now, show mock success
    const link = document.createElement('a');
    link.href = outputVideoUrl;
    link.download = `${draft.movieTitle || 'recap'}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`הורדת הסיכום התחילה: ${draft.movieTitle}.mp4`);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold text-brass-200 mb-2">
            {t.create.title}
          </h1>
          <p className="text-brass-300">6 שלבים פשוטים ליצירת סיכום AI מושלם</p>
        </div>

        {/* Progress Tracker */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4, 5, 6].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm sm:text-base transition-all ${
                    step === currentStep
                      ? 'bg-gradient-to-br from-brass-500 to-copper-600 text-white scale-110 glow-brass'
                      : step < currentStep
                      ? 'bg-brass-600/50 text-brass-200'
                      : 'bg-steam-800 text-brass-400'
                  }`}
                >
                  {step < currentStep ? <CheckCircle className="w-5 h-5" /> : step}
                </div>
                {step < 6 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition-all ${
                      step < currentStep ? 'bg-brass-600' : 'bg-steam-800'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="hidden sm:flex justify-between mt-2 text-xs text-brass-300">
            <span>{t.create.wizard.step1}</span>
            <span>{t.create.wizard.step2}</span>
            <span>{t.create.wizard.step3}</span>
            <span>{t.create.wizard.step4}</span>
            <span>{t.create.wizard.step5}</span>
            <span>{t.create.wizard.step6}</span>
          </div>
          <p className="sm:hidden text-center text-xs text-brass-300 mt-2">
            שלב {currentStep} מתוך {totalSteps}
          </p>
        </div>

        {/* Step Content */}
        <div className="steampunk-card p-4 sm:p-8 mb-6">
          {/* Step 1: Basic Input */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-2xl font-serif font-semibold text-brass-200 mb-4">
                {t.create.step1.title}
              </h2>
              <p className="text-brass-300 mb-6">{t.create.step1.description}</p>

              <div className="space-y-6">
                <div>
                  <label className="block text-brass-200 font-medium mb-2">
                    {t.create.step1.inputMode}
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {(['text', 'txt', 'mp3'] as InputMode[]).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setDraft({ ...draft, inputMode: mode })}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          draft.inputMode === mode
                            ? 'border-brass-500 bg-brass-900/50'
                            : 'border-brass-700/30 hover:border-brass-600/50'
                        }`}
                      >
                        {mode === 'text' && <FileText className="w-6 h-6 text-brass-400 mx-auto mb-2" />}
                        {mode === 'txt' && <Upload className="w-6 h-6 text-brass-400 mx-auto mb-2" />}
                        {mode === 'mp3' && <Music className="w-6 h-6 text-brass-400 mx-auto mb-2" />}
                        <span className="text-sm text-brass-200">
                          {mode === 'text' && t.create.step1.text}
                          {mode === 'txt' && t.create.step1.txtFile}
                          {mode === 'mp3' && t.create.step1.mp3File}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {draft.inputMode === 'text' && (
                  <div>
                    <label className="block text-brass-200 font-medium mb-2">תסריט</label>
                    <textarea
                      value={draft.scriptText}
                      onChange={(e) => setDraft({ ...draft, scriptText: e.target.value })}
                      placeholder={t.create.step1.scriptPlaceholder}
                      className="w-full h-48 bg-steam-900/50 border border-brass-600/30 rounded-lg p-4 text-brass-200 focus:outline-none focus:ring-2 focus:ring-brass-500"
                    />
                  </div>
                )}

                {draft.inputMode === 'txt' && (
                  <div>
                    <button
                      onClick={() => handleFileUpload('txt')}
                      className="steampunk-button w-full flex items-center justify-center gap-2"
                    >
                      <Upload className="w-5 h-5" />
                      {t.create.step1.uploadTxt}
                    </button>
                    {draft.txtAssetId && (
                      <p className="text-green-400 text-sm mt-2 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        קובץ הועלה: {draft.txtAssetId}
                      </p>
                    )}
                  </div>
                )}

                {draft.inputMode === 'mp3' && (
                  <div>
                    <button
                      onClick={() => handleFileUpload('mp3')}
                      className="steampunk-button w-full flex items-center justify-center gap-2"
                    >
                      <Upload className="w-5 h-5" />
                      {t.create.step1.uploadMp3}
                    </button>
                    {draft.mp3AssetId && (
                      <p className="text-green-400 text-sm mt-2 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        קובץ הועלה: {draft.mp3AssetId}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Audio Processing (AUTO-ADVANCE) */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-2xl font-serif font-semibold text-brass-200 mb-4">
                {t.create.step2.title}
              </h2>
              <p className="text-brass-300 mb-6">{t.create.step2.description}</p>

              <div className="space-y-6">
                <div className="bg-steam-900/30 border border-brass-600/30 rounded-lg p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brass-500 to-copper-600 flex items-center justify-center">
                      <Music className="w-6 h-6 text-white animate-pulse" />
                    </div>
                    <div className="flex-1">
                      <p className="text-brass-200 font-medium">{t.create.step2.processing}</p>
                      <div className="w-full bg-steam-800 rounded-full h-2 mt-2 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-brass-500 to-copper-500 h-full transition-all duration-100"
                          style={{ width: `${autoProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-brass-400 mt-1">{Math.round(autoProgress)}%</p>
                    </div>
                  </div>
                  <ul className="space-y-2 text-sm text-brass-400">
                    <li className="flex items-center gap-2">
                      <CheckCircle className={`w-4 h-4 ${autoProgress > 50 ? 'text-green-400' : 'text-brass-500'}`} />
                      {t.create.step2.extracting}
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className={`w-4 h-4 ${autoProgress > 80 ? 'text-green-400' : 'text-brass-500'}`} />
                      {t.create.step2.analyzing}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Advanced Settings */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-2xl font-serif font-semibold text-brass-200 mb-4">
                {t.create.step5.title}
              </h2>
              <p className="text-brass-300 mb-6">{t.create.step5.description}</p>

              <div className="space-y-6">
                {/* Movie Title */}
                <div>
                  <label className="block text-brass-200 font-medium mb-2">
                    {t.create.step3.movieTitle} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={draft.movieTitle}
                    onChange={(e) => setDraft({ ...draft, movieTitle: e.target.value })}
                    placeholder={t.create.step3.movieTitlePlaceholder}
                    className="w-full bg-steam-900/50 border border-brass-600/30 rounded-lg p-4 text-brass-200 focus:outline-none focus:ring-2 focus:ring-brass-500"
                  />
                </div>

                {/* Genre */}
                <div>
                  <label className="block text-brass-200 font-medium mb-2">
                    {t.create.step3.genre}
                  </label>
                  <select
                    value={draft.genre}
                    onChange={(e) => setDraft({ ...draft, genre: e.target.value })}
                    className="w-full bg-steam-900/50 border border-brass-600/30 rounded-lg p-4 text-brass-200 focus:outline-none focus:ring-2 focus:ring-brass-500"
                  >
                    {genres.map(genre => (
                      <option key={genre} value={genre}>
                        {t.create.step3.genres[genre as keyof typeof t.create.step3.genres]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-brass-200 font-medium mb-2">
                    {t.create.step3.descriptionLabel}
                  </label>
                  <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-3 mb-2">
                    <p className="text-sm text-blue-300 flex items-start gap-2">
                      <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{t.create.step3.descriptionTip}</span>
                    </p>
                  </div>
                  <textarea
                    value={draft.description}
                    onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                    placeholder={t.create.step3.descriptionPlaceholder}
                    rows={4}
                    className="w-full bg-steam-900/50 border border-brass-600/30 rounded-lg p-4 text-brass-200 focus:outline-none focus:ring-2 focus:ring-brass-500"
                  />
                </div>

                {/* Target Duration */}
                <div>
                  <label className="block text-brass-200 font-medium mb-2">
                    {t.create.step3.recapLength}
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-brass-400 mb-1 block">{t.create.step5.hours}</label>
                      <input
                        type="number"
                        min="0"
                        max="3"
                        value={draft.targetDurationHours}
                        onChange={(e) => setDraft({ ...draft, targetDurationHours: Math.min(3, parseInt(e.target.value) || 0) })}
                        className="w-full bg-steam-900/50 border border-brass-600/30 rounded-lg p-3 text-brass-200 text-center text-xl focus:outline-none focus:ring-2 focus:ring-brass-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-brass-400 mb-1 block">{t.create.step5.minutes}</label>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={draft.targetDurationMinutes}
                        onChange={(e) => setDraft({ ...draft, targetDurationMinutes: parseInt(e.target.value) || 0 })}
                        className="w-full bg-steam-900/50 border border-brass-600/30 rounded-lg p-3 text-brass-200 text-center text-xl focus:outline-none focus:ring-2 focus:ring-brass-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-brass-400 mb-1 block">{t.create.step5.seconds}</label>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={draft.targetDurationSeconds}
                        onChange={(e) => setDraft({ ...draft, targetDurationSeconds: parseInt(e.target.value) || 0 })}
                        className="w-full bg-steam-900/50 border border-brass-600/30 rounded-lg p-3 text-brass-200 text-center text-xl focus:outline-none focus:ring-2 focus:ring-brass-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Cut Every */}
                <div>
                  <label className="block text-brass-200 font-medium mb-2">
                    {t.create.step3.cutEvery}
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-brass-400 mb-1 block">{t.create.step5.minutes}</label>
                      <input
                        type="number"
                        min="0"
                        value={draft.cutEveryMinutes}
                        onChange={(e) => setDraft({ ...draft, cutEveryMinutes: parseInt(e.target.value) || 0 })}
                        className="w-full bg-steam-900/50 border border-brass-600/30 rounded-lg p-3 text-brass-200 text-center text-xl focus:outline-none focus:ring-2 focus:ring-brass-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-brass-400 mb-1 block">{t.create.step5.seconds}</label>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={draft.cutEverySeconds}
                        onChange={(e) => setDraft({ ...draft, cutEverySeconds: parseInt(e.target.value) || 0 })}
                        className="w-full bg-steam-900/50 border border-brass-600/30 rounded-lg p-3 text-brass-200 text-center text-xl focus:outline-none focus:ring-2 focus:ring-brass-500"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-brass-400 mt-2">
                    {t.create.step3.cutEveryInfo} {draft.cutEveryMinutes}:{String(draft.cutEverySeconds).padStart(2, '0')} {t.create.step3.cutEveryInfoEnd}
                  </p>
                </div>

                {/* Settings Summary */}
                <div className="bg-brass-900/30 border border-brass-600/30 rounded-lg p-6">
                  <h3 className="text-brass-200 font-semibold mb-4">{t.create.step3.settingsSummary}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-brass-400">{t.create.step3.recapLength}:</span>
                      <span className="text-brass-200 font-mono">
                        {String(draft.targetDurationHours).padStart(2, '0')}:
                        {String(draft.targetDurationMinutes).padStart(2, '0')}:
                        {String(draft.targetDurationSeconds).padStart(2, '0')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-brass-400">{t.create.step3.cutInterval}:</span>
                      <span className="text-brass-200 font-mono">
                        {String(draft.cutEveryMinutes).padStart(2, '0')}:
                        {String(draft.cutEverySeconds).padStart(2, '0')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-brass-400">{t.create.step3.estimatedClips}:</span>
                      <span className="text-brass-200">~{estimatedClips} {t.create.step3.clips}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-brass-400">{t.create.step3.clipDuration}:</span>
                      <span className="text-brass-200">{clipDuration} {t.create.step5.seconds}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Upload Video */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-2xl font-serif font-semibold text-brass-200 mb-4">
                {t.create.step5.title}
              </h2>
              <p className="text-brass-300 mb-6">{t.create.step5.description}</p>

              <div className="space-y-6">
                <div>
                  <label className="block text-brass-200 font-medium mb-2">
                    {t.create.step4.uploadVideo}
                  </label>
                  <button
                    onClick={() => handleFileUpload('video')}
                    disabled={uploading}
                    className="steampunk-button w-full py-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        {t.create.step4.uploading}
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        {t.create.step4.uploadVideo}
                      </>
                    )}
                  </button>
                  {draft.videoAssetId && (
                    <p className="text-green-400 text-sm mt-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      {t.create.step4.uploadComplete}
                    </p>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-brass-600/30"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-steam-900 text-brass-400">או</span>
                  </div>
                </div>

                <div>
                  <label className="block text-brass-200 font-medium mb-2">
                    {t.create.step4.youtubeUrl}
                  </label>
                  <input
                    type="url"
                    value={draft.youtubeUrl}
                    onChange={(e) => setDraft({ ...draft, youtubeUrl: e.target.value })}
                    placeholder={t.create.step4.urlPlaceholder}
                    className="w-full bg-steam-900/50 border border-brass-600/30 rounded-lg p-4 text-brass-200 focus:outline-none focus:ring-2 focus:ring-brass-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Video Analysis (AUTO-ADVANCE) */}
          {currentStep === 5 && (
            <div>
              <h2 className="text-2xl font-serif font-semibold text-brass-200 mb-4">
                {t.create.step5.title}
              </h2>
              <p className="text-brass-300 mb-6">{t.create.step5.description}</p>

              <div className="space-y-6">
                <div className="bg-steam-900/30 border border-brass-600/30 rounded-lg p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brass-500 to-copper-600 flex items-center justify-center">
                      <Video className="w-6 h-6 text-white animate-pulse" />
                    </div>
                    <div className="flex-1">
                      <p className="text-brass-200 font-medium">{t.create.step5.analyzing}</p>
                      <div className="w-full bg-steam-800 rounded-full h-2 mt-2 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-brass-500 to-copper-500 h-full transition-all duration-100"
                          style={{ width: `${autoProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-brass-400 mt-1">{Math.round(autoProgress)}%</p>
                    </div>
                  </div>
                  <ul className="space-y-2 text-sm text-brass-400">
                    <li className="flex items-center gap-2">
                      <CheckCircle className={`w-4 h-4 ${autoProgress > 50 ? 'text-green-400' : 'text-brass-500'}`} />
                      {t.create.step5.metadata}
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className={`w-4 h-4 ${autoProgress > 80 ? 'text-green-400' : 'text-brass-500'}`} />
                      {t.create.step5.extracting}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Final Render */}
          {currentStep === 6 && (
            <div>
              <h2 className="text-2xl font-serif font-semibold text-brass-200 mb-4">
                {t.create.step6.title}
              </h2>
              <p className="text-brass-300 mb-6">{t.create.step6.description}</p>

              <div className="space-y-6">
                {/* Rendering Progress */}
                {isRendering && (
                  <div className="bg-steam-900/30 border border-brass-600/30 rounded-lg p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brass-500 to-copper-600 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-white animate-pulse" />
                      </div>
                      <div className="flex-1">
                        <p className="text-brass-200 font-medium">{t.create.step6.rendering}</p>
                        <div className="w-full bg-steam-800 rounded-full h-2 mt-2 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-brass-500 to-copper-500 h-full transition-all duration-100"
                            style={{ width: `${renderProgress}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-brass-400 mt-1">{Math.round(renderProgress)}%</p>
                      </div>
                    </div>
                    <ul className="space-y-2 text-sm text-brass-400">
                      <li className="flex items-center gap-2">
                        <CheckCircle className={`w-4 h-4 ${renderProgress > 30 ? 'text-green-400' : 'text-brass-500'}`} />
                        {t.create.step6.rendering}
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className={`w-4 h-4 ${renderProgress > 60 ? 'text-green-400' : 'text-brass-500'}`} />
                        {t.create.step6.merging}
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className={`w-4 h-4 ${renderProgress > 90 ? 'text-green-400' : 'text-brass-500'}`} />
                        {t.create.step6.finalizing}
                      </li>
                    </ul>
                  </div>
                )}

                {/* Render Complete - Video Player & Actions */}
                {renderComplete && (
                  <div className="space-y-6">
                    {/* Success Message */}
                    <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-green-200 font-bold text-xl">🎉 הסיכום הושלם בהצלחה!</p>
                          <p className="text-green-300 text-sm mt-1">צפה, הורד או שתף את הסיכום שלך</p>
                        </div>
                      </div>
                    </div>

                    {/* Video Player */}
                    <div className="bg-steam-900/30 border border-brass-600/30 rounded-lg p-4">
                      <h3 className="text-brass-200 font-semibold mb-3">{t.create.step6.preview}</h3>
                      <video
                        controls
                        className="w-full rounded-lg bg-black"
                        poster="https://via.placeholder.com/800x450/1a1a1a/ffffff?text=Recap+Preview"
                      >
                        <source src={outputVideoUrl} type="video/mp4" />
                        {t.create.step6.videoNotSupported}
                      </video>
                    </div>

                    {/* Download Button */}
                    <button
                      onClick={handleDownloadVideo}
                      className="w-full steampunk-button py-4 text-lg flex items-center justify-center gap-2"
                    >
                      <Video className="w-5 h-5" />
                      {t.create.step6.download}
                    </button>

                    {/* Social Share Buttons */}
                    <div className="bg-brass-900/30 border border-brass-600/30 rounded-lg p-6">
                      <h3 className="text-brass-200 font-semibold mb-4 flex items-center gap-2">
                        <Share2 className="w-5 h-5" />
                        {t.create.step6.shareTitle}
                      </h3>
                      <div className="grid grid-cols-3 gap-4">
                        {/* WhatsApp */}
                        <button
                          onClick={() => {
                            const text = encodeURIComponent(`🎬 ${draft.movieTitle}\n${draft.description}\n\nצפו בסיכום המלא:`);
                            const url = encodeURIComponent(window.location.origin + '/gallery');
                            window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
                          }}
                          className="flex flex-col items-center gap-2 p-4 bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/30 rounded-lg transition-all"
                        >
                          <MessageCircle className="w-6 h-6 text-[#25D366]" />
                          <span className="text-sm text-brass-200">WhatsApp</span>
                        </button>

                        {/* Facebook */}
                        <button
                          onClick={() => {
                            const url = encodeURIComponent(window.location.origin + '/gallery');
                            window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
                          }}
                          className="flex flex-col items-center gap-2 p-4 bg-[#1877F2]/20 hover:bg-[#1877F2]/30 border border-[#1877F2]/30 rounded-lg transition-all"
                        >
                          <Facebook className="w-6 h-6 text-[#1877F2]" />
                          <span className="text-sm text-brass-200">Facebook</span>
                        </button>

                        {/* Twitter/X */}
                        <button
                          onClick={() => {
                            const text = encodeURIComponent(`🎬 ${draft.movieTitle}\n${draft.description}`);
                            const url = encodeURIComponent(window.location.origin + '/gallery');
                            window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
                          }}
                          className="flex flex-col items-center gap-2 p-4 bg-black/50 hover:bg-black/70 border border-white/20 rounded-lg transition-all"
                        >
                          <Twitter className="w-6 h-6 text-white" />
                          <span className="text-sm text-brass-200">Twitter</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {!isRendering && !renderComplete && (
                  <>
                  {/* Settings Summary */}
                  <div className="bg-brass-900/30 border border-brass-600/30 rounded-lg p-6">
                    <h3 className="text-brass-200 font-semibold mb-4">{t.create.step3.settingsSummary}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-brass-400">{t.create.step3.movieTitle}:</span>
                        <span className="text-brass-200">{draft.movieTitle || t.myRecaps.untitled}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-brass-400">{t.create.step3.genre}:</span>
                        <span className="text-brass-200">{t.create.step3.genres[draft.genre as keyof typeof t.create.step3.genres]}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-brass-400">{t.create.step3.recapLength}:</span>
                        <span className="text-brass-200 font-mono">
                          {String(draft.targetDurationHours).padStart(2, '0')}:
                          {String(draft.targetDurationMinutes).padStart(2, '0')}:
                          {String(draft.targetDurationSeconds).padStart(2, '0')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-brass-400">{t.create.step3.cutInterval}:</span>
                        <span className="text-brass-200 font-mono">
                          {String(draft.cutEveryMinutes).padStart(2, '0')}:
                          {String(draft.cutEverySeconds).padStart(2, '0')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-brass-400">{t.create.step3.estimatedClips}:</span>
                        <span className="text-brass-200">~{estimatedClips} {t.create.step3.clips}</span>
                      </div>
                    </div>
                  </div>

                  {/* Credits Check */}
                  <div className="bg-brass-900/30 border border-brass-600/30 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-brass-200 font-medium">{t.create.step6.credits}</span>
                      <span className="text-2xl font-bold text-brass-100">{wallet.balance}</span>
                    </div>
                    {wallet.balance < 1 && (
                      <div className="flex items-start gap-2 text-copper-300 text-sm mb-4">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <span>{t.create.step6.needCredits}</span>
                      </div>
                    )}
                  </div>

                  {/* Create Button */}
                  <button
                    onClick={handleCreate}
                    disabled={!user || !draft.movieTitle}
                    className="steampunk-button w-full py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="w-5 h-5" />
                    {t.create.step6.createRecap}
                  </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* AdSense Unit - Step 4 */}
        {currentStep === 4 && (
          <div className="mb-6">
            <AdSenseUnit
              adSlot="5544332211"
              adFormat="auto"
              className="max-w-full"
            />
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={handlePrev}
            disabled={currentStep === 1 || currentStep === 2 || currentStep === 5}
            className="px-6 py-3 bg-steam-800 hover:bg-steam-700 text-brass-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            <ChevronRight className="w-5 h-5" />
            {t.common.back}
          </button>

          {currentStep < 6 && currentStep !== 2 && currentStep !== 5 && (
            <button
              onClick={handleNext}
              disabled={(currentStep === 3 && !draft.movieTitle) || uploading}
              className="steampunk-button px-8 py-3 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t.common.continue}
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Rewarded Ad Dialog */}
      {showRewardedAd && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="steampunk-card max-w-xl w-full p-6">
            <h3 className="text-xl font-semibold text-brass-200 mb-4">
              נדרש קרדיט אחד
            </h3>
            <RewardedAd
              onRewardEarned={handleAdReward}
              onAdClosed={() => setShowRewardedAd(false)}
              rewardType="credit"
            />
          </div>
        </div>
      )}

      {/* Interstitial Ad Dialog */}
      {showInterstitialAd && (
        <InterstitialAd
          onAdClosed={handleInterstitialClose}
        />
      )}
    </div>
  );
}
