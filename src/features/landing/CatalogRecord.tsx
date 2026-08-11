import { useMemo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { SUPPORTED_LOCALES } from '../../i18n';
import { SHELF_MARKS } from './shelfMarks';

/**
 * A ficha de catálogo do próprio LumiLivre — o objeto que define o visual da
 * página inteira.
 *
 * Por que existe: a faixa de quatro números centralizados que ocupava este
 * lugar (`3 · 107 · 20 · 5`, uma coluna igual para cada) é literalmente a grade
 * simétrica que qualquer gerador produz. Os números são os MESMOS, já
 * conferidos no código; o que muda é que agora estão num **registro
 * bibliográfico**, que é como uma biblioteca de verdade descreve uma coisa.
 * Prova continua sendo prova, e a peça deixou de ser intercambiável com a de um
 * CRM.
 *
 * Nada aqui é afirmação nova: título e nota de licença saem da mesma copy do
 * rodapé, a descrição é composta dos quatro `proof.*` do i18n, a edição vem do
 * `__APP_VERSION__` do build e os idiomas são a lista real de `SUPPORTED_LOCALES`.
 */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    // Duas colunas a partir de `sm`, empilhado abaixo: em 320px a coluna de
    // rótulo mais o valor não cabem lado a lado sem quebrar toda palavra.
    // A pauta é a BORDA DA LINHA, não um fundo listrado: fundo listrado
    // desalinha assim que o devanágari cresce a altura da linha.
    <div className="grid gap-x-3 border-b border-paper-300/80 py-2.5 last:border-b-0 dark:border-white/10 sm:grid-cols-[5.5rem_minmax(0,1fr)]">
      <dt className="cota pt-px text-[10px] uppercase text-paper-500 dark:text-ink-400">
        {label}
      </dt>
      <dd className="text-[13px] leading-snug text-paper-800 dark:text-ink-200">
        {children}
      </dd>
    </div>
  );
}

export function CatalogRecord() {
  const { t } = useTranslation('landing');

  // As três linhas de descrição são os `proof.*` de sempre, escritos como um
  // catalogador escreveria: quantidade seguida do que é.
  const description = useMemo(
    () =>
      (['apps', 'endpoints', 'tables'] as const).map((key) => ({
        key,
        text: `${t(`proof.${key}.value`)} ${t(`proof.${key}.label`)}`,
      })),
    [t],
  );

  return (
    <article
      data-reveal
      data-reveal-delay="3"
      aria-label={t('record.aria')}
      className="ficha ficha-furo paper-surface bg-paper-50 px-5 pb-12 pt-4 dark:bg-ink-900 sm:px-6"
    >
      {/* Cabeçalho da ficha: cota à esquerda, sigla do acervo à direita — o
          canto superior de um cartão de fichário. Filete fino (não mais o de 2px)
          para o cartão respirar; o acento grosso da página fica na etiqueta de
          lombada da abertura de cada seção. */}
      <div className="flex items-baseline justify-between border-b border-paper-300 pb-3 dark:border-white/10">
        <span
          aria-hidden="true"
          className="cota text-sm text-lumi-600 dark:text-lumi-200"
        >
          {SHELF_MARKS.hero}
        </span>
        <span className="cota text-[10px] uppercase text-paper-500 dark:text-ink-400">
          {t('record.stamp')}
        </span>
      </div>

      <dl className="mt-1">
        <Field label={t('record.field.title')}>{t('record.value.title')}</Field>
        <Field label={t('record.field.author')}>
          {t('record.value.author')}
        </Field>
        <Field label={t('record.field.edition')}>
          <span className="tabular-nums">
            {t('record.value.edition', {
              version: __APP_VERSION__,
              year: new Date().getFullYear(),
            })}
          </span>
        </Field>
        <Field label={t('record.field.description')}>
          <ul className="space-y-1">
            {description.map((line) => (
              <li key={line.key} className="tabular-nums">
                {line.text}
              </li>
            ))}
          </ul>
        </Field>
        <Field label={t('record.field.languages')}>
          {/* Os cinco idiomas MOSTRADOS em vez de anunciados: a lista real que o
              seletor de idioma carrega. */}
          <span className="cota text-[11px] font-semibold normal-case tracking-[0.06em] text-paper-700 dark:text-ink-200">
            {SUPPORTED_LOCALES.join(' · ')}
          </span>
        </Field>
        <Field label={t('record.field.notes')}>{t('record.value.notes')}</Field>
      </dl>
    </article>
  );
}
