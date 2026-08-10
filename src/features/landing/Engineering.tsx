import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { SectionHeader } from './SectionHeader';
import { SHELF_MARKS } from './shelfMarks';

const ITEM_KEYS = [
  'rls',
  'ratelimit',
  'audit',
  'outbox',
  'resilience',
  'views',
  'metrics',
  'csp',
  'tests',
] as const;

/**
 * A camada mais profunda da página: o que foi decidido e por quê. É a seção
 * escrita para quem vai ler o código — e a razão de ela vir só depois das telas
 * é que ninguém precisa dela para entender o produto.
 *
 * Painel escuro nos dois temas de propósito: além do contraste de ritmo com as
 * seções claras de cima, sinaliza sem palavra nenhuma que aqui a conversa muda.
 * Nada de card com sombra aqui — rótulo em mono, título e uma linha de motivo.
 *
 * Substitui também a marquise de logos que rolava sozinha: movimento infinito
 * sem informação nova, e o repertório listava tecnologia que o app não usa.
 *
 * Saiu daqui, na mesma linha de raciocínio, o quadro "O que está por baixo" com
 * as etiquetas de tecnologia por camada. Lista de nome de framework não é
 * decisão de engenharia: é currículo, e concorria com as nove decisões — que são
 * o que a seção promete no título. Quem quiser o repertório abre os repositórios
 * (o Ecossistema agora leva direto a cada um).
 *
 * Saiu daqui o "blob" — o círculo roxo desfocado de 384px que flutuava no canto.
 * É o primeiro item da lista de tiques de página gerada, e não sobreviveria a
 * nenhuma das referências editoriais: fundo é material (pauta, papel), não
 * mancha de degradê. No lugar ficou a pauta horizontal de um cartão.
 */
export function Engineering() {
  const { t } = useTranslation('landing');

  const items = useMemo(
    () =>
      ITEM_KEYS.map((key) => ({
        key,
        label: t(`eng.item.${key}.label`),
        title: t(`eng.item.${key}.title`),
        desc: t(`eng.item.${key}.desc`),
      })),
    [t],
  );

  return (
    // A borda existe por causa do tema escuro: ali ink-900 e ink-950 quase se
    // encostam, e sem o filete a quebra de ritmo desapareceria.
    <section
      id="engineering"
      // `ink-900` e não `ink-950`: no tema escuro o fundo da página JÁ é
      // ink-950, e um painel da mesma cor apagaria justamente a quebra de ritmo
      // que esta seção existe para fazer.
      className="rule-lines relative overflow-hidden border-y border-white/10 bg-ink-900 px-6 py-24 text-ink-200 sm:py-28"
    >
      <div className="relative mx-auto max-w-6xl">
        <SectionHeader
          mark={SHELF_MARKS.engineering}
          eyebrow={t('eng.eyebrow')}
          title={t('eng.title')}
          lead={t('eng.lead')}
          tone="invert"
        />

        {/* Nove decisões numeradas em mono: a numeração é o que faz a lista ler
            como um índice de catálogo e não como mais uma grade de cards.
            Nove em três colunas fecham 3x3 exatos — é por isso que a seção não
            desequilibrou quando o quadro de tecnologias saiu do rodapé dela. */}
        <ul className="grid gap-x-10 gap-y-9 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <li
              key={item.key}
              data-reveal
              data-reveal-delay={String((index % 3) + 1)}
              className="border-t border-white/15 pt-5"
            >
              <div className="flex items-baseline gap-3">
                <span
                  aria-hidden="true"
                  className="cota text-[10px] text-white/30"
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-lumi-200">
                  {item.label}
                </span>
              </div>
              <h3 className="mb-2 mt-2 font-display text-lg font-extrabold leading-snug text-ink-100">
                {item.title}
              </h3>
              <p className="max-w-[52ch] text-sm leading-relaxed text-ink-400">
                {item.desc}
              </p>
            </li>
          ))}
        </ul>

        {/* Filete de fechamento. Cada decisão abre com uma linha em cima e nada
            embaixo; sem esta régua final a última fileira ficava com a borda de
            um lado só e a seção parecia interrompida no meio — que é justamente
            o risco de tirar o bloco que fechava a página aqui. Régua, e não um
            card novo: é pontuação, não conteúdo. */}
        <div
          aria-hidden="true"
          className="mt-14 border-t border-white/15"
        />
      </div>
    </section>
  );
}
