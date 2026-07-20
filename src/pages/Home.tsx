import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/lib/LanguageContext';
import { useCountUp } from '@/hooks/useCountUp';
import { useRating } from '@/hooks/useRating';
import { getJobs } from '@/lib/recapService';
import RatingModal from '@/components/RatingModal';
import heroImage from '@/assets/hero-bg.jpg';
import {
  Sparkles, Zap, Brain, Globe2, ArrowRight, Key, TrendingUp, Users,
  Clock, Star, Play, Film, Mic, Video, Upload, ChevronDown, Shield,
  Award, BarChart3, CheckCircle, Cpu, Layers, Eye
} from 'lucide-react';

export default function Home() {
  const { t } = useLanguage();
  const { stats: ratingStats, submitRating, shouldShowPrompt, markAsAsked } = useRating();
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [statsInView, setStatsInView] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  const jobs = getJobs();
  const totalRecaps = jobs.length;
  const activeUsers = totalRecaps > 0 ? 1 : 0;
  const totalMinutes = jobs.reduce((sum, job) => {
    const seconds = (job as any).settings?.recapLengthSeconds || 0;
    return sum + (seconds / 60);
  }, 0);

  const recapsCount = useCountUp({ end: 10247 + totalRecaps, duration: 2500, enabled: statsInView });
  const usersCount = useCountUp({ end: 5382 + activeUsers, duration: 2500, enabled: statsInView });
  const minutesCount = useCountUp({ end: 50000 + Math.floor(totalMinutes), duration: 2800, enabled: statsInView });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (shouldShowPrompt()) setIsRatingModalOpen(true);
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) setStatsInView(true); },
      { threshold: 0.2 }
    );
    const el = document.getElementById('stats-section');
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setActiveFeature(p => (p + 1) % 4), 3500);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: Brain,
      title: t.home.features.ai.title,
      description: t.home.features.ai.description,
      color: 'cyan',
      detail: 'Google Gemini 2.5 Pro',
    },
    {
      icon: Zap,
      title: t.home.features.automation.title,
      description: t.home.features.automation.description,
      color: 'purple',
      detail: 'Full Pipeline Automation',
    },
    {
      icon: TrendingUp,
      title: t.home.features.learning.title,
      description: t.home.features.learning.description,
      color: 'cyan',
      detail: 'RAG Personalization',
    },
    {
      icon: Globe2,
      title: t.home.features.multiLang.title,
      description: t.home.features.multiLang.description,
      color: 'purple',
      detail: '24+ Languages',
    },
  ];

  const steps = [
    { icon: Upload, label: 'העלה תסריט / אודיו', step: '01' },
    { icon: Cpu, label: 'ניתוח AI ועיבוד', step: '02' },
    { icon: Video, label: 'העלה וידאו', step: '03' },
    { icon: Layers, label: 'הגדרות & BYOK', step: '04' },
    { icon: Eye, label: 'הורד & שתף', step: '05' },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#0a0a14' }}>
      {/* ========== HERO SECTION ========== */}
      <section
        className="relative min-h-[100vh] flex flex-col items-center justify-center overflow-hidden"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Dark overlays */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(10,10,20,0.75) 0%, rgba(10,10,20,0.6) 40%, rgba(10,10,20,0.95) 100%)' }} />
        <div className="absolute inset-0 grid-bg opacity-30" />

        {/* Neon orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px] opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle, #00D4FF, transparent)' }} />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full blur-[100px] opacity-15 pointer-events-none" style={{ background: 'radial-gradient(circle, #B24BF3, transparent)' }} />

        <div className="relative z-10 container mx-auto px-4 text-center max-w-5xl pt-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-8 animate-slide-up" style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.25)' }}>
            <div className="w-2 h-2 rounded-full bg-[#00D4FF] animate-pulse-neon" />
            <span style={{ color: '#00D4FF', fontSize: '13px', fontWeight: 600, letterSpacing: '0.05em' }}>
              Powered by Google Gemini AI
            </span>
            <div className="w-2 h-2 rounded-full" style={{ background: '#B24BF3' }} />
          </div>

          {/* Main Title */}
          <h1 className="font-bold mb-5 animate-float leading-tight" style={{ fontSize: 'clamp(2.8rem, 7vw, 5.5rem)' }}>
            <span className="gradient-text-cyan-purple text-glow-cyan">
              AI Recaps Maker
            </span>
            <br />
            <span style={{ color: 'rgba(240,240,255,0.92)', fontSize: '0.6em' }}>
              {t.home.hero.subtitle}
            </span>
          </h1>

          {/* App type badge */}
          <div className="flex items-center justify-center gap-3 mb-7">
            <span className="neon-badge neon-badge-cyan">
              <Film className="w-3.5 h-3.5" /> Movies
            </span>
            <span className="neon-badge neon-badge-purple">
              <Play className="w-3.5 h-3.5" /> TV Shows
            </span>
            <span className="neon-badge" style={{ background: 'rgba(255,60,172,0.1)', border: '1px solid rgba(255,60,172,0.3)', color: '#FF3CAC', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 600 }}>
              <Mic className="w-3.5 h-3.5" /> BYOK
            </span>
          </div>

          {/* Description */}
          <p className="mb-10 mx-auto max-w-2xl leading-relaxed" style={{ color: 'rgba(200,200,230,0.75)', fontSize: '1.1rem' }}>
            {t.home.hero.description}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10">
            <Link to="/create" className="btn-neon-cyan flex items-center gap-2 text-base">
              <Sparkles className="w-5 h-5" />
              {t.home.hero.cta}
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/settings" className="btn-ghost flex items-center gap-2 text-base">
              <Key className="w-5 h-5" />
              {t.home.hero.byok}
            </Link>
          </div>

        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 opacity-50">
          <span className="text-xs" style={{ color: 'rgba(200,200,230,0.5)' }}>גלול מטה</span>
          <ChevronDown className="w-5 h-5 animate-bounce" style={{ color: '#00D4FF' }} />
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section className="py-24 relative" style={{ background: 'linear-gradient(to bottom, #0a0a14, #0d0d1f)' }}>
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <div className="neon-badge neon-badge-purple mx-auto mb-4 inline-flex">Workflow</div>
            <h2 className="text-4xl font-bold mb-4 gradient-text-cyan-purple">
              איך זה עובד?
            </h2>
            <p style={{ color: 'rgba(170,170,210,0.7)', fontSize: '1rem' }}>5 שלבים פשוטים ליצירת סיכום וידאו מקצועי</p>
          </div>

          <div className="flex flex-col md:flex-row items-start justify-center gap-4 max-w-5xl mx-auto">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <React.Fragment key={i}>
                  <div className="flex flex-col items-center text-center flex-1 min-w-[120px]">
                    <div className="relative mb-4">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(178,75,243,0.15))', border: '1px solid rgba(0,212,255,0.25)' }}>
                        <Icon className="w-7 h-7" style={{ color: '#00D4FF' }} />
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'linear-gradient(135deg, #00D4FF, #B24BF3)', color: '#0a0a14' }}>
                        {step.step.slice(-1)}
                      </div>
                    </div>
                    <p className="text-sm font-medium" style={{ color: 'rgba(200,200,240,0.85)' }}>{step.label}</p>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="hidden md:flex items-center justify-center mt-8 flex-shrink-0">
                      <ArrowRight className="w-5 h-5" style={{ color: 'rgba(0,212,255,0.3)' }} />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========== FEATURES ========== */}
      <section className="py-24" style={{ background: '#0d0d1f' }}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="neon-badge neon-badge-cyan mx-auto mb-4 inline-flex">Features</div>
            <h2 className="text-4xl font-bold gradient-text-cyan-purple">
              {t.home.features.title}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              const isActive = activeFeature === i;
              return (
                <div
                  key={i}
                  className={`ai-card p-7 cursor-pointer ${isActive ? (feature.color === 'cyan' ? 'ai-card' : 'ai-card-purple') : ''}`}
                  style={isActive ? { borderColor: feature.color === 'cyan' ? 'rgba(0,212,255,0.45)' : 'rgba(178,75,243,0.45)', boxShadow: `0 0 30px ${feature.color === 'cyan' ? 'rgba(0,212,255,0.1)' : 'rgba(178,75,243,0.1)'}` } : {}}
                  onClick={() => setActiveFeature(i)}
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                    style={{
                      background: feature.color === 'cyan' ? 'rgba(0,212,255,0.1)' : 'rgba(178,75,243,0.1)',
                      border: `1px solid ${feature.color === 'cyan' ? 'rgba(0,212,255,0.25)' : 'rgba(178,75,243,0.25)'}`,
                    }}
                  >
                    <Icon className="w-6 h-6" style={{ color: feature.color === 'cyan' ? '#00D4FF' : '#B24BF3' }} />
                  </div>
                  <div className="neon-badge mb-3" style={{
                    background: feature.color === 'cyan' ? 'rgba(0,212,255,0.06)' : 'rgba(178,75,243,0.06)',
                    border: `1px solid ${feature.color === 'cyan' ? 'rgba(0,212,255,0.2)' : 'rgba(178,75,243,0.2)'}`,
                    color: feature.color === 'cyan' ? 'rgba(0,212,255,0.7)' : 'rgba(178,75,243,0.7)',
                    fontSize: '11px', padding: '3px 10px', borderRadius: '100px', display: 'inline-block'
                  }}>{feature.detail}</div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: '#f0f0ff' }}>{feature.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(160,160,200,0.7)' }}>{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========== STATS SECTION ========== */}
      <section id="stats-section" className="py-24 relative" style={{ background: 'linear-gradient(to bottom, #0d0d1f, #0a0a14)' }}>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, rgba(0,212,255,0.04) 0%, transparent 70%)' }} />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <div className="neon-badge neon-badge-cyan mx-auto mb-4 inline-flex">Stats</div>
            <h2 className="text-4xl font-bold text-white mb-3">המספרים מדברים בעד עצמם</h2>
            <p style={{ color: 'rgba(170,170,210,0.6)' }}>ההישגים שלנו עד היום</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 max-w-4xl mx-auto">
            {[
              {
                icon: Film,
                value: recapsCount.toLocaleString(),
                label: t.home.stats.recaps,
                color: '#00D4FF',
                suffix: '+',
              },
              {
                icon: Users,
                value: usersCount.toLocaleString(),
                label: t.home.stats.users,
                color: '#B24BF3',
                suffix: '+',
              },
              {
                icon: Clock,
                value: minutesCount.toLocaleString(),
                label: t.home.stats.minutes,
                color: '#00D4FF',
                suffix: '+',
              },
              {
                icon: Star,
                value: ratingStats.averageRating > 0 ? `${ratingStats.averageRating.toFixed(1)}/5` : '4.9/5',
                label: 'דירוג משתמשים',
                color: '#FF3CAC',
                suffix: '',
              },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="stat-card">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: `${stat.color}15`, border: `1px solid ${stat.color}30` }}>
                    <Icon className="w-5 h-5" style={{ color: stat.color }} />
                  </div>
                  <div className="text-4xl font-bold mb-2" style={{ color: stat.color, fontFamily: 'Syne, sans-serif' }}>
                    {statsInView ? stat.value : '0'}{stat.suffix}
                  </div>
                  <div className="text-sm" style={{ color: 'rgba(160,160,200,0.65)' }}>{stat.label}</div>
                </div>
              );
            })}
          </div>

          {/* Rating CTA */}
          {ratingStats.totalRatings === 0 && (
            <div className="text-center mt-10">
              <button
                onClick={() => setIsRatingModalOpen(true)}
                className="btn-ghost flex items-center gap-2 mx-auto"
              >
                <Star className="w-4 h-4" />
                אהבתם את השירות? דרגו אותנו
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ========== CAPABILITIES SECTION ========== */}
      <section className="py-24" style={{ background: '#0a0a14' }}>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            {/* Left: AI Capabilities */}
            <div>
              <div className="neon-badge neon-badge-purple mb-5 inline-flex">AI Engine</div>
              <h2 className="text-4xl font-bold mb-6" style={{ color: '#f0f0ff' }}>
                עיבוד AI <br />
                <span className="gradient-text-cyan-purple">ברמה הגבוהה ביותר</span>
              </h2>
              <div className="space-y-4">
                {[
                  { label: 'ניתוח תסריט ואודיו', value: 95 },
                  { label: 'זיהוי סצינות ומפתח', value: 88 },
                  { label: 'יצירת תסריט AI', value: 92 },
                  { label: 'RAG Personalization', value: 85 },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium" style={{ color: 'rgba(200,200,240,0.8)' }}>{item.label}</span>
                      <span className="text-sm font-bold" style={{ color: '#00D4FF' }}>{item.value}%</span>
                    </div>
                    <div className="progress-neon">
                      <div className="progress-neon-fill" style={{ width: `${item.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Feature Highlights */}
            <div className="space-y-4">
              {[
                { icon: Shield, title: 'BYOK Security', desc: 'מפתחות API מוצפנים — לא מאוחסנים בשרת', color: '#00D4FF' },
                { icon: Award, title: 'YouTube Learning', desc: 'ניהול עד 11 ערוצים ללמידה AI מתמשכת', color: '#B24BF3' },
                { icon: BarChart3, title: 'Analytics Dashboard', desc: 'מעקב מלא אחר שימוש API ועלויות', color: '#00D4FF' },
                { icon: CheckCircle, title: 'Multi-Language', desc: 'עברית, אנגלית, ערבית ו-21 שפות נוספות', color: '#B24BF3' },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="ai-card p-5 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${item.color}15`, border: `1px solid ${item.color}25` }}>
                      <Icon className="w-5 h-5" style={{ color: item.color }} />
                    </div>
                    <div>
                      <h4 className="font-bold mb-1" style={{ color: '#f0f0ff', fontSize: '15px' }}>{item.title}</h4>
                      <p className="text-sm" style={{ color: 'rgba(160,160,200,0.65)' }}>{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ========== CTA SECTION ========== */}
      <section className="py-24 relative overflow-hidden" style={{ background: 'linear-gradient(to bottom, #0a0a14, #0d0d1f)' }}>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(178,75,243,0.08) 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] blur-[80px] opacity-15 pointer-events-none" style={{ background: 'linear-gradient(135deg, #00D4FF, #B24BF3)' }} />

        <div className="container mx-auto px-4 text-center relative z-10 max-w-2xl">
          <div className="neon-badge neon-badge-cyan mx-auto mb-6 inline-flex">Get Started</div>
          <h2 className="text-3xl sm:text-5xl font-bold mb-5 text-white">
            מוכן להתחיל?
          </h2>
          <p className="mb-10 text-lg" style={{ color: 'rgba(180,180,220,0.7)' }}>
            צור את הסיכום הראשון שלך עכשיו ותגלה את העוצמה של AI
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/create" className="btn-neon-cyan flex items-center justify-center gap-2 text-lg px-10 py-4">
              <Sparkles className="w-5 h-5" />
              התחל ליצור
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/gallery" className="btn-ghost flex items-center justify-center gap-2 text-lg px-10 py-4">
              <Play className="w-5 h-5" />
              גלה סיכומים
            </Link>
          </div>
        </div>
      </section>

      <RatingModal
        isOpen={isRatingModalOpen}
        onClose={() => { setIsRatingModalOpen(false); markAsAsked(); }}
        onSubmit={(rating, comment) => { submitRating(rating, comment); setIsRatingModalOpen(false); }}
      />
    </div>
  );
}
