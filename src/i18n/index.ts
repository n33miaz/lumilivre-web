import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import ptBRCommon from './locales/pt-BR/common.json';
import ptBRAuth from './locales/pt-BR/auth.json';
import ptBRReader from './locales/pt-BR/reader.json';
import ptBRBook from './locales/pt-BR/book.json';
import ptBRLoan from './locales/pt-BR/loan.json';
import ptBRSettings from './locales/pt-BR/settings.json';
import ptBRAdmin from './locales/pt-BR/admin.json';
import ptBRNav from './locales/pt-BR/nav.json';
import ptBRRanking from './locales/pt-BR/ranking.json';
import ptBRReport from './locales/pt-BR/report.json';
import ptBRContents from './locales/pt-BR/contents.json';
import ptBRDashboard from './locales/pt-BR/dashboard.json';
import ptBRLanding from './locales/pt-BR/landing.json';
import ptBRDownload from './locales/pt-BR/download.json';

import enUSCommon from './locales/en-US/common.json';
import enUSAuth from './locales/en-US/auth.json';
import enUSReader from './locales/en-US/reader.json';
import enUSBook from './locales/en-US/book.json';
import enUSLoan from './locales/en-US/loan.json';
import enUSSettings from './locales/en-US/settings.json';
import enUSAdmin from './locales/en-US/admin.json';
import enUSNav from './locales/en-US/nav.json';
import enUSRanking from './locales/en-US/ranking.json';
import enUSReport from './locales/en-US/report.json';
import enUSContents from './locales/en-US/contents.json';
import enUSDashboard from './locales/en-US/dashboard.json';
import enUSLanding from './locales/en-US/landing.json';
import enUSDownload from './locales/en-US/download.json';

export const LOCALES = [
  { code: 'pt-BR', label: 'Português', short: 'PT' },
  { code: 'en-US', label: 'English', short: 'EN' },
] as const;

export type SupportedLocale = (typeof LOCALES)[number]['code'];

export const SUPPORTED_LOCALES = LOCALES.map(
  (l) => l.code,
) as readonly SupportedLocale[];

export const DEFAULT_LOCALE: SupportedLocale = 'pt-BR';
export const LOCALE_STORAGE_KEY = 'lumilivre.locale';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      'pt-BR': {
        common: ptBRCommon,
        auth: ptBRAuth,
        reader: ptBRReader,
        book: ptBRBook,
        loan: ptBRLoan,
        settings: ptBRSettings,
        admin: ptBRAdmin,
        nav: ptBRNav,
        ranking: ptBRRanking,
        report: ptBRReport,
        contents: ptBRContents,
        dashboard: ptBRDashboard,
        landing: ptBRLanding,
        download: ptBRDownload,
      },
      'en-US': {
        common: enUSCommon,
        auth: enUSAuth,
        reader: enUSReader,
        book: enUSBook,
        loan: enUSLoan,
        settings: enUSSettings,
        admin: enUSAdmin,
        nav: enUSNav,
        ranking: enUSRanking,
        report: enUSReport,
        contents: enUSContents,
        dashboard: enUSDashboard,
        landing: enUSLanding,
        download: enUSDownload,
      },
    },
    fallbackLng: DEFAULT_LOCALE,
    defaultNS: 'common',
    supportedLngs: SUPPORTED_LOCALES,
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LOCALE_STORAGE_KEY,
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
