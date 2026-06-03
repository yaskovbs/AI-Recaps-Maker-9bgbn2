import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import {
  Menu, X, Home, LayoutDashboard, Plus, BarChart3, Settings,
  Wallet, Youtube, Globe, User, LogOut, LogIn, Film, Mail,
  Grid, Video, ChevronDown, Sparkles, Bell
} from 'lucide-react';

export default function Header() {
  const { t, language, setLanguage } = useLanguage();
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const mainNavItems = [
    { path: '/home', label: t.nav.home, icon: Home },
    { path: '/dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
    { path: '/create', label: t.nav.create, icon: Plus, highlight: true },
    { path: '/my-recaps', label: t.nav.myRecaps, icon: Film },
    { path: '/my-videos', label: 'My Videos', icon: Video },
    { path: '/gallery', label: t.nav.gallery || 'Gallery', icon: Grid },
    { path: '/analytics', label: t.nav.analytics, icon: BarChart3 },
    { path: '/wallet', label: t.nav.wallet, icon: Wallet },
    { path: '/youtube-learning', label: t.nav.youtube, icon: Youtube },
    { path: '/settings', label: t.nav.settings, icon: Settings },
  ];

  const languages = [
    { code: 'he', flag: '🇮🇱', label: 'עברית' },
    { code: 'en', flag: '🇬🇧', label: 'English' },
    { code: 'ar', flag: '🇸🇦', label: 'العربية' },
    { code: 'es', flag: '🇪🇸', label: 'Español' },
    { code: 'fr', flag: '🇫🇷', label: 'Français' },
    { code: 'de', flag: '🇩🇪', label: 'Deutsch' },
    { code: 'ru', flag: '🇷🇺', label: 'Русский' },
    { code: 'zh', flag: '🇨🇳', label: '中文' },
    { code: 'ja', flag: '🇯🇵', label: '日本語' },
    { code: 'pt', flag: '🇧🇷', label: 'Português' },
    { code: 'tr', flag: '🇹🇷', label: 'Türkçe' },
    { code: 'nl', flag: '🇳🇱', label: 'Nederlands' },
    { code: 'pl', flag: '🇵🇱', label: 'Polski' },
    { code: 'sv', flag: '🇸🇪', label: 'Svenska' },
    { code: 'th', flag: '🇹🇭', label: 'ไทย' },
    { code: 'vi', flag: '🇻🇳', label: 'Tiếng Việt' },
    { code: 'id', flag: '🇮🇩', label: 'Indonesia' },
    { code: 'fi', flag: '🇫🇮', label: 'Suomi' },
    { code: 'da', flag: '🇩🇰', label: 'Dansk' },
    { code: 'no', flag: '🇳🇴', label: 'Norsk' },
    { code: 'cs', flag: '🇨🇿', label: 'Čeština' },
    { code: 'hu', flag: '🇭🇺', label: 'Magyar' },
    { code: 'ro', flag: '🇷🇴', label: 'Română' },
    { code: 'el', flag: '🇬🇷', label: 'Ελληνικά' },
  ];

  const currentLang = languages.find(l => l.code === language) || languages[0];
  const isActive = (path: string) => location.pathname === path;

  return (
    <header
      className="sticky top-0 z-50 w-full transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(10,10,20,0.95)' : 'rgba(10,10,20,0.7)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: scrolled ? '1px solid rgba(0,212,255,0.15)' : '1px solid transparent',
        boxShadow: scrolled ? '0 4px 30px rgba(0,0,0,0.4)' : 'none',
      }}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/home" className="flex items-center gap-3 flex-shrink-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #00D4FF, #B24BF3)', boxShadow: '0 0 20px rgba(0,212,255,0.3)' }}
            >
              <Sparkles className="w-4.5 h-4.5 text-white w-5 h-5" />
            </div>
            <div className="hidden sm:block">
              <div className="font-bold text-base leading-tight" style={{ color: '#f0f0ff', fontFamily: 'Syne, sans-serif' }}>
                AI Recaps
              </div>
              <div className="text-xs" style={{ color: 'rgba(0,212,255,0.6)', fontSize: '10px' }}>Maker</div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {mainNavItems.map(item => {
              const Icon = item.icon;
              if (item.highlight) {
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="mx-1 btn-neon-cyan py-2 px-4 text-sm flex items-center gap-1.5"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {item.label}
                  </Link>
                );
              }
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                    isActive(item.path)
                      ? 'text-[#00D4FF]'
                      : 'hover:text-white text-[rgba(180,180,220,0.65)] hover:bg-white/5'
                  }`}
                  style={isActive(item.path) ? { background: 'rgba(0,212,255,0.08)' } : {}}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="hidden md:block relative">
              <button
                onClick={() => { setLangOpen(!langOpen); setUserMenuOpen(false); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all hover:bg-white/5"
                style={{ color: 'rgba(180,180,220,0.65)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <span>{currentLang.flag}</span>
                <span className="hidden xl:block">{currentLang.label}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              {langOpen && (
                <div
                  className="absolute top-full mt-1 right-0 rounded-xl p-2 z-50 w-48 max-h-64 overflow-y-auto"
                  style={{ background: 'rgba(12,12,25,0.98)', border: '1px solid rgba(0,212,255,0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}
                >
                  {languages.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => { setLanguage(lang.code as any); setLangOpen(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-all ${language === lang.code ? 'text-[#00D4FF]' : 'text-[rgba(200,200,240,0.7)] hover:bg-white/5'}`}
                      style={language === lang.code ? { background: 'rgba(0,212,255,0.08)' } : {}}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User Section */}
            <div className="hidden md:block">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => { setUserMenuOpen(!userMenuOpen); setLangOpen(false); }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all hover:bg-white/5"
                    style={{ border: '1px solid rgba(0,212,255,0.15)', color: 'rgba(200,200,240,0.8)' }}
                  >
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'linear-gradient(135deg, #00D4FF, #B24BF3)', color: '#0a0a14' }}>
                      {user.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm hidden xl:block">{user.username}</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {userMenuOpen && (
                    <div
                      className="absolute top-full mt-1 right-0 rounded-xl p-2 z-50 w-48"
                      style={{ background: 'rgba(12,12,25,0.98)', border: '1px solid rgba(0,212,255,0.15)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
                    >
                      <div className="px-3 py-2 mb-2 rounded-lg" style={{ background: 'rgba(0,212,255,0.05)' }}>
                        <div className="text-sm font-semibold" style={{ color: '#f0f0ff' }}>{user.username}</div>
                        <div className="text-xs" style={{ color: 'rgba(150,150,200,0.6)' }}>{user.email}</div>
                      </div>
                      <Link to="/settings" onClick={() => setUserMenuOpen(false)} className="w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-all hover:bg-white/5" style={{ color: 'rgba(200,200,240,0.7)' }}>
                        <Settings className="w-4 h-4" /> {t.nav.settings}
                      </Link>
                      <button onClick={() => { logout(); setUserMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-all hover:bg-red-500/10" style={{ color: 'rgba(255,80,80,0.8)' }}>
                        <LogOut className="w-4 h-4" /> {t.auth.logout}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="btn-ghost py-2 px-4 text-sm flex items-center gap-1.5">
                    <LogIn className="w-4 h-4" /> {t.auth.login.title}
                  </Link>
                  <Link to="/signup" className="btn-neon-cyan py-2 px-4 text-sm">
                    {t.auth.signup.title}
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg transition-all"
              style={{ color: 'rgba(200,200,240,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Overlay to close dropdowns */}
      {(langOpen || userMenuOpen) && (
        <div className="fixed inset-0 z-40" onClick={() => { setLangOpen(false); setUserMenuOpen(false); }} />
      )}

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden"
          style={{ background: 'rgba(10,10,20,0.98)', borderTop: '1px solid rgba(0,212,255,0.1)', backdropFilter: 'blur(20px)' }}
        >
          <nav className="container mx-auto px-4 py-4 space-y-1">
            {mainNavItems.map(item => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive(item.path) ? 'text-[#00D4FF]' : 'text-[rgba(180,180,220,0.65)] hover:text-white hover:bg-white/5'
                  } ${item.highlight ? 'text-[#00D4FF] bg-[rgba(0,212,255,0.08)]' : ''}`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}

            <div style={{ height: '1px', background: 'rgba(0,212,255,0.1)', margin: '12px 0' }} />

            {user ? (
              <>
                <div className="px-4 py-3 rounded-xl flex items-center gap-3" style={{ background: 'rgba(0,212,255,0.05)' }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold" style={{ background: 'linear-gradient(135deg, #00D4FF, #B24BF3)', color: '#0a0a14' }}>
                    {user.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: '#f0f0ff' }}>{user.username}</div>
                    <div className="text-xs" style={{ color: 'rgba(150,150,200,0.6)' }}>{user.email}</div>
                  </div>
                </div>
                <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all hover:bg-red-500/10" style={{ color: 'rgba(255,80,80,0.8)' }}>
                  <LogOut className="w-4 h-4" /> {t.auth.logout}
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 px-2">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="btn-ghost py-3 text-center text-sm">
                  {t.auth.login.title}
                </Link>
                <Link to="/signup" onClick={() => setMobileMenuOpen(false)} className="btn-neon-cyan py-3 text-center text-sm">
                  {t.auth.signup.title}
                </Link>
              </div>
            )}

            {/* Mobile Language */}
            <div className="px-2 pt-2">
              <select
                value={language}
                onChange={(e) => { setLanguage(e.target.value as any); setMobileMenuOpen(false); }}
                className="w-full px-4 py-3 rounded-xl text-sm"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(0,212,255,0.15)', color: 'rgba(200,200,240,0.8)' }}
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.flag} {lang.label}</option>
                ))}
              </select>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
