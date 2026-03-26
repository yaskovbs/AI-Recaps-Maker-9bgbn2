import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/lib/LanguageContext';
import { useWallet } from '@/hooks/useWallet';
import { getJobs } from '@/lib/recapService';
import { useVideoTasks } from '@/hooks/useVideoTasks';
import SocialShare from '@/components/SocialShare';
import CountdownTimer from '@/components/video/CountdownTimer';
import { TASK_STATUS_LABELS } from '@/lib/videoTaskTypes';
import { Plus, ChartBar as BarChart3, Settings, Wallet, Video, Clock, CircleCheck as CheckCircle, CircleAlert as AlertCircle, FileVideo, HardDrive, ArrowRight, Timer } from 'lucide-react';

export default function Dashboard() {
  const { t } = useLanguage();
  const { wallet } = useWallet();
  const jobs = getJobs();
  const { tasks: videoTasks, stats: videoStats, isLoading: videoLoading } = useVideoTasks();

  const recapStats = {
    total: jobs.length,
    inProgress: jobs.filter(j => j.status === 'processing').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    credits: wallet.balance,
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-900/50 text-green-300';
      case 'processing': case 'downloading': case 'summarizing': case 'converting_3d': return 'bg-copper-900/50 text-copper-300';
      case 'error': return 'bg-red-900/50 text-red-300';
      case 'cancelled': return 'bg-steam-800/50 text-brass-500';
      default: return 'bg-brass-900/50 text-brass-400';
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold text-brass-200 mb-2">
            {t.dashboard.title}
          </h1>
          <p className="text-brass-300">
            {t.dashboard.welcome}
          </p>
        </div>

        {(() => {
          const expiringTasks = videoTasks.filter(t => {
            if (t.status !== 'completed') return false;
            const hoursLeft = (new Date(t.expires_at).getTime() - Date.now()) / (1000 * 60 * 60);
            return hoursLeft > 0 && hoursLeft <= 168;
          });
          if (expiringTasks.length === 0) return null;
          const critical = expiringTasks.filter(t => {
            const hoursLeft = (new Date(t.expires_at).getTime() - Date.now()) / (1000 * 60 * 60);
            return hoursLeft <= 24;
          });
          return (
            <div className={`mb-6 p-4 rounded-lg border flex items-start gap-3 ${
              critical.length > 0
                ? 'bg-red-900/20 border-red-700/30'
                : 'bg-yellow-900/15 border-yellow-700/25'
            }`}>
              <Timer className={`w-5 h-5 flex-shrink-0 mt-0.5 ${critical.length > 0 ? 'text-red-400' : 'text-yellow-400'}`} />
              <div>
                <p className={`text-sm font-medium ${critical.length > 0 ? 'text-red-300' : 'text-yellow-300'}`}>
                  {critical.length > 0
                    ? `${critical.length} file${critical.length > 1 ? 's' : ''} expiring within 24 hours!`
                    : `${expiringTasks.length} file${expiringTasks.length > 1 ? 's' : ''} expiring within 7 days`
                  }
                </p>
                <p className={`text-xs mt-1 ${critical.length > 0 ? 'text-red-400/70' : 'text-yellow-400/70'}`}>
                  Download your files before they are automatically removed.
                </p>
                <Link to="/my-videos" className={`text-xs mt-2 inline-block underline ${critical.length > 0 ? 'text-red-300' : 'text-yellow-300'}`}>
                  Go to My Videos
                </Link>
              </div>
            </div>
          );
        })()}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="steampunk-card p-6">
            <div className="flex items-center justify-between mb-2">
              <Video className="w-5 h-5 text-brass-400" />
              <span className="text-2xl font-bold text-brass-100">{recapStats.total}</span>
            </div>
            <p className="text-sm text-brass-300">{t.dashboard.quickStats.totalRecaps}</p>
          </div>

          <div className="steampunk-card p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-copper-400" />
              <span className="text-2xl font-bold text-brass-100">{recapStats.inProgress}</span>
            </div>
            <p className="text-sm text-brass-300">{t.dashboard.quickStats.inProgress}</p>
          </div>

          <div className="steampunk-card p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-2xl font-bold text-brass-100">{recapStats.completed}</span>
            </div>
            <p className="text-sm text-brass-300">{t.dashboard.quickStats.completed}</p>
          </div>

          <div className="steampunk-card p-6 bg-gradient-to-br from-brass-700/40 to-copper-700/40">
            <div className="flex items-center justify-between mb-2">
              <Wallet className="w-5 h-5 text-brass-200" />
              <span className="text-2xl font-bold text-brass-100">{recapStats.credits}</span>
            </div>
            <p className="text-sm text-brass-200">{t.dashboard.quickStats.credits}</p>
          </div>
        </div>

        {/* Video Tasks Stats */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-serif font-semibold text-brass-200">
              DimensionDownload Tasks
            </h2>
            <Link to="/my-videos" className="text-sm text-brass-400 hover:text-brass-200 flex items-center gap-1 transition-colors">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-steam-900/40 border border-brass-700/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-1">
                <FileVideo className="w-4 h-4 text-brass-400" />
                <span className="text-xl font-bold text-brass-200">{videoStats.total}</span>
              </div>
              <p className="text-xs text-brass-500">Total Tasks</p>
            </div>
            <div className="bg-steam-900/40 border border-brass-700/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-1">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-xl font-bold text-brass-200">{videoStats.processing}</span>
              </div>
              <p className="text-xs text-brass-500">Processing</p>
            </div>
            <div className="bg-steam-900/40 border border-brass-700/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-1">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-xl font-bold text-brass-200">{videoStats.completed}</span>
              </div>
              <p className="text-xs text-brass-500">Completed</p>
            </div>
            <div className="bg-steam-900/40 border border-brass-700/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-1">
                <HardDrive className="w-4 h-4 text-copper-400" />
                <span className="text-xl font-bold text-brass-200">{(videoStats.storageUsedMb / 1024).toFixed(1)} GB</span>
              </div>
              <p className="text-xs text-brass-500">Storage Used</p>
            </div>
          </div>

          {/* Recent Video Tasks */}
          {videoTasks.length > 0 && (
            <div className="mt-4 space-y-2">
              {videoTasks.slice(0, 3).map(task => (
                <Link
                  key={task.id}
                  to="/my-videos"
                  className="block bg-steam-900/30 border border-brass-700/15 rounded-lg p-4 hover:border-brass-600/30 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileVideo className="w-4 h-4 text-brass-500 flex-shrink-0" />
                      <span className="text-sm text-brass-200 truncate">{task.title}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {task.status === 'completed' && (
                        <CountdownTimer expiresAt={task.expires_at} compact />
                      )}
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor(task.status)}`}>
                        {TASK_STATUS_LABELS[task.status]}
                      </span>
                    </div>
                  </div>
                  {task.progress_percentage > 0 && task.status !== 'completed' && task.status !== 'error' && (
                    <div className="mt-2 h-1 bg-steam-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-brass-500 to-copper-500 transition-all"
                        style={{ width: `${task.progress_percentage}%` }}
                      />
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-serif font-semibold text-brass-200 mb-4">
            {t.dashboard.quickActions.title}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/create"
              className="steampunk-card p-6 hover:shadow-brass transition-all hover:-translate-y-1 flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brass-500 to-copper-600 flex items-center justify-center">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <span className="text-brass-200 font-semibold">{t.dashboard.quickActions.createNew}</span>
            </Link>

            <Link
              to="/my-videos"
              className="steampunk-card p-6 hover:shadow-brass transition-all hover:-translate-y-1 flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-copper-500 to-brass-600 flex items-center justify-center">
                <FileVideo className="w-6 h-6 text-white" />
              </div>
              <span className="text-brass-200 font-semibold">My Videos</span>
            </Link>

            <Link
              to="/analytics"
              className="steampunk-card p-6 hover:shadow-brass transition-all hover:-translate-y-1 flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-steam-600 to-steam-700 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <span className="text-brass-200 font-semibold">{t.dashboard.quickActions.viewAll}</span>
            </Link>

            <Link
              to="/settings"
              className="steampunk-card p-6 hover:shadow-brass transition-all hover:-translate-y-1 flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cog-600 to-cog-700 flex items-center justify-center">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <span className="text-brass-200 font-semibold">{t.dashboard.quickActions.apiSettings}</span>
            </Link>
          </div>
        </div>

        {/* Recent Recaps */}
        <div>
          <h2 className="text-2xl font-serif font-semibold text-brass-200 mb-4">
            {t.dashboard.recentRecaps.title}
          </h2>
          {jobs.length === 0 ? (
            <div className="steampunk-card p-12 text-center">
              <AlertCircle className="w-12 h-12 text-brass-400 mx-auto mb-4" />
              <p className="text-brass-300">{t.dashboard.recentRecaps.empty}</p>
              <Link
                to="/create"
                className="steampunk-button mt-4 inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {t.dashboard.quickActions.createNew}
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.slice(0, 5).map(job => (
                <div key={job.id} className="steampunk-card p-6 hover:shadow-brass transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-brass-200 mb-1">
                        {job.title}
                      </h3>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-brass-400">
                          {new Date(job.createdAt).toLocaleDateString('he-IL')}
                        </p>
                        <SocialShare
                          title={job.title}
                          description={`AI Recap: ${job.title}`}
                          url={`${window.location.origin}/recap/${job.id}`}
                          className="scale-75"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {job.status === 'completed' && (
                        <span className="px-3 py-1 rounded-full bg-green-900/50 text-green-300 text-sm">
                          {t.dashboard.recentRecaps.status.completed}
                        </span>
                      )}
                      {job.status === 'processing' && (
                        <span className="px-3 py-1 rounded-full bg-copper-900/50 text-copper-300 text-sm">
                          {t.dashboard.recentRecaps.status.processing}
                        </span>
                      )}
                      {job.status === 'failed' && (
                        <span className="px-3 py-1 rounded-full bg-red-900/50 text-red-300 text-sm">
                          {t.dashboard.recentRecaps.status.failed}
                        </span>
                      )}
                    </div>
                  </div>
                  {job.status === 'processing' && (
                    <div className="mt-4">
                      <div className="h-2 bg-steam-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-brass-500 to-copper-500 transition-all duration-500"
                          style={{
                            width: `${(job.stages.filter(s => s.status === 'completed').length / job.stages.length) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
