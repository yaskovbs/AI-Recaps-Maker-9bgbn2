import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/lib/LanguageContext';
import { Youtube, Github, Link as LinkIcon, Mail, Phone, Sparkles, ArrowUpRight } from 'lucide-react';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer
      className="mt-auto"
      style={{
        background: 'linear-gradient(to bottom, #0a0a14, #07070f)',
        borderTop: '1px solid rgba(0,212,255,0.08)',
      }}
    >
      {/* Top neon divider */}
      <div className="neon-divider" />

      <div className="container mx-auto px-4 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #00D4FF, #B24BF3)', boxShadow: '0 0 20px rgba(0,212,255,0.3)' }}
              >
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-bold text-base" style={{ color: '#f0f0ff', fontFamily: 'Syne, sans-serif' }}>
                  AI Recaps Maker
                </div>
                <div className="text-xs" style={{ color: 'rgba(0,212,255,0.5)' }}>v1.2.0</div>
              </div>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(160,160,210,0.6)' }}>
              {t.footer.description}
            </p>
            <div className="flex gap-3 mt-5">
              <a
                href="https://youtube.com/@movies_and_tv_show_recap?si=L20-T0pxH8cBA8Uu"
                target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                style={{ background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.2)', color: '#ff4444' }}
              >
                <Youtube className="w-4 h-4" />
              </a>
              <a
                href="https://github.com/yaskovbs"
                target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(200,200,240,0.7)' }}
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="https://linktr.ee/yaaskovbs"
                target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', color: '#00D4FF' }}
              >
                <LinkIcon className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-sm mb-5 uppercase tracking-wider" style={{ color: '#00D4FF', fontSize: '11px', letterSpacing: '0.1em' }}>
              {t.footer.contact.title}
            </h3>
            <div className="space-y-3">
              <a
                href="mailto:contact-us@y-l-b-s-ai-studio-apps.com"
                className="flex items-center gap-2.5 text-sm transition-all group"
                style={{ color: 'rgba(160,160,210,0.65)' }}
              >
                <Mail className="w-4 h-4 flex-shrink-0 group-hover:text-[#00D4FF] transition-colors" style={{ color: 'rgba(0,212,255,0.5)' }} />
                <span className="group-hover:text-white transition-colors break-all">{t.footer.contact.email}</span>
              </a>
              <a
                href="tel:050-818-1948"
                className="flex items-center gap-2.5 text-sm transition-all group"
                style={{ color: 'rgba(160,160,210,0.65)' }}
              >
                <Phone className="w-4 h-4 flex-shrink-0 group-hover:text-[#00D4FF] transition-colors" style={{ color: 'rgba(0,212,255,0.5)' }} />
                <span className="group-hover:text-white transition-colors">{t.footer.contact.phone}</span>
              </a>
            </div>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-bold text-sm mb-5 uppercase tracking-wider" style={{ color: '#B24BF3', fontSize: '11px', letterSpacing: '0.1em' }}>
              {t.footer.social.title}
            </h3>
            <div className="space-y-3">
              {[
                { href: 'https://youtube.com/@movies_and_tv_show_recap?si=L20-T0pxH8cBA8Uu', icon: Youtube, label: t.footer.social.youtube },
                { href: 'https://github.com/yaskovbs', icon: Github, label: t.footer.social.github },
                { href: 'https://linktr.ee/yaaskovbs', icon: LinkIcon, label: t.footer.social.linktree },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <a
                    key={i}
                    href={item.href}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2.5 text-sm transition-all group"
                    style={{ color: 'rgba(160,160,210,0.65)' }}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0 group-hover:text-[#B24BF3] transition-colors" style={{ color: 'rgba(178,75,243,0.5)' }} />
                    <span className="group-hover:text-white transition-colors">{item.label}</span>
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-bold text-sm mb-5 uppercase tracking-wider" style={{ color: 'rgba(200,200,240,0.5)', fontSize: '11px', letterSpacing: '0.1em' }}>
              {t.footer.legal.title}
            </h3>
            <div className="space-y-3">
              {[
                { to: '/contact', label: t.footer.legal.contact },
                { to: '/terms', label: t.footer.legal.terms },
                { to: '/privacy', label: t.footer.legal.privacy },
                { to: '/faq', label: t.footer.legal.faq },
                { to: '/disclaimer', label: 'Disclaimer' },
              ].map((item, i) => (
                <Link
                  key={i}
                  to={item.to}
                  className="block text-sm transition-all hover:text-white group flex items-center gap-1"
                  style={{ color: 'rgba(160,160,210,0.6)' }}
                >
                  <span className="group-hover:text-white transition-colors">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8" style={{ borderTop: '1px solid rgba(0,212,255,0.06)' }}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm" style={{ color: 'rgba(120,120,170,0.55)' }}>
              {t.footer.copyright}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00ff80] animate-pulse" />
              <span className="text-xs" style={{ color: 'rgba(0,255,128,0.6)' }}>All systems operational</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
