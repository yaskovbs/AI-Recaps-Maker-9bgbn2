import React from 'react';

// Legacy shim for ParallaxSection
interface ParallaxSectionProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  withGears?: boolean;
}

export default function ParallaxSection({ children, className = '', style }: ParallaxSectionProps) {
  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}
