import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { isGoogleOAuthConfigured } from '@/lib/supabase';
import { Lock, Mail, User, UserPlus, Sparkles, Chrome } from 'lucide-react';
import GearAnimation from '@/components/steampunk/GearAnimation';
import SteamEffect from '@/components/steampunk/SteamEffect';

export default function Signup() {
  const { t } = useLanguage();
  const { signup, loginWithGoogle, isLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!email || !password || !confirmPassword || !username) {
      setError(t.auth.errors.fillAllFields);
      return;
    }

    if (password.length < 6) {
      setError(t.auth.errors.passwordTooShort);
      return;
    }

    if (password !== confirmPassword) {
      setError(t.auth.errors.passwordMismatch);
      return;
    }

    if (username.length < 3) {
      setError(t.auth.errors.usernameTooShort);
      return;
    }

    try {
      await signup(email, password, username);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || t.auth.errors.signupFailed);
    }
  };

  const handleGoogleSignup = async () => {
    setError('');
    
    try {
      await loginWithGoogle();
      // Auto-redirects to Google, no need to navigate
    } catch (err: any) {
      console.error('Google signup error:', err);
      const errorMessage = err.message || 'הרשמה עם Google נכשלה';
      
      // Show user-friendly error
      if (errorMessage.includes('not enabled') || errorMessage.includes('לא מוגדר')) {
        setError('⚠️ Google OAuth לא מוגדר במערכת.\n\nצעדים לפתרון:\n1. הגדר VITE_GOOGLE_CLIENT_ID ו-VITE_GOOGLE_CLIENT_SECRET בקובץ .env\n2. OnSpace Cloud Dashboard → User → Auth Settings\n3. הפעל Google Provider\n4. הזן Google Client ID & Secret\n5. שמור והמתן דקה\n6. נסה שוב');
      } else {
        setError(errorMessage);
      }
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-steam-950 via-steam-900 to-steam-800">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-20">
        <GearAnimation size="large" className="absolute top-10 left-10" />
        <GearAnimation size="medium" className="absolute bottom-20 right-20" speed={12} />
        <SteamEffect className="absolute top-1/3 right-1/4" />
        <SteamEffect className="absolute bottom-1/4 left-1/3" />
      </div>

      {/* Signup Card */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="steampunk-card p-8 relative">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-brass-500/10 to-copper-500/10 rounded-lg blur-xl"></div>

            <div className="relative z-10">
              {/* Logo */}
              <div className="text-center mb-8">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-brass-500 to-copper-600 flex items-center justify-center mb-4 glow-brass">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl font-serif font-bold text-brass-200 mb-2">
                  {t.auth.signup.title}
                </h1>
                <p className="text-brass-400">{t.auth.signup.subtitle}</p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-900/30 border border-red-700/50 rounded-lg text-red-300 text-sm">
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-brass-300 mb-2">
                    {t.auth.fields.username}
                  </label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brass-500" />
                    <input
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder={t.auth.placeholders.username}
                      className="steampunk-input w-full pr-10"
                      disabled={isLoading}
                      autoComplete="username"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-brass-300 mb-2">
                    {t.auth.fields.email}
                  </label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brass-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder={t.auth.placeholders.email}
                      className="steampunk-input w-full pr-10"
                      disabled={isLoading}
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-brass-300 mb-2">
                    {t.auth.fields.password}
                  </label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brass-500" />
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder={t.auth.placeholders.password}
                      className="steampunk-input w-full pr-10"
                      disabled={isLoading}
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-brass-300 mb-2">
                    {t.auth.fields.confirmPassword}
                  </label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brass-500" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder={t.auth.placeholders.confirmPassword}
                      className="steampunk-input w-full pr-10"
                      disabled={isLoading}
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="steampunk-button w-full py-3 flex items-center justify-center gap-2 mt-6"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      <span>{t.common.loading}</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      <span>{t.auth.signup.submit}</span>
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-brass-700/30"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-steam-900 text-brass-400">{t.auth.signup.orContinueWith || 'או המשך עם'}</span>
                </div>
              </div>

              {/* Google Sign Up */}
              <button
                type="button"
                onClick={handleGoogleSignup}
                disabled={isLoading}
                className="w-full bg-white hover:bg-gray-100 text-gray-900 border-2 border-gray-300 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>{t.auth.signup.googleSignUp || 'הירשם עם Google'}</span>
              </button>

              {/* Login Link */}
              <div className="mt-6 text-center text-sm">
                <span className="text-brass-400">{t.auth.signup.hasAccount} </span>
                <Link
                  to="/login"
                  className="text-brass-300 hover:text-brass-200 font-semibold underline"
                >
                  {t.auth.signup.loginLink}
                </Link>
              </div>

              {/* Back to Home */}
              <div className="mt-4 text-center">
                <Link
                  to="/home"
                  className="text-sm text-brass-500 hover:text-brass-400 transition-colors"
                >
                  ← {t.auth.signup.backToHome}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
