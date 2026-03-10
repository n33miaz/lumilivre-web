import {
  useContext,
  useEffect,
  useState,
  type ReactNode,
  type SVGProps,
} from 'react';
import { useNavigate } from 'react-router-dom';

import { ThemeContext } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

import UploadIcon from '../../assets/icons/download.svg?react';
import LockIcon from '../../assets/icons/lock.svg?react';
import SunIcon from '../../assets/icons/sun.svg?react';
import MoonIcon from '../../assets/icons/moon.svg?react';
import AutoIcon from '../../assets/icons/auto.svg?react';
import BackIcon from '../../assets/icons/arrow-left.svg?react';
import LogoutIcon from '../../assets/icons/logout.svg?react';
import ToolsIcon from '../../assets/icons/tools.svg?react';

interface SettingItemProps {
  Icon: React.FunctionComponent<SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  children: ReactNode;
  iconClassName?: string;
}

const SettingItem = ({
  Icon,
  title,
  description,
  children,
  iconClassName = 'w-6 h-6',
}: SettingItemProps) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b last:border-b-0 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 hover:duration-0 gap-4">
    <div className="flex items-start sm:items-center">
      <div className="p-2 rounded-lg mr-3 sm:mr-4 bg-gray-100 dark:bg-gray-700 shrink-0 mt-1 sm:mt-0">
        <Icon
          className={`${iconClassName} text-lumi-primary dark:text-lumi-label select-none`}
        />
      </div>
      <div>
        <h3 className="font-semibold text-gray-800 dark:text-white">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 sm:mt-0">
          {description}
        </p>
      </div>
    </div>
    <div className="w-full sm:w-auto flex justify-end">{children}</div>
  </div>
);

