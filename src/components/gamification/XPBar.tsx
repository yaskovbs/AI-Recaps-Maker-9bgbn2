import React from 'react';
import { Zap } from 'lucide-react';

interface XPBarProps {
  level: number;
  currentXP: number;
  xpForNextLevel: number;
  title: string;
  className?: string;
}

export default function XPBar({ level, currentXP, xpForNextLevel, title, className = '' }: XPBarProps) {
  const progress = (currentXP / xpForNextLevel) * 100;

  return (
    <div className={`xp-bar ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brass-500 to-copper-600 flex items-center justify-center font-bold text-white shadow-lg">
            {level}
          </div>
          <div>
            <div className="text-sm font-semibold text-brass-200">{title}</div>
            <div className="text-xs text-brass-400">
              {currentXP.toLocaleString()} / {xpForNextLevel.toLocaleString()} XP
            </div>
          </div>
        </div>
        <Zap className="w-5 h-5 text-brass-400" />
      </div>

      {/* Progress Bar */}
      <div className="h-3 bg-steam-800 rounded-full overflow-hidden shadow-inner">
        <div
          className="h-full bg-gradient-to-r from-brass-600 via-copper-500 to-brass-600 transition-all duration-500 ease-out relative overflow-hidden"
          style={{ width: `${Math.min(progress, 100)}%` }}
        >
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
        </div>
      </div>

      {/* Next Level Info */}
      <div className="text-xs text-brass-500 mt-1 text-center">
        {xpForNextLevel - currentXP} XP לרמה הבאה
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
