import React from 'react';
import { Smile, Frown, Meh } from 'lucide-react';

interface SentimentAnalysisProps {
  ratings: Array<{ score: number; comment?: string; sentiment?: string }>;
  className?: string;
}

export default function SentimentAnalysis({ ratings, className = '' }: SentimentAnalysisProps) {
  // Simple sentiment analysis based on score and keywords
  const analyzeSentiment = (rating: { score: number; comment?: string }): 'positive' | 'neutral' | 'negative' => {
    if (rating.score >= 4) return 'positive';
    if (rating.score <= 2) return 'negative';
    
    if (!rating.comment) return 'neutral';
    
    const comment = rating.comment.toLowerCase();
    const positiveKeywords = ['מעולה', 'נהדר', 'אהבתי', 'טוב', 'מומלץ', 'מצוין'];
    const negativeKeywords = ['רע', 'גרוע', 'לא', 'חבל', 'אכזבה', 'בעיה'];
    
    const hasPositive = positiveKeywords.some(word => comment.includes(word));
    const hasNegative = negativeKeywords.some(word => comment.includes(word));
    
    if (hasPositive && !hasNegative) return 'positive';
    if (hasNegative && !hasPositive) return 'negative';
    
    return 'neutral';
  };

  const sentiments = ratings.map(r => ({
    ...r,
    sentiment: r.sentiment || analyzeSentiment(r),
  }));

  const positive = sentiments.filter(s => s.sentiment === 'positive').length;
  const neutral = sentiments.filter(s => s.sentiment === 'neutral').length;
  const negative = sentiments.filter(s => s.sentiment === 'negative').length;
  const total = sentiments.length;

  const positivePercent = total > 0 ? (positive / total) * 100 : 0;
  const neutralPercent = total > 0 ? (neutral / total) * 100 : 0;
  const negativePercent = total > 0 ? (negative / total) * 100 : 0;

  return (
    <div className={`sentiment-analysis ${className}`}>
      <h4 className="text-brass-200 font-semibold mb-4">ניתוח סנטימנט</h4>
      
      {/* Visual Breakdown */}
      <div className="flex gap-2 h-3 rounded-full overflow-hidden mb-6">
        <div
          className="bg-green-600 transition-all duration-500"
          style={{ width: `${positivePercent}%` }}
        />
        <div
          className="bg-yellow-600 transition-all duration-500"
          style={{ width: `${neutralPercent}%` }}
        />
        <div
          className="bg-red-600 transition-all duration-500"
          style={{ width: `${negativePercent}%` }}
        />
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Positive */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-green-900/30 border border-green-600/30 flex items-center justify-center mx-auto mb-2">
            <Smile className="w-6 h-6 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-green-400 mb-1">{positive}</div>
          <div className="text-xs text-brass-400">חיובי</div>
          <div className="text-xs text-brass-500">{positivePercent.toFixed(0)}%</div>
        </div>

        {/* Neutral */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-yellow-900/30 border border-yellow-600/30 flex items-center justify-center mx-auto mb-2">
            <Meh className="w-6 h-6 text-yellow-400" />
          </div>
          <div className="text-2xl font-bold text-yellow-400 mb-1">{neutral}</div>
          <div className="text-xs text-brass-400">ניטרלי</div>
          <div className="text-xs text-brass-500">{neutralPercent.toFixed(0)}%</div>
        </div>

        {/* Negative */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-red-900/30 border border-red-600/30 flex items-center justify-center mx-auto mb-2">
            <Frown className="w-6 h-6 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400 mb-1">{negative}</div>
          <div className="text-xs text-brass-400">שלילי</div>
          <div className="text-xs text-brass-500">{negativePercent.toFixed(0)}%</div>
        </div>
      </div>

      {/* Overall Mood */}
      <div className="mt-6 p-4 bg-brass-900/30 border border-brass-600/30 rounded-lg text-center">
        <div className="text-sm text-brass-300 mb-1">מצב רוח כללי</div>
        <div className="text-lg font-bold text-brass-100">
          {positivePercent > 60 ? '😊 חיובי מאוד' : 
           positivePercent > 40 ? '🙂 חיובי בעיקר' :
           negativePercent > 40 ? '😟 שלילי' :
           '😐 מעורב'}
        </div>
      </div>
    </div>
  );
}