const SubPageHeader = ({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) => (
  <div className="flex items-center mb-4 select-none">
    <button
      onClick={onBack}
      className="p-2 mr-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 hover:scale-110 group"
    >
      <BackIcon className="w-5 h-5 text-lumi-primary dark:text-lumi-label" />
    </button>
    <h2 className="text-lg font-bold text-lumi-primary dark:text-lumi-label select-none">
      {title}
    </h2>
  </div>
);

export function ConfiguracoesPage() {
  const { theme, setTheme } = useContext(ThemeContext);
  const { user, logoutWithAnimation } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const isAdmin = user?.role === 'ADMIN';

  const [currentView, setCurrentView] = useState<'main' | 'import' | 'export'>(
    'main',
  );

  const [effectiveTheme, setEffectiveTheme] = useState(theme);

  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setEffectiveTheme(mediaQuery.matches ? 'dark' : 'light');
      const handler = (e: MediaQueryListEvent) =>
        setEffectiveTheme(e.matches ? 'dark' : 'light');
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      setEffectiveTheme(theme);
    }
  }, [theme]);

  const handleFeatureNotImplemented = () => {
    addToast({
      type: 'info',
      title: 'Em desenvolvimento',
      description: 'Esta funcionalidade estará disponível em breve.',
    });
  };

  const renderImportView = () => (
    <div className="p-6">
      <SubPageHeader title="Importar" onBack={() => setCurrentView('main')} />
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        <SettingItem
          Icon={UploadIcon}
          title="Alunos"
          description="Adicione um arquivo CSV ou XLSX com a relação de alunos"
        >
          <button
            onClick={handleFeatureNotImplemented}
            className="font-semibold dark:text-white py-2 px-4 rounded-lg shadow-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transform hover:scale-105 select-none w-full sm:w-auto"
          >
            Selecionar
          </button>
        </SettingItem>
        <SettingItem
          Icon={UploadIcon}
          title="Livros"
          description="Adicione um arquivo CSV ou XLSX com a relação de livros"
        >
          <button
            onClick={handleFeatureNotImplemented}
            className="font-semibold dark:text-white py-2 px-4 rounded-lg shadow-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transform hover:scale-105 select-none w-full sm:w-auto"
          >
            Selecionar
          </button>
        </SettingItem>
        <SettingItem
          Icon={UploadIcon}
          title="Exemplares"
          description="Adicione um arquivo CSV ou XLSX com a relação de exemplares dos livros"
        >
          <button
            onClick={handleFeatureNotImplemented}
            className="font-semibold dark:text-white py-2 px-4 rounded-lg shadow-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transform hover:scale-105 select-none w-full sm:w-auto"
          >
            Selecionar
          </button>
        </SettingItem>
      </div>
    </div>
  );

  const renderMainView = () => (
    <>
      {/* <div className="p-6">
        <h2 className="text-lg font-bold text-lumi-primary dark:text-lumi-label mb-4 select-none">
          Gerenciamento de Dados
        </h2>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
          <SettingItem
            Icon={UploadIcon}
            title="Importações"
            description="Trazer dados a partir de arquivos."
          >
            <button
              onClick={() => setCurrentView('import')}
              className="font-semibold dark:text-white py-2 px-4 rounded-lg shadow-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transform hover:scale-105 select-none w-full sm:w-[110px]"
            >
              Opções
            </button>
          </SettingItem>
        </div>
      </div> */}

      <div className="p-6 border-t border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-bold text-lumi-primary dark:text-lumi-label mb-4 select-none">
          Aparência
        </h2>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
          <SettingItem
            Icon={
              theme === 'system'
                ? AutoIcon
                : effectiveTheme === 'light'
                  ? SunIcon
                  : MoonIcon
            }
            iconClassName={
              effectiveTheme === 'dark' && theme !== 'system'
                ? 'w-6 h-5'
                : 'w-6 h-6'
            }
            title="Tema"
            description="Escolha sua preferência de tons na plataforma."
          >
            <div className="flex items-center space-x-1 sm:space-x-2 p-1 rounded-lg shadow-md bg-gray-200 dark:bg-gray-700 select-none w-full sm:w-auto justify-between sm:justify-start">
              <button
                onClick={() => setTheme('light')}
                className={`flex-1 sm:flex-none text-xs sm:text-sm p-2 rounded-md ${theme === 'light' ? 'bg-white shadow text-lumi-primary' : 'hover:bg-gray-600 text-gray-500 dark:text-gray-400'}`}
                title="Claro"
              >
                Claro
              </button>
              <button
                onClick={() => setTheme('system')}
                className={`flex-1 sm:flex-none text-xs sm:text-sm p-2 rounded-md ${theme === 'system' ? 'bg-lumi-primary shadow text-white' : 'hover:bg-gray-600 text-gray-500 dark:text-gray-400'}`}
                title="Automático"
              >
                Automático
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex-1 sm:flex-none text-xs sm:text-sm p-2 rounded-md ${theme === 'dark' ? 'bg-gray-800 shadow text-lumi-label' : 'hover:bg-gray-600 text-gray-500 dark:text-gray-400'}`}
                title="Escuro"
              >
                Escuro
              </button>
            </div>
          </SettingItem>
        </div>
      </div>

      <div className="p-6 border-t border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-bold text-lumi-primary dark:text-lumi-label mb-4 select-none">
          Aplicativo
        </h2>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
          <SettingItem
            Icon={UploadIcon}
            title="Android"
            description="Baixe a versão mais recente (APK) do aplicativo para alunos."
          >
            <a
              href="/lumilivre.apk"
              download="LumiLivre.apk"
              className="flex items-center justify-center font-semibold text-white py-2 px-4 rounded-lg shadow-md bg-green-600 hover:bg-green-700 transform hover:scale-105 select-none w-full sm:w-[110px]"
            >
              Baixar
            </a>
          </SettingItem>
          {/* TODO: Melhorar Opção Para Acessar Outro Site */}
          <SettingItem
            Icon={UploadIcon}
            title="iOS"
            description="Acesse a versão mais recente (site) da plataforma para alunos."
          >
            <a
              onClick={handleFeatureNotImplemented}
              className="flex items-center justify-center font-semibold text-white py-2 px-4 rounded-lg shadow-md bg-green-600 hover:bg-green-700 transform hover:scale-105 select-none w-full sm:w-[110px]"
            >
              Acessar
            </a>
          </SettingItem>
        </div>
      </div>

      <div className="p-6 border-t border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-bold text-lumi-primary dark:text-lumi-label mb-4 select-none">
          Conta
        </h2>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
          <SettingItem
            Icon={LockIcon}
            title="Mudar Senha"
            description="Altere sua senha de acesso."
          >
            <button
              onClick={() => navigate('/mudar-senha')}
              className="font-semibold dark:text-white py-2 px-4 rounded-lg shadow-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transform hover:scale-105 select-none w-full sm:w-[110px]"
            >
              Alterar
            </button>
          </SettingItem>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 shrink-0 select-none">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="p-2 bg-lumi-primary/10 dark:bg-lumi-primary/20 rounded-full shrink-0">
            <ToolsIcon className="w-8 h-8 text-lumi-primary dark:text-lumi-label" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
              {isAdmin ? 'Olá, Administrador!' : 'Olá, Bibliotecário!'}
            </h1>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
              Gerencie suas preferências do sistema.
            </p>
          </div>
        </div>

        <button
          onClick={logoutWithAnimation}
          className="flex items-center justify-center space-x-2 py-2 px-4 rounded-lg shadow-md bg-red-600 text-white hover:bg-red-700 transform hover:scale-105 w-full sm:w-auto sm:ml-auto"
        >
          <span className="font-bold">Sair da Conta</span>
          <LogoutIcon className="w-6 h-6 text-white" />
        </button>
      </div>

      <div className="bg-white dark:bg-dark-card rounded-lg shadow-md flex-grow overflow-y-auto border border-gray-100 dark:border-gray-700">
        {currentView === 'main' && renderMainView()}
        {currentView === 'import' && renderImportView()}
      </div>
    </div>
  );
}
