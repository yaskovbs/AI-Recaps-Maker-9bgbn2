import React, { useState, useEffect } from 'react';
import { X, Clock, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Info, Download, FileVideo, Layers3, Brain, Tag } from 'lucide-react';
import { fetchTaskLogs, getTaskDownloadUrl } from '@/lib/videoTaskService';
import type { VideoTask, TaskLog } from '@/lib/videoTaskTypes';
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from '@/lib/videoTaskTypes';
import CountdownTimer from './CountdownTimer';

interface TaskDetailsModalProps {
  task: VideoTask;
  onClose: () => void;
}

const logLevelConfig = {
  info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-900/20' },
  warning: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-900/20' },
  error: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-900/20' },
};

export default function TaskDetailsModal({ task, onClose }: TaskDetailsModalProps) {
  const [logs, setLogs] = useState<TaskLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'summary' | 'logs' | 'error'>('details');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    loadLogs();
    if (task.status === 'completed') void getTaskDownloadUrl(task).then(setDownloadUrl);
  }, [task.id]);

  const loadLogs = async () => {
    setIsLoadingLogs(true);
    const data = await fetchTaskLogs(task.id);
    setLogs(data);
    setIsLoadingLogs(false);
  };

  useEffect(() => {
    if (task.status === 'error') {
      setActiveTab('error');
    }
  }, [task.status]);

  const statusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'cancelled': return 'text-brass-500';
      default: return 'text-blue-400';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="steampunk-card max-w-2xl w-full max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-brass-700/30">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-xl font-serif font-bold text-brass-200 truncate">
              {task.title}
            </h2>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className={`text-sm font-semibold ${statusColor(task.status)}`}>
                {TASK_STATUS_LABELS[task.status]}
              </span>
              <span className="text-xs text-brass-500">
                {TASK_PRIORITY_LABELS[task.priority]}
              </span>
              <span className="text-xs text-brass-500">
                {new Date(task.created_at).toLocaleString('he-IL')}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-steam-800 text-brass-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-brass-700/30">
          {(['details', ...(task.summary_text ? ['summary'] : []), 'logs', ...(task.status === 'error' ? ['error'] : [])] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-3 text-sm font-medium transition-all border-b-2 ${
                activeTab === tab
                  ? 'text-brass-200 border-brass-500'
                  : 'text-brass-500 border-transparent hover:text-brass-300'
              }`}
            >
              {tab === 'details' && 'Details'}
              {tab === 'summary' && 'AI Summary'}
              {tab === 'logs' && `Logs (${logs.length})`}
              {tab === 'error' && 'Error'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Progress */}
              {task.status !== 'completed' && task.status !== 'error' && task.status !== 'cancelled' && (
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-brass-300">{task.current_step || 'Processing...'}</span>
                    <span className="text-brass-400 font-mono">{task.progress_percentage}%</span>
                  </div>
                  <div className="h-2 bg-steam-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brass-500 to-copper-500 transition-all duration-500"
                      style={{ width: `${task.progress_percentage}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <InfoItem label="Source Type" value={task.source_type} />
                <InfoItem label="Priority" value={TASK_PRIORITY_LABELS[task.priority]} />
                {task.source_url && <InfoItem label="Source URL" value={task.source_url} className="col-span-2 break-all" />}
                {task.description && <InfoItem label="Description" value={task.description} className="col-span-2" />}
                {task.duration_seconds > 0 && (
                  <InfoItem label="Duration" value={formatDuration(task.duration_seconds)} />
                )}
                {task.file_size_mb > 0 && (
                  <InfoItem label="File Size" value={`${task.file_size_mb.toFixed(1)} MB`} />
                )}
                <InfoItem
                  label="3D Conversion"
                  value={task.enable_3d_conversion ? 'Enabled' : 'Disabled'}
                  icon={task.enable_3d_conversion ? <Layers3 className="w-4 h-4 text-copper-400" /> : undefined}
                />
                {task.started_at && (
                  <InfoItem label="Started" value={new Date(task.started_at).toLocaleString('he-IL')} />
                )}
                {task.completed_at && (
                  <InfoItem label="Completed" value={new Date(task.completed_at).toLocaleString('he-IL')} />
                )}
              </div>

              {/* Countdown */}
              {task.status === 'completed' && (
                <div>
                  <label className="block text-xs text-brass-500 mb-2 uppercase tracking-wider">Expiration</label>
                  <CountdownTimer expiresAt={task.expires_at} />
                </div>
              )}

              {/* Processing Steps */}
              {task.processing_logs.length > 0 && (
                <div>
                  <label className="block text-xs text-brass-500 mb-3 uppercase tracking-wider">Processing Steps</label>
                  <div className="space-y-2">
                    {task.processing_logs.map((log, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 bg-steam-900/30 rounded">
                        {log.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />}
                        {log.status === 'running' && <Clock className="w-4 h-4 text-blue-400 animate-pulse flex-shrink-0" />}
                        {log.status === 'pending' && <Clock className="w-4 h-4 text-brass-600 flex-shrink-0" />}
                        {log.status === 'failed' && <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                        <span className="text-sm text-brass-300 flex-1">{log.message}</span>
                        <span className="text-xs text-brass-600">
                          {new Date(log.timestamp).toLocaleTimeString('he-IL')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {task.status === 'completed' && downloadUrl && (
                <div className="flex gap-3">
                  <a
                    href={downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 steampunk-button py-3 flex items-center justify-center gap-2"
                  >
                    <FileVideo className="w-5 h-5" />
                    Play Now
                  </a>
                  <a
                    href={downloadUrl}
                    download={`${task.title}.mp4`}
                    className="flex-1 steampunk-button-secondary py-3 flex items-center justify-center gap-2 border border-brass-600/30 rounded-lg text-brass-200 hover:bg-brass-700/20 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    Download
                  </a>
                </div>
              )}
            </div>
          )}

          {activeTab === 'summary' && task.summary_text && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Brain className="w-5 h-5 text-copper-400" />
                <h3 className="text-lg font-semibold text-brass-200">AI Analysis</h3>
                {task.summary_language && (
                  <span className="text-xs px-2 py-0.5 bg-brass-800/50 text-brass-400 rounded">
                    {task.summary_language === 'he' ? 'Hebrew' : task.summary_language === 'ar' ? 'Arabic' : 'English'}
                  </span>
                )}
              </div>

              <div className="bg-steam-900/40 border border-brass-700/20 rounded-lg p-5">
                <p className="text-sm text-brass-200 leading-relaxed whitespace-pre-wrap">
                  {task.summary_text}
                </p>
              </div>

              {task.key_topics && task.key_topics.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="w-4 h-4 text-brass-400" />
                    <label className="text-xs text-brass-500 uppercase tracking-wider">Key Topics</label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {task.key_topics.map((topic, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 bg-brass-800/40 border border-brass-600/20 rounded-full text-xs text-brass-300"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-2">
              {isLoadingLogs ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-2 border-brass-600/20 border-t-brass-600 rounded-full animate-spin" />
                </div>
              ) : logs.length === 0 ? (
                <p className="text-center text-brass-500 py-8">No logs available</p>
              ) : (
                logs.map(log => {
                  const cfg = logLevelConfig[log.level];
                  const LogIcon = cfg.icon;
                  return (
                    <div key={log.id} className={`flex items-start gap-3 p-3 rounded-lg ${cfg.bg}`}>
                      <LogIcon className={`w-4 h-4 ${cfg.color} flex-shrink-0 mt-0.5`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-brass-200">{log.message}</p>
                        <p className="text-xs text-brass-500 mt-1">
                          {new Date(log.created_at).toLocaleString('he-IL')}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'error' && task.status === 'error' && (
            <div className="space-y-6">
              <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <AlertTriangle className="w-8 h-8 text-red-400 flex-shrink-0" />
                  <div>
                    {task.error_code && (
                      <span className="inline-block px-2 py-0.5 bg-red-900/40 text-red-300 text-xs font-mono rounded mb-2">
                        {task.error_code}
                      </span>
                    )}
                    <h3 className="text-lg font-semibold text-red-300">
                      {task.error_message || 'An error occurred'}
                    </h3>
                    {task.error_details && (
                      <p className="text-sm text-red-400/80 mt-2">{task.error_details}</p>
                    )}
                  </div>
                </div>
              </div>

              {task.error_action && (
                <div className="bg-brass-900/20 border border-brass-600/30 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-brass-300 mb-2">Suggested Action</h4>
                  <p className="text-sm text-brass-400">{task.error_action}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value, className = '', icon }: { label: string; value: string; className?: string; icon?: React.ReactNode }) {
  return (
    <div className={className}>
      <label className="block text-xs text-brass-500 mb-1 uppercase tracking-wider">{label}</label>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-brass-200">{value}</span>
      </div>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}
