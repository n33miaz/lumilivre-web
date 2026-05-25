import {
  useContext,
  useEffect,
  useState,
  type ReactNode,
  type SVGProps,
} from 'react';
import { useTranslation } from 'react-i18next';

import { ThemeContext } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useLocale } from '../../contexts/LocaleContext';
import { ChangePasswordModal } from '../Auth/components/ChangePasswordModal';
import { LOCALES } from '../../i18n';

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
  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b last:border-b-0 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 hover:duration-0 gap-4 transition-colors duration-200">
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
      className="p-2 mr-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 hover:scale-110 group transition-transform duration-200"
    >
      <BackIcon className="w-5 h-5 text-lumi-primary dark:text-lumi-label" />
    </button>
    <h2 className="text-lg font-bold text-lumi-primary dark:text-lumi-label select-none">
      {title}
    </h2>
  </div>
);

/**
 * Componente ComingSoonBadge - Status visual para funcionalidades em desenvolvimento
 * 
 * Características:
 * - Badge animado com indicador de pulse
 * - Suporte completo a dark mode
 * - Estilização elegante com gradiente
 * - Acessível e semântico
 * 
 * @returns {JSX.Element} Badge do "Em breve"
 */
const ComingSoonBadge = () => {
  const { t } = useTranslation('common');
  return (
    <div className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 border border-amber-200 dark:border-amber-700/50 backdrop-blur-sm">
      <span className="inline-block w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse" />
      <span className="text-xs font-medium text-amber-700 dark:text-amber-300 whitespace-nowrap">
        {t('coming_soon')}
      </span>
    </div>
  );
};

/**
 * Componente ThemeButton - Botão individual de seleção de tema
 * 
 * Características:
 * - Estados visuais claramente diferenciados
 * - Transições suaves com feedback tátil
 * - Acessibilidade completa com aria-labels
 * - Responsive design (mobile e desktop)
 * 
 * @param {Object} props
 * @param {string} props.label - Texto do botão
 * @param {string} props.value - Valor do tema (light, dark, system)
 * @param {string} props.isSelected - Se o tema está selecionado
 * @param {Function} props.onClick - Callback ao clicar
 * @returns {JSX.Element} Botão de seleção de tema
 */
interface ThemeButtonProps {
  label: string;
  value: 'light' | 'dark' | 'system';
  isSelected: boolean;
  onClick: () => void;
}

const ThemeButton = ({ label, value, isSelected, onClick }: ThemeButtonProps) => (
  <button
    onClick={onClick}
    aria-label={`Selecionar tema ${label.toLowerCase()}`}
    aria-pressed={isSelected}
    className={`
      relative flex-1 sm:flex-none text-xs sm:text-sm px-3 py-2.5 rounded-md font-medium
      transition-all duration-300 ease-out
      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lumi-primary
      dark:focus:ring-offset-gray-700
      ${
        isSelected
          ? `
            shadow-lg scale-105 font-semibold
            ${
              value === 'light'
                ? 'bg-white text-lumi-primary dark:bg-white dark:text-lumi-primary'
                : value === 'system'
                  ? 'bg-lumi-primary text-white shadow-lg shadow-lumi-primary/30'
                  : 'bg-gray-800 dark:bg-gray-900 text-lumi-label shadow-lg shadow-gray-800/30 dark:shadow-gray-900/30'
            }
          `
          : `
            text-gray-600 dark:text-gray-400
            hover:text-gray-800 dark:hover:text-gray-200
            hover:bg-gray-50 dark:hover:bg-gray-600/20
          `
      }
    `}
    title={`Tema ${label}`}
  >
    {isSelected && (
      <span className="absolute inset-0 rounded-md bg-white/10 dark:bg-white/5 pointer-events-none" />
    )}
    <span className="relative">{label}</span>
  </button>
);

