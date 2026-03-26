import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/LanguageContext';
import { supabase } from '@/lib/supabase';
import { Play, Star, Calendar, Filter, Search, TrendingUp, Film } from 'lucide-react';

interface PublicRecap {
  id: string;
  title: string;
  description: string;
  genre: string;
  thumbnail_url: string;
  video_url: string;
  rating: number;
  views: number;
  created_at: string;
  username: string;
}

export default function Gallery() {
  const { t, language } = useLanguage();
  const locale = language === 'he' ? 'he-IL' : language === 'ar' ? 'ar-SA' : 'en-US';
  const [recaps, setRecaps] = useState<PublicRecap[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [sortBy, setSortBy] = useState<'recent' | 'rating' | 'views'>('recent');

  const genres = [
    'all', 'action', 'adventure', 'animation', 'comedy', 'crime', 'documentary',
    'drama', 'fantasy', 'horror', 'mystery', 'romance', 'scifi',
    'thriller', 'western', 'war', 'musical', 'biography', 'history',
    'sport', 'family'
  ];

  useEffect(() => {
    loadRecaps();
  }, [selectedGenre, sortBy]);

  const loadRecaps = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('public_recaps')
        .select('*')
        .eq('is_public', true); // Only show public recaps

      // Filter by genre
      if (selectedGenre !== 'all') {
        query = query.eq('genre', selectedGenre);
      }

      // Sort
      if (sortBy === 'recent') {
        query = query.order('created_at', { ascending: false });
      } else if (sortBy === 'rating') {
        query = query.order('rating', { ascending: false });
      } else if (sortBy === 'views') {
        query = query.order('views', { ascending: false });
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;

      setRecaps(data || []);
    } catch {
      toast.error(t.common.error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecaps = recaps.filter(recap =>
    recap?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recap?.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePlayRecap = (videoUrl: string) => {
    window.open(videoUrl, '_blank');
  };

  // Safe genre name getter with multiple fallbacks
  const getGenreName = (genre: string) => {
    try {
      if (!t) return genre;
      if (!t.create) return genre;
      if (!t.create.step3) return genre;
      if (!t.create.step3.genres) return genre;
      
      const genreKey = genre as keyof typeof t.create.step3.genres;
      return t.create.step3.genres[genreKey] || genre;
    } catch {
      return genre;
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold text-brass-200 mb-2">
            {t?.gallery?.title || 'Gallery'}
          </h1>
          <p className="text-brass-300">{t?.gallery?.subtitle || 'Discover amazing recaps'}</p>
        </div>

        {/* Filters & Search */}
        <div className="steampunk-card p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-brass-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t?.gallery?.searchPlaceholder || 'Search...'}
                className="w-full bg-steam-900/50 border border-brass-600/30 rounded-lg pl-4 pr-10 py-3 text-brass-200 focus:outline-none focus:ring-2 focus:ring-brass-500"
              />
            </div>

            {/* Genre Filter */}
            <div className="relative">
              <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-brass-400" />
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="w-full bg-steam-900/50 border border-brass-600/30 rounded-lg pl-4 pr-10 py-3 text-brass-200 focus:outline-none focus:ring-2 focus:ring-brass-500 appearance-none"
              >
                {genres.map(genre => (
                  <option key={genre} value={genre}>
                    {genre === 'all' ? (t?.gallery?.allGenres || 'All Genres') : getGenreName(genre)}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div className="relative">
              <TrendingUp className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-brass-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full bg-steam-900/50 border border-brass-600/30 rounded-lg pl-4 pr-10 py-3 text-brass-200 focus:outline-none focus:ring-2 focus:ring-brass-500 appearance-none"
              >
                <option value="recent">{t?.gallery?.sortRecent || 'Recent'}</option>
                <option value="rating">{t?.gallery?.sortRating || 'Rating'}</option>
                <option value="views">{t?.gallery?.sortViews || 'Views'}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Recaps Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 border-4 border-brass-500/30 border-t-brass-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-brass-300">{t?.common?.loading || 'Loading...'}</p>
          </div>
        ) : filteredRecaps.length === 0 ? (
          <div className="text-center py-20">
            <div className="mb-4">
              <Film className="w-24 h-24 mx-auto text-brass-500 opacity-50 mb-4" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-brass-200 mb-2">
              {t?.gallery?.emptyTitle || 'אין סיכומים ציבוריים עדיין'}
            </h3>
            <p className="text-brass-400 mb-6">
              {t?.gallery?.emptySubtitle || 'משתמשים יכולים להפוך את הסיכומים שלהם לציבוריים מעמוד "הסיכומים שלי"'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredRecaps.map((recap) => (
              <div
                key={recap.id}
                className="steampunk-card overflow-hidden hover:shadow-brass transition-all group"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-steam-800 overflow-hidden">
                  <img
                    src={recap.thumbnail_url || 'https://via.placeholder.com/320x180/1a1a1a/ffffff?text=No+Thumbnail'}
                    alt={recap.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <button
                    onClick={() => handlePlayRecap(recap.video_url)}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <div className="w-16 h-16 rounded-full bg-brass-600 flex items-center justify-center">
                      <Play className="w-8 h-8 text-white mr-1" />
                    </div>
                  </button>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-brass-200 font-semibold text-lg mb-2 line-clamp-1">
                    {recap.title}
                  </h3>
                  <p className="text-brass-400 text-sm mb-3 line-clamp-2">
                    {recap.description}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center justify-between text-xs text-brass-500">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span>{recap.rating.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Play className="w-4 h-4" />
                      <span>{recap.views.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(recap.created_at).toLocaleDateString(locale)}</span>
                    </div>
                  </div>

                  {/* Username */}
                  <div className="mt-3 pt-3 border-t border-brass-700/30 text-xs text-brass-500">
                    {t?.gallery?.by || 'By'} {recap.username}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
