import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useIsDark } from '../../hooks/useIsDark';
import { LoginMeshBackground } from '../../components/ui/ShaderBackground/LoginMeshBackground';
import { Btn } from './Btn';
import { HeroShot } from './HeroShot';
import { Icon } from './Icon';

const CONTACT_HREF = 'mailto:ncormino@gmail.com';

export function Hero() {
  const { t } = useTranslation('landing');
  const isDark = useIsDark();

  // Quatro números, todos rastreáveis no código (RLS nas 20 tabelas, endpoints
  // anotados, três clientes, dois idiomas completos). Prova antes de adjetivo:
  // "100% responsivo", que ocupava esta faixa, não provava nada.
  const proof = useMemo(
    () => [
      { key: 'apps', value: t('proof.apps.value'), label: t('proof.apps.label') },
      {
        key: 'endpoints',
        value: t('proof.endpoints.value'),
        label: t('proof.endpoints.label'),
      },
      {
        key: 'tables',
        value: t('proof.tables.value'),
        label: t('proof.tables.label'),
      },
      {
        key: 'langs',
        value: t('proof.langs.value'),
        label: t('proof.langs.label'),
      },
    ],
    [t],
  );

  return (
    <section id="top" className="relative overflow-hidden">
      {/* Fundo interativo (a mesma malha reativa do login). Degrada com graça em
          clientes sem WebGL e congela com prefers-reduced-motion. */}
      <LoginMeshBackground
        isDark={isDark}
        split={false}
        quality={0.4}
        className="absolute inset-x-0 top-0 z-0 h-full opacity-40 dark:opacity-30"
      />
      {/* Véu que devolve contraste ao texto sobre a malha e dissolve a seção no
          fundo da próxima — sem ele o limite entre as duas fica visível. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-[1] bg-gradient-to-b from-white/70 via-white/40 to-white dark:from-ink-950/70 dark:via-ink-950/50 dark:to-ink-950"
      />

      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-16 sm:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <span
            data-reveal
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-lumi-200/70 bg-white/70 px-3.5 py-1.5 text-xs font-bold text-lumi-700 backdrop-blur dark:border-lumi-500/30 dark:bg-white/5 dark:text-lumi-200"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-lumi-500 animate-pulse-soft" />
            {t('hero.badge')}
          </span>

          <h1
            data-reveal
            data-reveal-delay="1"
            className="text-[2.5rem] font-black leading-[1.04] tracking-tighter sm:text-6xl lg:text-7xl"
          >
            {t('hero.title.part1')}{' '}
            <span className="gradient-text">{t('hero.title.part2')}</span>
          </h1>

          <p
            data-reveal
            data-reveal-delay="2"
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600 dark:text-gray-300 sm:text-xl"
          >
            {t('hero.lead')}
          </p>

          <div
            data-reveal
            data-reveal-delay="3"
            className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center"
          >
            <Btn
              href="#screens"
              variant="primary"
              trailingIcon={<Icon name="arrow-right" size={16} />}
            >
              {t('hero.cta.primary')}
            </Btn>
            <Btn
              href={CONTACT_HREF}
              variant="secondary"
              icon={<Icon name="mail" size={16} />}
            >
              {t('hero.cta.secondary')}
            </Btn>
          </div>
        </div>

        <HeroShot />

        <dl className="mx-auto mt-14 grid max-w-4xl grid-cols-2 gap-x-6 gap-y-8 border-t border-gray-200 pt-10 dark:border-white/10 md:grid-cols-4">
          {proof.map((item, index) => (
            <div
              key={item.key}
              data-reveal
              data-reveal-delay={String(index + 1)}
              className="text-center md:text-left"
            >
              <dt className="sr-only">{item.label}</dt>
              <dd>
                <span className="block font-display text-3xl font-black tabular-nums text-gray-900 dark:text-white sm:text-4xl">
                  {item.value}
                </span>
                <span className="mt-1.5 block text-[13px] leading-snug text-gray-500 dark:text-gray-400">
                  {item.label}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
