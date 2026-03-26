import React, { useState, useCallback } from 'react';
import { X, Link2, Upload, Layers3, Loader as Loader2, CircleAlert as AlertCircle, Youtube } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { apiKeysService } from '@/lib/apiKeysService';
import { createVideoTask, fetchPlaylistItems, processVideoTask } from '@/lib/videoTaskService';
import type { TaskPriority, TaskSourceType } from '@/lib/videoTaskTypes';
import { supabase } from '@/lib/supabase';
import PlaylistSelector from './PlaylistSelector';

interface NewVideoTaskDialogProps {
  onClose: () => void;
  onCreated: () => void;
}

interface PlaylistItem {
  videoId: string;
  title: string;
  thumbnail: string;
  position: number;
  duration?: number;
}

export default function NewVideoTaskDialog({ onClose, onCreated }: NewVideoTaskDialogProps) {
  const { user } = useAuth();

  const [sourceType, setSourceType] = useState<'youtube' | 'upload'>('youtube');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [enable3d, setEnable3d] = useState(false);

  const [isFetchingPlaylist, setIsFetchingPlaylist] = useState(false);
  const [playlistItems, setPlaylistItems] = useState<PlaylistItem[]>([]);
  const [selectedVideoIds, setSelectedVideoIds] = useState<Set<string>>(new Set());
  const [fetchedType, setFetchedType] = useState<string>('');
  const [fetchError, setFetchError] = useState('');

  const [uploading, setUploading] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleFetchUrl = useCallback(async () => {
    if (!user || !youtubeUrl.trim()) return;

    setIsFetchingPlaylist(true);
    setFetchError('');
    setPlaylistItems([]);
    setSelectedVideoIds(new Set());
    setFetchedType('');

    const { keys } = await apiKeysService.loadKeys(user.id);
    if (!keys.youtube) {
      setFetchError('YouTube API key not configured. Go to Settings to add it.');
      setIsFetchingPlaylist(false);
      return;
    }

    const result = await fetchPlaylistItems(youtubeUrl, keys.youtube);

    if (result.error) {
      setFetchError(result.error);
      setIsFetchingPlaylist(false);
      return;
    }

    setFetchedType(result.type);
    setPlaylistItems(result.items);
    setSelectedVideoIds(new Set(result.items.map(i => i.videoId)));

    if (result.type === 'video' && result.items.length === 1 && !title) {
      setTitle(result.items[0].title);
    }

    setIsFetchingPlaylist(false);
  }, [user, youtubeUrl, title]);

  const handleFileUpload = useCallback(async () => {
    if (!user) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setUploading(true);
      try {
        const ext = file.name.split('.').pop();
        const fileName = `${user.id}/upload-${Date.now()}.${ext}`;

        const { error } = await supabase.storage
          .from('video-originals')
          .upload(fileName, file, { cacheControl: '3600', upsert: false });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('video-originals')
          .getPublicUrl(fileName);

        setUploadedFileUrl(publicUrl);
        setUploadedFileName(file.name);
        if (!title) setTitle(file.name.replace(/\.[^.]+$/, ''));
      } catch (err: any) {
        setSubmitError(err.message || 'Upload failed');
      } finally {
        setUploading(false);
      }
    };

    input.click();
  }, [user, title]);

  const toggleVideoSelection = useCallback((videoId: string) => {
    setSelectedVideoIds(prev => {
      const next = new Set(prev);
      if (next.has(videoId)) next.delete(videoId);
      else next.add(videoId);
      return next;
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const { keys } = await apiKeysService.loadKeys(user.id);

      if (sourceType === 'youtube') {
        if (fetchedType === 'playlist' && selectedVideoIds.size > 0) {
          for (const item of playlistItems.filter(i => selectedVideoIds.has(i.videoId))) {
            const videoUrl = `https://www.youtube.com/watch?v=${item.videoId}`;
            const task = await createVideoTask(user.id, {
              source_url: videoUrl,
              source_type: 'youtube' as TaskSourceType,
              title: item.title || title,
              priority,
              enable_3d_conversion: enable3d,
            });

            if (task) {
              processVideoTask(task.id, {
                youtube: keys.youtube,
                gemini: keys.gemini,
              });
            }
          }
        } else {
          const task = await createVideoTask(user.id, {
            source_url: youtubeUrl,
            source_type: 'youtube' as TaskSourceType,
            title: title || 'YouTube Video',
            priority,
            enable_3d_conversion: enable3d,
          });

          if (task) {
            processVideoTask(task.id, {
              youtube: keys.youtube,
              gemini: keys.gemini,
            });
          }
        }
      } else {
        const task = await createVideoTask(user.id, {
          source_url: uploadedFileUrl || undefined,
          source_type: 'upload' as TaskSourceType,
          title: title || uploadedFileName || 'Uploaded Video',
          priority,
          enable_3d_conversion: enable3d,
        });

        if (task && keys.gemini) {
          processVideoTask(task.id, { gemini: keys.gemini });
        }
      }

      onCreated();
      onClose();
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = sourceType === 'youtube'
    ? (youtubeUrl.trim() && (playlistItems.length === 0 || selectedVideoIds.size > 0))
    : !!uploadedFileUrl;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="steampunk-card max-w-xl w-full max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-brass-700/30">
          <h2 className="text-xl font-serif font-bold text-brass-200">New Video Task</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-steam-800 text-brass-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSourceType('youtube')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                sourceType === 'youtube'
                  ? 'border-brass-500 bg-brass-900/50 text-brass-200'
                  : 'border-brass-700/30 text-brass-400 hover:border-brass-600/50'
              }`}
            >
              <Youtube className="w-5 h-5" />
              YouTube
            </button>
            <button
              type="button"
              onClick={() => setSourceType('upload')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                sourceType === 'upload'
                  ? 'border-brass-500 bg-brass-900/50 text-brass-200'
                  : 'border-brass-700/30 text-brass-400 hover:border-brass-600/50'
              }`}
            >
              <Upload className="w-5 h-5" />
              Upload File
            </button>
          </div>

          {sourceType === 'youtube' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-brass-300 mb-1.5">YouTube URL</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brass-500" />
                    <input
                      type="url"
                      value={youtubeUrl}
                      onChange={e => setYoutubeUrl(e.target.value)}
                      placeholder="https://youtube.com/watch?v=... or playlist URL"
                      className="steampunk-input w-full pl-10 py-2.5"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleFetchUrl}
                    disabled={!youtubeUrl.trim() || isFetchingPlaylist}
                    className="steampunk-button px-4 py-2.5 flex items-center gap-2 disabled:opacity-50"
                  >
                    {isFetchingPlaylist ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Fetch'}
                  </button>
                </div>
              </div>

              {fetchError && (
                <div className="flex items-start gap-2 p-3 bg-red-900/20 border border-red-700/30 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300">{fetchError}</p>
                </div>
              )}

              {playlistItems.length > 0 && (
                <div>
                  <label className="block text-sm text-brass-300 mb-1.5">
                    {fetchedType === 'playlist' ? 'Select Videos from Playlist' : 'Video Found'}
                  </label>
                  <PlaylistSelector
                    items={playlistItems}
                    selectedIds={selectedVideoIds}
                    onToggle={toggleVideoSelection}
                    onSelectAll={() => setSelectedVideoIds(new Set(playlistItems.map(i => i.videoId)))}
                    onDeselectAll={() => setSelectedVideoIds(new Set())}
                  />
                </div>
              )}
            </div>
          )}

          {sourceType === 'upload' && (
            <div>
              <button
                type="button"
                onClick={handleFileUpload}
                disabled={uploading}
                className="steampunk-button w-full py-4 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    {uploadedFileName || 'Select Video File'}
                  </>
                )}
              </button>
              {uploadedFileName && (
                <p className="text-green-400 text-sm mt-2">{uploadedFileName} uploaded</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm text-brass-300 mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Video title"
              className="steampunk-input w-full py-2.5"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-brass-300 mb-1.5">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as TaskPriority)}
                className="w-full bg-steam-900/50 border border-brass-600/30 text-brass-200 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brass-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-brass-300 mb-1.5">3D Conversion</label>
              <button
                type="button"
                onClick={() => setEnable3d(!enable3d)}
                className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 transition-all ${
                  enable3d
                    ? 'border-copper-500 bg-copper-900/30 text-copper-300'
                    : 'border-brass-700/30 text-brass-400 hover:border-brass-600/50'
                }`}
              >
                <Layers3 className="w-4 h-4" />
                {enable3d ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>

          {submitError && (
            <div className="flex items-start gap-2 p-3 bg-red-900/20 border border-red-700/30 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{submitError}</p>
            </div>
          )}
        </form>

        <div className="p-6 border-t border-brass-700/30 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-steam-800 hover:bg-steam-700 text-brass-300 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="flex-1 steampunk-button py-3 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              `Create Task${fetchedType === 'playlist' && selectedVideoIds.size > 1 ? `s (${selectedVideoIds.size})` : ''}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
