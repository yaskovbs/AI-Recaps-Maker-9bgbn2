import React from 'react';
import { FileVideo, Play, Download, Eye, Trash2, MoveVertical as MoreVertical, TriangleAlert as AlertTriangle, Clock, Loader as Loader2, CircleCheck as CheckCircle, Circle as XCircle, Layers3, ArrowUp, ArrowRight, ArrowDown } from 'lucide-react';
import type { VideoTask, TaskPriority } from '@/lib/videoTaskTypes';
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS, PROCESSING_STATUSES } from '@/lib/videoTaskTypes';
import CountdownTimer from './CountdownTimer';

interface VideoTaskCardProps {
  task: VideoTask;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onViewDetails: (task: VideoTask) => void;
  onDelete: (task: VideoTask) => void;
  onPlay: (task: VideoTask) => void;
  onDownload: (task: VideoTask) => void;
}

const priorityIcons: Record<TaskPriority, React.ReactNode> = {
  high: <ArrowUp className="w-3 h-3 text-red-400" />,
  medium: <ArrowRight className="w-3 h-3 text-yellow-400" />,
  low: <ArrowDown className="w-3 h-3 text-green-400" />,
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="w-4 h-4 text-brass-400" />,
  downloading: <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />,
  processing: <Loader2 className="w-4 h-4 text-copper-400 animate-spin" />,
  summarizing: <Loader2 className="w-4 h-4 text-brass-400 animate-spin" />,
  converting_3d: <Layers3 className="w-4 h-4 text-copper-300 animate-pulse" />,
  completed: <CheckCircle className="w-4 h-4 text-green-400" />,
  error: <AlertTriangle className="w-4 h-4 text-red-400" />,
  cancelled: <XCircle className="w-4 h-4 text-brass-500" />,
};

const statusBgColors: Record<string, string> = {
  pending: 'bg-brass-900/20 border-brass-700/30',
  downloading: 'bg-blue-900/20 border-blue-700/30',
  processing: 'bg-copper-900/20 border-copper-700/30',
  summarizing: 'bg-brass-900/20 border-brass-600/30',
  converting_3d: 'bg-copper-900/30 border-copper-600/30',
  completed: 'bg-green-900/20 border-green-700/30',
  error: 'bg-red-900/20 border-red-700/30',
  cancelled: 'bg-steam-800/50 border-brass-700/20',
};

export default function VideoTaskCard({
  task,
  isSelected,
  onToggleSelect,
  onViewDetails,
  onDelete,
  onPlay,
  onDownload,
}: VideoTaskCardProps) {
  const isProcessing = PROCESSING_STATUSES.includes(task.status as any);

  return (
    <div
      className={`steampunk-card p-5 transition-all hover:shadow-brass group ${
        isSelected ? 'ring-2 ring-brass-500/60' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <label className="flex items-center pt-1 cursor-pointer">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(task.id)}
            className="w-4 h-4 rounded border-brass-600/50 bg-steam-900/50 text-brass-500 focus:ring-brass-500/30 cursor-pointer"
          />
        </label>

        {/* Thumbnail */}
        <div className="w-24 h-16 bg-gradient-to-br from-steam-800 to-steam-900 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden relative">
          {task.thumbnail_url ? (
            <img src={task.thumbnail_url} alt={task.title} className="w-full h-full object-cover" />
          ) : (
            <FileVideo className="w-8 h-8 text-brass-600" />
          )}
          {task.enable_3d_conversion && (
            <div className="absolute top-1 right-1 px-1 py-0.5 bg-copper-900/80 rounded text-[10px] text-copper-300 font-bold">
              3D
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3
              className="text-sm font-semibold text-brass-200 truncate cursor-pointer hover:text-brass-100 transition-colors"
              onClick={() => onViewDetails(task)}
            >
              {task.title}
            </h3>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {priorityIcons[task.priority]}
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${statusBgColors[task.status]}`}>
                {statusIcons[task.status]}
                {TASK_STATUS_LABELS[task.status]}
              </span>
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-xs text-brass-500 truncate mt-1">{task.description}</p>
          )}

          {/* Progress */}
          {isProcessing && (
            <div className="mt-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-brass-400">{task.current_step || 'Processing...'}</span>
                <span className="text-brass-500 font-mono">{task.progress_percentage}%</span>
              </div>
              <div className="h-1.5 bg-steam-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brass-500 to-copper-500 transition-all duration-500"
                  style={{ width: `${task.progress_percentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Error */}
          {task.status === 'error' && task.error_message && (
            <div className="mt-2 flex items-start gap-1.5">
              <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-400">{task.error_message}</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-3">
              <span className="text-xs text-brass-600">
                {new Date(task.created_at).toLocaleDateString('he-IL')}
              </span>
              {task.status === 'completed' && (
                <CountdownTimer expiresAt={task.expires_at} compact />
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {task.status === 'completed' && task.processed_file_url && (
                <>
                  <button
                    onClick={() => onPlay(task)}
                    className="p-1.5 rounded hover:bg-brass-700/20 text-brass-400 hover:text-brass-200 transition-colors"
                    title="Play"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDownload(task)}
                    className="p-1.5 rounded hover:bg-brass-700/20 text-brass-400 hover:text-brass-200 transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </>
              )}
              <button
                onClick={() => onViewDetails(task)}
                className="p-1.5 rounded hover:bg-brass-700/20 text-brass-400 hover:text-brass-200 transition-colors"
                title="View Details"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(task)}
                className="p-1.5 rounded hover:bg-red-900/30 text-brass-400 hover:text-red-400 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
