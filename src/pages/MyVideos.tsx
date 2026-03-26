import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useVideoTasks } from '@/hooks/useVideoTasks';
import type { VideoTask, TaskFilterOptions } from '@/lib/videoTaskTypes';
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS, PROCESSING_STATUSES } from '@/lib/videoTaskTypes';
import VideoTaskCard from '@/components/video/VideoTaskCard';
import BatchActionsBar from '@/components/video/BatchActionsBar';
import DeleteConfirmModal from '@/components/video/DeleteConfirmModal';
import TaskDetailsModal from '@/components/video/TaskDetailsModal';
import NewVideoTaskDialog from '@/components/video/NewVideoTaskDialog';
import { Search, Plus, Filter, Import as SortAsc, Dessert as SortDesc, RefreshCw, FileVideo, HardDrive, Clock, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, X } from 'lucide-react';

export default function MyVideos() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [filters, setFilters] = useState<TaskFilterOptions>({
    status: 'all',
    priority: 'all',
    search: '',
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  const { tasks, isLoading, stats, refresh, removeTask, removeTasks, cancelTask } = useVideoTasks(filters);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailTask, setDetailTask] = useState<VideoTask | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ ids: string[]; names: string[] } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(tasks.map(t => t.id)));
  }, [tasks]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const hasProcessingSelected = useMemo(() => {
    return tasks.some(t => selectedIds.has(t.id) && PROCESSING_STATUSES.includes(t.status as any));
  }, [tasks, selectedIds]);

  const handleDeleteSelected = () => {
    const ids = Array.from(selectedIds);
    const names = tasks.filter(t => ids.includes(t.id)).map(t => t.title);
    setDeleteTarget({ ids, names });
  };

  const handleDeleteSingle = (task: VideoTask) => {
    setDeleteTarget({ ids: [task.id], names: [task.title] });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    if (deleteTarget.ids.length === 1) {
      await removeTask(deleteTarget.ids[0]);
    } else {
      await removeTasks(deleteTarget.ids);
    }
    setSelectedIds(prev => {
      const next = new Set(prev);
      deleteTarget.ids.forEach(id => next.delete(id));
      return next;
    });
    setIsDeleting(false);
    setDeleteTarget(null);
  };

  const handleCancelSelected = async () => {
    const ids = Array.from(selectedIds).filter(id => {
      const task = tasks.find(t => t.id === id);
      return task && PROCESSING_STATUSES.includes(task.status as any);
    });
    for (const id of ids) {
      await cancelTask(id);
    }
    deselectAll();
  };

  const handlePlay = (task: VideoTask) => {
    if (task.processed_file_url) {
      window.open(task.processed_file_url, '_blank');
    }
  };

  const handleDownload = (task: VideoTask) => {
    if (task.processed_file_url) {
      const link = document.createElement('a');
      link.href = task.processed_file_url;
      link.download = `${task.title}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const toggleSort = () => {
    setFilters(prev => ({
      ...prev,
      sortOrder: prev.sortOrder === 'desc' ? 'asc' : 'desc',
    }));
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-serif font-bold text-brass-200 mb-1">
                My Videos
              </h1>
              <p className="text-brass-400 text-sm">
                Manage your downloaded and processed videos
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => refresh()}
                className="steampunk-button-secondary p-2 border border-brass-600/30 rounded-lg text-brass-300 hover:text-brass-200 hover:bg-brass-700/20 transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowNewTaskDialog(true)}
                className="steampunk-button flex items-center gap-2 px-4 py-2"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">New Task</span>
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <StatCard icon={<FileVideo className="w-4 h-4" />} label="Total" value={stats.total} color="text-brass-300" />
            <StatCard icon={<Clock className="w-4 h-4" />} label="Processing" value={stats.processing} color="text-blue-400" />
            <StatCard icon={<CheckCircle className="w-4 h-4" />} label="Completed" value={stats.completed} color="text-green-400" />
            <StatCard icon={<AlertTriangle className="w-4 h-4" />} label="Errors" value={stats.error} color="text-red-400" />
            <StatCard icon={<HardDrive className="w-4 h-4" />} label="Storage" value={`${(stats.storageUsedMb / 1024).toFixed(1)} GB`} color="text-copper-400" />
          </div>

          {/* Search & Filters */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brass-500" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  placeholder="Search videos..."
                  className="steampunk-input w-full pl-10 pr-8 py-2.5"
                />
                {filters.search && (
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brass-500 hover:text-brass-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`steampunk-button-secondary p-2.5 border rounded-lg transition-colors ${
                  showFilters ? 'bg-brass-700/20 border-brass-500/50 text-brass-200' : 'border-brass-600/30 text-brass-400'
                }`}
              >
                <Filter className="w-5 h-5" />
              </button>
              <button
                onClick={toggleSort}
                className="steampunk-button-secondary p-2.5 border border-brass-600/30 rounded-lg text-brass-400 hover:text-brass-200 transition-colors"
                title={filters.sortOrder === 'desc' ? 'Newest first' : 'Oldest first'}
              >
                {filters.sortOrder === 'desc' ? <SortDesc className="w-5 h-5" /> : <SortAsc className="w-5 h-5" />}
              </button>
            </div>

            {showFilters && (
              <div className="flex flex-wrap gap-3 p-4 bg-steam-900/50 border border-brass-700/20 rounded-lg">
                <div>
                  <label className="block text-xs text-brass-500 mb-1">Status</label>
                  <select
                    value={filters.status || 'all'}
                    onChange={e => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                    className="bg-steam-900/50 border border-brass-600/30 text-brass-200 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brass-500"
                  >
                    <option value="all">All Statuses</option>
                    {Object.entries(TASK_STATUS_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-brass-500 mb-1">Priority</label>
                  <select
                    value={filters.priority || 'all'}
                    onChange={e => setFilters(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="bg-steam-900/50 border border-brass-600/30 text-brass-200 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brass-500"
                  >
                    <option value="all">All Priorities</option>
                    {Object.entries(TASK_PRIORITY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-brass-500 mb-1">Sort By</label>
                  <select
                    value={filters.sortBy || 'created_at'}
                    onChange={e => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                    className="bg-steam-900/50 border border-brass-600/30 text-brass-200 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brass-500"
                  >
                    <option value="created_at">Date</option>
                    <option value="title">Name</option>
                    <option value="expires_at">Expiration</option>
                    <option value="priority">Priority</option>
                    <option value="status">Status</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Batch Actions */}
        <BatchActionsBar
          selectedCount={selectedIds.size}
          totalCount={tasks.length}
          onSelectAll={selectAll}
          onDeselectAll={deselectAll}
          onDeleteSelected={handleDeleteSelected}
          onCancelSelected={handleCancelSelected}
          hasProcessingSelected={hasProcessingSelected}
        />

        {/* Task List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-brass-600/20 border-t-brass-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-brass-400">Loading tasks...</p>
            </div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-20">
            <FileVideo className="w-20 h-20 mx-auto mb-4 text-brass-600 opacity-40" />
            <h3 className="text-xl font-semibold text-brass-300 mb-2">
              {filters.search || (filters.status && filters.status !== 'all')
                ? 'No matching tasks'
                : 'No video tasks yet'}
            </h3>
            <p className="text-brass-500 mb-6 max-w-md mx-auto">
              {filters.search || (filters.status && filters.status !== 'all')
                ? 'Try adjusting your search or filters'
                : 'Start by creating a new video task to download, process and convert videos.'}
            </p>
            {!filters.search && (!filters.status || filters.status === 'all') && (
              <button
                onClick={() => setShowNewTaskDialog(true)}
                className="steampunk-button inline-flex items-center gap-2 px-6 py-3"
              >
                <Plus className="w-5 h-5" />
                Create Your First Task
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map(task => (
              <VideoTaskCard
                key={task.id}
                task={task}
                isSelected={selectedIds.has(task.id)}
                onToggleSelect={toggleSelect}
                onViewDetails={setDetailTask}
                onDelete={handleDeleteSingle}
                onPlay={handlePlay}
                onDownload={handleDownload}
              />
            ))}
          </div>
        )}

        {/* Task count footer */}
        {tasks.length > 0 && (
          <div className="mt-6 text-center text-xs text-brass-600">
            Showing {tasks.length} task{tasks.length !== 1 ? 's' : ''}
            {selectedIds.size > 0 && ` | ${selectedIds.size} selected`}
          </div>
        )}
      </div>

      {/* Modals */}
      {detailTask && (
        <TaskDetailsModal
          task={detailTask}
          onClose={() => setDetailTask(null)}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          taskNames={deleteTarget.names}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
          isDeleting={isDeleting}
        />
      )}

      {showNewTaskDialog && (
        <NewVideoTaskDialog
          onClose={() => setShowNewTaskDialog(false)}
          onCreated={() => {
            setShowNewTaskDialog(false);
            setTimeout(() => refresh(), 500);
          }}
        />
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-steam-900/40 border border-brass-700/20 rounded-lg px-3 py-2.5 flex items-center gap-3">
      <div className={color}>{icon}</div>
      <div>
        <p className="text-lg font-bold text-brass-200 leading-tight">{value}</p>
        <p className="text-xs text-brass-500">{label}</p>
      </div>
    </div>
  );
}
