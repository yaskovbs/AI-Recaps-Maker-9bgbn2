import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { Lock, Mail, LogIn, Sparkles, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const { t } = useLanguage();
  const { login, loginWithGoogle, isLoading } = useAuth();
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

  const handleGoogleLogin = async () => {
    setError('');
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || 'התחברות עם Google נכשלה');
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
        <div className="ai-card p-8">
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
              <label className="block text-sm font-semibold mb-2" style={{ color: 'rgba(200,200,240,0.8)' }}>
                {t.auth.fields.email}
              </label>
              <div className="relative">
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(0,212,255,0.5)' }} />
                <input
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
              <label className="block text-sm font-semibold mb-2" style={{ color: 'rgba(200,200,240,0.8)' }}>
                {t.auth.fields.password}
              </label>
              <div className="relative">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(0,212,255,0.5)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={t.auth.placeholders.password}
                  className="ai-input pr-11 pl-11"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'rgba(160,160,210,0.5)' }}>
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

          {/* Divider */}
          <div className="relative my-6">
            <div className="neon-divider" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="px-4 text-sm" style={{ background: '#0f0f1e', color: 'rgba(160,160,210,0.5)' }}>
                {t.auth.login.orContinueWith || 'או המשך עם'}
              </span>
            </div>
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-3 transition-all disabled:opacity-50 hover:bg-white/90"
            style={{ background: '#ffffff', color: '#1a1a2e', fontSize: '15px' }}
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {t.auth.login.googleSignIn || 'התחבר עם Google'}
          </button>

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
