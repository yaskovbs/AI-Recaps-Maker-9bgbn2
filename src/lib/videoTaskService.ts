import { supabase } from './supabase';
import type {
  VideoTask,
  TaskLog,
  CreateTaskParams,
  TaskFilterOptions,
  TaskStatus,
} from './videoTaskTypes';

export const VIDEO_TASKS_UNAVAILABLE_MESSAGE = 'Video processing is not configured on this server yet.';

function videoTaskError(error: { code?: string; message?: string }): Error {
  return new Error(error.code === '42P01'
    ? VIDEO_TASKS_UNAVAILABLE_MESSAGE
    : error.message || 'Unable to load video tasks.');
}

export async function createVideoTask(
  userId: string,
  params: CreateTaskParams
): Promise<VideoTask> {
  const initialLog: ProcessingLogEntry = {
    step: 'created',
    status: 'completed',
    message: 'Task created successfully',
    timestamp: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('video_tasks')
    .insert({
      user_id: userId,
      source_url: params.source_url || null,
      source_type: params.source_type,
      title: params.title,
      description: params.description || null,
      priority: params.priority || 'medium',
      enable_3d_conversion: params.enable_3d_conversion || false,
      processing_logs: [initialLog],
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error creating video task:', error);
    throw videoTaskError(error);
  }

  if (data) {
    await addTaskLog(data.id, 'info', 'Task created and queued for processing');
  }

  if (!data) throw new Error('The server did not return the created processing task.');
  return data;
}

export async function fetchVideoTasks(
  userId: string,
  filters: TaskFilterOptions = {}
): Promise<VideoTask[]> {
  let query = supabase
    .from('video_tasks')
    .select('*')
    .eq('user_id', userId);

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters.priority && filters.priority !== 'all') {
    query = query.eq('priority', filters.priority);
  }

  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  const sortBy = filters.sortBy || 'created_at';
  const sortOrder = filters.sortOrder || 'desc';
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching video tasks:', error);
    throw videoTaskError(error);
  }

  return data || [];
}

export async function fetchTaskById(taskId: string): Promise<VideoTask | null> {
  const { data, error } = await supabase
    .from('video_tasks')
    .select('*')
    .eq('id', taskId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching task:', error);
    return null;
  }

  return data;
}

export async function updateVideoTask(
  taskId: string,
  updates: Partial<Pick<VideoTask, 'status' | 'priority' | 'progress_percentage' | 'current_step' | 'error_code' | 'error_message' | 'error_details' | 'error_action' | 'processed_file_url' | 'started_at' | 'completed_at' | 'processing_logs'>>
): Promise<boolean> {
  const { error } = await supabase
    .from('video_tasks')
    .update(updates)
    .eq('id', taskId);

  if (error) {
    console.error('Error updating video task:', error);
    return false;
  }

  return true;
}

export async function deleteVideoTask(taskId: string): Promise<boolean> {
  return deleteVideoTasks([taskId]);
}

export async function deleteVideoTasks(taskIds: string[]): Promise<boolean> {
  if (taskIds.length === 0) return true;
  const { data: tasks, error: fetchError } = await supabase
    .from('video_tasks')
    .select('status,source_url,output_storage_path,narration_storage_path')
    .in('id', taskIds);
  if (fetchError) {
    console.error('Error loading task files before deletion:', fetchError);
    return false;
  }
  if ((tasks || []).some(task => !['completed', 'error', 'cancelled'].includes(task.status))) {
    console.error('Only completed, failed, or cancelled tasks can be deleted.');
    return false;
  }

  const objectsByBucket = new Map<string, Set<string>>();
  const addStorageReference = (reference: string | null | undefined) => {
    if (!reference?.startsWith('storage://')) return;
    const location = reference.slice('storage://'.length);
    const slash = location.indexOf('/');
    if (slash <= 0 || slash === location.length - 1) return;
    const bucket = location.slice(0, slash);
    const path = location.slice(slash + 1);
    if (!objectsByBucket.has(bucket)) objectsByBucket.set(bucket, new Set());
    objectsByBucket.get(bucket)!.add(path);
  };

  for (const task of tasks || []) {
    addStorageReference(task.source_url);
    addStorageReference(task.narration_storage_path);
    if (task.output_storage_path) {
      if (!objectsByBucket.has('video-processed')) objectsByBucket.set('video-processed', new Set());
      objectsByBucket.get('video-processed')!.add(task.output_storage_path);
    }
  }

  for (const [bucket, paths] of objectsByBucket) {
    const { error: storageError } = await supabase.storage.from(bucket).remove([...paths]);
    if (storageError) {
      console.error(`Error deleting task files from ${bucket}:`, storageError);
      return false;
    }
  }

  const { error } = await supabase
    .from('video_tasks')
    .delete()
    .in('id', taskIds);

  if (error) {
    console.error('Error batch deleting video tasks:', error);
    return false;
  }

  return true;
}

