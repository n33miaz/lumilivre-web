import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Icon, type IconName } from './Icon';
import { SectionHeader } from './SectionHeader';
import { SHELF_MARKS } from './shelfMarks';

interface Pillar {
  key: string;
  icon: IconName;
  /** Nome real do repositório — serve de "cota" da peça. */
  repo: string;
  tag: string;
  title: string;
  desc: string;
  stack: string[];
  /** Colunas de 12 que a peça ocupa a partir de `lg`. */
  span: string;
}

/**
 * As três peças do ecossistema.
 *
 * A versão anterior era a grade de três cards idênticos — mesmo tamanho, mesmo
 * quadrado de ícone em degradê, mesma sombra — que é o terceiro item da lista de
 * tiques do briefing. Aqui as três peças têm **pesos diferentes**: a API ocupa a
 * largura inteira porque é o que sustenta as outras duas, e o painel (7) é maior
 * que o app (5) porque é o produto que a página está vendendo. A hierarquia da
 * arquitetura vira hierarquia de layout — que é informação, não enfeite.
 *
 * Cada peça é uma ficha: retângulo de 2px de raio, cabeçalho com o nome real do
 * repositório em mono e filete grosso separando cabeçalho de conteúdo.
 */
/** Etiquetas de tecnologia — o mesmo bloco mono das duas variantes de ficha. */
function Stack({ items, className }: { items: string[]; className: string }) {
  return (
    <ul className={`flex flex-wrap gap-1.5 ${className}`}>
      {items.map((item) => (
        <li
          key={item}
          className="rounded-[2px] border border-paper-300 px-2 py-1 font-mono text-[11px] text-paper-600 dark:border-white/10 dark:text-ink-400"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

export function Ecosystem() {
  const { t } = useTranslation('landing');

  const pillars: Pillar[] = useMemo(
    () => [
      {
        key: 'api',
        icon: 'server',
        repo: 'lumilivre-api',
        tag: t('ecosystem.pillar.api.tag'),
        title: t('ecosystem.pillar.api.title'),
        desc: t('ecosystem.pillar.api.desc'),
        // Versões conferidas no pom.xml e no docker-compose, não de memória.
        stack: ['Java 17', 'Spring Boot 3.4', 'PostgreSQL 16', 'Flyway'],
        span: 'lg:col-span-12',
      },
      {
        key: 'web',
        icon: 'monitor',
        repo: 'lumilivre-web',
        tag: t('ecosystem.pillar.web.tag'),
        title: t('ecosystem.pillar.web.title'),
        desc: t('ecosystem.pillar.web.desc'),
        stack: ['React 19', 'TypeScript', 'Vite 6', 'TailwindCSS'],
        span: 'lg:col-span-7',
      },
      {
        key: 'app',
        icon: 'smartphone',
        repo: 'lumilivre-app',
        tag: t('ecosystem.pillar.app.tag'),
        title: t('ecosystem.pillar.app.title'),
        desc: t('ecosystem.pillar.app.desc'),
        // Saiu "FCM": não existe nenhuma dependência do Firebase no aplicativo.
        stack: ['Flutter', 'Dart', 'Provider', 'Secure Storage'],
        span: 'lg:col-span-5',
      },
    ],
    [t],
  );

  return (
    <section
      id="ecosystem"
      className="paper-surface relative bg-paper-200 px-6 py-24 dark:bg-ink-900/50 sm:py-28"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeader
          mark={SHELF_MARKS.ecosystem}
          eyebrow={t('ecosystem.eyebrow')}
          title={t('ecosystem.title')}
          lead={t('ecosystem.lead')}
        />

        <div className="grid gap-4 lg:grid-cols-12">
          {pillars.map((pillar, index) => {
            // A peça de 12 colunas é a única que se abre em duas colunas por
            // dentro; as de 7 e 5 empilham.
            const wide = pillar.span.includes('12');
            return (
            <article
              key={pillar.key}
              data-reveal
              data-reveal-delay={String(index + 1)}
              className={`${pillar.span} ficha paper-surface bg-paper-50 p-6 transition-[border-color,box-shadow] duration-300 hover:border-lumi-400 dark:bg-ink-900 sm:p-7`}
            >
              <div className="flex items-center gap-3 border-b-2 border-paper-900 pb-3 dark:border-ink-100/80">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[2px] border border-lumi-500/35 bg-lumi-50 text-lumi-600 dark:border-lumi-label/30 dark:bg-lumi-500/15 dark:text-lumi-200">
                  <Icon name={pillar.icon} size={16} />
                </span>
                <span className="cota text-[11px] uppercase text-paper-500 dark:text-ink-400">
                  {pillar.tag}
                </span>
                <span className="ml-auto truncate font-mono text-[11px] text-paper-400 dark:text-white/30">
                  {pillar.repo}
                </span>
              </div>

              {/* No card largo (API) a ficha se abre em duas colunas — nome e
                  pilha à esquerda, descrição à direita. Sem isso a peça de 12
                  colunas vira uma linha de texto de 1100px, que ninguém lê, e
                  sobra um vazio à esquerda. Nos dois estreitos tudo empilha, e
                  na ordem natural de leitura: o que é, o que faz, com o quê. */}
              {wide ? (
                <div className="mt-5 grid gap-x-12 gap-y-5 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]">
                  <div>
                    <h3 className="font-display text-xl font-extrabold text-paper-900 dark:text-ink-100">
                      {pillar.title}
                    </h3>
                    <Stack items={pillar.stack} className="mt-4" />
                  </div>
                  <p className="max-w-[62ch] text-[15px] leading-relaxed text-paper-600 dark:text-ink-200">
                    {pillar.desc}
                  </p>
                </div>
              ) : (
                <div className="mt-5">
                  <h3 className="font-display text-xl font-extrabold text-paper-900 dark:text-ink-100">
                    {pillar.title}
                  </h3>
                  <p className="mt-2 max-w-[62ch] text-[15px] leading-relaxed text-paper-600 dark:text-ink-200">
                    {pillar.desc}
                  </p>
                  <Stack items={pillar.stack} className="mt-5" />
                </div>
              )}
            </article>
            );
          })}
        </div>

        {/* O elo entre as três peças: sem ele, "três aplicações" pode soar como
            três projetos separados — e o contrato compartilhado é justamente o
            que sustenta a afirmação de abertura. Nota de rodapé pautada, não um
            quarto card: é comentário sobre os três, não um irmão deles. */}
        <div
          data-reveal
          data-reveal-delay="4"
          className="mt-10 flex flex-col gap-2 border-t border-paper-300 pt-5 dark:border-white/10 sm:flex-row sm:gap-8"
        >
          <h3 className="cota shrink-0 text-[11px] uppercase text-lumi-600 dark:text-lumi-200 sm:w-52">
            {t('ecosystem.contract.title')}
          </h3>
          <p className="max-w-[70ch] text-[15px] leading-relaxed text-paper-600 dark:text-ink-400">
            {t('ecosystem.contract.desc')}
          </p>
        </div>
      </div>
    </section>
  );
}
