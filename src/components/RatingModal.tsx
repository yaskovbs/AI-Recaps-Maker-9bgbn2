import React, { useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { Star, X, Send } from 'lucide-react';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment?: string) => void;
}

export default function RatingModal({ isOpen, onClose, onSubmit }: RatingModalProps) {
  const { t } = useLanguage();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (rating > 0) {
      onSubmit(rating, comment || undefined);
      onClose();
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-steam-900/90 backdrop-blur-sm">
      <div className="steampunk-card max-w-md w-full p-8 relative animate-float">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 w-8 h-8 rounded-full bg-steam-800 hover:bg-steam-700 flex items-center justify-center transition-all"
        >
          <X className="w-5 h-5 text-brass-300" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brass-500 to-copper-600 flex items-center justify-center mx-auto mb-4 glow-brass">
            <Star className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-brass-200 mb-2">
            אהבתם את השירות?
          </h2>
          <p className="text-brass-300 text-sm">
            נשמח לשמוע מה דעתכם ולשפר את החוויה שלכם
          </p>
        </div>

        {/* Star Rating */}
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="transition-all transform hover:scale-110"
            >
              <Star
                className={`w-10 h-10 ${
                  star <= (hoveredRating || rating)
                    ? 'fill-brass-400 text-brass-400'
                    : 'text-brass-700'
                } transition-colors`}
              />
            </button>
          ))}
        </div>

        {/* Rating Text */}
        {rating > 0 && (
          <p className="text-center text-brass-200 mb-4 font-medium">
            {rating === 1 && 'לא טוב 😔'}
            {rating === 2 && 'יכול להיות יותר טוב'}
            {rating === 3 && 'סביר'}
            {rating === 4 && 'טוב מאוד! 😊'}
            {rating === 5 && 'מעולה! 🌟'}
          </p>
        )}

        {/* Comment (Optional) */}
        <div className="mb-6">
          <label className="block text-brass-200 text-sm font-medium mb-2">
            רוצים לשתף עוד? (אופציונלי)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="ספרו לנו מה אהבתם או מה ניתן לשפר..."
            className="w-full h-24 bg-steam-900/50 border border-brass-600/30 rounded-lg p-3 text-brass-200 placeholder-brass-400/50 focus:outline-none focus:ring-2 focus:ring-brass-500 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSkip}
            className="flex-1 px-4 py-3 bg-steam-800 hover:bg-steam-700 text-brass-200 rounded-lg font-semibold transition-all"
          >
            אולי אחר כך
          </button>
          <button
            onClick={handleSubmit}
            disabled={rating === 0}
            className="flex-1 steampunk-button px-4 py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            שלח דירוג
          </button>
        </div>
      </div>
    </div>
  );
}
