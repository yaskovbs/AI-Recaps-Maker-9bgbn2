import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { Trophy, Star, Award, TrendingUp, Zap, Crown } from 'lucide-react';

interface LeaderboardUser {
  id: string;
  username: string;
  avatar_url?: string;
  recaps_count: number;
  avg_rating: number;
  total_ratings: number;
  badges: string[];
}

interface TopRecap {
  id: string;
  title: string;
  avg_rating: number;
  ratings_count: number;
  created_at: string;
}

export default function Leaderboard() {
  const { t } = useLanguage();
  const [topContributors, setTopContributors] = useState<LeaderboardUser[]>([]);
  const [topRecaps, setTopRecaps] = useState<TopRecap[]>([]);
  const [activeUsers, setActiveUsers] = useState<LeaderboardUser[]>([]);

  useEffect(() => {
    // In production, fetch from Supabase
    // Mock data for now
    setTopContributors([
      { id: '1', username: 'משתמש דמו 1', recaps_count: 42, avg_rating: 4.8, total_ratings: 156, badges: ['👑', '🏆', '⭐'] },
      { id: '2', username: 'משתמש דמו 2', recaps_count: 38, avg_rating: 4.6, total_ratings: 124, badges: ['🏆', '⭐'] },
      { id: '3', username: 'משתמש דמו 3', recaps_count: 35, avg_rating: 4.5, total_ratings: 98, badges: ['⭐'] },
    ]);

    setTopRecaps([
      { id: '1', title: 'סיכום אקשן מטורף', avg_rating: 5.0, ratings_count: 42, created_at: new Date().toISOString() },
      { id: '2', title: 'דרמה מרגשת', avg_rating: 4.9, ratings_count: 38, created_at: new Date().toISOString() },
      { id: '3', title: 'קומדיה משעשעת', avg_rating: 4.8, ratings_count: 35, created_at: new Date().toISOString() },
    ]);

    setActiveUsers([
      { id: '1', username: 'משתמש פעיל 1', recaps_count: 15, avg_rating: 4.7, total_ratings: 45, badges: ['⚡'] },
      { id: '2', username: 'משתמש פעיל 2', recaps_count: 12, avg_rating: 4.6, total_ratings: 36, badges: ['⚡'] },
    ]);
  }, []);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Trophy className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Award className="w-6 h-6 text-orange-600" />;
    return <span className="text-brass-400 font-bold">#{rank}</span>;
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-serif font-bold text-brass-200 mb-2 flex items-center justify-center gap-3">
            <Trophy className="w-10 h-10 text-brass-400" />
            {t.leaderboard.title}
          </h1>
          <p className="text-brass-300">{t.leaderboard.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Contributors */}
          <div className="steampunk-card p-6">
            <h2 className="text-2xl font-serif font-semibold text-brass-200 mb-4 flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              {t.leaderboard.topCreators}
            </h2>
            <div className="space-y-4">
              {topContributors.map((user, idx) => (
                <div
                  key={user.id}
                  className={`flex items-center gap-4 p-4 rounded-lg transition-all hover:bg-brass-900/30 ${
                    idx === 0 ? 'bg-gradient-to-r from-yellow-900/20 to-brass-900/20 border border-yellow-600/30' :
                    idx === 1 ? 'bg-gradient-to-r from-gray-900/20 to-brass-900/20 border border-gray-600/30' :
                    idx === 2 ? 'bg-gradient-to-r from-orange-900/20 to-brass-900/20 border border-orange-600/30' :
                    'bg-steam-800/30'
                  }`}
                >
                  <div className="flex items-center justify-center w-12">
                    {getRankIcon(idx + 1)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-brass-100">{user.username}</span>
                      <div className="flex gap-1">
                        {user.badges.map((badge, i) => (
                          <span key={i} className="text-sm">{badge}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-brass-400">
                      <span>{user.recaps_count} {t.leaderboard.recaps}</span>
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-brass-400" />
                        {user.avg_rating.toFixed(1)}
                      </span>
                      <span>{user.total_ratings} {t.leaderboard.ratings}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Rated Recaps */}
          <div className="steampunk-card p-6">
            <h2 className="text-2xl font-serif font-semibold text-brass-200 mb-4 flex items-center gap-2">
              <Star className="w-6 h-6" />
              {t.leaderboard.topRecaps}
            </h2>
            <div className="space-y-4">
              {topRecaps.map((recap, idx) => (
                <div
                  key={recap.id}
                  className={`flex items-center gap-4 p-4 rounded-lg transition-all hover:bg-brass-900/30 ${
                    idx === 0 ? 'bg-gradient-to-r from-yellow-900/20 to-brass-900/20 border border-yellow-600/30' :
                    idx === 1 ? 'bg-gradient-to-r from-gray-900/20 to-brass-900/20 border border-gray-600/30' :
                    idx === 2 ? 'bg-gradient-to-r from-orange-900/20 to-brass-900/20 border border-orange-600/30' :
                    'bg-steam-800/30'
                  }`}
                >
                  <div className="flex items-center justify-center w-12">
                    {getRankIcon(idx + 1)}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-brass-100 mb-1">{recap.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-brass-400">
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-brass-400" />
                        {recap.avg_rating.toFixed(1)}
                      </span>
                      <span>{recap.ratings_count} {t.leaderboard.ratings}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Active Users */}
        <div className="steampunk-card p-6">
          <h2 className="text-2xl font-serif font-semibold text-brass-200 mb-4 flex items-center gap-2">
            <Zap className="w-6 h-6 text-copper-400" />
            {t.leaderboard.activeThisWeek}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-4 p-4 bg-steam-800/30 rounded-lg hover:bg-brass-900/30 transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brass-500 to-copper-600 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-brass-100">{user.username}</span>
                    {user.badges.map((badge, i) => (
                      <span key={i} className="text-sm">{badge}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-brass-400">
                    <span>{user.recaps_count} {t.leaderboard.recaps}</span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-brass-400" />
                      {user.avg_rating.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Badges Section */}
        <div className="steampunk-card p-6 mt-8">
          <h2 className="text-2xl font-serif font-semibold text-brass-200 mb-6 flex items-center gap-2">
            <Award className="w-6 h-6" />
            {t.leaderboard.badges.title}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: '🌟', name: t.leaderboard.badges.beginner, desc: t.leaderboard.badges.beginnerDesc, tier: 'bronze' },
              { icon: '⭐', name: t.leaderboard.badges.creator, desc: t.leaderboard.badges.creatorDesc, tier: 'silver' },
              { icon: '🏆', name: t.leaderboard.badges.expert, desc: t.leaderboard.badges.expertDesc, tier: 'gold' },
              { icon: '👑', name: t.leaderboard.badges.legend, desc: t.leaderboard.badges.legendDesc, tier: 'platinum' },
              { icon: '⭐⭐⭐⭐⭐', name: t.leaderboard.badges.highRated, desc: t.leaderboard.badges.highRatedDesc, tier: 'gold' },
              { icon: '💰', name: t.leaderboard.badges.creditCollector, desc: t.leaderboard.badges.creditCollectorDesc, tier: 'silver' },
            ].map((badge, idx) => (
              <div
                key={idx}
                className={`text-center p-4 rounded-lg transition-all hover:scale-105 ${
                  badge.tier === 'platinum' ? 'bg-gradient-to-br from-purple-900/30 to-brass-900/30 border border-purple-600/30' :
                  badge.tier === 'gold' ? 'bg-gradient-to-br from-yellow-900/30 to-brass-900/30 border border-yellow-600/30' :
                  badge.tier === 'silver' ? 'bg-gradient-to-br from-gray-900/30 to-brass-900/30 border border-gray-600/30' :
                  'bg-gradient-to-br from-orange-900/30 to-brass-900/30 border border-orange-600/30'
                }`}
              >
                <div className="text-4xl mb-2 animate-float">{badge.icon}</div>
                <div className="font-semibold text-brass-100 text-sm mb-1">{badge.name}</div>
                <div className="text-xs text-brass-400">{badge.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
