import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { Menu, X, Chrome as Home, LayoutDashboard, Plus, ChartBar as BarChart3, Settings, Wallet, Youtube, Globe, User, LogOut, LogIn, Film, Mail, Grid2x2 as Grid, Video, Shield } from 'lucide-react';

export default function Header() {
  const { t, language, setLanguage, dir } = useLanguage();
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/home', label: t.nav.home, icon: Home },
    { path: '/dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
    { path: '/create', label: t.nav.create, icon: Plus },
    { path: '/my-recaps', label: t.nav.myRecaps, icon: Film },
    { path: '/my-videos', label: 'My Videos', icon: Video },
    { path: '/gallery', label: t.nav.gallery, icon: Grid },
    { path: '/analytics', label: t.nav.analytics, icon: BarChart3 },
    { path: '/wallet', label: t.nav.wallet, icon: Wallet },
    { path: '/youtube-learning', label: t.nav.youtube, icon: Youtube },
    { path: '/contact', label: t.nav.contact, icon: Mail },
    { path: '/settings', label: t.nav.settings, icon: Settings },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full glass-morphism border-b border-brass-600/30">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/home" className="flex items-center space-x-2 rtl:space-x-reverse">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brass-500 to-copper-600 flex items-center justify-center glow-brass">
              <span className="text-white font-bold text-xl">AI</span>
            </div>
            <div className="hidden sm:block">
              <div className="text-lg font-serif font-bold text-brass-200">
                {t.common.appName}
              </div>
              <div className="text-xs text-brass-400">{t.common.version}</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1 rtl:space-x-reverse">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                    isActive(item.path)
                      ? 'bg-brass-600/50 text-white shadow-brass'
                      : 'text-brass-200 hover:bg-brass-700/30 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            {/* User Menu */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-steam-900/50 rounded-lg border border-brass-700/30">
                    <User className="w-4 h-4 text-brass-400" />
                    <span className="text-sm text-brass-300">{user.username}</span>
                  </div>
                  <button
                    onClick={logout}
                    className="steampunk-button-secondary p-2"
                    title={t.auth.logout}
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="steampunk-button-secondary px-4 py-2 flex items-center gap-2">
                    <LogIn className="w-4 h-4" />
                    {t.auth.login.title}
                  </Link>
                  <Link to="/signup" className="steampunk-button px-4 py-2">
                    {t.auth.signup.title}
                  </Link>
                </>
              )}
            </div>

            {/* Language Switcher */}
            <div className="hidden md:flex items-center gap-2">
              <Globe className="w-4 h-4 text-brass-300" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="bg-steam-900/50 border border-brass-600/30 text-brass-200 text-sm rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brass-500"
              >
                <option value="he">🇮🇱 עברית</option>
                <option value="en">🇬🇧 English</option>
                <option value="ar">🇸🇦 العربية</option>
                <option value="es">🇪🇸 Español</option>
                <option value="fr">🇫🇷 Français</option>
                <option value="de">🇩🇪 Deutsch</option>
                <option value="ru">🇷🇺 Русский</option>
                <option value="zh">🇨🇳 中文</option>
                <option value="ja">🇯🇵 日本語</option>
                <option value="pt">🇧🇷 Português</option>
                <option value="tr">🇹🇷 Türkçe</option>
                <option value="nl">🇳🇱 Nederlands</option>
                <option value="pl">🇵🇱 Polski</option>
                <option value="sv">🇸🇪 Svenska</option>
                <option value="th">🇹🇭 ไทย</option>
                <option value="vi">🇻🇳 Tiếng Việt</option>
                <option value="id">🇮🇩 Bahasa Indonesia</option>
                <option value="fi">🇫🇮 Suomi</option>
                <option value="da">🇩🇰 Dansk</option>
                <option value="no">🇳🇴 Norsk</option>
                <option value="cs">🇨🇿 Čeština</option>
                <option value="hu">🇭🇺 Magyar</option>
                <option value="ro">🇷🇴 Română</option>
                <option value="el">🇬🇷 Ελληνικά</option>
              </select>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-md text-brass-200 hover:bg-brass-700/30"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-brass-600/30 bg-steam-900/95 backdrop-blur-lg">
          <nav className="container mx-auto px-4 py-4 space-y-2">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-all ${
                    isActive(item.path)
                      ? 'bg-brass-600/50 text-white shadow-brass'
                      : 'text-brass-200 hover:bg-brass-700/30 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
            
            {/* Mobile User Menu */}
            <div className="border-t border-brass-700/30 pt-4 mt-4">
              {user ? (
                <>
                  <div className="flex items-center gap-3 px-4 py-3 bg-steam-900/50 rounded-lg mb-2">
                    <User className="w-5 h-5 text-brass-400" />
                    <div>
                      <div className="text-sm font-semibold text-brass-200">{user.username}</div>
                      <div className="text-xs text-brass-500">{user.email}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full steampunk-button-secondary py-3 flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-5 h-5" />
                    {t.auth.logout}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full steampunk-button-secondary py-3 text-center mb-2"
                  >
                    {t.auth.login.title}
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full steampunk-button py-3 text-center"
                  >
                    {t.auth.signup.title}
                  </Link>
                </>
              )}
            </div>
            
            {/* Mobile Language Switcher */}
            <div className="flex items-center gap-3 px-4 py-3">
              <Globe className="w-5 h-5 text-brass-300" />
              <select
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value as any);
                  setMobileMenuOpen(false);
                }}
                className="flex-1 bg-steam-900/50 border border-brass-600/30 text-brass-200 text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brass-500"
              >
                <option value="he">🇮🇱 עברית</option>
                <option value="en">🇬🇧 English</option>
                <option value="ar">🇸🇦 العربية</option>
                <option value="es">🇪🇸 Español</option>
                <option value="fr">🇫🇷 Français</option>
                <option value="de">🇩🇪 Deutsch</option>
                <option value="ru">🇷🇺 Русский</option>
                <option value="zh">🇨🇳 中文</option>
                <option value="ja">🇯🇵 日本語</option>
                <option value="pt">🇧🇷 Português</option>
                <option value="tr">🇹🇷 Türkçe</option>
                <option value="nl">🇳🇱 Nederlands</option>
                <option value="pl">🇵🇱 Polski</option>
                <option value="sv">🇸🇪 Svenska</option>
                <option value="th">🇹🇭 ไทย</option>
                <option value="vi">🇻🇳 Tiếng Việt</option>
                <option value="id">🇮🇩 Bahasa Indonesia</option>
                <option value="fi">🇫🇮 Suomi</option>
                <option value="da">🇩🇰 Dansk</option>
                <option value="no">🇳🇴 Norsk</option>
                <option value="cs">🇨🇿 Čeština</option>
                <option value="hu">🇭🇺 Magyar</option>
                <option value="ro">🇷🇴 Română</option>
                <option value="el">🇬🇷 Ελληνικά</option>
              </select>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
