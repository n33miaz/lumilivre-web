import { useTranslation } from 'react-i18next';

import { useIsDark } from '../../hooks/useIsDark';
import { LoginMeshBackground } from '../../components/ui/ShaderBackground/LoginMeshBackground';
import { Btn } from './Btn';
import { CatalogRecord } from './CatalogRecord';
import { Icon } from './Icon';
import { LoanCycle } from './LoanCycle';
import { ShelfMark } from './ShelfMark';
import { SHELF_MARKS } from './shelfMarks';

const CONTACT_HREF = 'mailto:ncormino@gmail.com';

/**
 * Abertura da página.
 *
 * O herói anterior tinha, um a um, os tiques de página gerada: bloco
 * centralizado, pastilha com bolinha pulsando, título com degradê no texto,
 * dois botões gêmeos e uma faixa de quatro estatísticas em colunas idênticas.
 * Nada disso era ruim isoladamente — o problema é que é o conjunto que a
 * ferramenta entrega por padrão, e o dono pediu justamente para não parecer
 * isso.
 *
 * O que ficou no lugar:
 *
 * - **Assimetria 7/5.** Coluna de texto larga à esquerda, ficha estreita à
 *   direita. Duas colunas de larguras diferentes, e nunca o mesmo eixo do
 *   bloco seguinte (o `LoanCycle` vem com a legenda à ESQUERDA, invertendo o
 *   peso).
 * - **Escala com salto.** Título até 4,5rem contra corpo de 1,125rem. O
 *   destaque é uma cor sólida da marca, não um degradê — degradê em texto é
 *   ilegível no escuro e é o efeito mais copiado da última década.
 * - **Uma ação forte e uma discreta.** A secundária virou link com filete.
 * - **A prova virou registro.** Ver `CatalogRecord`.
 *
 * A malha WebGL fica: é a mesma do login, dá material próprio ao topo e degrada
 * com graça sem WebGL. Só a opacidade caiu, para o papel aparecer por baixo.
 */
export function Hero() {
  const { t } = useTranslation('landing');
  const isDark = useIsDark();

  return (
    <section
      id="top"
      className="paper-surface relative overflow-hidden bg-paper-100 dark:bg-ink-950"
    >
      {/* A malha continua — é o mesmo shader do login, e o topo precisa de um
          material vivo por baixo do papel. O que mudou é a dose: com o véu
          pesado por cima ela dá um movimento perceptível de canto, longe de
          virar a mancha roxa flutuante que a página existe para evitar. */}
      <LoginMeshBackground
        isDark={isDark}
        split={false}
        quality={0.4}
        className="absolute inset-x-0 top-0 z-0 h-full opacity-40 dark:opacity-[0.35]"
      />
      {/* Véu que devolve contraste ao texto sobre a malha e dissolve a seção no
          fundo da próxima — sem ele o limite entre as duas fica visível.

          São DOIS véus empilhados, um por tema, e não um só com `dark:`.
          Degradê é a única coisa que o CSS não sabe interpolar: com um véu só,
          a troca de tema repintava de creme para tinta num quadro, e como este
          véu cobre o herói inteiro era ele — não o fundo — que fazia a abertura
          da página saltar. Empilhados, o que muda é a OPACIDADE de cada um, que
          entra na esmaecida de 200ms junto com o resto (ver `.tema-em-troca`).
          O custo é uma camada a mais, sem pintura nova: os dois degradês já
          existiam, um deles era só a variante `dark:` do outro. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-[1] bg-gradient-to-b from-paper-100/75 via-paper-100/60 to-paper-100 opacity-100 dark:opacity-0"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 z-[1] bg-gradient-to-b from-ink-950/75 via-ink-950/65 to-ink-950 opacity-0 dark:opacity-100"
      />

      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-20 pt-10 sm:pt-14">
        <div className="grid items-start gap-x-10 gap-y-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <ShelfMark mark={SHELF_MARKS.hero} label={t('hero.mark')} />

            <h1
              data-reveal
              data-reveal-delay="1"
              className="mt-7 font-display text-[2.6rem] font-extrabold leading-[1.08] tracking-[-0.035em] text-paper-900 dark:text-ink-100 sm:text-[3.4rem] lg:text-[4.25rem]"
            >
              {t('hero.title.part1')}{' '}
              {/* `lumi-300` no escuro, não `lumi-label`: aquele token é magenta
                  (#C964C5) e, num título de 4rem, a metade destacada da frase
                  lia como ROSA, não como o roxo da marca. `lumi-300` (#CE93D8)
                  é degrau da própria rampa roxa e dá 8,3:1 sobre `ink-950` —
                  passa AA com folga. A troca é de classe, não de token: o
                  `lumi-label` é usado no painel inteiro e mexer nele repintaria
                  telas que nada têm a ver com esta frase. */}
              <span className="text-lumi-500 dark:text-lumi-300">
                {t('hero.title.part2')}
              </span>
            </h1>

            <p
              data-reveal
              data-reveal-delay="2"
              className="mt-7 max-w-[48ch] text-[17px] leading-relaxed text-paper-600 dark:text-ink-200 sm:text-lg"
            >
              {t('hero.lead')}
            </p>

            <div
              data-reveal
              data-reveal-delay="3"
              className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-5"
            >
              <Btn
                href="#screens"
                variant="primary"
                trailingIcon={<Icon name="arrow-right" size={16} />}
              >
                {t('hero.cta.primary')}
              </Btn>
              <Btn href={CONTACT_HREF} variant="quiet">
                {t('hero.cta.secondary')}
              </Btn>
            </div>
          </div>

          <div className="lg:col-span-5">
            <CatalogRecord />
          </div>
        </div>

        <LoanCycle />
      </div>
    </section>
  );
}
