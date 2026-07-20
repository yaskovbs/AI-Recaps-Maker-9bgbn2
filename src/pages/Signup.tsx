import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { Lock, Mail, User, UserPlus, Sparkles, Eye, EyeOff } from 'lucide-react';

export default function Signup() {
  const { t } = useLanguage();
  const { signup, isLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!email || !password || !confirmPassword || !username) { setError(t.auth.errors.fillAllFields); return; }
    if (password.length < 6) { setError(t.auth.errors.passwordTooShort); return; }
    if (password !== confirmPassword) { setError(t.auth.errors.passwordMismatch); return; }
    if (username.length < 3) { setError(t.auth.errors.usernameTooShort); return; }
    try {
      const result = await signup(email.trim(), password, username.trim());
      if (result === 'confirmation-required') {
        setSuccess('Account created. Please check your email and confirm your account, then sign in.');
        return;
      }
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message || t.auth.errors.signupFailed);
    }
  };

  const fields = [
    { key: 'username', icon: User, type: 'text', label: t.auth.fields.username, placeholder: t.auth.placeholders.username, value: username, setter: setUsername, autoComplete: 'username' },
    { key: 'email', icon: Mail, type: 'email', label: t.auth.fields.email, placeholder: t.auth.placeholders.email, value: email, setter: setEmail, autoComplete: 'email' },
    { key: 'password', icon: Lock, type: showPassword ? 'text' : 'password', label: t.auth.fields.password, placeholder: t.auth.placeholders.password, value: password, setter: setPassword, autoComplete: 'new-password' },
    { key: 'confirm', icon: Lock, type: showConfirmPassword ? 'text' : 'password', label: t.auth.fields.confirmPassword, placeholder: t.auth.placeholders.confirmPassword, value: confirmPassword, setter: setConfirmPassword, autoComplete: 'new-password' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: '#0a0a14' }}>
      <div className="absolute top-1/4 right-1/4 w-72 h-72 rounded-full blur-[100px] opacity-15 pointer-events-none" style={{ background: '#B24BF3' }} />
      <div className="absolute bottom-1/4 left-1/4 w-60 h-60 rounded-full blur-[80px] opacity-12 pointer-events-none" style={{ background: '#00D4FF' }} />
      <div className="absolute inset-0 grid-bg opacity-20" />

      <div className="w-full max-w-md relative z-10">
        <div className="ai-card p-5 sm:p-8">
          {/* Logo */}
          <div className="text-center mb-7">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #B24BF3, #00D4FF)', boxShadow: '0 0 30px rgba(178,75,243,0.35)' }}>
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#f0f0ff', fontFamily: 'Syne, sans-serif' }}>
              {t.auth.signup.title}
            </h1>
            <p className="text-sm" style={{ color: 'rgba(160,160,210,0.6)' }}>{t.auth.signup.subtitle}</p>
          </div>


          {error && (
            <div role="alert" className="mb-5 p-4 rounded-xl text-sm whitespace-pre-line" style={{ background: 'rgba(255,60,60,0.1)', border: '1px solid rgba(255,60,60,0.25)', color: '#ff8888' }}>
              {error}
            </div>
          )}

          {success && (
            <div role="status" className="mb-5 p-4 rounded-xl text-sm" style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', color: '#8be9ff' }}>
              {success}{' '}
              <Link to="/login" className="font-semibold underline hover:text-white">Sign in</Link>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(field => {
              const Icon = field.icon;
              const isPasswordField = field.key === 'password' || field.key === 'confirm';
              const isVisible = field.key === 'password' ? showPassword : showConfirmPassword;
              const toggleVisibility = field.key === 'password'
                ? () => setShowPassword(value => !value)
                : () => setShowConfirmPassword(value => !value);
              return (
                <div key={field.key}>
                  <label htmlFor={`signup-${field.key}`} className="block text-sm font-semibold mb-1.5" style={{ color: 'rgba(200,200,240,0.8)' }}>
                    {field.label}
                  </label>
                  <div className="relative">
                    <Icon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(0,212,255,0.5)' }} />
                    <input
                      id={`signup-${field.key}`}
                      type={field.type}
                      value={field.value}
                      onChange={e => field.setter(e.target.value)}
                      placeholder={field.placeholder}
                      className={`ai-input pr-11 ${isPasswordField ? 'pl-11' : ''}`}
                      disabled={isLoading}
                      autoComplete={field.autoComplete}
                    />
                    {isPasswordField && (
                      <button type="button" onClick={toggleVisibility} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-lg p-2 hover:bg-white/5" style={{ color: 'rgba(160,160,210,0.7)' }} aria-label={isVisible ? `Hide ${field.label}` : `Show ${field.label}`} aria-pressed={isVisible}>
                        {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-neon-purple w-full py-3.5 flex items-center justify-center gap-2 text-base mt-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t.common.loading}</>
              ) : (
                <><UserPlus className="w-5 h-5" />{t.auth.signup.submit}</>
              )}
            </button>
          </form>

          <div className="mt-5 text-center text-sm">
            <span style={{ color: 'rgba(160,160,210,0.55)' }}>{t.auth.signup.hasAccount} </span>
            <Link to="/login" className="font-semibold hover:text-white transition-colors" style={{ color: '#B24BF3' }}>
              {t.auth.signup.loginLink}
            </Link>
          </div>
          <div className="mt-3 text-center">
            <Link to="/home" className="text-sm transition-colors hover:text-white" style={{ color: 'rgba(140,140,190,0.5)' }}>
              ← {t.auth.signup.backToHome}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
