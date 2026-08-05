import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import LogoIcon from '../../assets/icons/logo.svg?react';
import { Icon } from './Icon';

const REPOS = ['lumilivre-api', 'lumilivre-web', 'lumilivre-app'];

const LINK_CLASS =
  'rounded text-gray-700 transition-colors hover:text-lumi-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-lumi-400 dark:text-gray-300 dark:hover:text-lumi-200';

export function Footer() {
  const { t } = useTranslation('landing');
  const year = new Date().getFullYear();

  const projectLinks = useMemo(
    () => [
      { label: t('footer.link.screens'), href: '#screens' },
      { label: t('footer.link.engineering'), href: '#engineering' },
      {
        label: t('footer.link.license'),
        href: 'https://github.com/n33miaz/lumilivre-web/blob/master/LICENSE',
      },
      { label: t('footer.link.contact'), href: '#contact' },
    ],
    [t],
  );

  return (
    <footer className="border-t border-gray-200 px-6 py-16 dark:border-gray-800">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="mb-4 flex items-center gap-2.5">
              <LogoIcon className="h-7 w-7 text-lumi-500" />
              <span className="text-lg font-extrabold">LumiLivre</span>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              {t('footer.description')}
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
              {t('footer.heading.repos')}
            </h2>
            <ul className="space-y-2.5 text-sm">
              {REPOS.map((repo) => (
                <li key={repo}>
                  <a
                    href={`https://github.com/n33miaz/${repo}`}
                    target="_blank"
                    rel="noreferrer"
                    className={`inline-flex items-center gap-1.5 font-mono ${LINK_CLASS}`}
                  >
                    <Icon name="github" size={14} />
                    {repo}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
              {t('footer.heading.project')}
            </h2>
            <ul className="space-y-2.5 text-sm">
              {projectLinks.map((link) => {
                const external = link.href.startsWith('http');
                return (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target={external ? '_blank' : undefined}
                      rel={external ? 'noreferrer' : undefined}
                      className={LINK_CLASS}
                    >
                      {link.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-8 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400 md:flex-row">
          <div>{t('footer.copyright', { year })}</div>
          <div className="font-mono">{t('footer.location')}</div>
        </div>
      </div>
    </footer>
  );
}
