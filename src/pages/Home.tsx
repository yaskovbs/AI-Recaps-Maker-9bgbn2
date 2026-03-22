
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/lib/LanguageContext';
import { useWallet } from '@/hooks/useWallet';
import { useCountUp } from '@/hooks/useCountUp';
import { useRating } from '@/hooks/useRating';
import { getJobs } from '@/lib/recapService';
import AdUnit from '@/components/ads/AdUnit';
import RatingModal from '@/components/RatingModal';
import ParallaxSection from '@/components/steampunk/ParallaxSection';
import SteamEffect from '@/components/steampunk/SteamEffect';
import { Sparkles, Zap, Brain, Globe2, ArrowRight, Key, TrendingUp, Users, Clock, Star } from 'lucide-react';

export default function Home() {
  const { t } = useLanguage();
  const { wallet, rewardCredits } = useWallet();
  const { stats: ratingStats, submitRating, shouldShowPrompt, markAsAsked } = useRating();
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [statsInView, setStatsInView] = useState(false);

  // Real stats from system
  const jobs = getJobs();
  const totalRecaps = jobs.length;
  const activeUsers = totalRecaps > 0 ? 1 : 0; // In production, count unique users
  const totalMinutes = jobs.reduce((sum, job) => {
    // Safely access nested properties with optional chaining
    const seconds = job.settings?.recapLengthSeconds || job.metadata?.settings?.recapLengthSeconds || 0;
    return sum + (seconds / 60);
  }, 0);
  const uptime = 99.9; // In production, calculate from server

  // Animated counters
  const recapsCount = useCountUp({ end: totalRecaps, duration: 2000, enabled: statsInView });
  const usersCount = useCountUp({ end: activeUsers, duration: 2000, enabled: statsInView });
  const minutesCount = useCountUp({ end: Math.floor(totalMinutes), duration: 2500, enabled: statsInView });

  // Check if should show rating prompt
  useEffect(() => {
    const timer = setTimeout(() => {
      if (shouldShowPrompt()) {
        setIsRatingModalOpen(true);
      }
    }, 5000); // Show after 5 seconds on home page

    return () => clearTimeout(timer);
  }, []);

  // Intersection observer for stats animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setStatsInView(true);
        }
      },
      { threshold: 0.3 }
    );

    const statsSection = document.getElementById('stats-section');
    if (statsSection) {
      observer.observe(statsSection);
    }

    return () => observer.disconnect();
  }, []);

  const handleRatingSubmit = (rating: number, comment?: string) => {
    submitRating(rating, comment);
  };

  const handleRatingClose = () => {
    setIsRatingModalOpen(false);
    markAsAsked();
  };

  const handleWatchAd = () => {
    // In production, show real ad
    alert('מציג מודעה... (במצב דמו)');
    setTimeout(() => {
      rewardCredits(1, 'Watched ad from home');
      alert('קיבלת קרדיט אחד!');
    }, 1000);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section with Background Image */}
      <ParallaxSection
        className="relative min-h-[600px] flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: 'url(https://cdn-ai.onspace.ai/onspace/files/95s67Rn6h8oTUjdnBGNhBJ/IMG_20260321_202350_067.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-steam-900/90 via-steam-900/70 to-steam-900/95"></div>

        {/* Animated gears decoration */}
        <div className="absolute top-10 left-10 w-32 h-32 opacity-10">
          <div className="w-full h-full border-4 border-brass-500 rounded-full gear-decoration"></div>
        </div>
        <div className="absolute bottom-20 right-20 w-24 h-24 opacity-10">
          <div className="w-full h-full border-4 border-copper-500 rounded-full gear-decoration" style={{ animationDirection: 'reverse' }}></div>
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 py-20 text-center">
          <div className="max-w-4xl mx-auto">
            {/* Main Title - Bilingual */}
            <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 animate-float">
              <span className="block text-brass-200 glow-brass drop-shadow-[0_2px_10px_rgba(212,124,71,0.5)]">
                {t.home.hero.title}
              </span>
              <span className="block text-3xl md:text-4xl mt-4 text-copper-300 drop-shadow-[0_2px_8px_rgba(214,100,69,0.4)]">
                {t.home.hero.subtitle}
              </span>
            </h1>

            <p className="text-lg md:text-xl text-brass-100 mb-8 leading-relaxed max-w-3xl mx-auto drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
              {t.home.hero.description}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Link
                to="/create"
                className="steampunk-button px-8 py-4 text-lg flex items-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                {t.home.hero.cta}
                <ArrowRight className="w-5 h-5" />
              </Link>

              <Link
                to="/settings"
                className="px-8 py-4 text-lg bg-steam-800/80 hover:bg-steam-700/90 text-brass-100 border-2 border-brass-500/50 rounded-lg transition-all flex items-center gap-2 font-semibold backdrop-blur-sm"
              >
                <Key className="w-5 h-5" />
                {t.home.hero.byok}
              </Link>
            </div>

            {/* Credits Quick Action */}
            <div className="inline-flex items-center gap-4 bg-brass-900/60 backdrop-blur-md px-6 py-3 rounded-lg border border-brass-500/30">
              <div className="text-brass-200">
                <span className="text-2xl font-bold text-brass-100">{wallet.balance}</span>
                <span className="text-sm mr-2">{t.wallet.credits}</span>
              </div>
              <button
                onClick={handleWatchAd}
                className="bg-gradient-to-r from-copper-600 to-brass-600 hover:from-copper-500 hover:to-brass-500 px-4 py-2 rounded text-sm font-semibold text-white transition-all"
              >
                + {t.wallet.watchAd}
              </button>
            </div>
          </div>
        </div>
      </ParallaxSection>

      {/* AdSense Unit A - After Hero */}
      <AdUnit slot="1234567890" format="auto" className="my-8" />

      {/* Features Section */}
      <ParallaxSection className="py-20 bg-gradient-to-b from-steam-900 to-steam-950" withGears>
        <SteamEffect count={8} className="absolute inset-0 pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-4xl font-serif font-bold text-center text-brass-200 mb-12">
            {t.home.features.title}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Brain,
                title: t.home.features.ai.title,
                description: t.home.features.ai.description,
              },
              {
                icon: Zap,
                title: t.home.features.automation.title,
                description: t.home.features.automation.description,
              },
              {
                icon: TrendingUp,
                title: t.home.features.learning.title,
                description: t.home.features.learning.description,
              },
              {
                icon: Globe2,
                title: t.home.features.multiLang.title,
                description: t.home.features.multiLang.description,
              },
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="steampunk-card p-6 hover:shadow-brass transition-all hover:-translate-y-1"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brass-500 to-copper-600 flex items-center justify-center mb-4 glow-brass">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-brass-200 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-brass-300 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </ParallaxSection>

      {/* Stats Section - Animated Real Numbers */}
      <div id="stats-section" className="py-16 bg-steam-950/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-serif font-bold text-center text-brass-200 mb-3">
            המספרים מדברים בעד עצמם
          </h2>
          <p className="text-center text-brass-300 mb-12">ההישגים שלנו עד היום</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Recaps Created */}
            <div className="text-center transform transition-all hover:scale-105">
              <Sparkles className="w-8 h-8 text-brass-500 mx-auto mb-2" />
              <div className="text-4xl font-bold text-brass-100 mb-1">
                {recapsCount.toLocaleString('he-IL')}
              </div>
              <div className="text-sm text-brass-400">{t.home.stats.recaps}</div>
            </div>

            {/* Active Users */}
            <div className="text-center transform transition-all hover:scale-105">
              <Users className="w-8 h-8 text-brass-500 mx-auto mb-2" />
              <div className="text-4xl font-bold text-brass-100 mb-1">
                {usersCount.toLocaleString('he-IL')}
              </div>
              <div className="text-sm text-brass-400">{t.home.stats.users}</div>
            </div>

            {/* Uptime */}
            <div className="text-center transform transition-all hover:scale-105">
              <Clock className="w-8 h-8 text-brass-500 mx-auto mb-2" />
              <div className="text-4xl font-bold text-brass-100 mb-1">
                {uptime}%
              </div>
              <div className="text-sm text-brass-400">זמינות השירות</div>
            </div>

            {/* User Rating */}
            <div className="text-center transform transition-all hover:scale-105">
              <Star className="w-8 h-8 text-brass-500 mx-auto mb-2" />
              <div className="text-4xl font-bold text-brass-100 mb-1">
                {ratingStats.averageRating.toFixed(1)}/5
              </div>
              <div className="text-sm text-brass-400">
                דירוג משתמשים
                {ratingStats.totalRatings > 0 && (
                  <span className="block text-xs text-brass-500 mt-1">
                    ({ratingStats.totalRatings} דירוגים)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Rating CTA */}
          {!shouldShowPrompt() && ratingStats.totalRatings === 0 && totalRecaps > 0 && (
            <div className="mt-8 text-center">
              <button
                onClick={() => setIsRatingModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brass-600/30 to-copper-600/30 hover:from-brass-600/50 hover:to-copper-600/50 border border-brass-500/30 rounded-lg text-brass-200 transition-all"
              >
                <Star className="w-5 h-5" />
                אהבתם את השירות? דרגו אותנו כאן
              </button>
            </div>
          )}
        </div>
      </div>

      {/* AdSense Unit B - Before CTA */}
      <AdUnit slot="9876543210" format="horizontal" className="my-8" />

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-b from-steam-950 to-steam-900">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-serif font-bold text-brass-200 mb-6">
            מוכן להתחיל?
          </h2>
          <p className="text-lg text-brass-300 mb-8 max-w-2xl mx-auto">
            צור את הסיכום הראשון שלך עכשיו ותגלה את העוצמה של AI
          </p>
          <Link
            to="/create"
            className="steampunk-button px-10 py-4 text-lg inline-flex items-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            התחל ליצור
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Rating Modal */}
      <RatingModal
        isOpen={isRatingModalOpen}
        onClose={handleRatingClose}
        onSubmit={handleRatingSubmit}
      />
    </div>
  );
}
