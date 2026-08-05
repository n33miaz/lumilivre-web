import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Icon, type IconName } from './Icon';
import { SectionHeader } from './SectionHeader';

interface Pillar {
  key: string;
  icon: IconName;
  tag: string;
  title: string;
  desc: string;
  stack: string[];
  accent: string;
}

export function Ecosystem() {
  const { t } = useTranslation('landing');

  const pillars: Pillar[] = useMemo(
    () => [
      {
        key: 'api',
        icon: 'server',
        tag: t('ecosystem.pillar.api.tag'),
        title: t('ecosystem.pillar.api.title'),
        desc: t('ecosystem.pillar.api.desc'),
        // Versões conferidas no pom.xml e no docker-compose, não de memória.
        stack: ['Java 17', 'Spring Boot 3.4', 'PostgreSQL 16', 'Flyway'],
        accent: 'from-lumi-500 to-lumi-700',
      },
      {
        key: 'web',
        icon: 'monitor',
        tag: t('ecosystem.pillar.web.tag'),
        title: t('ecosystem.pillar.web.title'),
        desc: t('ecosystem.pillar.web.desc'),
        stack: ['React 19', 'TypeScript', 'Vite 6', 'TailwindCSS'],
        accent: 'from-lumi-action to-blue-700',
      },
      {
        key: 'app',
        icon: 'smartphone',
        tag: t('ecosystem.pillar.app.tag'),
        title: t('ecosystem.pillar.app.title'),
        desc: t('ecosystem.pillar.app.desc'),
        // Saiu "FCM": não existe nenhuma dependência do Firebase no aplicativo.
        stack: ['Flutter', 'Dart', 'Provider', 'Secure Storage'],
        accent: 'from-lumi-label to-pink-600',
      },
    ],
    [t],
  );

  return (
    <section
      id="ecosystem"
      className="relative bg-gray-50 px-6 py-24 dark:bg-ink-900/40 sm:py-28"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeader
          eyebrow={t('ecosystem.eyebrow')}
          title={t('ecosystem.title')}
          lead={t('ecosystem.lead')}
        />

        <div className="grid gap-5 md:grid-cols-3">
          {pillars.map((pillar, index) => (
            <article
              key={pillar.key}
              data-reveal
              data-reveal-delay={String(index + 1)}
              className="group relative rounded-2xl border border-gray-200 bg-white p-7 shadow-soft transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-lumi-400 hover:shadow-glow dark:border-gray-800 dark:bg-ink-900"
            >
              <div
                className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${pillar.accent} text-white shadow-lg`}
              >
                <Icon name={pillar.icon} size={22} />
              </div>
              <div className="mb-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-lumi-600 dark:text-lumi-300">
                {pillar.tag} · 0{index + 1}
              </div>
              <h3 className="mb-3 text-2xl font-extrabold text-gray-900 dark:text-white">
                {pillar.title}
              </h3>
              <p className="mb-5 text-[15px] leading-relaxed text-gray-600 dark:text-gray-400">
                {pillar.desc}
              </p>
              <ul className="flex flex-wrap gap-1.5">
                {pillar.stack.map((item) => (
                  <li
                    key={item}
                    className="rounded-md bg-gray-100 px-2 py-1 font-mono text-[11px] text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        {/* O elo entre os três cards: sem ele, "três aplicações" pode soar como
            três projetos separados — e o contrato compartilhado é justamente o
            que sustenta a afirmação do hero. */}
        <div
          data-reveal
          data-reveal-delay="4"
          className="mt-5 rounded-2xl border border-dashed border-lumi-300/70 bg-white/60 p-6 dark:border-lumi-500/30 dark:bg-white/[0.03] sm:p-7"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:gap-6">
            <h3 className="shrink-0 font-display text-base font-extrabold text-gray-900 dark:text-white">
              {t('ecosystem.contract.title')}
            </h3>
            <p className="text-[15px] leading-relaxed text-gray-600 dark:text-gray-400">
              {t('ecosystem.contract.desc')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