export async function cancelVideoTask(taskId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('cancel_video_task', { p_task_id: taskId });
  return !error && data === true;
}

export async function getTaskDownloadUrl(task: VideoTask): Promise<string | null> {
  if (task.output_storage_path) {
    const { data, error } = await supabase.storage.from('video-processed').createSignedUrl(task.output_storage_path, 300);
    return error ? null : data.signedUrl;
  }
  return task.processed_file_url;
}

export async function fetchTaskLogs(taskId: string): Promise<TaskLog[]> {
  const { data, error } = await supabase
    .from('task_logs')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching task logs:', error);
    return [];
  }

  return data || [];
}

export async function addTaskLog(
  taskId: string,
  level: TaskLog['level'],
  message: string,
  metadata?: Record<string, unknown>
): Promise<boolean> {
  const { error } = await supabase
    .from('task_logs')
    .insert({
      task_id: taskId,
      level,
      message,
      metadata: metadata || null,
    });

  if (error) {
    console.error('Error adding task log:', error);
    return false;
  }

  return true;
}

export async function getTaskStats(userId: string): Promise<{
  total: number;
  pending: number;
  processing: number;
  completed: number;
  error: number;
  storageUsedMb: number;
}> {
  const { data, error } = await supabase
    .from('video_tasks')
    .select('status, file_size_mb')
    .eq('user_id', userId);

  if (error || !data) {
    throw error ? videoTaskError(error) : new Error('Unable to load video task statistics.');
  }

  const activeStatuses: TaskStatus[] = ['downloading', 'processing', 'summarizing', 'converting_3d'];

  return {
    total: data.length,
    pending: data.filter(t => t.status === 'pending').length,
    processing: data.filter(t => activeStatuses.includes(t.status as TaskStatus)).length,
    completed: data.filter(t => t.status === 'completed').length,
    error: data.filter(t => t.status === 'error').length,
    storageUsedMb: data.reduce((sum, t) => sum + (t.file_size_mb || 0), 0),
  };
}

export async function processVideoTask(
  taskId: string,
  apiKeys: { youtube?: string; gemini?: string; googleSearch?: string; searchEngineId?: string; webSearchEnabled?: boolean; language?: string; recapDurationSeconds?: number; narrationAudioUrl?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-video-task`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        'Apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        task_id: taskId,
        youtube_api_key: apiKeys.youtube || '',
        gemini_api_key: apiKeys.gemini || '',
        google_search_api_key: apiKeys.googleSearch || '',
        search_engine_id: apiKeys.searchEngineId || '',
        web_search_enabled: apiKeys.webSearchEnabled === true,
        language: apiKeys.language || 'en',
        recap_duration_seconds: Math.max(1, Math.round(apiKeys.recapDurationSeconds || 60)),
        narration_audio_url: apiKeys.narrationAudioUrl || '',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.error || `HTTP ${response.status}` };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Processing failed';
    return { success: false, error: message };
  }
}

export async function fetchPlaylistItems(
  url: string,
  youtubeApiKey: string
): Promise<{
  type: string;
  items: Array<{ videoId: string; title: string; thumbnail: string; position: number; duration?: number }>;
  totalCount: number;
  error?: string;
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { type: 'error', items: [], totalCount: 0, error: 'Not authenticated' };
    }

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-playlist`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        'Apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ url, youtube_api_key: youtubeApiKey }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { type: 'error', items: [], totalCount: 0, error: errorData.error || `HTTP ${response.status}` };
    }

    return await response.json();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch playlist';
    return { type: 'error', items: [], totalCount: 0, error: message };
  }
}
