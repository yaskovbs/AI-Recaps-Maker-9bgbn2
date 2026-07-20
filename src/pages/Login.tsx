import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { Lock, Mail, LogIn, Sparkles, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const { t } = useLanguage();
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/dashboard';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError(t.auth.errors.fillAllFields); return; }
    try {
      await login(email, password);
      navigate(returnTo, { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.auth.errors.loginFailed);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: '#0a0a14' }}>
      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full blur-[100px] opacity-15 pointer-events-none" style={{ background: '#00D4FF' }} />
      <div className="absolute bottom-1/4 right-1/4 w-60 h-60 rounded-full blur-[80px] opacity-12 pointer-events-none" style={{ background: '#B24BF3' }} />
      <div className="absolute inset-0 grid-bg opacity-20" />

      <div className="w-full max-w-md relative z-10">
        {/* Card */}
        <div className="ai-card p-5 sm:p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00D4FF, #B24BF3)', boxShadow: '0 0 30px rgba(0,212,255,0.35)' }}>
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#f0f0ff', fontFamily: 'Syne, sans-serif' }}>
              {t.auth.login.title}
            </h1>
            <p className="text-sm" style={{ color: 'rgba(160,160,210,0.6)' }}>{t.auth.login.subtitle}</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 p-4 rounded-xl text-sm" style={{ background: 'rgba(255,60,60,0.1)', border: '1px solid rgba(255,60,60,0.25)', color: '#ff8888' }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="block text-sm font-semibold mb-2" style={{ color: 'rgba(200,200,240,0.8)' }}>
                {t.auth.fields.email}
              </label>
              <div className="relative">
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(0,212,255,0.5)' }} />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={t.auth.placeholders.email}
                  className="ai-input pr-11"
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-semibold mb-2" style={{ color: 'rgba(200,200,240,0.8)' }}>
                {t.auth.fields.password}
              </label>
              <div className="relative">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(0,212,255,0.5)' }} />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={t.auth.placeholders.password}
                  className="ai-input pr-11 pl-11"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-lg p-2 hover:bg-white/5" style={{ color: 'rgba(160,160,210,0.7)' }} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-neon-cyan w-full py-3.5 flex items-center justify-center gap-2 text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <><div className="w-5 h-5 border-2 border-[#0a0a14]/30 border-t-[#0a0a14] rounded-full animate-spin" />{t.common.loading}</>
              ) : (
                <><LogIn className="w-5 h-5" />{t.auth.login.submit}</>
              )}
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 text-center text-sm">
            <span style={{ color: 'rgba(160,160,210,0.55)' }}>{t.auth.login.noAccount} </span>
            <Link to="/signup" className="font-semibold hover:text-white transition-colors" style={{ color: '#00D4FF' }}>
              {t.auth.login.signupLink}
            </Link>
          </div>
          <div className="mt-3 text-center">
            <Link to="/home" className="text-sm transition-colors hover:text-white" style={{ color: 'rgba(140,140,190,0.5)' }}>
              ← {t.auth.login.backToHome}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
