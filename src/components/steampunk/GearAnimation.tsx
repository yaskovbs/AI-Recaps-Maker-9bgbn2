import React, { useEffect, useRef } from 'react';

interface GearAnimationProps {
  size?: number;
  speed?: number;
  direction?: 'clockwise' | 'counterclockwise';
  interactive?: boolean;
  className?: string;
}

export default function GearAnimation({
  size = 100,
  speed = 20,
  direction = 'clockwise',
  interactive = false,
  className = '',
}: GearAnimationProps) {
  const gearRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef(0);

  useEffect(() => {
    if (!interactive || !gearRef.current) return;

    const handleScroll = () => {
      if (!gearRef.current) return;
      
      const scrollY = window.scrollY;
      const elementTop = gearRef.current.offsetTop;
      const elementVisible = elementTop - window.innerHeight;
      
      if (scrollY > elementVisible) {
        const progress = (scrollY - elementVisible) / window.innerHeight;
        rotationRef.current = progress * 360;
        
        const rotation = direction === 'clockwise' ? rotationRef.current : -rotationRef.current;
        gearRef.current.style.transform = `rotate(${rotation}deg)`;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [interactive, direction]);

  const animationDuration = `${speed}s`;

  return (
    <div
      ref={gearRef}
      className={`gear-container ${className}`}
      style={{
        width: size,
        height: size,
        animation: interactive ? 'none' : `gear-spin-${direction} ${animationDuration} linear infinite`,
      }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-[0_0_10px_rgba(212,124,71,0.5)]"
      >
        {/* Outer gear teeth */}
        <g className="fill-brass-600 stroke-brass-400 stroke-1">
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            const x1 = 50 + 40 * Math.cos(angle);
            const y1 = 50 + 40 * Math.sin(angle);
            const x2 = 50 + 48 * Math.cos(angle);
            const y2 = 50 + 48 * Math.sin(angle);
            
            return (
              <rect
                key={i}
                x={x1 - 3}
                y={y1 - 6}
                width="6"
                height="12"
                transform={`rotate(${i * 30} ${x1} ${y1})`}
              />
            );
          })}
        </g>
        
        {/* Main gear body */}
        <circle
          cx="50"
          cy="50"
          r="38"
          className="fill-brass-700 stroke-brass-500 stroke-2"
        />
        
        {/* Inner circle */}
        <circle
          cx="50"
          cy="50"
          r="28"
          className="fill-copper-800 stroke-copper-600 stroke-1"
        />
        
        {/* Center hole */}
        <circle
          cx="50"
          cy="50"
          r="10"
          className="fill-steam-900 stroke-brass-400 stroke-2"
        />
        
        {/* Decorative spokes */}
        {Array.from({ length: 6 }).map((_, i) => {
          const angle = (i * 60 * Math.PI) / 180;
          const x = 50 + 20 * Math.cos(angle);
          const y = 50 + 20 * Math.sin(angle);
          
          return (
            <line
              key={i}
              x1="50"
              y1="50"
              x2={x}
              y2={y}
              className="stroke-brass-500 stroke-2"
            />
          );
        })}
      </svg>
    </div>
  );
}
