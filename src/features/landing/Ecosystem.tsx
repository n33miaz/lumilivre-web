import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Icon, type IconName } from './Icon';
import { SectionHeader } from './SectionHeader';

interface Pillar {
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
        icon: 'server',
        tag: t('ecosystem.pillar.api.tag'),
        title: t('ecosystem.pillar.api.title'),
        desc: t('ecosystem.pillar.api.desc'),
        stack: ['Spring Boot', 'PostgreSQL', 'Supabase', 'JWT'],
        accent: 'from-lumi-500 to-lumi-700',
      },
      {
        icon: 'monitor',
        tag: t('ecosystem.pillar.web.tag'),
        title: t('ecosystem.pillar.web.title'),
        desc: t('ecosystem.pillar.web.desc'),
        stack: ['React', 'TypeScript', 'TailwindCSS', 'Vite'],
        accent: 'from-lumi-action to-blue-700',
      },
      {
        icon: 'smartphone',
        tag: t('ecosystem.pillar.app.tag'),
        title: t('ecosystem.pillar.app.title'),
        desc: t('ecosystem.pillar.app.desc'),
        stack: ['Flutter', 'Dart', 'Material 3', 'FCM'],
        accent: 'from-lumi-label to-pink-600',
      },
    ],
    [t],
  );

  return (
    <section id="ecosystem" className="py-28 px-6 relative">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          eyebrow={t('ecosystem.eyebrow')}
          title={t('ecosystem.title')}
          lead={t('ecosystem.lead')}
        />
        <div className="grid md:grid-cols-3 gap-6">
          {pillars.map((p, i) => (
            <div
              key={p.title}
              className="group relative rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-ink-900 p-7 hover:border-lumi-400 hover:-translate-y-1 transition-all duration-300 shadow-soft hover:shadow-glow"
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${p.accent} flex items-center justify-center text-white mb-5 shadow-lg`}
              >
                <Icon name={p.icon} size={22} />
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-lumi-500 dark:text-lumi-400 mb-1.5">
                {p.tag} · 0{i + 1}
              </div>
              <h3 className="text-2xl font-extrabold mb-3 text-gray-900 dark:text-white">
                {p.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-5 text-[15px]">
                {p.desc}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {p.stack.map((s) => (
                  <span
                    key={s}
                    className="text-[11px] font-mono px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
