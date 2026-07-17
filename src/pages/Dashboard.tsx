import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { useWallet } from '@/hooks/useWallet';
import { getJobs } from '@/lib/recapService';
import { useVideoTasks } from '@/hooks/useVideoTasks';
import SocialShare from '@/components/SocialShare';
import CountdownTimer from '@/components/video/CountdownTimer';
import { TASK_STATUS_LABELS } from '@/lib/videoTaskTypes';
import {
  Plus, BarChart3, Settings, Wallet, Video, Clock, CheckCircle, AlertCircle,
  FileVideo, HardDrive, ArrowRight, Timer, TrendingUp, Sparkles, Zap
} from 'lucide-react';

export default function Dashboard() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { wallet } = useWallet();
  const jobs = getJobs(user?.id);
  const { tasks: videoTasks, stats: videoStats, error: videoTasksError, refresh: refreshVideoTasks } = useVideoTasks();

  const recapStats = {
    total: jobs.length,
    inProgress: jobs.filter(j => j.status === 'processing').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    credits: wallet.balance,
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'completed': return { bg: 'rgba(0,255,128,0.1)', border: 'rgba(0,255,128,0.25)', color: '#00ff80' };
      case 'processing': case 'downloading': case 'summarizing': case 'converting_3d':
        return { bg: 'rgba(0,212,255,0.1)', border: 'rgba(0,212,255,0.25)', color: '#00D4FF' };
      case 'error': return { bg: 'rgba(255,60,60,0.1)', border: 'rgba(255,60,60,0.25)', color: '#ff4444' };
      case 'cancelled': return { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', color: 'rgba(200,200,240,0.4)' };
      default: return { bg: 'rgba(178,75,243,0.08)', border: 'rgba(178,75,243,0.2)', color: '#B24BF3' };
    }
  };

  // Expiring tasks alert
  const expiringTasks = videoTasks.filter(t => {
    if (t.status !== 'completed') return false;
    const hoursLeft = (new Date(t.expires_at).getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursLeft > 0 && hoursLeft <= 168;
  });
  const criticalTasks = expiringTasks.filter(t => {
    const h = (new Date(t.expires_at).getTime() - Date.now()) / (1000 * 60 * 60);
    return h <= 24;
  });

  return (
    <div className="min-h-screen py-8" style={{ background: '#0a0a14' }}>
      <div className="container mx-auto px-4 max-w-6xl">

        {videoTasksError && (
          <div role="alert" className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-red-500/30 bg-red-950/30 p-4 text-sm text-red-200">
            <span>Video processing data is unavailable: {videoTasksError}</span>
            <button onClick={() => void refreshVideoTasks()} className="underline hover:text-white">Retry</button>
          </div>
        )}

        {/* Page Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="neon-badge neon-badge-cyan mb-3 inline-flex">Dashboard</div>
            <h1 className="text-4xl font-bold" style={{ color: '#f0f0ff', fontFamily: 'Syne, sans-serif' }}>
              {t.dashboard.title}
            </h1>
            <p className="mt-2 text-sm" style={{ color: 'rgba(160,160,210,0.6)' }}>
              {user ? `ברוך הבא, ${user.username}` : t.dashboard.welcome}
            </p>
          </div>
          <Link to="/create" className="btn-neon-cyan flex items-center gap-2 self-start sm:self-auto">
            <Plus className="w-4 h-4" /> {t.dashboard.quickActions.createNew}
          </Link>
        </div>

        {/* Expiry Alert */}
        {expiringTasks.length > 0 && (
          <div className="mb-6 p-4 rounded-xl flex items-start gap-3" style={{
            background: criticalTasks.length > 0 ? 'rgba(255,60,60,0.08)' : 'rgba(255,200,0,0.06)',
            border: `1px solid ${criticalTasks.length > 0 ? 'rgba(255,60,60,0.25)' : 'rgba(255,200,0,0.2)'}`,
          }}>
            <Timer className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: criticalTasks.length > 0 ? '#ff4444' : '#ffcc00' }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: criticalTasks.length > 0 ? '#ff6666' : '#ffdd44' }}>
                {criticalTasks.length > 0
                  ? `${criticalTasks.length} קבצים יפוגו תוך 24 שעות!`
                  : `${expiringTasks.length} קבצים יפוגו תוך 7 ימים`}
              </p>
              <p className="text-xs mt-1" style={{ color: 'rgba(200,200,240,0.5)' }}>
                הורד את הקבצים לפני שיימחקו אוטומטית.
              </p>
              <Link to="/my-videos" className="text-xs mt-1.5 inline-flex items-center gap-1 underline" style={{ color: criticalTasks.length > 0 ? '#ff6666' : '#ffdd44' }}>
                עבור ל-My Videos <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Video, value: recapStats.total, label: t.dashboard.quickStats.totalRecaps, color: '#00D4FF' },
            { icon: Clock, value: recapStats.inProgress, label: t.dashboard.quickStats.inProgress, color: '#B24BF3' },
            { icon: CheckCircle, value: recapStats.completed, label: t.dashboard.quickStats.completed, color: '#00ff80' },
            { icon: Wallet, value: recapStats.credits, label: t.dashboard.quickStats.credits, color: '#FF3CAC' },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="ai-card p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${stat.color}15`, border: `1px solid ${stat.color}25` }}>
                    <Icon className="w-4 h-4" style={{ color: stat.color }} />
                  </div>
                  <span className="text-3xl font-bold" style={{ color: '#f0f0ff', fontFamily: 'Syne, sans-serif' }}>{stat.value}</span>
                </div>
                <p className="text-sm" style={{ color: 'rgba(160,160,210,0.6)' }}>{stat.label}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Video Tasks + Recent Recaps */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Task Stats */}
            <div className="ai-card p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold" style={{ color: '#f0f0ff', fontFamily: 'Syne, sans-serif' }}>
                  Video Tasks
                </h2>
                <Link to="/my-videos" className="text-xs flex items-center gap-1 transition-all hover:text-white" style={{ color: 'rgba(0,212,255,0.6)' }}>
                  View All <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                {[
                  { icon: FileVideo, value: videoStats.total, label: 'Total', color: '#00D4FF' },
                  { icon: Clock, value: videoStats.processing, label: 'Processing', color: '#B24BF3' },
                  { icon: CheckCircle, value: videoStats.completed, label: 'Completed', color: '#00ff80' },
                  { icon: HardDrive, value: `${(videoStats.storageUsedMb / 1024).toFixed(1)}G`, label: 'Storage', color: '#FF3CAC' },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <Icon className="w-4 h-4 mx-auto mb-2" style={{ color: item.color }} />
                      <div className="text-lg font-bold" style={{ color: '#f0f0ff' }}>{item.value}</div>
                      <div className="text-xs" style={{ color: 'rgba(150,150,200,0.55)' }}>{item.label}</div>
                    </div>
                  );
                })}
              </div>

              {videoTasks.length > 0 && (
                <div className="space-y-2">
                  {videoTasks.slice(0, 3).map(task => {
                    const badge = statusBadge(task.status);
                    return (
                      <Link
                        key={task.id}
                        to="/my-videos"
                        className="flex items-center justify-between p-3 rounded-xl transition-all hover:bg-white/[0.03]"
                        style={{ border: '1px solid rgba(255,255,255,0.05)' }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <FileVideo className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(0,212,255,0.5)' }} />
                          <span className="text-sm truncate" style={{ color: 'rgba(200,200,240,0.8)' }}>{task.title}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {task.status === 'completed' && <CountdownTimer expiresAt={task.expires_at} compact />}
                          <span className="text-xs px-2 py-1 rounded-lg font-medium" style={{ background: badge.bg, border: `1px solid ${badge.border}`, color: badge.color }}>
                            {TASK_STATUS_LABELS[task.status]}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent Recaps */}
            <div className="ai-card p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold" style={{ color: '#f0f0ff', fontFamily: 'Syne, sans-serif' }}>
                  {t.dashboard.recentRecaps.title}
                </h2>
                <Link to="/my-recaps" className="text-xs flex items-center gap-1 transition-all hover:text-white" style={{ color: 'rgba(0,212,255,0.6)' }}>
                  View All <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              {jobs.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)' }}>
                    <AlertCircle className="w-7 h-7" style={{ color: 'rgba(0,212,255,0.5)' }} />
                  </div>
                  <p className="text-sm mb-4" style={{ color: 'rgba(160,160,210,0.55)' }}>{t.dashboard.recentRecaps.empty}</p>
                  <Link to="/create" className="btn-neon-cyan py-2 px-5 text-sm inline-flex items-center gap-2">
                    <Plus className="w-4 h-4" /> {t.dashboard.quickActions.createNew}
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {jobs.slice(0, 5).map(job => {
                    const badge = statusBadge(job.status === 'completed' ? 'completed' : job.status === 'processing' ? 'processing' : job.status === 'failed' ? 'error' : 'pending');
                    return (
                      <div key={job.id} className="p-4 rounded-xl transition-all" style={{ border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold truncate mb-1" style={{ color: '#f0f0ff' }}>{job.title}</h3>
                            <div className="flex items-center justify-between">
                              <span className="text-xs" style={{ color: 'rgba(140,140,190,0.55)' }}>
                                {new Date(job.createdAt).toLocaleDateString('he-IL')}
                              </span>
                              <SocialShare title={job.title} description={`AI Recap: ${job.title}`} url={`${window.location.origin}/recap/${job.id}`} className="scale-75 origin-right" />
                            </div>
                          </div>
                          <span className="text-xs px-2 py-1 rounded-lg font-medium flex-shrink-0" style={{ background: badge.bg, border: `1px solid ${badge.border}`, color: badge.color }}>
                            {job.status === 'completed' ? t.dashboard.recentRecaps.status.completed : job.status === 'processing' ? t.dashboard.recentRecaps.status.processing : t.dashboard.recentRecaps.status.failed}
                          </span>
                        </div>
                        {job.status === 'processing' && (
                          <div className="mt-3 progress-neon">
                            <div className="progress-neon-fill" style={{ width: `${(job.stages.filter((s: any) => s.status === 'completed').length / job.stages.length) * 100}%` }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right column: Quick Actions */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold" style={{ color: '#f0f0ff', fontFamily: 'Syne, sans-serif' }}>
              {t.dashboard.quickActions.title}
            </h2>
            {[
              { to: '/create', icon: Sparkles, label: t.dashboard.quickActions.createNew, color: '#00D4FF', desc: 'Wizard 5 שלבים' },
              { to: '/my-videos', icon: FileVideo, label: 'My Videos', color: '#B24BF3', desc: 'ניהול קבצי וידאו' },
              { to: '/analytics', icon: BarChart3, label: t.dashboard.quickActions.viewAll, color: '#00D4FF', desc: 'נתוני שימוש API' },
              { to: '/wallet', icon: Wallet, label: t.dashboard.quickActions.earnCredits, color: '#FF3CAC', desc: 'קרדיטים ומודעות' },
              { to: '/youtube-learning', icon: TrendingUp, label: t.nav.youtube, color: '#B24BF3', desc: 'עד 11 ערוצים' },
              { to: '/settings', icon: Settings, label: t.dashboard.quickActions.apiSettings, color: '#00D4FF', desc: 'BYOK & הגדרות' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <Link
                  key={i}
                  to={item.to}
                  className="ai-card p-4 flex items-center gap-3 group"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${item.color}12`, border: `1px solid ${item.color}22` }}>
                    <Icon className="w-4.5 h-4.5 w-5 h-5" style={{ color: item.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold" style={{ color: 'rgba(220,220,250,0.9)' }}>{item.label}</div>
                    <div className="text-xs" style={{ color: 'rgba(140,140,190,0.55)' }}>{item.desc}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: item.color }} />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
