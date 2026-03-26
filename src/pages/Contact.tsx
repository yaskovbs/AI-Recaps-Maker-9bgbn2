import React, { useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { supabase } from '@/lib/supabase';
import { CONTACT_EMAIL, CONTACT_PHONE } from '@/constants/contact';
import { Mail, Phone, Send, Clock, CheckCircle, AlertCircle, Loader } from 'lucide-react';

export default function Contact() {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setErrorMessage('');

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setStatus('error');
      setErrorMessage(t.contactPage.invalidEmail);
      return;
    }

    try {
      // Save contact submission to database
      const { error } = await supabase
        .from('contact_submissions')
        .insert({
          name: formData.name,
          email: formData.email,
          message: formData.message,
          status: 'new',
        });

      if (error) {
        setStatus('error');
        setErrorMessage(error.message || t.contactPage.errorDefault);
        return;
      }

      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
        setFormData({ name: '', email: '', message: '' });
      }, 5000);
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.message || t.contactPage.errorDefault);
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold text-brass-200 mb-2">{t.contactPage.title}</h1>
          <p className="text-brass-300">{t.contactPage.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contact Info */}
          <div className="lg:col-span-1 space-y-4">
            <div className="steampunk-card p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brass-500 to-copper-600 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-brass-200 font-semibold mb-1">{t.contactPage.email}</h3>
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="text-brass-300 hover:text-brass-100 text-sm break-all"
                  >
                    {CONTACT_EMAIL}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brass-500 to-copper-600 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-brass-200 font-semibold mb-1">{t.contactPage.phone}</h3>
                  <a
                    href={`tel:${CONTACT_PHONE}`}
                    className="text-brass-300 hover:text-brass-100 text-sm"
                  >
                    {CONTACT_PHONE}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brass-500 to-copper-600 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-brass-200 font-semibold mb-1">{t.contactPage.hours}</h3>
                  <p className="text-brass-300 text-sm">{t.contactPage.hoursDays}</p>
                  <p className="text-brass-300 text-sm">{t.contactPage.hoursTime}</p>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="steampunk-card p-6">
              <h3 className="text-brass-200 font-semibold mb-4">{t.contactPage.followUs}</h3>
              <div className="space-y-3">
                <a
                  href="https://youtube.com/@movies_and_tv_show_recap?si=L20-T0pxH8cBA8Uu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-brass-300 hover:text-brass-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-red-600/20 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  </div>
                  YouTube
                </a>
                <a
                  href="https://github.com/yaskovbs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-brass-300 hover:text-brass-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-brass-600/20 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                  </div>
                  GitHub
                </a>
                <a
                  href="https://linktr.ee/yaaskovbs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-brass-300 hover:text-brass-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-green-600/20 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M13.511 5.853l.002-.002 6.632 6.632-1.115 1.115-6.632-6.632 1.113-1.113zm-7.024 1.115l6.632 6.632-1.115 1.115-6.632-6.632 1.115-1.115zm.002 6.634l.002-.002 6.632 6.632-1.113 1.113-6.632-6.632 1.111-1.111z" />
                    </svg>
                  </div>
                  Linktree
                </a>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="steampunk-card p-8">
              <h2 className="text-2xl font-serif font-semibold text-brass-200 mb-6">
                {t.contactPage.sendMessage}
              </h2>

              {status === 'success' ? (
                <div className="bg-green-900/30 border border-green-600/50 rounded-lg p-8 text-center">
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-green-300 mb-2">
                    {t.contactPage.success}
                  </h3>
                  <p className="text-green-200">
                    {t.contactPage.successDetail}
                  </p>
                </div>
              ) : (
                <>
                  {status === 'error' && (
                    <div className="bg-red-900/30 border border-red-600/50 rounded-lg p-4 mb-6 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-red-300 font-semibold mb-1">{t.contactPage.errorTitle}</h4>
                        <p className="text-red-200 text-sm">{errorMessage}</p>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-brass-200 font-medium mb-2">{t.contactPage.nameLabel}</label>
                      <input
                        type="text"
                        required
                        disabled={status === 'sending'}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder={t.contactPage.namePlaceholder}
                        className="w-full bg-steam-900/50 border border-brass-600/30 rounded-lg p-4 text-brass-200 focus:outline-none focus:ring-2 focus:ring-brass-500 disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="block text-brass-200 font-medium mb-2">{t.contactPage.emailLabel}</label>
                      <input
                        type="email"
                        required
                        disabled={status === 'sending'}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="your@email.com"
                        className="w-full bg-steam-900/50 border border-brass-600/30 rounded-lg p-4 text-brass-200 focus:outline-none focus:ring-2 focus:ring-brass-500 disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="block text-brass-200 font-medium mb-2">{t.contactPage.messageLabel}</label>
                      <textarea
                        required
                        disabled={status === 'sending'}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder={t.contactPage.messagePlaceholder}
                        rows={6}
                        className="w-full bg-steam-900/50 border border-brass-600/30 rounded-lg p-4 text-brass-200 focus:outline-none focus:ring-2 focus:ring-brass-500 disabled:opacity-50"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={status === 'sending'}
                      className="steampunk-button w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {status === 'sending' ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          {t.contactPage.sending}
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          {t.contactPage.send}
                        </>
                      )}
                    </button>

                    <p className="text-xs text-brass-400 text-center">
                      {t.contactPage.privacyNote}
                    </p>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
