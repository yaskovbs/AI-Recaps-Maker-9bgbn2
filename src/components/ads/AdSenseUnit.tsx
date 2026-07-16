import React, { useEffect, useRef } from 'react';

interface AdSenseUnitProps {
  adSlot: string;
  adFormat?: 'auto' | 'horizontal' | 'vertical' | 'rectangle';
  style?: React.CSSProperties;
  className?: string;
  onAdLoaded?: () => void;
  onAdFailed?: (error: unknown) => void;
}

declare global { interface Window { adsbygoogle: unknown[]; } }

/** Standard non-rewarded AdSense inventory. It never changes credits or unlocks features. */
export default function AdSenseUnit({ adSlot, adFormat='auto', style, className='', onAdLoaded, onAdFailed }:AdSenseUnitProps){
 const ref=useRef<HTMLModElement>(null);
 useEffect(()=>{if(!ref.current||!adSlot||adSlot.startsWith('YOUR_'))return;try{(window.adsbygoogle=window.adsbygoogle||[]).push({});onAdLoaded?.();}catch(error){onAdFailed?.(error);}},[adSlot,onAdLoaded,onAdFailed]);
 return <div className={`adsense-container ${className}`} style={style}><ins ref={ref} className="adsbygoogle" style={{display:'block',...style}} data-ad-client="ca-pub-9953179201685717" data-ad-slot={adSlot} data-ad-format={adFormat} data-full-width-responsive="true"/></div>;
}
