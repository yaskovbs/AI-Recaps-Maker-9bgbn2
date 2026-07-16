import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { useYouTubeChannels } from '@/hooks/useYouTubeChannels';
import { RewardedAd } from '@/components/ads/AdSenseUnit';
import { supabase } from '@/lib/supabase';
import { Youtube, Plus, Trash2, RefreshCw, Lock, ChevronDown, ChevronUp, Sparkles, Film, Clock, Palette, Music, Tag } from 'lucide-react';

export default function YouTubeLearning() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const {
    channels,
    slotInfo,
    isLoading,
    addChannel,
    removeChannel,
    syncChannel,
    recordAdView,
    settings,
    saveSettings,
  } = useYouTubeChannels(user?.id);
  
  const [channelInput, setChannelInput] = useState('');
  const [showAdDialog, setShowAdDialog] = useState(false);
  const [adsWatchedForSlot, setAdsWatchedForSlot] = useState(0);
  const [pendingChannelInput, setPendingChannelInput] = useState('');
  const [expandedChannels, setExpandedChannels] = useState<Set<string>>(new Set());
  const autoSynced = useRef(new Set<string>());

  useEffect(() => {
    const now=Date.now();
    channels.forEach(channel=>{
      const stale=!channel.last_synced_at || now-new Date(channel.last_synced_at).getTime()>=settings.refresh_interval_seconds*1000;
      if(stale&&!autoSynced.current.has(channel.id)){autoSynced.current.add(channel.id);void syncChannel(channel.id);}
    });
  },[channels,settings.refresh_interval_seconds,syncChannel]);

  const toggleChannelExpanded = (channelId: string) => {
    setExpandedChannels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(channelId)) {
        newSet.delete(channelId);
      } else {
        newSet.add(channelId);
      }
      return newSet;
    });
  };

  const handleAddChannel = async () => {
    if (!user) {
      alert('יש להתחבר כדי להוסיף ערוצים');
      return;
    }

    if (!channelInput.trim()) {
      alert('הזן URL, @handle, או channel ID');
      return;
    }

    // Check if slot needs to be unlocked
    if (slotInfo.needsAdsToUnlock && adsWatchedForSlot < slotInfo.adsRequired) {
      setPendingChannelInput(channelInput);
      setShowAdDialog(true);
      return;
    }

    // Add channel
    const result = await addChannel(channelInput, adsWatchedForSlot === slotInfo.adsRequired ? 'ads' : false);
    if (result.success) {
      setChannelInput('');
      setAdsWatchedForSlot(0);
      alert('ערוץ נוסף בהצלחה!');
    } else {
      alert(result.error || 'שגיאה בהוספת ערוץ');
    }
  };

  const handleRemoveChannel = async (channelId: string) => {
    if (!confirm('האם למחוק ערוץ זה?')) return;
    const success = await removeChannel(channelId);
    if (success) {
      alert('ערוץ הוסר');
    } else {
      alert('שגיאה בהסרת ערוץ');
    }
  };

  const handleSyncChannel = async (channelId: string) => {
    const success = await syncChannel(channelId);
    if (success) {
      alert('ערוץ סונכרן!');
    } else {
      alert('שגיאה בסנכרון');
    }
  };

  const handleAdReward = async (eventId: string) => {
    const recorded = await recordAdView('youtube_slot', 'rewarded', eventId);
    if (!recorded) return;
    
    const newCount = adsWatchedForSlot + 1;
    setAdsWatchedForSlot(newCount);

    if (newCount >= slotInfo.adsRequired) {
      setShowAdDialog(false);
      const result = await addChannel(pendingChannelInput, 'ads');
      if (result.success) {
        setChannelInput('');
        setPendingChannelInput('');
        setAdsWatchedForSlot(0);
        alert('סלוט נפתח! ערוץ נוסף בהצלחה!');
      } else {
        alert(result.error || 'שגיאה בהוספת ערוץ');
      }
    } else {
      alert(`נותרו עוד ${slotInfo.adsRequired - newCount} מודעות`);
    }
  };

  const handleCreditUnlock = async () => {
    const { data, error } = await supabase.rpc('purchase_youtube_slot_with_credits');
    if (error || !data) { alert(error?.message || 'Unable to purchase slot.'); return; }
    const result = await addChannel(pendingChannelInput, 'credits');
    if (result.success) { setShowAdDialog(false); setPendingChannelInput(''); setChannelInput(''); }
    else alert(result.error || 'Unable to add channel.');
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold text-brass-200 mb-2 flex items-center gap-3">
            <Youtube className="w-10 h-10" />
            {t.youtube.title}
          </h1>
          <p className="text-brass-300">{t.youtube.description}</p>
        </div>

        {/* Slots Info */}
        <div className="steampunk-card p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-brass-300 text-sm mb-1">{t.youtube.channels.slots}</p>
              <p className="text-2xl font-bold text-brass-100">
                {slotInfo.freeSlots} / {slotInfo.totalSlots}
              </p>
              <p className="text-xs text-brass-500 mt-1">
                {slotInfo.usedSlots} ערוצים פעילים
              </p>
            </div>
            
            {slotInfo.needsAdsToUnlock && (
              <div className="text-right">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-5 h-5 text-brass-400" />
                  <span className="text-sm text-brass-300">
                    נדרשות {slotInfo.adsRequired} מודעות
                  </span>
                </div>
                <p className="text-xs text-brass-500">
                  שכבה: {slotInfo.nextTier === 'premium_12' && '12 ערוצים'}
                  {slotInfo.nextTier === 'premium_22' && '22 ערוצים'}
                  {slotInfo.nextTier === 'unlimited' && 'בלתי מוגבל'}
                </p>
              </div>
            )}
          </div>

          {slotInfo.needsAdsToUnlock && adsWatchedForSlot > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-brass-400 mb-1">
                <span>התקדמות פתיחת סלוט</span>
                <span>{adsWatchedForSlot} / {slotInfo.adsRequired}</span>
              </div>
              <div className="w-full bg-steam-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-brass-500 to-copper-500 h-full transition-all"
                  style={{ width: `${(adsWatchedForSlot / slotInfo.adsRequired) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Add Channel */}
        <div className="steampunk-card p-6 mb-8">
          <h2 className="text-xl font-serif font-semibold text-brass-200 mb-4">
            {t.youtube.channels.add}
          </h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={channelInput}
              onChange={(e) => setChannelInput(e.target.value)}
              placeholder={t.youtube.input.placeholder}
              className="flex-1 bg-steam-900/50 border border-brass-600/30 rounded-lg p-3 text-brass-200 focus:outline-none focus:ring-2 focus:ring-brass-500"
            />
            <button
              onClick={handleAddChannel}
              disabled={!user || isLoading}
              className="steampunk-button px-6 flex items-center gap-2 disabled:opacity-50"
            >
              <Plus className="w-5 h-5" />
              {t.youtube.input.add}
            </button>
          </div>
          <p className="text-xs text-brass-400 mt-2">
            פורמטים נתמכים: https://youtube.com/... , @channelhandle , UC...channelID
          </p>
        </div>

        {/* Channels List */}
        <div className="steampunk-card p-8">
          <h2 className="text-2xl font-serif font-semibold text-brass-200 mb-6">
            {t.youtube.channels.title}
          </h2>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-brass-600/20 border-t-brass-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-brass-300">טוען ערוצים...</p>
            </div>
          ) : channels.length === 0 ? (
            <div className="text-center py-12">
              <Youtube className="w-12 h-12 text-brass-400 mx-auto mb-4" />
              <p className="text-brass-300">{t.youtube.channels.empty}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {channels.map((channel) => {
                const isExpanded = expandedChannels.has(channel.id);
                const insights = channel.learning_insights;

                return (
                  <div
                    key={channel.id}
                    className="bg-steam-800/30 border border-brass-700/20 rounded-lg overflow-hidden hover:bg-steam-800/50 transition-all"
                  >
                    {/* Channel Header */}
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brass-500 to-copper-600 flex items-center justify-center">
                          <Youtube className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-brass-200 font-medium">{channel.channel_name}</p>
                          <p className="text-xs text-brass-400">
                            {channel.channel_handle || channel.channel_id}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs px-2 py-0.5 bg-brass-900/50 rounded text-brass-300">
                              {channel.slot_type === 'free' && 'חינם'}
                              {channel.slot_type === 'premium_12' && 'פרימיום 12'}
                              {channel.slot_type === 'premium_22' && 'פרימיום 22'}
                              {channel.slot_type === 'unlimited' && 'בלתי מוגבל'}
                            </span>
                            {insights && insights.videos_analyzed > 0 && (
                              <span className="text-xs px-2 py-0.5 bg-purple-900/30 border border-purple-600/30 rounded text-purple-300 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                {insights.videos_analyzed} סרטונים נותחו
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {insights && insights.videos_analyzed > 0 && (
                          <button
                            onClick={() => toggleChannelExpanded(channel.id)}
                            className="p-2 bg-brass-700/30 hover:bg-brass-700/50 text-brass-200 rounded transition-all"
                            title={isExpanded ? t.youtube.channels.hideInsights : t.youtube.channels.viewInsights}
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        )}
                        <button
                          onClick={() => handleSyncChannel(channel.id)}
                          className="p-2 bg-brass-700/30 hover:bg-brass-700/50 text-brass-200 rounded transition-all"
                          title="סנכרן"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveChannel(channel.id)}
                          className="p-2 bg-red-900/30 hover:bg-red-900/50 text-red-300 rounded transition-all"
                          title="הסר"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Learning Insights (Expanded) */}
                    {isExpanded && insights && (
                      <div className="border-t border-brass-700/20 bg-steam-900/50 p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <Sparkles className="w-5 h-5 text-purple-400" />
                          <h3 className="text-lg font-semibold text-brass-200">
                            {t.youtube.insights.title}
                          </h3>
                        </div>

                        {insights.videos_analyzed === 0 ? (
                          <p className="text-brass-400 text-sm">{t.youtube.insights.noData}</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Videos Analyzed */}
                            <div className="bg-steam-800/50 rounded-lg p-4 border border-brass-700/10">
                              <div className="flex items-center gap-2 mb-2">
                                <Film className="w-4 h-4 text-brass-400" />
                                <p className="text-xs text-brass-400">{t.youtube.insights.videosAnalyzed}</p>
                              </div>
                              <p className="text-2xl font-bold text-brass-100">{insights.videos_analyzed}</p>
                            </div>

                            {/* Avg Duration */}
                            <div className="bg-steam-800/50 rounded-lg p-4 border border-brass-700/10">
                              <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-4 h-4 text-brass-400" />
                                <p className="text-xs text-brass-400">{t.youtube.insights.avgDuration}</p>
                              </div>
                              <p className="text-2xl font-bold text-brass-100">
                                {formatDuration(insights.avg_duration_seconds)}
                              </p>
                            </div>

                            {/* Genres */}
                            {insights.genres && insights.genres.length > 0 && (
                              <div className="bg-steam-800/50 rounded-lg p-4 border border-brass-700/10">
                                <div className="flex items-center gap-2 mb-2">
                                  <Tag className="w-4 h-4 text-brass-400" />
                                  <p className="text-xs text-brass-400">{t.youtube.insights.genres}</p>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {insights.genres.map((genre, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-1 bg-brass-900/50 border border-brass-600/30 rounded text-xs text-brass-200"
                                    >
                                      {genre}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Topics */}
                            {insights.topics && insights.topics.length > 0 && (
                              <div className="bg-steam-800/50 rounded-lg p-4 border border-brass-700/10">
                                <div className="flex items-center gap-2 mb-2">
                                  <Sparkles className="w-4 h-4 text-brass-400" />
                                  <p className="text-xs text-brass-400">{t.youtube.insights.topics}</p>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {insights.topics.map((topic, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-1 bg-purple-900/30 border border-purple-600/30 rounded text-xs text-purple-200"
                                    >
                                      {topic}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Editing Style */}
                            {insights.editing_style && (
                              <div className="bg-steam-800/50 rounded-lg p-4 border border-brass-700/10">
                                <p className="text-xs text-brass-400 mb-1">{t.youtube.insights.editingStyle}</p>
                                <p className="text-brass-200">{insights.editing_style}</p>
                              </div>
                            )}

                            {/* Music Style */}
                            {insights.music_style && (
                              <div className="bg-steam-800/50 rounded-lg p-4 border border-brass-700/10">
                                <div className="flex items-center gap-2 mb-2">
                                  <Music className="w-4 h-4 text-brass-400" />
                                  <p className="text-xs text-brass-400">{t.youtube.insights.musicStyle}</p>
                                </div>
                                <p className="text-brass-200">{insights.music_style}</p>
                              </div>
                            )}

                            {/* Color Palette */}
                            {insights.color_palette && insights.color_palette.length > 0 && (
                              <div className="bg-steam-800/50 rounded-lg p-4 border border-brass-700/10 md:col-span-2">
                                <div className="flex items-center gap-2 mb-2">
                                  <Palette className="w-4 h-4 text-brass-400" />
                                  <p className="text-xs text-brass-400">{t.youtube.insights.colorPalette}</p>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {insights.color_palette.map((color, idx) => (
                                    <span
                                      key={idx}
                                      className="px-3 py-1 bg-gradient-to-r from-brass-900/50 to-copper-900/50 border border-brass-600/30 rounded-full text-xs text-brass-200"
                                    >
                                      {color}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Last Learning */}
                            {insights.last_learning_at && (
                              <div className="bg-steam-800/50 rounded-lg p-4 border border-brass-700/10 md:col-span-2">
                                <p className="text-xs text-brass-400 mb-1">{t.youtube.insights.lastLearning}</p>
                                <p className="text-sm text-green-400">
                                  {new Date(insights.last_learning_at).toLocaleString('he-IL')}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Learning Settings */}
        <div className="steampunk-card p-8 mt-6">
          <h2 className="text-2xl font-serif font-semibold text-brass-200 mb-6">
            {t.youtube.settings.title}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-brass-200 font-medium mb-2">
                {t.youtube.settings.refreshInterval}
              </label>
              <select value={settings.refresh_interval_seconds} onChange={e=>void saveSettings({...settings,refresh_interval_seconds:Number(e.target.value)})} className="w-full bg-steam-900/50 border border-brass-600/30 rounded-lg p-3 text-brass-200 focus:outline-none focus:ring-2 focus:ring-brass-500">
                <option value="3600">כל שעה</option>
                <option value="21600">כל 6 שעות</option>
                <option value="86400">כל 24 שעות</option>
                <option value="604800">כל שבוע</option>
              </select>
            </div>

            <div>
              <label className="block text-brass-200 font-medium mb-2">
                {t.youtube.settings.scope}
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-brass-300">
                  <input type="checkbox" checked={settings.include_public} onChange={e=>void saveSettings({...settings,include_public:e.target.checked})} className="rounded" />
                  {t.youtube.settings.public}
                </label>
                <label className="flex items-center gap-2 text-brass-300">
                  <input type="checkbox" checked={settings.include_shorts} onChange={e=>void saveSettings({...settings,include_shorts:e.target.checked})} className="rounded" />
                  {t.youtube.settings.shorts}
                </label>
                <label className="flex items-center gap-2 text-brass-300">
                  <input type="checkbox" checked={settings.include_live} onChange={e=>void saveSettings({...settings,include_live:e.target.checked})} className="rounded" />
                  {t.youtube.settings.live}
                </label>
                <label className="flex items-center gap-2 text-brass-300">
                  <input type="checkbox" checked={settings.recent_90_days} onChange={e=>void saveSettings({...settings,recent_90_days:e.target.checked})} className="rounded" />
                  {t.youtube.settings.recent90}
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ad Dialog for Slot Unlocking */}
      {showAdDialog && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="steampunk-card max-w-xl w-full p-6">
            <h3 className="text-xl font-semibold text-brass-200 mb-4">
              פתיחת סלוט ערוץ נוסף
            </h3>
            <p className="text-brass-300 mb-4">
              צפה ב-{slotInfo.adsRequired} מודעות כדי לפתוח סלוט זה ({adsWatchedForSlot} / {slotInfo.adsRequired})
            </p>
            <button onClick={handleCreditUnlock} className="steampunk-button-secondary w-full py-3 mb-4">Use 2 credits for a 7-day slot</button>
            
            <RewardedAd
              onRewardEarned={handleAdReward}
              onAdClosed={() => {
                setShowAdDialog(false);
                setPendingChannelInput('');
              }}
              rewardType="youtube_slot"
            />
          </div>
        </div>
      )}
    </div>
  );
}
