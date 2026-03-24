import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/lib/LanguageContext';
import { useWallet } from '@/hooks/useWallet';
import { getJobs } from '@/lib/recapService';
import SocialShare from '@/components/SocialShare';
import { Plus, BarChart3, Settings, Wallet, Video, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const { t } = useLanguage();
  const { wallet } = useWallet();
  const jobs = getJobs();

  const stats = {
    total: jobs.length,
    inProgress: jobs.filter(j => j.status === 'processing').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    credits: wallet.balance,
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

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="steampunk-card p-6">
            <div className="flex items-center justify-between mb-2">
              <Video className="w-5 h-5 text-brass-400" />
              <span className="text-2xl font-bold text-brass-100">{stats.total}</span>
            </div>
            <p className="text-sm text-brass-300">{t.dashboard.quickStats.totalRecaps}</p>
          </div>

          <div className="steampunk-card p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-copper-400" />
              <span className="text-2xl font-bold text-brass-100">{stats.inProgress}</span>
            </div>
            <p className="text-sm text-brass-300">{t.dashboard.quickStats.inProgress}</p>
          </div>

          <div className="steampunk-card p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-2xl font-bold text-brass-100">{stats.completed}</span>
            </div>
            <p className="text-sm text-brass-300">{t.dashboard.quickStats.completed}</p>
          </div>

          <div className="steampunk-card p-6 bg-gradient-to-br from-brass-700/40 to-copper-700/40">
            <div className="flex items-center justify-between mb-2">
              <Wallet className="w-5 h-5 text-brass-200" />
              <span className="text-2xl font-bold text-brass-100">{stats.credits}</span>
            </div>
            <p className="text-sm text-brass-200">{t.dashboard.quickStats.credits}</p>
          </div>
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

            <Link
              to="/wallet"
              className="steampunk-card p-6 hover:shadow-brass transition-all hover:-translate-y-1 flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-copper-600 to-brass-600 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <span className="text-brass-200 font-semibold">{t.dashboard.quickActions.earnCredits}</span>
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
                <div key={job.id} className="steampunk-card p-4 sm:p-6 hover:shadow-brass transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-brass-200 mb-1 truncate">
                        {job.title}
                      </h3>
                      <div className="flex items-center gap-3 flex-wrap">
                        <p className="text-sm text-brass-400">
                          {new Date(job.createdAt).toLocaleDateString('he-IL')}
                        </p>
                        {job.status === 'completed' && (
                          <span className="px-2 py-0.5 rounded-full bg-green-900/50 text-green-300 text-xs sm:text-sm">
                            {t.dashboard.recentRecaps.status.completed}
                          </span>
                        )}
                        {job.status === 'processing' && (
                          <span className="px-2 py-0.5 rounded-full bg-copper-900/50 text-copper-300 text-xs sm:text-sm">
                            {t.dashboard.recentRecaps.status.processing}
                          </span>
                        )}
                        {job.status === 'failed' && (
                          <span className="px-2 py-0.5 rounded-full bg-red-900/50 text-red-300 text-xs sm:text-sm">
                            {t.dashboard.recentRecaps.status.failed}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="hidden sm:block">
                      <SocialShare
                        title={job.title}
                        description={`סיכום AI מדהים: ${job.title}`}
                        url={`${window.location.origin}/recap/${job.id}`}
                        className="scale-75"
                      />
                    </div>
                  </div>
                  {/* Progress bar */}
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
