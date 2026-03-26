import React from 'react';
import { TrendingUp, Flame, Eye, Heart } from 'lucide-react';

interface TrendingItem {
  id: string;
  title: string;
  category: string;
  views: number;
  likes: number;
  growth: number; // percentage
  thumbnail?: string;
}

interface TrendingContentProps {
  items: TrendingItem[];
  className?: string;
}

export default function TrendingContent({ items, className = '' }: TrendingContentProps) {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div className={`trending-content ${className}`}>
      <div className="flex items-center gap-2 mb-6">
        <Flame className="w-5 h-5 text-brass-400" />
        <h3 className="text-xl font-serif font-semibold text-brass-200">טרנדים עכשיו</h3>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="steampunk-card p-4 hover:shadow-brass transition-all hover:-translate-y-0.5 cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              {/* Rank */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  index === 0
                    ? 'bg-gradient-to-br from-yellow-600 to-yellow-500 text-white'
                    : index === 1
                    ? 'bg-gradient-to-br from-gray-400 to-gray-300 text-white'
                    : index === 2
                    ? 'bg-gradient-to-br from-orange-600 to-orange-500 text-white'
                    : 'bg-steam-800 text-brass-300'
                }`}
              >
                {index + 1}
              </div>

              {/* Thumbnail */}
              {item.thumbnail && (
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-steam-900/50 flex-shrink-0">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                  />
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-brass-200 mb-1 truncate group-hover:text-brass-100 transition-colors">
                  {item.title}
                </h4>
                <div className="flex items-center gap-3 text-xs text-brass-400">
                  <span className="px-2 py-0.5 bg-steam-900/50 rounded">{item.category}</span>
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span>{formatNumber(item.views)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="w-3 h-3" />
                    <span>{formatNumber(item.likes)}</span>
                  </div>
                </div>
              </div>

              {/* Growth indicator */}
              <div className="flex-shrink-0">
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                    item.growth > 0
                      ? 'bg-green-900/30 text-green-400'
                      : 'bg-red-900/30 text-red-400'
                  }`}
                >
                  <TrendingUp
                    className={`w-3 h-3 ${item.growth < 0 ? 'rotate-180' : ''}`}
                  />
                  <span>{Math.abs(item.growth)}%</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-8 text-brass-400">
          <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>אין טרנדים זמינים כרגע</p>
        </div>
      )}
    </div>
  );
}
