import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Language } from './i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.he;
  dir: 'rtl' | 'ltr';
}

// Create context with undefined default (must be used within Provider)
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('he');

  useEffect(() => {
    const saved = localStorage.getItem('language') as Language;
    if (saved && ['he', 'en', 'ar', 'es', 'fr', 'de', 'ru', 'zh', 'ja', 'pt', 'tr', 'nl', 'pl', 'sv', 'th', 'vi', 'id', 'fi', 'da', 'no', 'cs', 'hu', 'ro', 'el'].includes(saved)) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    
    // Update HTML attributes
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'he' || lang === 'ar' ? 'rtl' : 'ltr';
  };

  // RTL languages: Hebrew, Arabic
  const dir = language === 'he' || language === 'ar' ? 'rtl' : 'ltr';

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t: translations[language],
        dir,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback for cache issues - return default values
    return {
      language: 'he' as Language,
      setLanguage: (lang: Language) => {
        localStorage.setItem('language', lang);
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'he' || lang === 'ar' ? 'rtl' : 'ltr';
        window.location.reload(); // Force reload to fix context
      },
      t: translations['he'],
      dir: 'rtl' as const,
    };
  }
  return context;
}
