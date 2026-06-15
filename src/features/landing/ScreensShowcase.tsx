import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useIsDark } from '../../hooks/useIsDark';
import { Icon } from './Icon';

import dashboardLight from '../../assets/images/prints/dashboard.png';
import dashboardDark from '../../assets/images/prints/dashboard_dark.png';
import booksLight from '../../assets/images/prints/books-new.png';
import booksDark from '../../assets/images/prints/books_dark-new.png';
import loansLight from '../../assets/images/prints/loans.png';
import loansDark from '../../assets/images/prints/loans_dark.png';
import rankingLight from '../../assets/images/prints/ranking.png';
import rankingDark from '../../assets/images/prints/ranking_dark.png';
import reportsLight from '../../assets/images/prints/reports.png';
import reportsDark from '../../assets/images/prints/reports_dark.png';

interface Screen {
  key: string;
  tab: string;
  title: string;
  description: string;
  light: string;
  dark: string;
}

/**
 * Vitrine das telas reais do sistema — deixa o visitante percorrer as principais
 * áreas do painel (Dashboard, Acervo, Empréstimos, Classificação, Relatórios)
 * com troca animada e reação ao tema (claro/escuro), espelhando o site.
 */
export function ScreensShowcase() {
  const { t } = useTranslation('landing');
  const isDark = useIsDark();
  const [active, setActive] = useState(0);

  const screens: Screen[] = [
    {
      key: 'dashboard',
      tab: t('screens.dashboard.tab', { defaultValue: 'Dashboard' }),
      title: t('screens.dashboard.title', {
        defaultValue: 'Visão gerencial em tempo real',
      }),
      description: t('screens.dashboard.desc', {
        defaultValue:
          'KPIs, gráficos de empréstimos, top de livros e pendências — tudo em uma tela, com exportação de relatórios.',
      }),
      light: dashboardLight,
      dark: dashboardDark,
    },
    {
      key: 'books',
      tab: t('screens.books.tab', { defaultValue: 'Acervo' }),
      title: t('screens.books.title', {
        defaultValue: 'Catálogo completo com exemplares',
      }),
      description: t('screens.books.desc', {
        defaultValue:
          'Busca por ISBN, visualização em lista ou grade, controle de exemplares e filtros avançados.',
      }),
      light: booksLight,
      dark: booksDark,
    },
    {
      key: 'loans',
      tab: t('screens.loans.tab', { defaultValue: 'Empréstimos' }),
      title: t('screens.loans.title', {
        defaultValue: 'Empréstimos e devoluções sem fricção',
      }),
      description: t('screens.loans.desc', {
        defaultValue:
          'Controle de retiradas, prazos e atrasos, com notificações automáticas por e-mail aos leitores.',
      }),
      light: loansLight,
      dark: loansDark,
    },
    {
      key: 'ranking',
      tab: t('screens.ranking.tab', { defaultValue: 'Classificação' }),
      title: t('screens.ranking.title', {
        defaultValue: 'Engajamento que motiva a leitura',
      }),
      description: t('screens.ranking.desc', {
        defaultValue:
          'Ranking de leitores por curso, módulo e turno, com gráficos de participação da comunidade.',
      }),
      light: rankingLight,
      dark: rankingDark,
    },
    {
      key: 'reports',
      tab: t('screens.reports.tab', { defaultValue: 'Relatórios' }),
      title: t('screens.reports.title', {
        defaultValue: 'Relatórios prontos para impressão',
      }),
      description: t('screens.reports.desc', {
        defaultValue:
          'Exporte empréstimos, exemplares e estatísticas em PDF, em português ou inglês.',
      }),
      light: reportsLight,
      dark: reportsDark,
    },
  ];

  const current = screens[active];

  return (
    <section id="screens" className="relative overflow-hidden py-24">
      <div className="absolute inset-0 grid-pattern opacity-40" />
      <div className="relative max-w-6xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-lumi-100 dark:bg-lumi-500/20 text-lumi-700 dark:text-lumi-200 text-xs font-bold mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-lumi-500 animate-pulse-soft" />
            {t('screens.eyebrow', { defaultValue: 'O sistema por dentro' })}
          </span>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">
            {t('screens.title', { defaultValue: 'Conheça as telas principais' })}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {t('screens.subtitle', {
              defaultValue:
                'Uma plataforma completa para a biblioteca escolar — do acervo ao engajamento dos leitores.',
            })}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {screens.map((screen, index) => (
            <button
              key={screen.key}
              type="button"
              onClick={() => setActive(index)}
              aria-pressed={active === index}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                active === index
                  ? 'bg-lumi-gradient text-white shadow-glowSoft'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
              }`}
            >
              {screen.tab}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-5 gap-10 items-center">
          {/* Caption */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <h3 className="text-2xl font-black tracking-tight mb-3">
              {current.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              {current.description}
            </p>
            <div className="mt-6 flex gap-2">
              {screens.map((screen, index) => (
                <button
                  key={screen.key}
                  type="button"
                  aria-label={screen.tab}
                  onClick={() => setActive(index)}
                  className={`h-1.5 rounded-full transition-all ${
                    active === index
                      ? 'w-8 bg-lumi-500'
                      : 'w-2 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Browser-framed preview */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-ink-900 shadow-2xl overflow-hidden">
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-gray-100 dark:border-white/5">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="ml-3 inline-flex items-center gap-1.5 text-[11px] text-gray-400">
                  <Icon name="book-open" size={12} /> app.lumilivre.com.br
                </span>
              </div>
              <div className="relative aspect-[16/10] bg-gray-50 dark:bg-ink-950">
                {screens.map((screen, index) => (
                  <img
                    key={screen.key}
                    src={isDark ? screen.dark : screen.light}
                    alt={screen.title}
                    loading="lazy"
                    className={`absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-500 ${
                      active === index ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
