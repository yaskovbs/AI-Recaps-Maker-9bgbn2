import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/lib/LanguageContext';
import { CONTACT_EMAIL, CONTACT_PHONE } from '@/constants/contact';
import { Youtube, Github, Link as LinkIcon, Mail, Phone } from 'lucide-react';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="mt-auto border-t border-brass-600/30 bg-steam-900/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brass-500 to-copper-600 flex items-center justify-center glow-brass">
                <span className="text-white font-bold text-xl">AI</span>
              </div>
              <div>
                <div className="text-sm font-serif font-bold text-brass-200">
                  AI Recaps Maker
                </div>
              </div>
            </div>
            <p className="text-sm text-brass-300">
              {t.footer.description}
            </p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-brass-200 font-semibold mb-4">{t.footer.contact.title}</h3>
            <div className="space-y-2 text-sm text-brass-300">
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="flex items-center gap-2 hover:text-brass-100 transition-colors"
              >
                <Mail className="w-4 h-4" />
                {t.footer.contact.email}
              </a>
              <a
                href={`tel:${CONTACT_PHONE}`}
                className="flex items-center gap-2 hover:text-brass-100 transition-colors"
              >
                <Phone className="w-4 h-4" />
                {t.footer.contact.phone}
              </a>
            </div>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-brass-200 font-semibold mb-4">{t.footer.social.title}</h3>
            <div className="space-y-2 text-sm text-brass-300">
              <a
                href="https://youtube.com/@movies_and_tv_show_recap?si=L20-T0pxH8cBA8Uu"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-brass-100 transition-colors"
              >
                <Youtube className="w-4 h-4" />
                {t.footer.social.youtube}
              </a>
              <a
                href="https://github.com/yaskovbs"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-brass-100 transition-colors"
              >
                <Github className="w-4 h-4" />
                {t.footer.social.github}
              </a>
              <a
                href="https://linktr.ee/yaaskovbs"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-brass-100 transition-colors"
              >
                <LinkIcon className="w-4 h-4" />
                {t.footer.social.linktree}
              </a>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-brass-200 font-semibold mb-4">{t.footer.legal.title}</h3>
            <div className="space-y-2 text-sm text-brass-300">
              <Link
                to="/contact"
                className="block hover:text-brass-100 transition-colors"
              >
                {t.footer.legal.contact}
              </Link>
              <Link
                to="/terms"
                className="block hover:text-brass-100 transition-colors"
              >
                {t.footer.legal.terms}
              </Link>
              <Link
                to="/privacy"
                className="block hover:text-brass-100 transition-colors"
              >
                {t.footer.legal.privacy}
              </Link>
              <Link
                to="/faq"
                className="block hover:text-brass-100 transition-colors"
              >
                {t.footer.legal.faq}
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-brass-600/30 text-center text-sm text-brass-400">
          {t.footer.copyright}
        </div>
      </div>
    </footer>
  );
}
