import React, { useEffect, useState } from 'react';

interface SteamParticle {
  id: number;
  x: number;
  delay: number;
  duration: number;
  size: number;
}

interface SteamEffectProps {
  count?: number;
  className?: string;
}

export default function SteamEffect({ count = 5, className = '' }: SteamEffectProps) {
  const [particles, setParticles] = useState<SteamParticle[]>([]);

  useEffect(() => {
    const newParticles: SteamParticle[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 2,
      size: 20 + Math.random() * 40,
    }));
    
    setParticles(newParticles);
  }, [count]);

  return (
    <div className={`steam-effect-container relative ${className}`}>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="steam-particle absolute bottom-0"
          style={{
            left: `${particle.x}%`,
            width: particle.size,
            height: particle.size,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
          }}
        >
          <svg viewBox="0 0 50 50" className="w-full h-full">
            <defs>
              <radialGradient id={`steam-gradient-${particle.id}`}>
                <stop offset="0%" stopColor="rgba(255, 255, 255, 0.3)" />
                <stop offset="50%" stopColor="rgba(200, 220, 255, 0.2)" />
                <stop offset="100%" stopColor="rgba(150, 180, 200, 0)" />
              </radialGradient>
            </defs>
            <circle
              cx="25"
              cy="25"
              r="20"
              fill={`url(#steam-gradient-${particle.id})`}
              className="blur-sm"
            />
          </svg>
        </div>
      ))}
      
      <style>{`
        .steam-particle {
          animation: steam-rise 3s ease-out infinite;
          pointer-events: none;
        }
        
        @keyframes steam-rise {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0.8;
          }
          50% {
            transform: translateY(-30px) scale(1.2);
            opacity: 0.4;
          }
          100% {
            transform: translateY(-60px) scale(1.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
