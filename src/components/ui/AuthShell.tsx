import { type ReactNode } from 'react';

import { useIsDark } from '../../hooks/useIsDark';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { ThemeToggle } from '../../layouts/components/ThemeToggle';
import { LocaleSwitcher } from './LocaleSwitcher';
import { LoginMeshBackground } from './ShaderBackground';

import LogoIcon from '../../assets/icons/logo.svg?react';

interface AuthShellProps {
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  /** Optional footer (e.g. a "back to login" link), centered under the form. */
  footer?: ReactNode;
}

/**
 * Shared scaffold for the centered, single-column auth pages (forgot password,
 * reset password). Mirrors the login's visual language: flowing mesh backdrop
 * (lg+ only — a flat themed color on phones), top-right locale + theme controls,
 * and a solid card with a centered logo/title header.
 */
export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  const isDark = useIsDark();
  // Mesh on tablets/laptops/desktops; only true phones (<640px) stay flat.
  const showMesh = useMediaQuery('(min-width: 640px)');

  return (
    <main className="auth-shell login-enter relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-16 select-none">
      {showMesh && (
        <LoginMeshBackground
          isDark={isDark}
          split={false}
          className="absolute inset-0 z-0"
          quality={0.55}
        />
      )}

      <div className="absolute right-5 top-5 z-10 flex items-center gap-2">
        <LocaleSwitcher />
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="login-card rounded-3xl p-6 sm:p-8">
          <div className="mb-7 text-center">
            <LogoIcon className="mx-auto h-16 w-auto text-lumi-primary" />
            <h1 className="mt-3 font-display text-3xl font-extrabold text-gray-900 dark:text-white">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>

          {children}

          {footer && <div className="mt-5 text-center">{footer}</div>}
        </div>
      </div>
    </main>
  );
}
