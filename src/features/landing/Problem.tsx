import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { SectionHeader } from './SectionHeader';
import { SHELF_MARKS } from './shelfMarks';

/**
 * O único bloco da página escrito para a bibliotecária, não para quem avalia o
 * código: descreve a rotina antes e depois. Serve de ponte para os outros
 * públicos — é aqui que quem não é técnico entende *por que* isso é difícil,
 * antes de qualquer sigla aparecer.
 *
 * Desenho: duas colunas de larguras DIFERENTES (5 e 7 de 12). Meio a meio
 * sugere empate; o lado "como fica" é o que a página quer que fique, e por isso
 * respira mais. Os itens são linhas pautadas numeradas, não lista com ícone de
 * check — o ícone verde de "certo" ao lado de cada frase é decoração que não
 * acrescenta informação, e o par ✓/− transforma a comparação num anúncio.
 * O que separa as colunas é o peso da tinta e o filete roxo, só.
 */
export function Problem() {
  const { t } = useTranslation('landing');

  const before = useMemo(
    () => [
      t('problem.before.item1'),
      t('problem.before.item2'),
      t('problem.before.item3'),
      t('problem.before.item4'),
    ],
    [t],
  );

  const after = useMemo(
    () => [
      t('problem.after.item1'),
      t('problem.after.item2'),
      t('problem.after.item3'),
      t('problem.after.item4'),
    ],
    [t],
  );

  return (
    <section id="problem" className="px-6 py-24 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeader
          mark={SHELF_MARKS.problem}
          eyebrow={t('problem.eyebrow')}
          title={t('problem.title')}
          lead={t('problem.lead')}
        />

        <div className="grid gap-x-12 gap-y-12 lg:grid-cols-12">
          <div data-reveal data-reveal-delay="1" className="lg:col-span-5">
            <h3 className="border-t border-paper-300 pt-3 text-[11px] font-bold uppercase tracking-[0.18em] text-paper-500 dark:border-white/10 dark:text-ink-400">
              {t('problem.before.title')}
            </h3>
            <ul className="mt-1">
              {before.map((item, index) => (
                <li
                  key={item}
                  className="flex gap-4 border-b border-paper-300/70 py-3.5 last:border-b-0 dark:border-white/[0.07]"
                >
                  <span
                    aria-hidden="true"
                    className="cota shrink-0 pt-1 text-[10px] text-paper-400 dark:text-white/25"
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="text-[15px] leading-relaxed text-paper-500 dark:text-ink-400">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div data-reveal data-reveal-delay="2" className="lg:col-span-7">
            <h3 className="border-t-2 border-lumi-500 pt-3 text-[11px] font-bold uppercase tracking-[0.18em] text-lumi-600 dark:border-lumi-label dark:text-lumi-200">
              {t('problem.after.title')}
            </h3>
            <ul className="mt-1">
              {after.map((item, index) => (
                <li
                  key={item}
                  className="flex gap-4 border-b border-paper-300/70 py-3.5 last:border-b-0 dark:border-white/[0.07]"
                >
                  <span
                    aria-hidden="true"
                    className="cota shrink-0 pt-1 text-[10px] text-lumi-500 dark:text-lumi-label"
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="text-[17px] font-medium leading-relaxed text-paper-800 dark:text-ink-200">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
