import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, TrendingUp, Eye, User, Clock } from 'lucide-react';
import SocialShare from '@/components/SocialShare';
import { useLanguage } from '@/lib/LanguageContext';

interface FeedPost {
  id: string;
  userId: string;
  username: string;
  userAvatar?: string;
  jobId: string;
  title: string;
  description: string;
  thumbnail?: string;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  isLiked: boolean;
  createdAt: string;
  trending: boolean;
}

interface FeedProps {
  posts: FeedPost[];
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  className?: string;
}

export default function Feed({ posts, onLike, onComment, className = '' }: FeedProps) {
  const { t, language } = useLanguage();
  const locale = language === 'he' ? 'he-IL' : language === 'ar' ? 'ar-SA' : 'en-US';
  const [showShareFor, setShowShareFor] = useState<string | null>(null);

  const handleLike = (postId: string) => {
    onLike?.(postId);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getTimeAgo = (date: string): string => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return t.feed.now;
    if (diffMins < 60) return t.feed.minutesAgo.replace('{count}', String(diffMins));
    if (diffHours < 24) return t.feed.hoursAgo.replace('{count}', String(diffHours));
    if (diffDays === 1) return t.feed.yesterday;
    if (diffDays < 7) return t.feed.daysAgo.replace('{count}', String(diffDays));
    return past.toLocaleDateString(locale);
  };

  return (
    <div className={`feed space-y-6 ${className}`}>
      {posts.map(post => (
        <div key={post.id} className="steampunk-card p-6 hover:shadow-brass transition-all">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brass-500 to-copper-600 flex items-center justify-center">
              {post.userAvatar ? (
                <img src={post.userAvatar} alt={post.username} className="w-full h-full rounded-full" />
              ) : (
                <User className="w-5 h-5 text-white" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-brass-200">{post.username}</span>
                {post.trending && (
                  <span className="px-2 py-0.5 bg-gradient-to-r from-brass-600/30 to-copper-600/30 border border-brass-500/30 rounded-full text-xs text-brass-200 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    טרנדי
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-brass-400">
                <Clock className="w-3 h-3" />
                <span>{getTimeAgo(post.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-brass-200 mb-2">{post.title}</h3>
            <p className="text-brass-300 text-sm leading-relaxed mb-3">{post.description}</p>
            
            {post.thumbnail && (
              <div className="rounded-lg overflow-hidden bg-steam-900/50">
                <img
                  src={post.thumbnail}
                  alt={post.title}
                  className="w-full h-48 object-cover"
                />
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-brass-400 mb-4 pb-4 border-b border-brass-700/30">
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{formatNumber(post.views)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              <span>{formatNumber(post.likes)}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="w-4 h-4" />
              <span>{formatNumber(post.comments)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Share2 className="w-4 h-4" />
              <span>{formatNumber(post.shares)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleLike(post.id)}
              className={`flex-1 py-2 px-4 rounded-lg transition-all ${
                post.isLiked
                  ? 'bg-gradient-to-r from-brass-600 to-copper-600 text-white'
                  : 'bg-steam-800/50 hover:bg-steam-700/50 text-brass-300'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} />
                <span className="text-sm font-medium">
                  {post.isLiked ? 'אהבתי' : 'לייק'}
                </span>
              </div>
            </button>

            <button
              onClick={() => onComment?.(post.id)}
              className="flex-1 py-2 px-4 rounded-lg bg-steam-800/50 hover:bg-steam-700/50 text-brass-300 transition-all"
            >
              <div className="flex items-center justify-center gap-2">
                <MessageCircle className="w-4 h-4" />
                <span className="text-sm font-medium">תגובה</span>
              </div>
            </button>

            <button
              onClick={() => setShowShareFor(showShareFor === post.id ? null : post.id)}
              className="flex-1 py-2 px-4 rounded-lg bg-steam-800/50 hover:bg-steam-700/50 text-brass-300 transition-all"
            >
              <div className="flex items-center justify-center gap-2">
                <Share2 className="w-4 h-4" />
                <span className="text-sm font-medium">שתף</span>
              </div>
            </button>
          </div>

          {/* Share options */}
          {showShareFor === post.id && (
            <div className="mt-4 p-4 bg-steam-900/30 border border-brass-700/20 rounded-lg">
              <SocialShare
                title={post.title}
                description={post.description}
                url={`${window.location.origin}/recap/${post.jobId}`}
              />
            </div>
          )}
        </div>
      ))}

      {posts.length === 0 && (
        <div className="steampunk-card p-12 text-center">
          <MessageCircle className="w-12 h-12 text-brass-400 mx-auto mb-4 opacity-50" />
          <p className="text-brass-300">אין פוסטים להצגה</p>
          <p className="text-sm text-brass-500 mt-2">
            צור את הסיכום הראשון שלך ושתף עם הקהילה!
          </p>
        </div>
      )}
    </div>
  );
}
