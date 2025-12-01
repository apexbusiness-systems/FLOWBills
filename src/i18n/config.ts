import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from '@/locales/en.json' assert { type: 'json' };
import fr from '@/locales/fr.json' assert { type: 'json' };
import de from '@/locales/de.json' assert { type: 'json' };
import ar from '@/locales/ar.json' assert { type: 'json' };
import zh from '@/locales/zh.json' assert { type: 'json' };

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
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
