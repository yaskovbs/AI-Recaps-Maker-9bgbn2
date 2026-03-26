import React, { useEffect, useRef } from 'react';

function SidebarAd({ slot, format, fullWidthResponsive }: {
  slot: string;
  format: string;
  fullWidthResponsive?: boolean;
}) {
  const adRef = useRef<boolean>(false);

  useEffect(() => {
    if (adRef.current) return;
    adRef.current = true;
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense initialization may fail if blocked
    }
  }, []);

  const adProps: Record<string, string> = {
    'data-ad-client': 'ca-pub-9953179201685717',
    'data-ad-slot': slot,
    'data-ad-format': format,
  };

  if (fullWidthResponsive) {
    adProps['data-full-width-responsive'] = 'true';
  }

  return (
    <ins
      className="adsbygoogle"
      style={{ display: 'block', width: '160px', minHeight: '600px' }}
      {...adProps}
    />
  );
}

export default function SidebarAds() {
  return (
    <>
      {/* Left sidebar ad - Ad Unit 1 (slot 1638612465) */}
      <div
        className="hidden 2xl:block fixed top-1/2 left-0 z-40"
        style={{ transform: 'translateY(-50%)' }}
      >
        <SidebarAd
          slot="1638612465"
          format="auto"
          fullWidthResponsive={true}
        />
      </div>

      {/* Right sidebar ad - Ad Unit 2 (slot 3929166632) */}
      <div
        className="hidden 2xl:block fixed top-1/2 right-0 z-40"
        style={{ transform: 'translateY(-50%)' }}
      >
        <SidebarAd
          slot="3929166632"
          format="autorelaxed"
        />
      </div>
    </>
  );
}
