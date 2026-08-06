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

import esESCommon from './locales/es-ES/common.json';
import esESAuth from './locales/es-ES/auth.json';
import esESReader from './locales/es-ES/reader.json';
import esESBook from './locales/es-ES/book.json';
import esESLoan from './locales/es-ES/loan.json';
import esESSettings from './locales/es-ES/settings.json';
import esESAdmin from './locales/es-ES/admin.json';
import esESNav from './locales/es-ES/nav.json';
import esESRanking from './locales/es-ES/ranking.json';
import esESReport from './locales/es-ES/report.json';
import esESContents from './locales/es-ES/contents.json';
import esESDashboard from './locales/es-ES/dashboard.json';
import esESLanding from './locales/es-ES/landing.json';
import esESDownload from './locales/es-ES/download.json';

import zhCNCommon from './locales/zh-CN/common.json';
import zhCNAuth from './locales/zh-CN/auth.json';
import zhCNReader from './locales/zh-CN/reader.json';
import zhCNBook from './locales/zh-CN/book.json';
import zhCNLoan from './locales/zh-CN/loan.json';
import zhCNSettings from './locales/zh-CN/settings.json';
import zhCNAdmin from './locales/zh-CN/admin.json';
import zhCNNav from './locales/zh-CN/nav.json';
import zhCNRanking from './locales/zh-CN/ranking.json';
import zhCNReport from './locales/zh-CN/report.json';
import zhCNContents from './locales/zh-CN/contents.json';
import zhCNDashboard from './locales/zh-CN/dashboard.json';
import zhCNLanding from './locales/zh-CN/landing.json';
import zhCNDownload from './locales/zh-CN/download.json';

import hiINCommon from './locales/hi-IN/common.json';
import hiINAuth from './locales/hi-IN/auth.json';
import hiINReader from './locales/hi-IN/reader.json';
import hiINBook from './locales/hi-IN/book.json';
import hiINLoan from './locales/hi-IN/loan.json';
import hiINSettings from './locales/hi-IN/settings.json';
import hiINAdmin from './locales/hi-IN/admin.json';
import hiINNav from './locales/hi-IN/nav.json';
import hiINRanking from './locales/hi-IN/ranking.json';
import hiINReport from './locales/hi-IN/report.json';
import hiINContents from './locales/hi-IN/contents.json';
import hiINDashboard from './locales/hi-IN/dashboard.json';
import hiINLanding from './locales/hi-IN/landing.json';
import hiINDownload from './locales/hi-IN/download.json';

export const LOCALES = [
  { code: 'pt-BR', label: 'Português', short: 'PT' },
  { code: 'en-US', label: 'English', short: 'EN' },
  { code: 'es-ES', label: 'Español', short: 'ES' },
  { code: 'zh-CN', label: '中文', short: '中' },
  { code: 'hi-IN', label: 'हिन्दी', short: 'HI' },
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
      'es-ES': {
        common: esESCommon,
        auth: esESAuth,
        reader: esESReader,
        book: esESBook,
        loan: esESLoan,
        settings: esESSettings,
        admin: esESAdmin,
        nav: esESNav,
        ranking: esESRanking,
        report: esESReport,
        contents: esESContents,
        dashboard: esESDashboard,
        landing: esESLanding,
        download: esESDownload,
      },
      'zh-CN': {
        common: zhCNCommon,
        auth: zhCNAuth,
        reader: zhCNReader,
        book: zhCNBook,
        loan: zhCNLoan,
        settings: zhCNSettings,
        admin: zhCNAdmin,
        nav: zhCNNav,
        ranking: zhCNRanking,
        report: zhCNReport,
        contents: zhCNContents,
        dashboard: zhCNDashboard,
        landing: zhCNLanding,
        download: zhCNDownload,
      },
      'hi-IN': {
        common: hiINCommon,
        auth: hiINAuth,
        reader: hiINReader,
        book: hiINBook,
        loan: hiINLoan,
        settings: hiINSettings,
        admin: hiINAdmin,
        nav: hiINNav,
        ranking: hiINRanking,
        report: hiINReport,
        contents: hiINContents,
        dashboard: hiINDashboard,
        landing: hiINLanding,
        download: hiINDownload,
      },
    },
    fallbackLng: {
      'es-ES': ['en-US', 'pt-BR'],
      'zh-CN': ['en-US', 'pt-BR'],
      'hi-IN': ['en-US', 'pt-BR'],
      default: [DEFAULT_LOCALE],
    },
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
