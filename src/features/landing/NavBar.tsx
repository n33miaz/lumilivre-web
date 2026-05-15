import LogoIcon from '../../assets/icons/logo.svg?react';
import { Icon } from './Icon';
import { Btn } from './Btn';

interface NavBarProps {
  dark: boolean;
  setDark: (value: boolean) => void;
  onAdminClick: () => void;
}

export function NavBar({ dark, setDark, onAdminClick }: NavBarProps) {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-white/70 dark:bg-ink-950/70 border-b border-gray-200/60 dark:border-gray-800/60">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#top" className="flex items-center gap-2.5">
          <LogoIcon className="h-8 w-8 text-lumi-500" />
          <span className="font-extrabold text-lg tracking-tight">LumiLivre</span>
        </a>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-700 dark:text-gray-300">
          <a href="#ecosystem" className="hover:text-lumi-500 dark:hover:text-lumi-400">
            Ecossistema
          </a>
          <a href="#features" className="hover:text-lumi-500 dark:hover:text-lumi-400">
            Recursos
          </a>
          <a href="#stack" className="hover:text-lumi-500 dark:hover:text-lumi-400">
            Tecnologia
          </a>
          <a href="#community" className="hover:text-lumi-500 dark:hover:text-lumi-400">
            Comunidade
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setDark(!dark)}
            aria-label="Alternar tema"
            className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Icon name={dark ? 'sun' : 'moon'} size={18} />
          </button>
          <button
            onClick={onAdminClick}
            className="hidden sm:inline-flex items-center gap-2 rounded-lg font-semibold text-sm px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:text-lumi-500 dark:hover:text-lumi-400"
          >
            Entrar
          </button>
          <Btn
            href="https://github.com/n33miaz"
            target="_blank"
            rel="noreferrer"
            variant="primary"
            icon={<Icon name="github" size={16} />}
          >
            GitHub
          </Btn>
        </div>
      </div>
    </header>
  );
}
