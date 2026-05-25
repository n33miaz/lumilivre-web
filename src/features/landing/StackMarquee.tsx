import { useTranslation } from 'react-i18next';

import { SectionHeader } from './SectionHeader';

const TECHS = [
  { name: 'React', icon: 'R' },
  { name: 'TypeScript', icon: 'TS' },
  { name: 'TailwindCSS', icon: 'TW' },
  { name: 'Vite', icon: 'V' },
  { name: 'Flutter', icon: 'F' },
  { name: 'Dart', icon: 'D' },
  { name: 'Spring Boot', icon: 'SB' },
  { name: 'PostgreSQL', icon: 'PG' },
  { name: 'Supabase', icon: 'SP' },
  { name: 'Docker', icon: 'DK' },
  { name: 'JWT', icon: 'JWT' },
  { name: 'Material 3', icon: 'M3' },
];

function MarqueeItem({ t }: { t: { name: string; icon: string } }) {
  return (
    <div className="flex-shrink-0 flex items-center gap-2.5 px-5 py-2.5 mx-2 rounded-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-ink-900">
      <span className="text-xs font-mono font-bold w-8 text-center text-lumi-500 dark:text-lumi-400">
        {t.icon}
      </span>
      <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">{t.name}</span>
    </div>
  );
}

export function StackMarquee() {
  const { t } = useTranslation('landing');
  const stream = [...TECHS, ...TECHS];
  return (
    <section id="stack" className="py-24 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        <SectionHeader
          eyebrow={t('stack.eyebrow')}
          title={t('stack.title')}
          lead={t('stack.lead')}
        />
      </div>
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white dark:from-ink-950 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white dark:from-ink-950 to-transparent z-10 pointer-events-none" />
        <div className="flex animate-marquee" style={{ width: 'max-content' }}>
          {stream.map((tech, i) => (
            <MarqueeItem key={`${tech.name}-${i}`} t={tech} />
          ))}
        </div>
      </div>
    </section>
  );
}
