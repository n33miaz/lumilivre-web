import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Icon, type IconName } from './Icon';
import { SectionHeader } from './SectionHeader';
import { SHELF_MARKS } from './shelfMarks';

interface Pillar {
  key: string;
  icon: IconName;
  /** Nome real do repositório — serve de "cota" da peça e de destino do link. */
  repo: string;
  href: string;
  tag: string;
  title: string;
  desc: string;
  stack: string[];
  /** Colunas de 12 que a peça ocupa a partir de `lg`. */
  span: string;
}

/** Etiquetas de tecnologia — o mesmo bloco mono das duas variantes de ficha. */
function Stack({ items }: { items: string[] }) {
  return (
    <ul className="mt-5 flex flex-wrap justify-center gap-1.5">
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
 *
 * Duas mudanças desta rodada, ambas a pedido do dono:
 *
 * 1. **Conteúdo centralizado.** Com isso caiu a variante de duas colunas que a
 *    ficha larga usava. Ela existia para o parágrafo da API não virar uma linha
 *    de 1100px; a coluna centralizada com medida travada em 62ch resolve o mesmo
 *    problema por outro caminho, e sem duas composições para manter.
 * 2. **A ficha inteira é link para o repositório.** Âncora de verdade (não um
 *    `div` com `onClick`), então teclado, menu de contexto e "abrir em nova aba"
 *    funcionam de graça. A pista visual de que é link são três coisas juntas: a
 *    seta diagonal no cabeçalho, o deslocamento dela no hover e a borda que
 *    acende — cor sozinha não serve a quem não distingue cor.
 */
export function Ecosystem() {
  const { t } = useTranslation('landing');

  const pillars: Pillar[] = useMemo(
    () => [
      {
        key: 'api',
        icon: 'server',
        repo: 'lumilivre-api',
        href: 'https://github.com/n33miaz/lumilivre-api',
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
        href: 'https://github.com/n33miaz/lumilivre-web',
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
        href: 'https://github.com/n33miaz/lumilivre-app',
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
          {pillars.map((pillar, index) => (
            <a
              key={pillar.key}
              href={pillar.href}
              target="_blank"
              rel="noopener noreferrer"
              // Nome acessível curto e completo: sem ele o leitor de tela
              // anunciaria o card inteiro (tag + título + parágrafo + pilha)
              // como rótulo do link.
              aria-label={t('ecosystem.pillar.aria', {
                name: pillar.title,
                repo: pillar.repo,
              })}
              data-reveal
              data-reveal-delay={String(index + 1)}
              className={`${pillar.span} ficha paper-surface group block bg-paper-50 p-6 text-center transition-[border-color,box-shadow,transform] duration-300 hover:border-lumi-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-lumi-400 focus-visible:ring-offset-2 focus-visible:ring-offset-paper-200 dark:bg-ink-900 dark:hover:border-lumi-300 dark:focus-visible:ring-offset-ink-900 sm:p-7`}
            >
              <div className="flex items-center justify-center gap-3 border-b-2 border-paper-900 pb-3 dark:border-ink-100/80">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[2px] border border-lumi-500/35 bg-lumi-50 text-lumi-600 dark:border-lumi-300/30 dark:bg-lumi-500/15 dark:text-lumi-200">
                  <Icon name={pillar.icon} size={16} />
                </span>
                <span className="cota text-[11px] uppercase text-paper-500 dark:text-ink-400">
                  {pillar.tag}
                </span>
                <span className="truncate font-mono text-[11px] text-paper-400 dark:text-white/30">
                  {pillar.repo}
                </span>
                {/* A seta é o affordance: sai do lugar no hover e no foco, para
                    a ficha nunca parecer um bloco estático de texto. */}
                <span className="text-paper-400 transition-[color,transform] duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-lumi-600 group-focus-visible:-translate-y-0.5 group-focus-visible:translate-x-0.5 dark:text-white/30 dark:group-hover:text-lumi-200">
                  <Icon name="arrow-up-right" size={14} />
                </span>
              </div>

              <div className="mt-5">
                <h3 className="font-display text-xl font-extrabold text-paper-900 underline decoration-transparent decoration-2 underline-offset-4 transition-[text-decoration-color] duration-200 group-hover:decoration-lumi-400 group-focus-visible:decoration-lumi-400 dark:text-ink-100">
                  {pillar.title}
                </h3>
                <p className="mx-auto mt-2 max-w-[62ch] text-[15px] leading-relaxed text-paper-600 dark:text-ink-200">
                  {pillar.desc}
                </p>
                <Stack items={pillar.stack} />
              </div>
            </a>
          ))}
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
