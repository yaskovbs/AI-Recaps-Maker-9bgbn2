import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  fetchVideoTasks,
  deleteVideoTask,
  deleteVideoTasks,
  cancelVideoTask,
  getTaskStats,
  VIDEO_TASKS_UNAVAILABLE_MESSAGE,
} from '@/lib/videoTaskService';
import type { VideoTask, TaskFilterOptions, TaskStatus } from '@/lib/videoTaskTypes';
import { PROCESSING_STATUSES } from '@/lib/videoTaskTypes';

const AUTO_REFRESH_INTERVAL = 30_000;

function hasVisibleTaskChange(current: VideoTask, incoming: VideoTask): boolean {
  const ignoredFields = new Set(['heartbeat_at', 'locked_at', 'worker_id', 'updated_at']);
  return Object.keys(incoming).some(key => {
    if (ignoredFields.has(key)) return false;
    const currentValue = current[key as keyof VideoTask];
    const incomingValue = incoming[key as keyof VideoTask];
    if (currentValue === incomingValue) return false;
    if (typeof currentValue === 'object' && typeof incomingValue === 'object') {
      return JSON.stringify(currentValue) !== JSON.stringify(incomingValue);
    }
    return true;
  });
}

export function useVideoTasks(filters: TaskFilterOptions = {}) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<VideoTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    error: 0,
    storageUsedMb: 0,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const loadTasks = useCallback(async () => {
    if (!user) return;
    const data = await fetchVideoTasks(user.id, filtersRef.current);
    setTasks(data);
  }, [user]);

  const loadStats = useCallback(async () => {
    if (!user) return;
    const s = await getTaskStats(user.id);
    setStats(s);
  }, [user]);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      await Promise.all([loadTasks(), loadStats()]);
      setIsAvailable(true);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Unable to load video tasks.';
      setError(message);
      setIsAvailable(message !== VIDEO_TASKS_UNAVAILABLE_MESSAGE);
    }
  }, [loadTasks, loadStats]);

  useEffect(() => {
    if (!user) {
      setTasks([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    refresh().finally(() => setIsLoading(false));
  }, [user, refresh]);

  useEffect(() => {
    if (!user) return;
    loadTasks().catch(cause => {
      setError(cause instanceof Error ? cause.message : 'Unable to load video tasks.');
    });
  }, [filters.status, filters.priority, filters.search, filters.sortBy, filters.sortOrder]);

  useEffect(() => {
    const hasProcessing = tasks.some(t =>
      PROCESSING_STATUSES.includes(t.status as any)
    );

    if (hasProcessing) {
      intervalRef.current = setInterval(() => {
        loadTasks().catch(cause => {
          setError(cause instanceof Error ? cause.message : 'Unable to refresh video tasks.');
        });
      }, AUTO_REFRESH_INTERVAL);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [tasks, loadTasks]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`video_tasks_changes:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'video_tasks',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'DELETE') {
            void refresh();
            return;
          }

          const incoming = payload.new as VideoTask;
          const existing = tasksRef.current.find(task => task.id === incoming.id);
          const statusChanged = !!existing && existing.status !== incoming.status;
          setTasks(currentTasks => {
            const current = currentTasks.find(task => task.id === incoming.id);
            if (!current || !hasVisibleTaskChange(current, incoming)) return currentTasks;
            return currentTasks.map(task => task.id === incoming.id ? incoming : task);
          });

          if (statusChanged) {
            void Promise.all([loadTasks(), loadStats()]).catch(cause => {
              setError(cause instanceof Error ? cause.message : 'Unable to refresh video tasks.');
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refresh, loadTasks, loadStats]);

  const removeTask = useCallback(async (taskId: string) => {
    const success = await deleteVideoTask(taskId);
    if (success) {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      loadStats();
    }
    return success;
  }, [loadStats]);

  const removeTasks = useCallback(async (taskIds: string[]) => {
    const success = await deleteVideoTasks(taskIds);
    if (success) {
      setTasks(prev => prev.filter(t => !taskIds.includes(t.id)));
      loadStats();
    }
    return success;
  }, [loadStats]);

  const cancelTask = useCallback(async (taskId: string) => {
    const success = await cancelVideoTask(taskId);
    if (success) {
      refresh();
    }
    return success;
  }, [refresh]);

  return {
    tasks,
    isLoading,
    error,
    isAvailable,
    stats,
    refresh,
    removeTask,
    removeTasks,
    cancelTask,
  };
}
