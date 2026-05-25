import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import LogoIcon from '../../assets/icons/logo.svg?react';
import { Icon, type IconName } from './Icon';

const SIDEBAR_ICONS: IconName[] = ['home', 'book', 'arrow-left-right', 'users'];

const ACTIVITY_ITEMS: Array<[string, string, string]> = [
  ['Anna Souza', 'Dom Casmurro', 'bg-green-400'],
  ['Lucas Pereira', 'A Hora da Estrela', 'bg-blue-400'],
  ['Julia Martins', 'Capitaes da Areia', 'bg-red-400'],
  ['Bruno Lima', 'Memorias Postumas', 'bg-gray-400'],
];

const FEATURED_COVERS = ['#3754A8', '#A20E47', '#8A4100'];

export function HeroVisual() {
  const { t } = useTranslation('landing');

  const stats = useMemo(
    () => [
      { l: t('heroVisual.stat.books'), v: '1.247', c: 'bg-lumi-100 text-lumi-600' },
      { l: t('heroVisual.stat.loans'), v: '86', c: 'bg-blue-100 text-blue-600' },
      { l: t('heroVisual.stat.overdue'), v: '7', c: 'bg-orange-100 text-orange-600' },
    ],
    [t],
  );

  const genres = useMemo(
    () => [
      { c: '#E8115B', t: t('heroVisual.genre.romance') },
      { c: '#006450', t: t('heroVisual.genre.children') },
      { c: '#8400E7', t: t('heroVisual.genre.teen') },
      { c: '#1E3264', t: t('heroVisual.genre.adventure') },
    ],
    [t],
  );

  return (
    <div className="relative h-[520px]">
      <div className="absolute top-4 left-0 right-12 h-[380px] rounded-2xl bg-white dark:bg-ink-900 border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden animate-float">
        <div className="h-9 bg-gray-100 dark:bg-gray-800 flex items-center gap-1.5 px-4 border-b border-gray-200 dark:border-gray-700">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
          <span className="ml-3 text-[10px] font-mono text-gray-400">painel.lumilivre.org</span>
        </div>
        <div className="flex h-[calc(100%-2.25rem)]">
          <div className="w-12 bg-lumi-500 flex flex-col items-center py-3 gap-3">
            <LogoIcon className="w-6 h-6 text-white" />
            {SIDEBAR_ICONS.map((iconName) => (
              <div
                key={iconName}
                className="w-8 h-8 rounded-md flex items-center justify-center text-white/80"
              >
                <Icon name={iconName} size={14} />
              </div>
            ))}
          </div>
          <div className="flex-1 p-5">
            <div className="text-xs font-bold text-gray-900 dark:text-white mb-1">
              {t('heroVisual.title')}
            </div>
            <div className="text-[10px] text-gray-500 mb-4">
              {t('heroVisual.subtitle')}
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {stats.map((s) => (
                <div
                  key={s.l}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 p-2.5"
                >
                  <div className={`w-6 h-6 rounded ${s.c} mb-1.5`} />
                  <div className="text-[9px] text-gray-500 dark:text-gray-400">{s.l}</div>
                  <div className="text-base font-extrabold text-gray-900 dark:text-white">
                    {s.v}
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-1.5">
              {ACTIVITY_ITEMS.map(([n, b, c]) => (
                <div
                  key={n}
                  className="flex items-center gap-2 text-[10px] py-1.5 px-2 rounded bg-gray-50 dark:bg-gray-800/50"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${c}`} />
                  <span className="font-semibold text-gray-900 dark:text-white">{n}</span>
                  <span className="text-gray-500">{b}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        className="absolute bottom-0 -right-2 w-[200px] h-[400px] rounded-[28px] bg-ink-950 border-[6px] border-gray-900 dark:border-gray-700 shadow-2xl overflow-hidden"
        style={{ animationDelay: '1.5s' }}
      >
        <div className="h-full bg-gray-50 dark:bg-ink-900 relative">
          <div className="bg-lumi-label h-[100px] rounded-b-[24px] flex flex-col justify-center px-4 pt-6">
            <div className="text-[10px] text-white/80">{t('heroVisual.greeting')}</div>
            <div className="text-base font-extrabold text-white">Anna</div>
          </div>
          <div className="px-3 -mt-6 grid grid-cols-2 gap-2 relative z-10">
            {genres.map((g) => (
              <div
                key={g.t}
                className="rounded-lg p-2.5 text-white text-[10px] font-extrabold h-12 flex items-end"
                style={{ background: `linear-gradient(135deg, ${g.c}cc, ${g.c})` }}
              >
                {g.t}
              </div>
            ))}
          </div>
          <div className="px-3 mt-3">
            <div className="text-[10px] font-bold text-gray-700 dark:text-gray-200 mb-1.5">
              {t('heroVisual.featured')}
            </div>
            <div className="flex gap-1.5 overflow-hidden">
              {FEATURED_COVERS.map((c, i) => (
                <div
                  key={c}
                  className="flex-shrink-0 w-14 rounded-md overflow-hidden bg-white dark:bg-gray-800 shadow"
                >
                  <div
                    className="aspect-[2/3]"
                    style={{ background: `linear-gradient(160deg, ${c}cc, ${c})` }}
                  />
                  <div className="p-1.5">
                    <div className="text-[7px] font-bold text-gray-900 dark:text-white truncate">
                      {t('heroVisual.book.prefix')}
                      {i + 1}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute bottom-0 inset-x-0 bg-lumi-500 grid grid-cols-3 py-1.5">
            {(['search', 'home', 'user'] as IconName[]).map((n, i) => (
              <div
                key={n}
                className="flex justify-center text-white"
                style={{ opacity: i === 1 ? 1 : 0.6 }}
              >
                <Icon name={n} size={12} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
