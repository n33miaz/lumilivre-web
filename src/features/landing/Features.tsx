import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Icon, type IconName } from './Icon';
import { SectionHeader } from './SectionHeader';

type Visual = 'catalog' | 'tcc' | undefined;

interface FeatureItem {
  span: string;
  icon: IconName;
  title: string;
  desc: string;
  visual?: Visual;
}

function CatalogVisual() {
  const { t } = useTranslation('landing');
  return (
    <div className="mt-auto pt-6 -mx-6 -mb-6 px-6 pb-6 bg-gradient-to-br from-lumi-50 to-transparent dark:from-lumi-500/10">
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-ink-950 p-3 font-mono text-[11px] shadow-sm">
        <div className="flex items-center gap-2 text-gray-400 mb-2">
          <Icon name="search" size={12} />
          <span>978-85-7522-403-1</span>
          <span className="ml-auto text-lumi-500 animate-pulse">●</span>
        </div>
        <div className="space-y-1 text-gray-600 dark:text-gray-300">
          <div>
            <span className="text-gray-400">
              {t('features.visual.catalog.titleLabel')}
            </span>
            Dom Casmurro
          </div>
          <div>
            <span className="text-gray-400">
              {t('features.visual.catalog.authorLabel')}
            </span>
            Machado de Assis
          </div>
          <div>
            <span className="text-gray-400">
              {t('features.visual.catalog.publisherLabel')}
            </span>
            Atica · 2008
          </div>
          <div className="text-green-500">
            {t('features.visual.catalog.filledBy')}
          </div>
        </div>
      </div>
    </div>
  );
}

function TccVisual() {
  const items = [
    { c: '#3754A8', t: 'IoT em estufas' },
    { c: '#A20E47', t: 'Algoritmos geneticos' },
    { c: '#0B5E04', t: 'Robotica educacional' },
  ];
  return (
    <div className="mt-4 grid grid-cols-3 gap-2">
      {items.map((t) => (
        <div
          key={t.t}
          className="rounded-md bg-white dark:bg-ink-950 border border-gray-200 dark:border-gray-700 p-2"
        >
          <div
            className="aspect-[3/4] rounded mb-2"
            style={{ background: `linear-gradient(160deg, ${t.c}cc, ${t.c})` }}
          />
          <div className="text-[9px] font-semibold text-gray-700 dark:text-gray-300 truncate">
            {t.t}
          </div>
        </div>
      ))}
    </div>
  );
}

export function Features() {
  const { t } = useTranslation('landing');

  const items: FeatureItem[] = useMemo(
    () => [
      {
        span: 'md:col-span-2 md:row-span-2',
        icon: 'sparkles',
        title: t('features.item.catalog.title'),
        desc: t('features.item.catalog.desc'),
        visual: 'catalog',
      },
      {
        span: '',
        icon: 'arrow-left-right',
        title: t('features.item.loans.title'),
        desc: t('features.item.loans.desc'),
      },
      {
        span: '',
        icon: 'smartphone',
        title: t('features.item.app.title'),
        desc: t('features.item.app.desc'),
      },
      {
        span: 'md:col-span-2',
        icon: 'graduation-cap',
        title: t('features.item.tcc.title'),
        desc: t('features.item.tcc.desc'),
        visual: 'tcc',
      },
      {
        span: '',
        icon: 'mail',
        title: t('features.item.emails.title'),
        desc: t('features.item.emails.desc'),
      },
      {
        span: '',
        icon: 'file-text',
        title: t('features.item.reports.title'),
        desc: t('features.item.reports.desc'),
      },
    ],
    [t],
  );

  return (
    <section id="features" className="py-28 px-6 bg-gray-50 dark:bg-ink-900/40">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          eyebrow={t('features.eyebrow')}
          title={t('features.title')}
          lead={t('features.lead')}
        />
        <div className="grid md:grid-cols-3 md:auto-rows-[200px] gap-4">
          {items.map((it) => (
            <div
              key={it.title}
              className={`${it.span} group relative rounded-2xl bg-white dark:bg-ink-900 border border-gray-200 dark:border-gray-800 p-6 overflow-hidden hover:border-lumi-400 transition-colors`}
            >
              <div className="relative z-10 flex flex-col h-full">
                <div className="w-10 h-10 rounded-lg bg-lumi-100 dark:bg-lumi-500/20 text-lumi-600 dark:text-lumi-300 flex items-center justify-center mb-4">
                  <Icon name={it.icon} size={20} />
                </div>
                <h3 className="font-extrabold text-lg mb-2 text-gray-900 dark:text-white">
                  {it.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {it.desc}
                </p>
                {it.visual === 'catalog' && <CatalogVisual />}
                {it.visual === 'tcc' && <TccVisual />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
