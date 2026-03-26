import React from 'react';
import { Target, CheckCircle, Clock } from 'lucide-react';
import { DailyChallenge } from '@/hooks/useGamification';
import { useLanguage } from '@/lib/LanguageContext';

interface DailyChallengesProps {
  challenges: DailyChallenge[];
  className?: string;
}

export default function DailyChallenges({ challenges, className = '' }: DailyChallengesProps) {
  const { t } = useLanguage();
  const completedCount = challenges.filter(c => c.completed).length;

  const getTimeRemaining = (expiresAt: string): string => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return t.dailyChallenges.expired;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}:${minutes.toString().padStart(2, '0')} ${t.dailyChallenges.hours}`;
  };

  return (
    <div className={`daily-challenges ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-serif font-semibold text-brass-200 flex items-center gap-2">
          <Target className="w-5 h-5" />
          {t.dailyChallenges.title} ({completedCount}/{challenges.length})
        </h3>
        {challenges.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-brass-400">
            <Clock className="w-4 h-4" />
            <span>{getTimeRemaining(challenges[0].expiresAt)}</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {challenges.map(challenge => (
          <div
            key={challenge.id}
            className={`steampunk-card p-4 transition-all ${
              challenge.completed
                ? 'bg-gradient-to-br from-green-900/30 to-green-800/20 border-green-600/30'
                : 'hover:shadow-brass hover:-translate-y-0.5'
            }`}
          >
            <div className="flex items-start gap-4">
              {/* Icon/Status */}
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                  challenge.completed
                    ? 'bg-green-900/50 border-2 border-green-500'
                    : 'bg-brass-900/50 border-2 border-brass-600'
                }`}
              >
                {challenge.completed ? (
                  <CheckCircle className="w-6 h-6 text-green-400" />
                ) : (
                  <Target className="w-6 h-6 text-brass-400" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-base font-semibold text-brass-200 mb-1">
                      {challenge.title}
                    </h4>
                    <p className="text-sm text-brass-400">{challenge.description}</p>
                  </div>
                  <div className="text-right flex-shrink-0 mr-4">
                    <div className="text-lg font-bold text-brass-100">
                      +{challenge.xpReward} XP
                    </div>
                  </div>
                </div>

                {/* Progress */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-brass-400 mb-1">
                    <span>{t.dailyChallenges.progress}</span>
                    <span>
                      {challenge.progress}/{challenge.maxProgress}
                    </span>
                  </div>
                  <div className="h-2 bg-steam-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        challenge.completed
                          ? 'bg-gradient-to-r from-green-600 to-green-500'
                          : 'bg-gradient-to-r from-brass-600 to-copper-600'
                      }`}
                      style={{
                        width: `${Math.min(
                          (challenge.progress / challenge.maxProgress) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {challenges.length === 0 && (
        <div className="text-center py-8 text-brass-400">
          <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{t.dailyChallenges.empty}</p>
        </div>
      )}
    </div>
  );
}
