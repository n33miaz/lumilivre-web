import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Icon } from './Icon';
import { SectionHeader } from './SectionHeader';

/**
 * O único bloco da página escrito para a bibliotecária, não para quem avalia o
 * código: descreve a rotina antes e depois. Serve de ponte para os outros
 * públicos — é aqui que quem não é técnico entende *por que* isso é difícil,
 * antes de qualquer sigla aparecer.
 *
 * Texto corrido em duas colunas de propósito: quebra a sequência de grades de
 * card e dá respiro entre o hero e o ecossistema.
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
          eyebrow={t('problem.eyebrow')}
          title={t('problem.title')}
          lead={t('problem.lead')}
          align="left"
        />

        <div className="grid gap-10 md:grid-cols-2 md:gap-16">
          <div data-reveal data-reveal-delay="1">
            <h3 className="mb-5 text-xs font-bold uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
              {t('problem.before.title')}
            </h3>
            <ul className="space-y-3.5">
              {before.map((item) => (
                <li key={item} className="flex gap-3">
                  <Icon
                    name="minus"
                    size={18}
                    className="mt-0.5 shrink-0 text-gray-300 dark:text-gray-600"
                  />
                  <span className="text-[15px] leading-relaxed text-gray-500 dark:text-gray-400">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div
            data-reveal
            data-reveal-delay="2"
            className="relative md:pl-16 md:before:absolute md:before:inset-y-0 md:before:left-0 md:before:w-px md:before:bg-gradient-to-b md:before:from-transparent md:before:via-lumi-200 md:before:to-transparent md:dark:before:via-white/10"
          >
            <h3 className="mb-5 text-xs font-bold uppercase tracking-[0.14em] text-lumi-600 dark:text-lumi-300">
              {t('problem.after.title')}
            </h3>
            <ul className="space-y-3.5">
              {after.map((item) => (
                <li key={item} className="flex gap-3">
                  <Icon
                    name="check"
                    size={18}
                    strokeWidth={2.5}
                    className="mt-0.5 shrink-0 text-lumi-500 dark:text-lumi-300"
                  />
                  <span className="text-[15px] font-medium leading-relaxed text-gray-800 dark:text-gray-200">
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
