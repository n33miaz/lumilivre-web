import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Icon } from './Icon';
import { Btn } from './Btn';
import { HeroVisual } from './HeroVisual';
import { useIsDark } from '../../hooks/useIsDark';
import { LoginMeshBackground } from '../../components/ui/ShaderBackground/LoginMeshBackground';

export function Hero() {
  const { t } = useTranslation('landing');
  const isDark = useIsDark();

  const stats = useMemo(
    () => [
      { label: t('hero.stat.apps.label'), value: t('hero.stat.apps.value') },
      {
        label: t('hero.stat.opensource.label'),
        value: t('hero.stat.opensource.value'),
      },
      { label: t('hero.stat.price.label'), value: t('hero.stat.price.value') },
    ],
    [t],
  );

  return (
    <section id="top" className="relative overflow-hidden">
      {/* Fundo interativo (mesma malha reativa do login). Degrada com
          graça em clientes sem WebGL / prefers-reduced-motion. */}
      <LoginMeshBackground
        isDark={isDark}
        split={false}
        quality={0.4}
        className="absolute inset-0 z-0 opacity-50 dark:opacity-40"
      />
      <div className="absolute inset-0 z-[1] grid-pattern" />
      <div className="blob bg-lumi-label w-[500px] h-[500px] top-20 -right-32 z-[1]" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-20 pb-28">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-lumi-100 dark:bg-lumi-500/20 text-lumi-700 dark:text-lumi-200 text-xs font-bold mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-lumi-500 animate-pulse-soft" />
              {t('hero.badge')}
            </span>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[1.05] mb-6">
              {t('hero.title.part1')}{' '}
              <span className="gradient-text">{t('hero.title.part2')}</span>
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed mb-10 max-w-xl">
              {t('hero.description.prefix')}
              <strong className="text-gray-900 dark:text-white">
                {t('hero.description.bold')}
              </strong>
              {t('hero.description.suffix')}
            </p>

            <div className="flex flex-wrap gap-3">
              <Btn
                href="mailto:ncormino@gmail.com"
                variant="primary"
                icon={<Icon name="mail" size={16} />}
              >
                {t('hero.cta.github')}
              </Btn>
              <Btn href="#screens" variant="secondary" icon={<Icon name="book-open" size={16} />}>
                {t('hero.cta.docs')}
              </Btn>
            </div>

            <div className="flex items-center gap-8 mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="text-2xl font-black text-gray-900 dark:text-white">
                    {s.value}
                  </div>
                  <div className="text-xs uppercase tracking-wider text-gray-500 mt-1">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <HeroVisual />
        </div>
      </div>
    </section>
  );
}
