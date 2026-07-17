import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Film, Calendar, Eye, Share2, Trash2, Download, Edit, Plus, Search, Globe, Lock } from 'lucide-react';
import SocialShare from '@/components/SocialShare';
import ExportMenu from '@/components/export/ExportMenu';

interface Recap {
  id: string;
  title: string;
  description?: string;
  genre?: string;
  status: string;
  created_at: string;
  youtube_url?: string;
  movie_title?: string;
  recap_length_seconds: number;
  metadata?: any;
  is_public?: boolean;
}

export default function MyRecaps() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recaps, setRecaps] = useState<Recap[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecap, setSelectedRecap] = useState<Recap | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadRecaps();
  }, [user]);

  const loadRecaps = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Load jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;

      // Load public_recaps to check is_public status
      const { data: publicData, error: publicError } = await supabase
        .from('public_recaps')
        .select('id, is_public')
        .eq('user_id', user.id);

      if (publicError && publicError.code !== 'PGRST116') throw publicError;

      // Merge is_public status
      const publicMap = new Map(publicData?.map(p => [p.id, p.is_public]) || []);
      const mergedData = jobsData?.map(job => ({
        ...job,
        is_public: publicMap.get(job.id) || false,
      })) || [];

      setRecaps(mergedData);
    } catch (error) {
      console.error('Error loading recaps:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (recapId: string) => {
    if (!confirm(t.myRecaps.confirmDelete)) return;

    try {
      // Delete from jobs
      const { error: jobError } = await supabase
        .from('jobs')
        .delete()
        .eq('id', recapId)
        .eq('user_id', user.id);

      if (jobError) throw jobError;

      // Delete from public_recaps if exists
      await supabase
        .from('public_recaps')
        .delete()
        .eq('id', recapId)
        .eq('user_id', user.id);

      setRecaps(recaps.filter(r => r.id !== recapId));
    } catch (error) {
      console.error('Error deleting recap:', error);
      alert(t.myRecaps.deleteFailed);
    }
  };

  const handleTogglePublic = async (recap: Recap) => {
    if (!user) return;

    try {
      const newPublicState = !recap.is_public;

      if (newPublicState) {
        // Make public - insert/update in public_recaps
        const { error } = await supabase
          .from('public_recaps')
          .upsert({
            id: recap.id,
            user_id: user.id,
            username: user.username,
            title: recap.title || recap.movie_title || t.myRecaps.untitled,
            description: recap.description || '',
            genre: recap.genre || 'action',
            thumbnail_url: recap.metadata?.thumbnail_url || '',
            video_url: recap.metadata?.video_url || `https://example.com/recaps/${recap.id}.mp4`,
            is_public: true,
            rating: 0,
            views: 0,
          });

        if (error) throw error;
      } else {
        // Make private - update is_public to false
        const { error } = await supabase
          .from('public_recaps')
          .update({ is_public: false })
          .eq('id', recap.id)
          .eq('user_id', user.id);

        if (error) throw error;
      }

      // Update local state
      setRecaps(recaps.map(r => 
        r.id === recap.id ? { ...r, is_public: newPublicState } : r
      ));

    } catch (error) {
      console.error('Error toggling public state:', error);
      alert('שגיאה בעדכון מצב הפרטיות');
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'bg-green-900/30 text-green-400 border-green-700/50';
      case 'processing':
        return 'bg-blue-900/30 text-blue-400 border-blue-700/50';
      case 'failed':
        return 'bg-red-900/30 text-red-400 border-red-700/50';
      default:
        return 'bg-steam-800/50 text-brass-400 border-brass-700/30';
    }
  };

  const filteredRecaps = recaps.filter(recap =>
    recap.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recap.movie_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recap.genre?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brass-600/20 border-t-brass-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-brass-300">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-brass-200 mb-2">
              {t.myRecaps.title}
            </h1>
            <p className="text-brass-400">
              {t.myRecaps.subtitle} ({filteredRecaps.length} {t.myRecaps.recaps})
            </p>
          </div>
          <button
            onClick={() => navigate('/create')}
            className="steampunk-button flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {t.myRecaps.createNew}
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brass-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t.myRecaps.searchPlaceholder}
            className="steampunk-input w-full pr-10"
          />
        </div>
      </div>

      {/* Recaps Grid */}
      {filteredRecaps.length === 0 ? (
        <div className="text-center py-16">
          <Film className="w-24 h-24 mx-auto mb-4 text-brass-500 opacity-50" />
          <h3 className="text-xl font-semibold text-brass-300 mb-2">
            {searchQuery ? t.myRecaps.noResults : t.myRecaps.empty}
          </h3>
          <p className="text-brass-500 mb-6">
            {searchQuery ? t.myRecaps.tryDifferentSearch : t.myRecaps.emptySubtitle}
          </p>
          {!searchQuery && (
            <button
              onClick={() => navigate('/create')}
              className="steampunk-button inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {t.myRecaps.createFirst}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecaps.map(recap => (
            <div
              key={recap.id}
              className="steampunk-card p-6 hover:shadow-brass transition-all hover:-translate-y-1 group"
            >
              {/* Thumbnail Placeholder */}
              <div className="aspect-video bg-gradient-to-br from-steam-800 to-steam-900 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
                <Film className="w-12 h-12 text-brass-500 opacity-50" />
                <div className="absolute inset-0 bg-gradient-to-t from-steam-950/80 to-transparent"></div>
                
                {/* Status Badge */}
                <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-semibold border ${getStatusColor(recap.status)}`}>
                  {t.dashboard.recentRecaps.status[recap.status as keyof typeof t.dashboard.recentRecaps.status] || recap.status}
                </div>

                {/* Duration */}
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-steam-950/90 rounded text-xs text-brass-300">
                  {formatDuration(recap.recap_length_seconds)}
                </div>
              </div>

              {/* Info */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-brass-200 mb-1 line-clamp-2 group-hover:text-brass-100 transition-colors">
                  {recap.title || recap.movie_title || t.myRecaps.untitled}
                </h3>
                
                {recap.genre && (
                  <div className="flex items-center gap-2 text-xs text-brass-400 mb-2">
                    <span className="px-2 py-0.5 bg-steam-900/50 rounded">{recap.genre}</span>
                  </div>
                )}

                {recap.description && (
                  <p className="text-sm text-brass-400 line-clamp-2 mb-2">
                    {recap.description}
                  </p>
                )}

                <div className="flex items-center gap-2 text-xs text-brass-500">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(recap.created_at).toLocaleDateString('he-IL')}</span>
                </div>
              </div>

              {/* Visibility Toggle */}
              <div className="mb-3 pb-3 border-b border-brass-700/30">
                <button
                  onClick={() => handleTogglePublic(recap)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                    recap.is_public
                      ? 'bg-green-900/20 border-green-700/50 hover:bg-green-900/30'
                      : 'bg-steam-900/50 border-brass-700/30 hover:border-brass-600/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {recap.is_public ? (
                      <Globe className="w-4 h-4 text-green-400" />
                    ) : (
                      <Lock className="w-4 h-4 text-brass-400" />
                    )}
                    <span className={`text-sm font-medium ${
                      recap.is_public ? 'text-green-300' : 'text-brass-300'
                    }`}>
                      {recap.is_public ? t.myRecaps.public : t.myRecaps.private}
                    </span>
                  </div>
                  <span className="text-xs text-brass-500">
                    {recap.is_public ? t.myRecaps.makePrivate : t.myRecaps.makePublic}
                  </span>
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/recap/${recap.id}`)}
                  className="flex-1 steampunk-button text-sm py-2 flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  {t.myRecaps.view}
                </button>

                <button
                  onClick={() => {
                    setSelectedRecap(recap);
                    setShowShareDialog(true);
                  }}
                  className="steampunk-button-secondary p-2"
                  title={t.myRecaps.share}
                >
                  <Share2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setSelectedRecap(recap);
                    setShowExportMenu(true);
                  }}
                  className="steampunk-button-secondary p-2"
                  title={t.myRecaps.export}
                >
                  <Download className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDelete(recap.id)}
                  className="steampunk-button-secondary p-2 hover:!bg-red-900/30 hover:!border-red-700/50"
                  title={t.myRecaps.delete}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Share Dialog */}
      {showShareDialog && selectedRecap && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="steampunk-card p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-brass-200 mb-4">{t.myRecaps.shareRecap}</h3>
            <SocialShare
              url={`${window.location.origin}/recap/${selectedRecap.id}`}
              title={selectedRecap.title || selectedRecap.movie_title || ''}
              description={selectedRecap.description}
            />
            <button
              onClick={() => setShowShareDialog(false)}
              className="steampunk-button-secondary w-full mt-4"
            >
              {t.common.close}
            </button>
          </div>
        </div>
      )}

      {/* Export Menu */}
      {showExportMenu && selectedRecap && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="steampunk-card p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-brass-200 mb-4">{t.myRecaps.exportRecap}</h3>
            <ExportMenu
              recapId={selectedRecap.id}
              title={selectedRecap.title || selectedRecap.movie_title || 'recap'}
              onClose={() => setShowExportMenu(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
