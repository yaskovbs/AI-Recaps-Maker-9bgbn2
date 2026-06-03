import React from 'react';

// Legacy shim for GearAnimation - not used in new Neon AI Dark design
interface GearAnimationProps {
  size?: number | 'large' | 'medium' | 'small';
  speed?: number;
  direction?: 'clockwise' | 'counterclockwise';
  interactive?: boolean;
  className?: string;
}

export default function GearAnimation({ className = '' }: GearAnimationProps) {
  return null;
}
