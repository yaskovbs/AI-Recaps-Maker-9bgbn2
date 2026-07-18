import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { apiKeysService } from '@/lib/apiKeysService';

export interface LearningInsights {
  videos_analyzed: number;
  genres: string[];
  avg_duration_seconds: number;
  topics: string[];
  editing_style: string;
  color_palette: string[];
  music_style: string;
  last_learning_at: string | null;
}

export interface YouTubeChannel {
  id: string;
  user_id: string;
  channel_id: string;
  channel_handle?: string;
  channel_url?: string;
  channel_name?: string;
  channel_description?: string;
  subscriber_count?: number;
  video_count?: number;
  is_active: boolean;
  slot_unlocked_at?: string;
  slot_type: 'free' | 'premium_12' | 'premium_22' | 'unlimited';
  last_synced_at?: string;
  learning_insights?: LearningInsights;
  created_at: string;
  updated_at: string;
}

export interface SlotInfo {
  totalSlots: number;
  usedSlots: number;
  freeSlots: number;
  needsAdsToUnlock: boolean;
  adsRequired: number; // 0 or 2
  nextTier: 'premium_12' | 'premium_22' | 'unlimited' | null;
}
export interface YouTubeLearningSettings { refresh_interval_seconds:number;include_public:boolean;include_shorts:boolean;include_live:boolean;recent_90_days:boolean; }

