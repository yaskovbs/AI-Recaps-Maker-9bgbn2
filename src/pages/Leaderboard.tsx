import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { Trophy, Star, Award, TrendingUp, Zap, Crown, Sparkles } from 'lucide-react';

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
  username: string;
  avg_rating: number;
  ratings_count: number;
  genre: string;
  created_at: string;
}

export default function Leaderboard() {
  const { t } = useLanguage();
  const [topContributors, setTopContributors] = useState<LeaderboardUser[]>([]);
  const [topRecaps, setTopRecaps] = useState<TopRecap[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setIsLoading(true);
    try {
      // Load top contributors - users with most jobs
      const { data: profilesData } = await supabase
        .from('user_profiles')
        .select('id, username, avatar_url');

      if (profilesData && profilesData.length > 0) {
        // Get job counts per user
        const { data: jobsData } = await supabase
          .from('jobs')
          .select('user_id, status');

        // Get ratings per user
        const { data: ratingsData } = await supabase
          .from('ratings')
          .select('user_id, score');

        // Calculate leaderboard
        const userMap = new Map<string, LeaderboardUser>();

        for (const profile of profilesData) {
          const userJobs = jobsData?.filter(j => j.user_id === profile.id) || [];
          const userRatings = ratingsData?.filter(r => r.user_id === profile.id) || [];
          const avgRating = userRatings.length > 0
            ? userRatings.reduce((sum, r) => sum + r.score, 0) / userRatings.length
            : 0;

          const recapsCount = userJobs.filter(j => j.status === 'completed').length;

          // Assign badges
          const badges: string[] = [];
          if (recapsCount >= 100) badges.push('👑');
          else if (recapsCount >= 50) badges.push('🏆');
          else if (recapsCount >= 10) badges.push('⭐');
          else if (recapsCount >= 1) badges.push('🌟');
          if (avgRating >= 4.5 && userRatings.length >= 3) badges.push('⭐⭐⭐⭐⭐');

          if (recapsCount > 0) {
            userMap.set(profile.id, {
              id: profile.id,
              username: profile.username,
              avatar_url: profile.avatar_url,
              recaps_count: recapsCount,
              avg_rating: avgRating,
              total_ratings: userRatings.length,
              badges,
            });
          }
        }

        const sorted = Array.from(userMap.values())
          .sort((a, b) => b.recaps_count - a.recaps_count)
          .slice(0, 10);

        setTopContributors(sorted);
      }

      // Load top rated public recaps
      const { data: recapsData } = await supabase
        .from('public_recaps')
        .select('id, title, username, rating, views, genre, created_at')
        .eq('is_public', true)
        .order('rating', { ascending: false })
        .limit(10);

      if (recapsData) {
        setTopRecaps(recapsData.map(r => ({
          id: r.id,
          title: r.title,
          username: r.username || '',
          avg_rating: r.rating || 0,
          ratings_count: r.views || 0,
          genre: r.genre || '',
          created_at: r.created_at,
        })));
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Trophy className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Award className="w-6 h-6 text-orange-600" />;
    return <span className="text-brass-400 font-bold">#{rank}</span>;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brass-500/30 border-t-brass-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-brass-300">טוען טבלת מובילים...</p>
        </div>
      </div>
    );
  }

  const isEmpty = topContributors.length === 0 && topRecaps.length === 0;

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-serif font-bold text-brass-200 mb-2 flex items-center justify-center gap-3">
            <Trophy className="w-10 h-10 text-brass-400" />
            טבלת מובילים
          </h1>
          <p className="text-brass-300">היוצרים הטובים ביותר והסיכומים המדורגים ביותר</p>
        </div>

        {isEmpty ? (
          <div className="steampunk-card p-12 text-center max-w-lg mx-auto">
            <Sparkles className="w-16 h-16 text-brass-500 mx-auto mb-4 opacity-50" />
            <h2 className="text-2xl font-serif font-bold text-brass-200 mb-3">
              היה הראשון בלידרבורד!
            </h2>
            <p className="text-brass-400 mb-6">
              צור את הסיכום הראשון שלך וקח את המקום הראשון בטבלת המובילים
            </p>
            <Link
              to="/create"
              className="steampunk-button inline-flex items-center gap-2 px-8"
            >
              <Sparkles className="w-5 h-5" />
              התחל ליצור
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Top Contributors */}
              <div className="steampunk-card p-6">
                <h2 className="text-2xl font-serif font-semibold text-brass-200 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6" />
                  יוצרים מובילים
                </h2>
                {topContributors.length === 0 ? (
                  <p className="text-brass-400 text-center py-8">אין יוצרים עדיין</p>
                ) : (
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
                            <span>{user.recaps_count} סיכומים</span>
                            {user.avg_rating > 0 && (
                              <span className="flex items-center gap-1">
                                <Star className="w-3 h-3 fill-brass-400" />
                                {user.avg_rating.toFixed(1)}
                              </span>
                            )}
                            {user.total_ratings > 0 && (
                              <span>{user.total_ratings} דירוגים</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top Rated Recaps */}
              <div className="steampunk-card p-6">
                <h2 className="text-2xl font-serif font-semibold text-brass-200 mb-4 flex items-center gap-2">
                  <Star className="w-6 h-6" />
                  סיכומים מדורגים
                </h2>
                {topRecaps.length === 0 ? (
                  <p className="text-brass-400 text-center py-8">אין סיכומים ציבוריים עדיין</p>
                ) : (
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
                            {recap.avg_rating > 0 && (
                              <span className="flex items-center gap-1">
                                <Star className="w-3 h-3 fill-brass-400" />
                                {recap.avg_rating.toFixed(1)}
                              </span>
                            )}
                            {recap.genre && (
                              <span className="px-2 py-0.5 bg-steam-900/50 rounded text-xs">{recap.genre}</span>
                            )}
                            {recap.username && (
                              <span className="text-xs">מאת {recap.username}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Badges Section */}
        <div className="steampunk-card p-6 mt-8">
          <h2 className="text-2xl font-serif font-semibold text-brass-200 mb-6 flex items-center gap-2">
            <Award className="w-6 h-6" />
            תגים והישגים
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: '🌟', name: 'מתחיל', desc: 'סיכום ראשון', tier: 'bronze' },
              { icon: '⭐', name: 'יוצר', desc: '10 סיכומים', tier: 'silver' },
              { icon: '🏆', name: 'מומחה', desc: '50 סיכומים', tier: 'gold' },
              { icon: '👑', name: 'אגדה', desc: '100 סיכומים', tier: 'platinum' },
              { icon: '⭐⭐⭐⭐⭐', name: 'מדורג גבוה', desc: 'ממוצע 4.5', tier: 'gold' },
              { icon: '💰', name: 'צבר קרדיטים', desc: '50 קרדיטים', tier: 'silver' },
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
