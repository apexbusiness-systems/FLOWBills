import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from '@/locales/en.json';
import fr from '@/locales/fr.json';
import de from '@/locales/de.json';
import ar from '@/locales/ar.json';
import zh from '@/locales/zh.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
      de: { translation: de },
      ar: { translation: ar },
      zh: { translation: zh },
    },
    fallbackLng: 'en',
    returnNull: false,
    saveMissing: import.meta.env.DEV,
    missingKeyHandler: (lng, _namespace, key) => {
      if (import.meta.env.DEV) {
        console.warn(`[i18n] Missing translation key "${key}" for locale "${lng}".`);
      }
    },
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
