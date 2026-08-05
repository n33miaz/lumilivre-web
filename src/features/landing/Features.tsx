import { useMemo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Icon, type IconName } from './Icon';
import { SectionHeader } from './SectionHeader';

/**
 * Exemplo do console de catalogação. O ISBN, o título, o autor e o ano são de um
 * livro que existe no seed de demonstração (`R__seed_demo_data.sql`) — a editora
 * ficou de fora porque a do seed é fictícia, e o resto viria de um dado inventado.
 */
const SAMPLE_ISBN = '9788535902778';
const SAMPLE_TITLE = 'Dom Casmurro';
const SAMPLE_AUTHOR = 'Machado de Assis';
const SAMPLE_YEAR = '1899';

function CatalogVisual() {
  const { t } = useTranslation('landing');

  const fields: Array<[string, string]> = [
    [t('features.visual.catalog.titleLabel'), SAMPLE_TITLE],
    [t('features.visual.catalog.authorLabel'), SAMPLE_AUTHOR],
    [t('features.visual.catalog.yearLabel'), SAMPLE_YEAR],
  ];

  return (
    <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50/80 p-4 font-mono text-[11px] dark:border-white/10 dark:bg-ink-950/60">
      <div className="flex items-center gap-2 border-b border-dashed border-gray-200 pb-3 dark:border-white/10">
        <span className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {t('features.visual.catalog.input')}
        </span>
        <span className="font-semibold text-gray-700 dark:text-gray-200">
          {SAMPLE_ISBN}
        </span>
        <span
          aria-hidden="true"
          className="ml-auto h-1.5 w-1.5 rounded-full bg-lumi-500 animate-pulse-soft"
        />
      </div>
      {/* Sem `data-reveal` nas linhas: a revelação do card já cobre o conjunto, e
          animar cada detalhe interno vira ruído — além de deixar pedaço de texto
          invisível quando o card entra na tela pela borda. */}
      <dl className="mt-3 space-y-1.5">
        {fields.map(([label, value]) => (
          <div key={label} className="flex gap-2">
            <dt className="w-14 shrink-0 text-gray-500 dark:text-gray-400">{label}</dt>
            <dd className="text-gray-700 dark:text-gray-200">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-3 flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
        <Icon name="check" size={12} strokeWidth={3} />
        {t('features.visual.catalog.filledBy')}
      </div>
    </div>
  );
}

function BoardVisual() {
  const { t } = useTranslation('landing');

  const kinds = [
    { label: t('features.visual.board.announcement'), tone: 'bg-lumi-500' },
    { label: t('features.visual.board.attachment'), tone: 'bg-lumi-action' },
    // bg-lumi-label com texto branco dá 3,4:1; lumi-400 sobe para 5,3:1.
    { label: t('features.visual.board.work'), tone: 'bg-lumi-400' },
  ];

  return (
    <div className="mt-5 flex flex-wrap items-center gap-2">
      {kinds.map((kind) => (
        <span
          key={kind.label}
          className={`inline-flex items-center gap-1.5 rounded-full ${kind.tone} px-2.5 py-1 text-[11px] font-bold text-white`}
        >
          {kind.label}
        </span>
      ))}
      <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-gray-300 px-2.5 py-1 font-mono text-[11px] text-gray-500 dark:border-white/15 dark:text-gray-400">
        {t('features.visual.board.audience')}
      </span>
      {/* Pastilha local em vez da utility `.pill-warn` do sistema: o âmbar dela
          fica em 2,9:1 neste corpo de 11px, e mexer na classe compartilhada
          mudaria todas as tabelas do painel. */}
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-800 dark:bg-amber-400/15 dark:text-amber-300">
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        {t('features.visual.board.scheduled')}
      </span>
    </div>
  );
}

interface FeatureItem {
  key: string;
  span: string;
  icon: IconName;
  title: string;
  desc: string;
  visual?: ReactNode;
  /** Card de largura total: título e texto lado a lado, não empilhados. */
  wide?: boolean;
}

export function Features() {
  const { t } = useTranslation('landing');

  // Seis itens, e só. O app do leitor saiu daqui porque o Ecossistema já é a
  // seção dele — repetir encheria a grade sem acrescentar informação.
  const items: FeatureItem[] = useMemo(
    () => [
      {
        key: 'catalog',
        span: 'md:col-span-2 md:row-span-2',
        icon: 'sparkles',
        title: t('features.item.catalog.title'),
        desc: t('features.item.catalog.desc'),
        visual: <CatalogVisual />,
      },
      {
        key: 'loans',
        span: '',
        icon: 'arrow-left-right',
        title: t('features.item.loans.title'),
        desc: t('features.item.loans.desc'),
      },
      {
        key: 'reservations',
        span: '',
        icon: 'bookmark',
        title: t('features.item.reservations.title'),
        desc: t('features.item.reservations.desc'),
      },
      {
        key: 'board',
        span: 'md:col-span-2',
        icon: 'megaphone',
        title: t('features.item.board.title'),
        desc: t('features.item.board.desc'),
        visual: <BoardVisual />,
      },
      {
        key: 'emails',
        span: '',
        icon: 'mail',
        title: t('features.item.emails.title'),
        desc: t('features.item.emails.desc'),
      },
      {
        key: 'reports',
        span: 'md:col-span-3',
        icon: 'file-text',
        title: t('features.item.reports.title'),
        desc: t('features.item.reports.desc'),
        wide: true,
      },
    ],
    [t],
  );

  return (
    <section id="features" className="px-6 py-24 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeader
          eyebrow={t('features.eyebrow')}
          title={t('features.title')}
          lead={t('features.lead')}
        />

        <div className="grid gap-4 md:grid-cols-3 md:auto-rows-[minmax(212px,auto)]">
          {items.map((item, index) => (
            <article
              key={item.key}
              data-reveal
              data-reveal-delay={String((index % 3) + 1)}
              className={`${item.span} group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 transition-[border-color,box-shadow] duration-300 hover:border-lumi-400 hover:shadow-card dark:border-gray-800 dark:bg-ink-900`}
            >
              {/* Filete que cresce do canto ao passar o ponteiro: só scale-x, sem
                  tocar em layout. */}
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-lumi-gradient transition-transform duration-500 group-hover:scale-x-100"
              />
              <div
                className={`flex h-full flex-col ${
                  item.wide ? 'md:flex-row md:items-center md:gap-8' : ''
                }`}
              >
                <div className={item.wide ? 'md:w-1/3' : ''}>
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-lumi-100 text-lumi-600 dark:bg-lumi-500/20 dark:text-lumi-200">
                    <Icon name={item.icon} size={20} />
                  </div>
                  <h3 className="mb-2 text-lg font-extrabold text-gray-900 dark:text-white">
                    {item.title}
                  </h3>
                </div>
                <div className={item.wide ? 'md:flex-1' : ''}>
                  <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                    {item.desc}
                  </p>
                  {item.visual}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
