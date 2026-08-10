import { useMemo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Icon, type IconName } from './Icon';
import { SectionHeader } from './SectionHeader';
import { SHELF_MARKS } from './shelfMarks';

/**
 * Exemplo do console de catalogação. O ISBN, o título, o autor e o ano são de um
 * livro que existe no seed de demonstração (`R__seed_demo_data.sql`) — a editora
 * ficou de fora porque a do seed é fictícia, e o resto viria de um dado inventado.
 *
 * Este é o ponto em que o motivo da página deixa de ser estilo e vira argumento:
 * o que o sistema faz ao ler um ISBN é **preencher uma ficha**, e é uma ficha
 * que aparece aqui, com a mesma pauta e o mesmo furo do registro do topo.
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
    <div className="ficha ficha-furo mt-6 bg-paper-100 px-4 pb-10 pt-3 dark:bg-ink-950/70">
      <div className="flex items-baseline gap-2 border-b-2 border-paper-900/80 pb-2.5 dark:border-ink-100/60">
        <span className="cota text-[10px] uppercase text-paper-500 dark:text-ink-400">
          {t('features.visual.catalog.input')}
        </span>
        <span className="cota text-[11px] tabular-nums text-paper-800 dark:text-ink-200">
          {SAMPLE_ISBN}
        </span>
      </div>
      {/* Sem `data-reveal` nas linhas: a revelação do card já cobre o conjunto, e
          animar cada detalhe interno vira ruído — além de deixar pedaço de texto
          invisível quando o card entra na tela pela borda. */}
      <dl>
        {fields.map(([label, value]) => (
          <div
            key={label}
            className="flex gap-3 border-b border-paper-300/70 py-2 dark:border-white/[0.07]"
          >
            <dt className="cota w-12 shrink-0 pt-px text-[10px] uppercase text-paper-500 dark:text-ink-400">
              {label}
            </dt>
            <dd className="text-[13px] leading-snug text-paper-800 dark:text-ink-200">
              {value}
            </dd>
          </div>
        ))}
      </dl>
      <div className="mt-2.5 flex items-center gap-1.5 font-mono text-[11px] text-lumi-600 dark:text-lumi-200">
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
    // Etiquetas retangulares, não pastilhas: no sistema desta página o
    // arredondado total está reservado ao que é de fato circular.
    <div className="mt-5 flex flex-wrap items-center gap-2">
      {kinds.map((kind) => (
        <span
          key={kind.label}
          className={`inline-flex items-center rounded-[2px] ${kind.tone} px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-white`}
        >
          {kind.label}
        </span>
      ))}
      <span className="inline-flex items-center rounded-[2px] border border-dashed border-paper-400 px-2.5 py-1 font-mono text-[11px] text-paper-600 dark:border-white/20 dark:text-ink-400">
        {t('features.visual.board.audience')}
      </span>
      {/* Pastilha local em vez da utility `.pill-warn` do sistema: o âmbar dela
          fica em 2,9:1 neste corpo de 11px, e mexer na classe compartilhada
          mudaria todas as tabelas do painel. */}
      <span className="inline-flex items-center gap-1.5 rounded-[2px] bg-amber-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-amber-800 dark:bg-amber-400/15 dark:text-amber-300">
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        {t('features.visual.board.scheduled')}
      </span>
    </div>
  );
}

/**
 * Os seis relatórios, nomeados.
 *
 * Os nomes vêm do namespace `report` — a MESMA copy que a Central de Relatórios
 * do painel usa, já traduzida nos cinco idiomas. Reaproveitar em vez de
 * reescrever garante que a página diga exatamente o que a tela entrega, e não
 * uma paráfrase que envelhece sozinha. É também o que faz o card de largura
 * inteira merecer a largura: antes ele tinha três linhas de texto e 100px de
 * vazio embaixo.
 */
const REPORT_KEYS = [
  'books',
  'copies',
  'readers',
  'loans',
  'courses',
  'statistics',
] as const;

function ReportsVisual() {
  const { t } = useTranslation(['landing', 'report']);

  return (
    <ul className="mt-5 flex flex-wrap gap-1.5">
      {REPORT_KEYS.map((key) => (
        <li
          key={key}
          className="rounded-[2px] border border-paper-300 px-2.5 py-1 font-mono text-[11px] text-paper-600 dark:border-white/10 dark:text-ink-400"
        >
          {t(`report:item.${key}.title`)}
        </li>
      ))}
    </ul>
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
        visual: <ReportsVisual />,
        wide: true,
      },
    ],
    [t],
  );

  return (
    <section
      id="features"
      className="emenda emenda-dobra px-6 py-24 sm:py-28"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeader
          mark={SHELF_MARKS.features}
          eyebrow={t('features.eyebrow')}
          title={t('features.title')}
          lead={t('features.lead')}
        />

        {/* A gaveta: células de tamanhos diferentes (2×2, 1×1, 2×1, 3×1) numa
            grade de três colunas. A assimetria já existia e é boa — o que mudou
            foi o material das células, que eram cards arredondados com sombra e
            agora são fichas. */}
        <div className="grid gap-3 md:grid-cols-3 md:auto-rows-[minmax(212px,auto)]">
          {items.map((item, index) => (
            <article
              key={item.key}
              data-reveal
              data-reveal-delay={String((index % 3) + 1)}
              className={`${item.span} ficha paper-surface group relative overflow-hidden bg-paper-50 p-6 transition-[border-color] duration-300 hover:border-lumi-400 dark:bg-ink-900`}
            >
              {/* Filete que cresce do canto ao passar o ponteiro: só scale-x, sem
                  tocar em layout. */}
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-lumi-500 transition-transform duration-500 group-hover:scale-x-100 dark:bg-lumi-label"
              />
              <div
                // A célula de largura inteira centra o conteúdo na vertical: a
                // linha da grade tem 212px de altura mínima e o conteúdo dela
                // ocupa ~120px, então alinhado ao topo sobrava um vazio embaixo
                // que parecia card inacabado.
                className={`flex h-full flex-col ${
                  item.wide ? 'md:flex-row md:items-center md:gap-10' : ''
                }`}
              >
                <div className={item.wide ? 'md:w-1/3' : ''}>
                  <span className="mb-4 flex h-8 w-8 items-center justify-center rounded-[2px] border border-lumi-500/35 bg-lumi-50 text-lumi-600 dark:border-lumi-label/30 dark:bg-lumi-500/15 dark:text-lumi-200">
                    <Icon name={item.icon} size={16} />
                  </span>
                  <h3 className="mb-2 font-display text-lg font-extrabold leading-snug text-paper-900 dark:text-ink-100">
                    {item.title}
                  </h3>
                </div>
                <div className={item.wide ? 'md:flex-1' : ''}>
                  <p className="max-w-[62ch] text-sm leading-relaxed text-paper-600 dark:text-ink-400">
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
