import { type ReactNode } from 'react';

import { useIsDark } from '../../hooks/useIsDark';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { ThemeToggle } from '../../layouts/components/ThemeToggle';
import { AuthCardHeader } from './AuthCardHeader';
import { LocaleSwitcher } from './LocaleSwitcher';
import { LoginMeshBackground } from './ShaderBackground';

interface AuthShellProps {
  /** Etiqueta curta da superfície, no cabeçalho da ficha. */
  kicker: string;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  /** Optional footer (e.g. a "back to login" link), centered under the form. */
  footer?: ReactNode;
}

/**
 * Scaffold das telas de autenticação de uma coluna (esqueci a senha, redefinir).
 *
 * Fala a mesma língua do login: malha WebGL ao fundo (≥sm; celular fica na cor
 * chapada), controles de idioma e tema no canto, e uma **ficha** — o mesmo
 * cartão de fichário da landing, com pauta, canto de 2px e furo do bastão na
 * base — em vez do cartão arredondado de 24px que havia antes.
 *
 * O logo centralizado de 64px saiu do topo da ficha: repetia a marca que já está
 * na aba do navegador e empurrava o título para baixo da dobra no celular. No
 * lugar entrou o cabeçalho com cota, que é o que identifica a família.
 */
export function AuthShell({
  kicker,
  title,
  subtitle,
  children,
  footer,
}: AuthShellProps) {
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

      {/* Mesma pastilha do login: papel opaco, borda de 1px e canto de 2px, o
          material da ficha logo abaixo. As quatro telas de acesso têm de mostrar
          o mesmo canto superior direito. */}
      <div className="ficha-pastilha paper-surface absolute right-5 top-5 z-10 flex items-center gap-1 px-1.5 py-1">
        <LocaleSwitcher />
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="ficha ficha-elevada ficha-furo paper-surface bg-paper-50 px-6 pb-14 pt-6 dark:bg-ink-900 sm:px-8 sm:pt-8">
          <AuthCardHeader kicker={kicker} title={title} subtitle={subtitle} />

          {children}

          {footer && (
            <div className="mt-7 border-t border-paper-300 pt-6 text-center dark:border-white/10">
              {footer}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
