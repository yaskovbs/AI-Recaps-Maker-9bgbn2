import React, { useEffect, useRef, useState } from 'react';

interface AdSenseUnitProps {
  adSlot: string;
  adFormat?: 'auto' | 'horizontal' | 'vertical' | 'rectangle';
  style?: React.CSSProperties;
  className?: string;
  onAdLoaded?: () => void;
  onAdFailed?: (error: any) => void;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export default function AdSenseUnit({
  adSlot,
  adFormat = 'auto',
  style,
  className = '',
  onAdLoaded,
  onAdFailed,
}: AdSenseUnitProps) {
  const adRef = useRef<HTMLModElement>(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState<any>(null);

  useEffect(() => {
    if (!adRef.current) return;

    try {
      // Push ad to AdSense queue
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      
      setAdLoaded(true);
      onAdLoaded?.();
    } catch (error) {
      setAdError(error);
      onAdFailed?.(error);
    }
  }, []);

  return (
    <div className={`adsense-container ${className}`} style={style}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block', ...style }}
        data-ad-client="ca-pub-9953179201685717"
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
      ></ins>
      
      {adError && (
        <div className="text-xs text-red-400 mt-2 text-center">
          מודעה לא נטענה - נסה לרענן
        </div>
      )}
    </div>
  );
}

// Rewarded Ad Component (for credits)
interface RewardedAdProps {
  onRewardEarned: () => void;
  onAdClosed: () => void;
  onAdFailed?: (error: any) => void;
  rewardType: 'credit' | 'youtube_slot';
}

export function RewardedAd({ onRewardEarned, onAdClosed, onAdFailed, rewardType }: RewardedAdProps) {
  const [isWatching, setIsWatching] = useState(false);
  const [countdown, setCountdown] = useState(30); // 30 seconds ad simulation

  useEffect(() => {
    if (!isWatching) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAdComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isWatching]);

  const handleAdComplete = () => {
    setIsWatching(false);
    onRewardEarned();
    setTimeout(() => {
      onAdClosed();
    }, 1000);
  };

  const handleClose = () => {
    if (countdown > 0) {
      const confirmClose = window.confirm('האם אתה בטוח? לא תקבל את הקרדיט אם תסגור עכשיו.');
      if (!confirmClose) return;
    }
    setIsWatching(false);
    onAdClosed();
  };

  if (!isWatching) {
    return (
      <div className="text-center">
        <div className="mb-4">
          <div className="text-6xl mb-4">📺</div>
          <h3 className="text-xl font-semibold text-brass-200 mb-2">
            {rewardType === 'credit' ? 'קבל קרדיט חינם!' : 'פתח סלוט חדש!'}
          </h3>
          <p className="text-brass-400 mb-4">
            {rewardType === 'credit' 
              ? 'צפה במודעה קצרה וקבל 1 קרדיט חינם'
              : 'צפה ב-2 מודעות כדי לפתוח סלוט ערוץ נוסף'}
          </p>
        </div>
        
        <button
          onClick={() => setIsWatching(true)}
          className="steampunk-button w-full py-3 mb-2"
        >
          התחל צפייה במודעה
        </button>
        
        <button
          onClick={onAdClosed}
          className="steampunk-button-secondary w-full py-2"
        >
          ביטול
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Ad Placeholder (replace with real AdSense) */}
      <div className="aspect-video bg-gradient-to-br from-steam-900 to-steam-800 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
        <div className="text-center">
          <div className="text-4xl mb-2">🎬</div>
          <p className="text-brass-300 font-medium">מודעה מתנגנת...</p>
          <p className="text-brass-500 text-sm mt-2">
            נותרו {countdown} שניות
          </p>
        </div>
        
        {/* Real AdSense Unit */}
        <div className="absolute inset-0">
          <AdSenseUnit
            adSlot="YOUR_REWARDED_AD_SLOT_ID"
            adFormat="auto"
            onAdLoaded={() => {}}
            onAdFailed={(error) => {
              onAdFailed?.(error);
            }}
          />
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-steam-800 rounded-full h-2 mb-4 overflow-hidden">
        <div
          className="bg-gradient-to-r from-brass-500 to-copper-500 h-full transition-all duration-1000"
          style={{ width: `${((30 - countdown) / 30) * 100}%` }}
        ></div>
      </div>

      {/* Close button (only after 5 seconds) */}
      {countdown <= 25 && (
        <button
          onClick={handleClose}
          className="steampunk-button-secondary w-full py-2"
        >
          {countdown > 0 ? `סגור (ללא קרדיט)` : 'סגור'}
        </button>
      )}
    </div>
  );
}

// Interstitial Ad (for recap creation gate)
interface InterstitialAdProps {
  onAdClosed: () => void;
  onAdFailed?: (error: any) => void;
}

export function InterstitialAd({ onAdClosed, onAdFailed }: InterstitialAdProps) {
  const [countdown, setCountdown] = useState(5); // 5 seconds minimum

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="steampunk-card max-w-2xl w-full p-6">
        <div className="aspect-video bg-gradient-to-br from-steam-900 to-steam-800 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
          <div className="text-center">
            <div className="text-4xl mb-2">📺</div>
            <p className="text-brass-300 font-medium">מודעה</p>
            {countdown > 0 && (
              <p className="text-brass-500 text-sm mt-2">
                נותרו {countdown} שניות
              </p>
            )}
          </div>
          
          {/* Real AdSense Unit */}
          <div className="absolute inset-0">
            <AdSenseUnit
              adSlot="YOUR_INTERSTITIAL_AD_SLOT_ID"
              adFormat="auto"
              onAdLoaded={() => {}}
              onAdFailed={(error) => {
                onAdFailed?.(error);
              }}
            />
          </div>
        </div>

        {countdown === 0 && (
          <button
            onClick={onAdClosed}
            className="steampunk-button w-full py-3"
          >
            המשך ליצירת הסיכום
          </button>
        )}
      </div>
    </div>
  );
}
