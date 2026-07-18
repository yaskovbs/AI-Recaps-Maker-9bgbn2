import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { translations, Language } from './i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.he;
  dir: 'rtl' | 'ltr';
}

// Create context with undefined default (must be used within Provider)
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function mergeTranslations<T>(fallback: T, selected: unknown): T {
  if (Array.isArray(fallback) || fallback === null || typeof fallback !== 'object') {
    return (selected === undefined ? fallback : selected) as T;
  }

  const selectedObject = selected && typeof selected === 'object'
    ? selected as Record<string, unknown>
    : {};

  const fallbackObject = fallback as Record<string, unknown>;

  // Translation files are intentionally allowed to be partial. Build the
  // result from the union of both objects so a key added to one language is
  // not discarded just because it is missing from the fallback language.
  return Object.fromEntries(
    [...new Set([...Object.keys(fallbackObject), ...Object.keys(selectedObject)])]
      .map((key) => [
        key,
        key in fallbackObject
          ? mergeTranslations(fallbackObject[key], selectedObject[key])
          : selectedObject[key],
      ])
  ) as T;
}

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
  const resolvedTranslations = useMemo(() => {
    // Hebrew currently contains several newer page strings (notifications,
    // insights, etc.) that English and Arabic do not. Start with a complete
    // union of the two primary dictionaries, then overlay the selected locale.
    const completeFallback = mergeTranslations(translations.he, translations.en);
    return mergeTranslations(completeFallback, translations[language]);
  }, [language]) as typeof translations.he;

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t: resolvedTranslations,
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
    console.warn('⚠️ useLanguage called outside LanguageProvider - using fallback');
    return {
      language: 'he' as Language,
      setLanguage: (lang: Language) => {
        console.warn('⚠️ setLanguage called outside LanguageProvider');
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
