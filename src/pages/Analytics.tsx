import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { useRating } from '@/hooks/useRating';
import AdUnit from '@/components/ads/AdUnit';
import RatingBreakdown from '@/components/RatingBreakdown';
import SentimentAnalysis from '@/components/SentimentAnalysis';
import ParallaxSection from '@/components/steampunk/ParallaxSection';
import { getJobs, getJobEvents } from '@/lib/recapService';
import { BarChart3, TrendingUp, Eye, Users, Clock, CheckCircle, AlertCircle, XCircle, Star, LineChart } from 'lucide-react';

export default function Analytics() {
  const { t, language } = useLanguage();
  const locale = language === 'he' ? 'he-IL' : language === 'ar' ? 'ar-SA' : 'en-US';
  const { stats: ratingStats } = useRating();
  const jobs = getJobs();
  const [lastJobId, setLastJobId] = useState<string | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [ratings, setRatings] = useState<any[]>([]);

  useEffect(() => {
    const savedJobId = localStorage.getItem('lastJobId');
    if (savedJobId) {
      setLastJobId(savedJobId);
      const jobEvents = getJobEvents(savedJobId);
      setEvents(jobEvents);
    }

    // Load ratings from localStorage
    const stored = localStorage.getItem('airm_ratings');
    if (stored) {
      try { setRatings(JSON.parse(stored)); } catch { /* corrupted data, ignore */ }
    }
  }, []);

  const stats = {
    total: jobs.length,
    avgDuration: jobs.length > 0 ? '3:24' : '0:00',
    totalViews: 0,
    engagement: '0%',
  };

  const lastJob = lastJobId ? jobs.find(j => j.id === lastJobId) : null;

  const getStageIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-copper-400 animate-spin" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'fallback':
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      default:
        return <Clock className="w-4 h-4 text-brass-400" />;
    }
  };

  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      step_started: t.analytics.eventLabels.started,
      step_completed: t.analytics.eventLabels.completed,
      step_fallback: t.analytics.eventLabels.fallback,
      step_failed: t.analytics.eventLabels.failed,
    };
    return labels[type] || type;
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold text-brass-200 mb-2">
            {t.analytics.title}
          </h1>
          <p className="text-brass-300">{t.analytics.subtitle}</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="steampunk-card p-6">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-5 h-5 text-brass-400" />
              <span className="text-2xl font-bold text-brass-100">{stats.total}</span>
            </div>
            <p className="text-sm text-brass-300">{t.analytics.totalRecaps}</p>
          </div>

          <div className="steampunk-card p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-brass-400" />
              <span className="text-2xl font-bold text-brass-100">{stats.avgDuration}</span>
            </div>
            <p className="text-sm text-brass-300">{t.analytics.avgDuration}</p>
          </div>

          <div className="steampunk-card p-6">
            <div className="flex items-center justify-between mb-2">
              <Eye className="w-5 h-5 text-brass-400" />
              <span className="text-2xl font-bold text-brass-100">{stats.totalViews}</span>
            </div>
            <p className="text-sm text-brass-300">{t.analytics.totalViews}</p>
          </div>

          <div className="steampunk-card p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-brass-400" />
              <span className="text-2xl font-bold text-brass-100">{stats.engagement}</span>
            </div>
            <p className="text-sm text-brass-300">{t.analytics.engagement}</p>
          </div>
        </div>

        {/* Pipeline Monitor */}
        <div className="steampunk-card p-8">
          <h2 className="text-2xl font-serif font-semibold text-brass-200 mb-6 flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            {t.analytics.pipelineMonitor.title}
          </h2>

          {!lastJob ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-brass-400 mx-auto mb-4" />
              <p className="text-brass-300">{t.analytics.pipelineMonitor.noJobs}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Job Info */}
              <div className="bg-steam-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-brass-200">{lastJob.title}</h3>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      lastJob.status === 'completed'
                        ? 'bg-green-900/50 text-green-300'
                        : lastJob.status === 'processing'
                        ? 'bg-copper-900/50 text-copper-300'
                        : 'bg-red-900/50 text-red-300'
                    }`}
                  >
                    {lastJob.status}
                  </span>
                </div>
                <p className="text-sm text-brass-400">
                  {new Date(lastJob.createdAt).toLocaleString(locale)}
                </p>
              </div>

              {/* Stages Progress */}
              <div>
                <h4 className="text-brass-200 font-semibold mb-4">{t.analytics.pipelineStages}</h4>
                <div className="space-y-3">
                  {lastJob.stages.map((stage) => (
                    <div key={stage.stage} className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-steam-800 flex items-center justify-center">
                        {getStageIcon(stage.status)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-brass-200 font-medium">
                            {t.analytics.stage} {stage.stage}: {stage.message}
                          </span>
                          <span className="text-xs text-brass-400">
                            {stage.status === 'completed' && stage.endedAt
                              ? new Date(stage.endedAt).toLocaleTimeString(locale)
                              : stage.status === 'processing' && stage.startedAt
                              ? new Date(stage.startedAt).toLocaleTimeString(locale)
                              : ''}
                          </span>
                        </div>
                        <div className="h-2 bg-steam-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              stage.status === 'completed'
                                ? 'bg-green-500 w-full'
                                : stage.status === 'processing'
                                ? 'bg-copper-500 w-1/2 animate-pulse'
                                : stage.status === 'failed'
                                ? 'bg-red-500 w-full'
                                : 'bg-brass-700 w-0'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Events Timeline */}
              <div>
                <h4 className="text-brass-200 font-semibold mb-4">
                  {t.analytics.pipelineMonitor.events}
                </h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {events.length === 0 ? (
                    <p className="text-brass-400 text-sm">{t.analytics.noEvents}</p>
                  ) : (
                    events.map((event, idx) => (
                      <div
                        key={idx}
                        className="bg-steam-800/30 border border-brass-700/20 rounded-lg p-3 flex items-start gap-3"
                      >
                        <div className="w-6 h-6 rounded-full bg-brass-800/50 flex items-center justify-center flex-shrink-0">
                          {getStageIcon(event.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-brass-200">
                              {getEventTypeLabel(event.type)} - {t.analytics.stage} {event.stage}
                            </span>
                            <span className="text-xs text-brass-400 flex-shrink-0">
                              {new Date(event.createdAt).toLocaleTimeString(locale)}
                            </span>
                          </div>
                          {event.reason && (
                            <p className="text-xs text-brass-400">{event.reason}</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Ratings Analytics Section */}
        <ParallaxSection className="mt-8" withGears>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Rating Breakdown */}
            <div className="steampunk-card p-8">
              <h2 className="text-2xl font-serif font-semibold text-brass-200 mb-6 flex items-center gap-2">
                <Star className="w-6 h-6" />
                {t.analytics.ratingBreakdown}
              </h2>
              <RatingBreakdown ratings={ratings} />
            </div>

            {/* Sentiment Analysis */}
            <div className="steampunk-card p-8">
              <h2 className="text-2xl font-serif font-semibold text-brass-200 mb-6 flex items-center gap-2">
                <LineChart className="w-6 h-6" />
                {t.analytics.sentimentAnalysis}
              </h2>
              <SentimentAnalysis ratings={ratings} />
            </div>
          </div>
        </ParallaxSection>

        {/* Ratings Trend Over Time */}
        {ratings.length > 0 && (
          <div className="steampunk-card p-8 mt-8">
            <h2 className="text-2xl font-serif font-semibold text-brass-200 mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              {t.analytics.ratingTrends}
            </h2>
            <div className="h-64 flex items-end justify-between gap-2">
              {ratings.slice(0, 10).reverse().map((rating, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-gradient-to-t from-brass-600 to-copper-600 rounded-t-lg transition-all hover:from-brass-500 hover:to-copper-500"
                    style={{ height: `${(rating.score / 5) * 100}%` }}
                  />
                  <span className="text-xs text-brass-400">
                    {new Date(rating.created_at).toLocaleDateString(locale, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AdSense Unit - Analytics Page */}
        <AdUnit slot="1122334455" format="rectangle" className="mt-8" />
      </div>
    </div>
  );
}
