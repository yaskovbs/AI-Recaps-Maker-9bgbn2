import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/LanguageContext';
import SocialShare from '@/components/SocialShare';
import { Film, Calendar, Star, ArrowRight, Share2, Download, Eye, Tag } from 'lucide-react';

interface RecapData {
  id: string;
  title: string;
  description?: string;
  genre?: string;
  status: string;
  movie_title?: string;
  youtube_url?: string;
  video_url?: string;
  thumbnail_url?: string;
  recap_length_seconds: number;
  created_at: string;
  username?: string;
  rating?: number;
  views?: number;
  metadata?: any;
}

export default function RecapView() {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useLanguage();
  const locale = language === 'he' ? 'he-IL' : language === 'ar' ? 'ar-SA' : 'en-US';
  const [recap, setRecap] = useState<RecapData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    if (id) loadRecap(id);
  }, [id]);

  const loadRecap = async (recapId: string) => {
    setIsLoading(true);
    try {
      // Try public_recaps first
      const { data: publicData } = await supabase
        .from('public_recaps')
        .select('*')
        .eq('id', recapId)
        .eq('is_public', true)
        .single();

      if (publicData) {
        setRecap({
          id: publicData.id,
          title: publicData.title,
          description: publicData.description,
          genre: publicData.genre,
          status: 'completed',
          video_url: publicData.video_url,
          thumbnail_url: publicData.thumbnail_url,
          recap_length_seconds: 0,
          created_at: publicData.created_at,
          username: publicData.username,
          rating: publicData.rating,
          views: publicData.views,
        });
        return;
      }

      // Try jobs table
      const { data: jobData } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', recapId)
        .single();

      if (jobData) {
        setRecap({
          id: jobData.id,
          title: jobData.title || jobData.movie_title || t.recapView.noTitle,
          description: jobData.description,
          genre: jobData.genre,
          status: jobData.status,
          movie_title: jobData.movie_title,
          youtube_url: jobData.youtube_url,
          video_url: jobData.metadata?.video_url,
          recap_length_seconds: jobData.recap_length_seconds || 0,
          created_at: jobData.created_at,
          metadata: jobData.metadata,
        });
      }
    } catch {
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brass-500/30 border-t-brass-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-brass-300">{t.recapView.loading}</p>
        </div>
      </div>
    );
  }

  if (!recap || loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="steampunk-card p-8 max-w-md text-center">
          <Film className="w-16 h-16 text-brass-500 mx-auto mb-4 opacity-50" />
          <h2 className="text-2xl font-serif font-bold text-brass-200 mb-3">
            {loadError ? t.recapView.loadError : t.recapView.notFound}
          </h2>
          <p className="text-brass-400 mb-6">
            {t.recapView.notFoundMessage}
          </p>
          <Link
            to="/gallery"
            className="steampunk-button inline-flex items-center gap-2"
          >
            {t.recapView.gallery}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Video Player / Thumbnail */}
        <div className="aspect-video bg-gradient-to-br from-steam-800 to-steam-900 rounded-xl mb-6 flex items-center justify-center relative overflow-hidden border border-brass-700/30">
          {recap.video_url ? (
            <video
              src={recap.video_url}
              controls
              className="w-full h-full object-contain"
              poster={recap.thumbnail_url}
            />
          ) : (
            <>
              <Film className="w-20 h-20 text-brass-500 opacity-30" />
              <div className="absolute bottom-4 left-4 px-3 py-1 bg-steam-950/90 rounded text-sm text-brass-300">
                {recap.status === 'completed' ? t.recapView.videoSoon : `${recap.status}`}
              </div>
            </>
          )}
        </div>

        {/* Recap Info */}
        <div className="steampunk-card p-8 mb-6">
          <h1 className="text-3xl font-serif font-bold text-brass-200 mb-3">
            {recap.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-brass-400 mb-4">
            {recap.genre && (
              <span className="flex items-center gap-1 px-3 py-1 bg-steam-900/50 rounded-full">
                <Tag className="w-3 h-3" />
                {recap.genre}
              </span>
            )}
            {recap.username && (
              <span>{t.recapView.by}: {recap.username}</span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(recap.created_at).toLocaleDateString(locale)}
            </span>
            {recap.recap_length_seconds > 0 && (
              <span>{formatDuration(recap.recap_length_seconds)}</span>
            )}
            {recap.rating !== undefined && recap.rating > 0 && (
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-brass-400 text-brass-400" />
                {recap.rating.toFixed(1)}
              </span>
            )}
            {recap.views !== undefined && recap.views > 0 && (
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {recap.views} {t.recapView.views}
              </span>
            )}
          </div>

          {recap.description && (
            <p className="text-brass-300 leading-relaxed mb-6">
              {recap.description}
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowShare(!showShare)}
              className="steampunk-button flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              {t.recapView.share}
            </button>

            {recap.video_url && (
              <a
                href={recap.video_url}
                download
                className="steampunk-button-secondary flex items-center gap-2 px-6"
              >
                <Download className="w-4 h-4" />
                {t.recapView.download}
              </a>
            )}

            <Link
              to="/gallery"
              className="steampunk-button-secondary flex items-center gap-2 px-6"
            >
              {t.recapView.galleryLink}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Share Section */}
        {showShare && (
          <div className="steampunk-card p-6 mb-6">
            <h3 className="text-lg font-semibold text-brass-200 mb-4">{t.recapView.shareRecap}</h3>
            <SocialShare
              url={window.location.href}
              title={recap.title}
              description={recap.description}
            />
          </div>
        )}
      </div>
    </div>
  );
}
