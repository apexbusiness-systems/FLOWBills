// #region agent log
fetch('http://127.0.0.1:7247/ingest/b2b4d03c-5e29-4823-8db6-62be0d831805',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'i18n/config.ts:1',message:'i18n config module started',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
// #endregion
import i18n from 'i18next';
// #region agent log
fetch('http://127.0.0.1:7247/ingest/b2b4d03c-5e29-4823-8db6-62be0d831805',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'i18n/config.ts:4',message:'i18next imported',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
// #endregion
import { initReactI18next } from 'react-i18next';
// #region agent log
fetch('http://127.0.0.1:7247/ingest/b2b4d03c-5e29-4823-8db6-62be0d831805',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'i18n/config.ts:6',message:'initReactI18next imported',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
// #endregion
import LanguageDetector from 'i18next-browser-languagedetector';
// #region agent log
fetch('http://127.0.0.1:7247/ingest/b2b4d03c-5e29-4823-8db6-62be0d831805',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'i18n/config.ts:8',message:'LanguageDetector imported',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
// #endregion

// #region agent log
fetch('http://127.0.0.1:7247/ingest/b2b4d03c-5e29-4823-8db6-62be0d831805',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'i18n/config.ts:11',message:'About to import locale files',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
// #endregion
import en from '@/locales/en.json';
// #region agent log
fetch('http://127.0.0.1:7247/ingest/b2b4d03c-5e29-4823-8db6-62be0d831805',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'i18n/config.ts:13',message:'en.json imported',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
// #endregion
import fr from '@/locales/fr.json';
// #region agent log
fetch('http://127.0.0.1:7247/ingest/b2b4d03c-5e29-4823-8db6-62be0d831805',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'i18n/config.ts:15',message:'fr.json imported',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
// #endregion
import de from '@/locales/de.json';
// #region agent log
fetch('http://127.0.0.1:7247/ingest/b2b4d03c-5e29-4823-8db6-62be0d831805',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'i18n/config.ts:17',message:'de.json imported',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
// #endregion
import ar from '@/locales/ar.json';
// #region agent log
fetch('http://127.0.0.1:7247/ingest/b2b4d03c-5e29-4823-8db6-62be0d831805',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'i18n/config.ts:19',message:'ar.json imported',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
// #endregion
import zh from '@/locales/zh.json';
// #region agent log
fetch('http://127.0.0.1:7247/ingest/b2b4d03c-5e29-4823-8db6-62be0d831805',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'i18n/config.ts:21',message:'zh.json imported',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
// #endregion

// #region agent log
fetch('http://127.0.0.1:7247/ingest/b2b4d03c-5e29-4823-8db6-62be0d831805',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'i18n/config.ts:24',message:'About to initialize i18n',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
// #endregion
try {
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
  // #region agent log
  fetch('http://127.0.0.1:7247/ingest/b2b4d03c-5e29-4823-8db6-62be0d831805',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'i18n/config.ts:42',message:'i18n initialization completed',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
} catch (error) {
  // #region agent log
  fetch('http://127.0.0.1:7247/ingest/b2b4d03c-5e29-4823-8db6-62be0d831805',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'i18n/config.ts:45',message:'i18n initialization failed',data:{error:error?.toString(),stack:error?.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  throw error;
}

export default i18n;
// #region agent log
fetch('http://127.0.0.1:7247/ingest/b2b4d03c-5e29-4823-8db6-62be0d831805',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'i18n/config.ts:50',message:'i18n config module completed',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
// #endregion
