import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import LogoIcon from '../../assets/icons/logo.svg?react';
import { Icon } from './Icon';

const REPOS = ['lumilivre-api', 'lumilivre-web', 'lumilivre-app'];

const LINK_CLASS =
  'rounded-[2px] text-paper-600 transition-colors hover:text-lumi-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-lumi-400 dark:text-ink-400 dark:hover:text-lumi-200';

/**
 * Rodapé em colofão: a mesma família de filete e mono do resto da página, com a
 * assimetria 5/3/4 em vez das quatro colunas iguais que havia antes. Colunas
 * iguais no rodapé é o penúltimo lugar onde a página deixava escapar que a
 * estrutura vinha de um molde.
 */
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
    <footer className="paper-surface border-t-2 border-paper-900 bg-paper-100 px-6 py-16 dark:border-ink-100/80 dark:bg-ink-950">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="mb-4 flex items-center gap-2.5">
              <LogoIcon className="h-7 w-7 text-lumi-500 dark:text-lumi-label" />
              <span className="font-display text-lg font-extrabold text-paper-900 dark:text-ink-100">
                LumiLivre
              </span>
            </div>
            <p className="max-w-[46ch] text-sm leading-relaxed text-paper-600 dark:text-ink-400">
              {t('footer.description')}
            </p>
          </div>

          <div className="lg:col-span-3">
            <h2 className="mb-4 border-t border-paper-300 pt-3 text-[11px] font-bold uppercase tracking-[0.18em] text-paper-500 dark:border-white/10 dark:text-ink-400">
              {t('footer.heading.repos')}
            </h2>
            <ul className="space-y-2.5 text-sm">
              {REPOS.map((repo) => (
                <li key={repo}>
                  <a
                    href={`https://github.com/n33miaz/${repo}`}
                    target="_blank"
                    rel="noreferrer"
                    className={`inline-flex items-center gap-1.5 font-mono text-[13px] ${LINK_CLASS}`}
                  >
                    <Icon name="github" size={14} />
                    {repo}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-4">
            <h2 className="mb-4 border-t border-paper-300 pt-3 text-[11px] font-bold uppercase tracking-[0.18em] text-paper-500 dark:border-white/10 dark:text-ink-400">
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

        <div className="flex flex-col items-start justify-between gap-3 border-t border-paper-300 pt-8 font-mono text-[11px] text-paper-500 dark:border-white/10 dark:text-ink-400 md:flex-row md:items-center">
          <div>{t('footer.copyright', { year })}</div>
          {/* Assinatura, não endereço: a cidade saiu porque um portfólio lido
              por recrutador do mundo inteiro não ganha nada em publicar onde o
              autor mora. O que sustenta a linha é a autoria, e ela fica. */}
          <div>{t('footer.authorship')}</div>
        </div>
      </div>
    </footer>
  );
}
