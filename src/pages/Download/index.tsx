import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import LogoIcon from '../../assets/icons/logo.svg?react';
import DownloadIcon from '../../assets/icons/upload.svg?react';
import { apkLinkProps, resolveApkUrl } from '../../utils/apkDownload';

export function DownloadAppPage() {
  const { t } = useTranslation('download');
  const apkUrl = resolveApkUrl();

  useEffect(() => {
    if (!apkUrl) return;

    const timer = setTimeout(() => {
      window.location.href = apkUrl;
    }, 1000);

    return () => clearTimeout(timer);
  }, [apkUrl]);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-lumi-radial p-6 dark:bg-dark-background">
      <div className="glass w-full max-w-md rounded-3xl border border-white/70 p-8 text-center shadow-card dark:border-white/10">
        <div className="mx-auto mb-8 flex h-28 w-28 items-center justify-center rounded-3xl bg-lumi-primary/10 text-lumi-primary animate-popIn dark:bg-lumi-label/15 dark:text-lumi-label">
          <LogoIcon className="h-20 w-auto" />
        </div>

        <span className="text-xs font-bold uppercase text-lumi-primary dark:text-lumi-label">
          {t('eyebrow')}
        </span>
        <h1 className="mt-2 font-display text-3xl font-extrabold text-gray-900 dark:text-white">
          {apkUrl ? t('title') : t('unconfigured.title')}
        </h1>

        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-gray-500 dark:text-gray-400">
          {apkUrl ? t('message') : t('unconfigured.message')}
        </p>

        <div className="mt-8 space-y-4">
          <a
            {...apkLinkProps()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-4 text-sm font-extrabold text-white shadow-sm transition-all duration-200 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-offset-2 active:scale-95 dark:focus:ring-offset-dark-card"
          >
            <DownloadIcon className="h-5 w-5" />
            {apkUrl ? t('button.retry') : t('button.releases')}
          </a>

          <Link
            to="/login"
            className="inline-flex font-bold text-lumi-primary transition-colors hover:text-lumi-primary-hover dark:text-lumi-label"
          >
            {t('link.return_to_admin')}
          </Link>
        </div>
      </div>
    </main>
  );
}