export function ConfiguracoesPage() {
  const { t } = useTranslation('settings');
  const { theme, setTheme } = useContext(ThemeContext);
  const { user, logoutWithAnimation } = useAuth();
  const { addToast } = useToast();
  const { locale, setLocale } = useLocale();

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

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
      title: t('in_development', { ns: 'common' }),
      description: t('feature_coming_soon', { ns: 'common' }),
    });
  };

  const renderImportView = () => (
    <div className="p-6">
      <SubPageHeader title={t('import.title')} onBack={() => setCurrentView('main')} />
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        <SettingItem
          Icon={UploadIcon}
          title={t('import.students.title')}
          description={t('import.students.description')}
        >
          <button
            onClick={handleFeatureNotImplemented}
            className="font-semibold dark:text-white py-2 px-4 rounded-lg shadow-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transform hover:scale-105 select-none w-full sm:w-auto transition-all duration-200"
          >
            {t('import.button.select')}
          </button>
        </SettingItem>
        <SettingItem
          Icon={UploadIcon}
          title={t('import.books.title')}
          description={t('import.books.description')}
        >
          <button
            onClick={handleFeatureNotImplemented}
            className="font-semibold dark:text-white py-2 px-4 rounded-lg shadow-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transform hover:scale-105 select-none w-full sm:w-auto transition-all duration-200"
          >
            {t('import.button.select')}
          </button>
        </SettingItem>
        <SettingItem
          Icon={UploadIcon}
          title={t('import.copies.title')}
          description={t('import.copies.description')}
        >
          <button
            onClick={handleFeatureNotImplemented}
            className="font-semibold dark:text-white py-2 px-4 rounded-lg shadow-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transform hover:scale-105 select-none w-full sm:w-auto transition-all duration-200"
          >
            {t('import.button.select')}
          </button>
        </SettingItem>
      </div>
    </div>
  );

  const renderMainView = () => (
    <>
      {/* Gerenciamento de Dados - Comentado até implementação futura */}
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
          {t('section.appearance')}
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
            title={t('theme.title')}
            description={t('theme.description')}
          >
            <div className="flex items-center gap-1.5 p-1.5 rounded-lg shadow-md bg-gray-100 dark:bg-gray-700 select-none w-full sm:w-auto justify-between sm:justify-start backdrop-blur-sm">
              <ThemeButton
                label={t('theme.light')}
                value="light"
                isSelected={theme === 'light'}
                onClick={() => setTheme('light')}
              />
              <ThemeButton
                label={t('theme.system')}
                value="system"
                isSelected={theme === 'system'}
                onClick={() => setTheme('system')}
              />
              <ThemeButton
                label={t('theme.dark')}
                value="dark"
                isSelected={theme === 'dark'}
                onClick={() => setTheme('dark')}
              />
            </div>
          </SettingItem>
        </div>
      </div>

      <div className="p-6 border-t border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-bold text-lumi-primary dark:text-lumi-label mb-4 select-none">
          {t('section.app')}
        </h2>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
          <SettingItem
            Icon={UploadIcon}
            title={t('app.android.title')}
            description={t('app.android.description')}
          >
            <a
              href="/lumilivre.apk"
              download="LumiLivre.apk"
              className="flex items-center justify-center font-semibold text-white py-2 px-4 rounded-lg shadow-md bg-green-600 hover:bg-green-700 transform hover:scale-105 select-none w-full sm:w-[110px] transition-all duration-200"
            >
              {t('app.android.button')}
            </a>
          </SettingItem>

          <SettingItem
            Icon={UploadIcon}
            title={t('app.ios.title')}
            description={t('app.ios.description')}
          >
            <ComingSoonBadge />
          </SettingItem>
        </div>
      </div>

      <div className="p-6 border-t border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-bold text-lumi-primary dark:text-lumi-label mb-4 select-none">
          {t('section.account')}
        </h2>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
          <SettingItem
            Icon={LockIcon}
            title={t('account.change_password.title')}
            description={t('account.change_password.description')}
          >
            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="font-semibold dark:text-white py-2 px-4 rounded-lg shadow-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transform hover:scale-105 select-none w-full sm:w-[110px] transition-all duration-200"
            >
              {t('account.change_password.button')}
            </button>
          </SettingItem>
        </div>
      </div>

      <div className="p-6 border-t border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-bold text-lumi-primary dark:text-lumi-label mb-4 select-none">
          {t('section.language')}
        </h2>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
          <SettingItem
            Icon={ToolsIcon}
            title={t('language.title')}
            description={t('language.description')}
          >
            <div className="flex items-center gap-2 flex-wrap">
              {LOCALES.map((item) => {
                const i18nKey = `language.${item.code.replace('-', '_').toLowerCase()}`;
                const fallbackLabel = item.label;
                return (
                  <button
                    key={item.code}
                    onClick={() => setLocale(item.code)}
                    className={`px-3 py-1.5 rounded text-sm font-semibold transition-all ${
                      locale === item.code
                        ? 'bg-lumi-primary text-white shadow'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {t(i18nKey, fallbackLabel)}
                  </button>
                );
              })}
            </div>
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
              {isAdmin ? t('page.title.admin') : t('page.title.librarian')}
            </h1>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
              {t('page.subtitle')}
            </p>
          </div>
        </div>

        <button
          onClick={logoutWithAnimation}
          className="flex items-center justify-center space-x-2 py-2 px-4 rounded-lg shadow-md bg-red-600 text-white hover:bg-red-700 transform hover:scale-105 w-full sm:w-auto sm:ml-auto transition-all duration-200"
        >
          <span className="font-bold">{t('button.logout')}</span>
          <LogoutIcon className="w-6 h-6 text-white" />
        </button>
      </div>

      <div className="bg-white dark:bg-dark-card rounded-lg shadow-md flex-grow overflow-y-auto border border-gray-100 dark:border-gray-700">
        {currentView === 'main' && renderMainView()}
        {currentView === 'import' && renderImportView()}
      </div>

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
}
