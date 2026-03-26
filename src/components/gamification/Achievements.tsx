import React from 'react';
import { Trophy, Lock } from 'lucide-react';
import { Achievement } from '@/hooks/useGamification';
import { useLanguage } from '@/lib/LanguageContext';

interface AchievementsProps {
  achievements: Achievement[];
  className?: string;
}

export default function Achievements({ achievements, className = '' }: AchievementsProps) {
  const { t, language } = useLanguage();
  const locale = language === 'he' ? 'he-IL' : language === 'ar' ? 'ar-SA' : 'en-US';
  const unlocked = achievements.filter(a => a.unlockedAt);
  const locked = achievements.filter(a => !a.unlockedAt);

  return (
    <div className={`achievements ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-serif font-semibold text-brass-200 flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          {t.gamification.achievementsTitle} ({unlocked.length}/{achievements.length})
        </h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Unlocked achievements first */}
        {unlocked.map(achievement => (
          <div
            key={achievement.id}
            className="steampunk-card p-4 relative overflow-hidden hover:shadow-brass transition-all hover:-translate-y-1"
          >
            {/* Unlock animation glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-brass-500/10 to-copper-500/10 animate-pulse"></div>
            
            <div className="relative z-10">
              <div className="text-4xl mb-2 text-center">{achievement.icon}</div>
              <h4 className="text-sm font-semibold text-brass-200 mb-1 text-center">
                {achievement.name}
              </h4>
              <p className="text-xs text-brass-400 mb-2 text-center leading-relaxed">
                {achievement.description}
              </p>
              <div className="flex items-center justify-center gap-1 text-xs text-brass-300">
                <Trophy className="w-3 h-3" />
                <span>{achievement.xpReward} XP</span>
              </div>
              {achievement.unlockedAt && (
                <div className="text-xs text-green-400 mt-2 text-center">
                  ✓ {t.gamification.unlockedAt} {new Date(achievement.unlockedAt).toLocaleDateString(locale)}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Locked achievements */}
        {locked.map(achievement => (
          <div
            key={achievement.id}
            className="steampunk-card p-4 opacity-60 relative"
          >
            <div className="absolute top-2 right-2">
              <Lock className="w-4 h-4 text-brass-500" />
            </div>
            
            <div className="text-4xl mb-2 text-center grayscale">{achievement.icon}</div>
            <h4 className="text-sm font-semibold text-brass-300 mb-1 text-center">
              {achievement.name}
            </h4>
            <p className="text-xs text-brass-500 mb-2 text-center leading-relaxed">
              {achievement.description}
            </p>
            
            {/* Progress bar if applicable */}
            {achievement.maxProgress > 1 && achievement.progress > 0 && (
              <div className="mt-2">
                <div className="h-1.5 bg-steam-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brass-600 to-copper-600 transition-all"
                    style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                  />
                </div>
                <div className="text-xs text-brass-500 mt-1 text-center">
                  {achievement.progress}/{achievement.maxProgress}
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-center gap-1 text-xs text-brass-500 mt-2">
              <Trophy className="w-3 h-3" />
              <span>{achievement.xpReward} XP</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
