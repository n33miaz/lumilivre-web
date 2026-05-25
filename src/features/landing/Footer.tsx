import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import LogoIcon from '../../assets/icons/logo.svg?react';
import { Icon } from './Icon';

const REPOS = ['lumilivre-api', 'lumilivre-web', 'lumilivre-app'];

export function Footer() {
  const { t } = useTranslation('landing');
  const year = new Date().getFullYear();

  const projectLinks = useMemo(
    () => [
      { label: t('footer.link.docs'), href: '#ecosystem' },
      {
        label: t('footer.link.license'),
        href: 'https://opensource.org/license/mit/',
      },
      { label: t('footer.link.coc'), href: '#community' },
    ],
    [t],
  );

  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 px-6 py-16">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <LogoIcon className="h-7 w-7 text-lumi-500" />
              <span className="font-extrabold text-lg">LumiLivre</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-md">
              {t('footer.description')}
            </p>
          </div>

          <div>
            <h4 className="font-bold text-sm mb-4 uppercase tracking-wider text-gray-500">
              {t('footer.heading.repos')}
            </h4>
            <ul className="space-y-2.5 text-sm">
              {REPOS.map((r) => (
                <li key={r}>
                  <a
                    href={`https://github.com/n33miaz/${r}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-gray-700 dark:text-gray-300 hover:text-lumi-500 inline-flex items-center gap-1.5 font-mono"
                  >
                    <Icon name="github" size={14} />
                    {r}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-sm mb-4 uppercase tracking-wider text-gray-500">
              {t('footer.heading.project')}
            </h4>
            <ul className="space-y-2.5 text-sm">
              {projectLinks.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    target={l.href.startsWith('http') ? '_blank' : undefined}
                    rel={l.href.startsWith('http') ? 'noreferrer' : undefined}
                    className="text-gray-700 dark:text-gray-300 hover:text-lumi-500"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <div>{t('footer.copyright', { year })}</div>
          <div className="font-mono">{t('footer.location')}</div>
        </div>
      </div>
    </footer>
  );
}
