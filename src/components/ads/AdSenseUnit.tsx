import React, { useEffect, useRef, useState } from 'react';

interface AdSenseUnitProps {
  adSlot: string;
  adFormat?: 'auto' | 'horizontal' | 'vertical' | 'rectangle';
  style?: React.CSSProperties;
  className?: string;
  onAdLoaded?: () => void;
  onAdFailed?: (error: unknown) => void;
}

declare global {
  interface Window {
    adsbygoogle: unknown[];
    googletag?: any;
  }
}

export default function AdSenseUnit({ adSlot, adFormat = 'auto', style, className = '', onAdLoaded, onAdFailed }: AdSenseUnitProps) {
  const adRef = useRef<HTMLModElement>(null);
  useEffect(() => {
    if (!adRef.current || !adSlot || adSlot.startsWith('YOUR_')) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      onAdLoaded?.();
    } catch (error) { onAdFailed?.(error); }
  }, [adSlot, onAdLoaded, onAdFailed]);
  return (
    <div className={`adsense-container ${className}`} style={style}>
      <ins ref={adRef} className="adsbygoogle" style={{ display: 'block', ...style }} data-ad-client="ca-pub-9953179201685717"
        data-ad-slot={adSlot} data-ad-format={adFormat} data-full-width-responsive="true" />
    </div>
  );
}

interface RewardedAdProps {
  onRewardEarned: (eventId: string) => void | Promise<void | boolean>;
  onAdClosed: () => void;
  onAdFailed?: (error: unknown) => void;
  rewardType: 'credit' | 'youtube_slot';
}

const GPT_SRC = 'https://securepubads.g.doubleclick.net/tag/js/gpt.js';

export function RewardedAd({ onRewardEarned, onAdClosed, onAdFailed, rewardType }: RewardedAdProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'watching' | 'granted' | 'unavailable'>('idle');
  const slotRef = useRef<any>(null);
  const adUnitPath = import.meta.env.VITE_GOOGLE_REWARDED_AD_UNIT_PATH as string | undefined;

  useEffect(() => () => {
    if (slotRef.current && window.googletag?.destroySlots) window.googletag.destroySlots([slotRef.current]);
  }, []);

  const start = () => {
    if (!adUnitPath) {
      setStatus('unavailable');
      onAdFailed?.(new Error('Rewarded ad unit is not configured'));
      return;
    }
    setStatus('loading');
    const initialize = () => {
      window.googletag = window.googletag || { cmd: [] };
      window.googletag.cmd.push(() => {
        const gpt = window.googletag;
        const slot = gpt.defineOutOfPageSlot(adUnitPath, gpt.enums.OutOfPageFormat.REWARDED);
        if (!slot) { setStatus('unavailable'); onAdFailed?.(new Error('Rewarded ads are unavailable on this device')); return; }
        slotRef.current = slot;
        slot.addService(gpt.pubads());
        gpt.pubads().addEventListener('rewardedSlotReady', (event: any) => {
          if (event.slot !== slot) return;
          setStatus('ready');
          event.makeRewardedVisible();
          setStatus('watching');
        });
        gpt.pubads().addEventListener('rewardedSlotGranted', async (event: any) => {
          if (event.slot !== slot) return;
          setStatus('granted');
          await onRewardEarned(crypto.randomUUID());
        });
        gpt.pubads().addEventListener('rewardedSlotClosed', (event: any) => {
          if (event.slot !== slot) return;
          gpt.destroySlots([slot]);
          slotRef.current = null;
          onAdClosed();
        });
        gpt.pubads().addEventListener('slotRenderEnded', (event: any) => {
          if (event.slot === slot && event.isEmpty) { setStatus('unavailable'); onAdFailed?.(new Error('No rewarded ad inventory is available')); }
        });
        gpt.enableServices();
        gpt.display(slot);
      });
    };
    if (window.googletag) initialize();
    else {
      const existing = document.querySelector<HTMLScriptElement>(`script[src="${GPT_SRC}"]`);
      if (existing) existing.addEventListener('load', initialize, { once: true });
      else {
        const script = document.createElement('script');
        script.async = true; script.src = GPT_SRC; script.onload = initialize;
        script.onerror = () => { setStatus('unavailable'); onAdFailed?.(new Error('Google ad library failed to load')); };
        document.head.appendChild(script);
      }
    }
  };

  return (
    <div className="text-center space-y-4">
      <h3 className="text-xl font-semibold text-brass-200">{rewardType === 'credit' ? 'Earn 1 credit' : 'Unlock a channel slot'}</h3>
      <p className="text-brass-400">The reward is granted only after Google confirms the rewarded ad was viewed.</p>
      {status === 'idle' && <button onClick={start} className="steampunk-button w-full py-3">Watch rewarded ad</button>}
      {['loading', 'ready', 'watching'].includes(status) && <p className="text-brass-300">Loading rewarded ad…</p>}
      {status === 'granted' && <p className="text-green-300">Reward confirmed.</p>}
      {status === 'unavailable' && <p className="text-red-300">No rewarded ad is available. Try again later.</p>}
      <button onClick={onAdClosed} className="steampunk-button-secondary w-full py-2">Close</button>
    </div>
  );
}

interface InterstitialAdProps { onAdClosed: () => void; onAdFailed?: (error: unknown) => void; }
export function InterstitialAd({ onAdClosed }: InterstitialAdProps) {
  return <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"><div className="steampunk-card p-6">
    <p className="text-brass-200 mb-4">Advertisement</p><button onClick={onAdClosed} className="steampunk-button">Continue</button>
  </div></div>;
}