export function useYouTubeChannels(userId: string | undefined) {
  const [channels, setChannels] = useState<YouTubeChannel[]>([]);
  const [slotInfo, setSlotInfo] = useState<SlotInfo>({
    totalSlots: 11,
    usedSlots: 0,
    freeSlots: 11,
    needsAdsToUnlock: false,
    adsRequired: 0,
    nextTier: 'premium_12',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [settings,setSettings]=useState<YouTubeLearningSettings>({refresh_interval_seconds:86400,include_public:true,include_shorts:true,include_live:true,recent_90_days:true});

  useEffect(() => {
    if (userId) {
      loadChannels();
      void loadSettings();
    }
  }, [userId]);

  const loadChannels = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('youtube_channels')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setChannels(data || []);
      calculateSlotInfo(data || []);
    } catch (error) {
      console.error('Error loading YouTube channels:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateSlotInfo = (currentChannels: YouTubeChannel[]) => {
    const usedSlots = currentChannels.length;
    let totalSlots = 11; // Base free slots
    let needsAdsToUnlock = false;
    let adsRequired = 0;
    let nextTier: SlotInfo['nextTier'] = 'premium_12';

    if (usedSlots >= 11 && usedSlots < 12) {
      // Need to unlock slot 12
      totalSlots = 11;
      needsAdsToUnlock = true;
      adsRequired = 2;
      nextTier = 'premium_12';
    } else if (usedSlots >= 12 && usedSlots < 22) {
      // In premium_12 tier, can go up to 22
      totalSlots = usedSlots < 22 ? usedSlots + 1 : 22;
      needsAdsToUnlock = usedSlots < 22;
      adsRequired = needsAdsToUnlock ? 2 : 0;
      nextTier = usedSlots < 22 ? 'premium_22' : 'unlimited';
    } else if (usedSlots >= 22) {
      // In unlimited tier, always need 2 ads per new channel
      totalSlots = usedSlots + 1;
      needsAdsToUnlock = true;
      adsRequired = 2;
      nextTier = 'unlimited';
    }

    setSlotInfo({
      totalSlots,
      usedSlots,
      freeSlots: totalSlots - usedSlots,
      needsAdsToUnlock,
      adsRequired,
      nextTier,
    });
  };

  const loadSettings=async()=>{if(!userId)return;const{data}=await supabase.from('youtube_learning_settings').select('*').eq('user_id',userId).maybeSingle();if(data)setSettings(data);};
  const saveSettings=async(next:YouTubeLearningSettings)=>{if(!userId)return false;const{error}=await supabase.from('youtube_learning_settings').upsert({user_id:userId,...next,updated_at:new Date().toISOString()});if(!error)setSettings(next);return !error;};

  const fetchChannelDetails = async (input: string) => {
    if (!userId) throw new Error('User not authenticated');
    const { keys } = await apiKeysService.loadKeys(userId);
    if (!keys.youtube) throw new Error('Add and validate a YouTube Data API key in Settings first.');
    const trimmed = input.trim();
    const channelMatch = trimmed.match(/(?:youtube\.com\/channel\/)?(UC[\w-]{20,})/i);
    const handleMatch = trimmed.match(/(?:youtube\.com\/)?@([\w.-]+)/i);
    const query = channelMatch ? `id=${encodeURIComponent(channelMatch[1])}` : handleMatch || trimmed.startsWith('@')
      ? `forHandle=${encodeURIComponent(handleMatch?.[1] || trimmed.slice(1))}` : null;
    if (!query) throw new Error('Use a YouTube channel URL, @handle, or channel ID.');
    const response = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&${query}&key=${encodeURIComponent(keys.youtube)}`);
    const payload = await response.json();
    if (!response.ok) {
      if (response.status === 429 || JSON.stringify(payload).toLowerCase().includes('quota')) throw new Error('YouTube API quota is exhausted.');
      throw new Error(payload?.error?.message || 'YouTube channel lookup failed.');
    }
    const channel = payload.items?.[0];
    if (!channel) throw new Error('YouTube channel was not found.');
    return {
      id: channel.id as string,
      handle: channel.snippet?.customUrl as string | undefined,
      title: channel.snippet?.title as string,
      description: channel.snippet?.description as string,
      subscriberCount: Number(channel.statistics?.subscriberCount || 0),
      videoCount: Number(channel.statistics?.videoCount || 0),
      uploadsPlaylistId: channel.contentDetails?.relatedPlaylists?.uploads as string | undefined,
    };
  };

  const fetchLearningInsights = async (uploadsPlaylistId?: string): Promise<LearningInsights> => {
    if (!userId || !uploadsPlaylistId) return { videos_analyzed: 0, genres: [], avg_duration_seconds: 0, topics: [], editing_style: '', color_palette: [], music_style: '', last_learning_at: new Date().toISOString() };
    const { keys } = await apiKeysService.loadKeys(userId);
    const listResponse = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${encodeURIComponent(uploadsPlaylistId)}&maxResults=50&key=${encodeURIComponent(keys.youtube)}`);
    const listPayload = await listResponse.json();
    if (!listResponse.ok) throw new Error(listPayload?.error?.message || 'Unable to load channel videos.');
    const ids = (listPayload.items || []).map((item: any) => item.contentDetails?.videoId).filter(Boolean);
    if (!ids.length) return { videos_analyzed: 0, genres: [], avg_duration_seconds: 0, topics: [], editing_style: '', color_palette: [], music_style: '', last_learning_at: new Date().toISOString() };
    const videosResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,liveStreamingDetails&id=${ids.join(',')}&key=${encodeURIComponent(keys.youtube)}`);
    const videosPayload = await videosResponse.json();
    if (!videosResponse.ok) throw new Error(videosPayload?.error?.message || 'Unable to analyze channel videos.');
    const cutoff = Date.now() - 90 * 86400000;
    const videos = (videosPayload.items || []).filter((video: any) => new Date(video.snippet?.publishedAt || 0).getTime() >= cutoff);
    const duration = (iso = '') => { const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/); return match ? Number(match[1] || 0) * 3600 + Number(match[2] || 0) * 60 + Number(match[3] || 0) : 0; };
    const words = new Map<string, number>();
    videos.forEach((video: any) => [...(video.snippet?.tags || []), ...(video.snippet?.title || '').split(/\W+/)].forEach((value: string) => { const word = value.trim().toLowerCase(); if (word.length > 3) words.set(word, (words.get(word) || 0) + 1); }));
    const durations = videos.map((video: any) => duration(video.contentDetails?.duration));
    return { videos_analyzed: videos.length, genres: [], avg_duration_seconds: durations.length ? Math.round(durations.reduce((a: number,b: number)=>a+b,0)/durations.length) : 0,
      topics: [...words.entries()].sort((a,b)=>b[1]-a[1]).slice(0,20).map(([word])=>word), editing_style: '', color_palette: [], music_style: '', last_learning_at: new Date().toISOString() };
  };

  const addChannel = async (
    channelInput: string,
    unlockMethod: 'credits' | false = false
  ): Promise<{ success: boolean; error?: string }> => {
    if (!userId) return { success: false, error: 'User not authenticated' };

    // Check if user needs to watch ads first
    if (slotInfo.needsAdsToUnlock && !unlockMethod) {
      return {
        success: false,
        error: `צריך לצפות ב-${slotInfo.adsRequired} מודעות כדי לפתוח סלוט זה`,
      };
    }

    try {
      const details = await fetchChannelDetails(channelInput);
      // Parse channel input (URL, @handle, or UC... ID)
      let channelId = '';
      let channelHandle = '';
      let channelUrl = '';

      if (channelInput.startsWith('@')) {
        channelHandle = channelInput;
        channelUrl = `https://youtube.com/${channelInput}`;
      } else if (channelInput.startsWith('UC')) {
        channelId = channelInput;
        channelUrl = `https://youtube.com/channel/${channelInput}`;
      } else if (channelInput.includes('youtube.com')) {
        channelUrl = channelInput;
        if (channelInput.includes('/channel/')) {
          channelId = channelInput.split('/channel/')[1].split(/[/?]/)[0];
        } else if (channelInput.includes('/@')) {
          channelHandle = '@' + channelInput.split('/@')[1].split(/[/?]/)[0];
        }
      } else {
        return { success: false, error: 'פורמט לא תקין. השתמש ב-URL, @handle, או UC... ID' };
      }

      // For now, use handle or ID as channel_id (in real app, use YouTube API to resolve)
      const finalChannelId = details.id;

      const { data: existingChannel } = await supabase.from('youtube_channels').select('id').eq('user_id', userId).eq('channel_id', finalChannelId).maybeSingle();
      if (existingChannel) return { success: false, error: 'This channel is already connected.' };

      // Determine slot type
      let slotType: YouTubeChannel['slot_type'] = 'free';
      if (slotInfo.usedSlots >= 22) {
        slotType = 'unlimited';
      } else if (slotInfo.usedSlots >= 12) {
        slotType = 'premium_22';
      } else if (slotInfo.usedSlots >= 11) {
        slotType = 'premium_12';
      }

      const { data, error } = await supabase
        .from('youtube_channels')
        .insert({
          user_id: userId,
          channel_id: finalChannelId,
          channel_handle: details.handle || channelHandle || null,
          channel_url: `https://youtube.com/channel/${details.id}`,
          channel_name: details.title,
          channel_description: details.description,
          subscriber_count: details.subscriberCount,
          video_count: details.videoCount,
          slot_type: slotType,
          slot_unlocked_at: unlockMethod ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return { success: false, error: 'ערוץ זה כבר קיים' };
        }
        throw error;
      }

      await loadChannels();
      return { success: true };
    } catch (error: any) {
      console.error('Error adding channel:', error);
      return { success: false, error: error.message || 'שגיאה בהוספת ערוץ' };
    }
  };

  const removeChannel = async (channelId: string): Promise<boolean> => {
    if (!userId) return false;

    try {
      const { error } = await supabase
        .from('youtube_channels')
        .delete()
        .eq('id', channelId)
        .eq('user_id', userId);

      if (error) throw error;

      await loadChannels();
      return true;
    } catch (error) {
      console.error('Error removing channel:', error);
      return false;
    }
  };

  const syncChannel = async (channelId: string): Promise<boolean> => {
    try {
      const channel = channels.find(item => item.id === channelId);
      if (!channel) return false;
      const details = await fetchChannelDetails(channel.channel_id);
      const insights = await fetchLearningInsights(details.uploadsPlaylistId);
      const { error } = await supabase
        .from('youtube_channels')
        .update({
          channel_handle: details.handle || null,
          channel_name: details.title,
          channel_description: details.description,
          subscriber_count: details.subscriberCount,
          video_count: details.videoCount,
          learning_insights: insights,
          last_synced_at: new Date().toISOString(),
        })
        .eq('id', channelId)
        .eq('user_id', userId!);

      if (error) throw error;

      await loadChannels();
      return true;
    } catch (error) {
      console.error('Error syncing channel:', error);
      return false;
    }
  };

  return {
    channels,
    slotInfo,
    isLoading,
    loadChannels,
    addChannel,
    removeChannel,
    syncChannel,
    settings,
    saveSettings,
  };
}
