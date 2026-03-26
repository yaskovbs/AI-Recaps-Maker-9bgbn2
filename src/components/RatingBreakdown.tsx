import React from 'react';
import { Star } from 'lucide-react';

interface RatingBreakdownProps {
  ratings: Array<{ score: number; comment?: string; created_at: string }>;
  className?: string;
}

export default function RatingBreakdown({ ratings, className = '' }: RatingBreakdownProps) {
  // Calculate breakdown by stars
  const breakdown = [5, 4, 3, 2, 1].map((stars) => {
    const count = ratings.filter((r) => r.score === stars).length;
    const percentage = ratings.length > 0 ? (count / ratings.length) * 100 : 0;
    return { stars, count, percentage };
  });

  const averageRating = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length
    : 0;

  return (
    <div className={`rating-breakdown ${className}`}>
      {/* Average Score */}
      <div className="flex items-center gap-4 mb-6 pb-6 border-b border-brass-700/30">
        <div className="text-center">
          <div className="text-5xl font-bold text-brass-100 mb-1">
            {averageRating.toFixed(1)}
          </div>
          <div className="flex items-center justify-center gap-1 mb-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.round(averageRating)
                    ? 'fill-brass-400 text-brass-400'
                    : 'text-brass-700'
                }`}
              />
            ))}
          </div>
          <div className="text-sm text-brass-400">
            {ratings.length} {ratings.length === 1 ? 'דירוג' : 'דירוגים'}
          </div>
        </div>

        <div className="flex-1">
          {breakdown.map(({ stars, count, percentage }) => (
            <div key={stars} className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-1 w-12">
                <span className="text-sm text-brass-300">{stars}</span>
                <Star className="w-3 h-3 text-brass-500" />
              </div>
              <div className="flex-1 h-2 bg-steam-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brass-600 to-copper-600 transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-sm text-brass-400 w-12 text-left">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Comments */}
      {ratings.filter((r) => r.comment).length > 0 && (
        <div>
          <h4 className="text-brass-200 font-semibold mb-3">תגובות אחרונות</h4>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {ratings
              .filter((r) => r.comment)
              .slice(0, 5)
              .map((rating, idx) => (
                <div
                  key={idx}
                  className="bg-steam-800/30 border border-brass-700/20 rounded-lg p-3"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < rating.score
                            ? 'fill-brass-400 text-brass-400'
                            : 'text-brass-700'
                        }`}
                      />
                    ))}
                    <span className="text-xs text-brass-400">
                      {new Date(rating.created_at).toLocaleDateString('he-IL')}
                    </span>
                  </div>
                  <p className="text-sm text-brass-300 leading-relaxed">
                    {rating.comment}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
