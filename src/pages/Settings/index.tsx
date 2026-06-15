import { useContext, useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { ThemeContext } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { ChangePasswordModal } from '../Auth/components/ChangePasswordModal';

import UploadIcon from '../../assets/icons/download.svg?react';
import LockIcon from '../../assets/icons/lock.svg?react';
import SunIcon from '../../assets/icons/sun.svg?react';
import MoonIcon from '../../assets/icons/moon.svg?react';
import AutoIcon from '../../assets/icons/auto.svg?react';
import LogoutIcon from '../../assets/icons/logout.svg?react';
import ToolsIcon from '../../assets/icons/tools.svg?react';
import AlertIcon from '../../assets/icons/alert.svg?react';
import { LocaleSwitcher } from '../../components/ui/LocaleSwitcher';

type ThemeValue = 'light' | 'dark' | 'system';

interface SettingsRowProps {
  icon: ReactNode;
  title: string;
  description: string;
  action: ReactNode;
}

function SettingsRow({ icon, title, description, action }: SettingsRowProps) {
  return (
    <div className="rounded-2xl bg-white dark:bg-dark-card border border-gray-200/70 dark:border-white/5 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-lumi-50 dark:bg-white/5 text-lumi-primary dark:text-lumi-label flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-display font-bold text-gray-900 dark:text-white">
          {title}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-lumi-primary dark:text-lumi-label font-display font-bold text-lg mb-3">
      {children}
    </h2>
  );
}

interface ThemePickerProps {
  theme: ThemeValue;
  onChange: (next: ThemeValue) => void;
  labels: { light: string; system: string; dark: string };
}

function ThemePicker({ theme, onChange, labels }: ThemePickerProps) {
  const options: Array<{ value: ThemeValue; label: string }> = [
    { value: 'light', label: labels.light },
    { value: 'system', label: labels.system },
    { value: 'dark', label: labels.dark },
  ];

  return (
    <div className="inline-flex p-1 rounded-xl bg-gray-100 dark:bg-white/5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={theme === option.value}
          onClick={() => onChange(option.value)}
          className={`px-3 py-1.5 rounded-lg text-sm font-bold transition ${
            theme === option.value
              ? 'bg-white dark:bg-lumi-primary text-lumi-primary dark:text-white shadow-md'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

interface NotifSwitchProps {
  checked: boolean;
  onChange: () => void;
  ariaLabel: string;
}

function NotifSwitch({ checked, onChange, ariaLabel }: NotifSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={onChange}
      className={`switch ${checked ? 'on' : ''}`}
    />
  );
}

export function ConfiguracoesPage() {
  const { t } = useTranslation('settings');
  const { theme, setTheme } = useContext(ThemeContext);
  const { logoutWithAnimation } = useAuth();

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    () => localStorage.getItem('lumilivre.notifications.enabled') !== 'false',
  );

  const handleNotificationsChange = () => {
    setNotificationsEnabled((current) => {
      const next = !current;
      localStorage.setItem('lumilivre.notifications.enabled', String(next));
      return next;
    });
  };

  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => {};
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [theme]);

  return (
    <section className="space-y-5">
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-lumi-gradient flex items-center justify-center text-white shadow-glowSoft">
            <ToolsIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-3xl text-gray-900 dark:text-white">
              {t('page.title.librarian', { defaultValue: 'Olá, Bibliotecário!' })}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('page.subtitle', {
                defaultValue: 'Gerencie suas preferências do sistema.',
              })}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={logoutWithAnimation}
          className="h-10 px-4 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-bold inline-flex items-center gap-2 shadow-md"
        >
          <LogoutIcon className="w-4 h-4" />
          {t('button.logout', { defaultValue: 'SAIR DA CONTA' })}
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <SectionTitle>
            {t('section.appearance', { defaultValue: 'Aparência' })}
          </SectionTitle>
          <SettingsRow
            icon={
              theme === 'dark' ? (
                <MoonIcon className="w-6 h-6" />
              ) : theme === 'light' ? (
                <SunIcon className="w-6 h-6" />
              ) : (
                <AutoIcon className="w-6 h-6" />
              )
            }
            title={t('theme.title', { defaultValue: 'Tema' })}
            description={t('theme.description', {
              defaultValue:
                'Escolha sua preferência de tons na plataforma.',
            })}
            action={
              <ThemePicker
                theme={theme as ThemeValue}
                onChange={setTheme}
                labels={{
                  light: t('theme.light', { defaultValue: 'Claro' }),
                  system: t('theme.system', { defaultValue: 'Automático' }),
                  dark: t('theme.dark', { defaultValue: 'Escuro' }),
                }}
              />
            }
          />
        </div>

        <div>
          <SectionTitle>
            {t('section.app', { defaultValue: 'Aplicativo' })}
          </SectionTitle>
          <SettingsRow
            icon={<UploadIcon className="w-6 h-6" />}
            title={t('app.android.title', { defaultValue: 'Android' })}
            description={t('app.android.description', {
              defaultValue:
                'Baixe a versão mais recente (APK) do aplicativo para alunos.',
            })}
            action={
              <a
                href="/lumilivre.apk"
                download="LumiLivre.apk"
                className="h-9 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm inline-flex items-center gap-2"
              >
                {t('app.android.button', { defaultValue: 'Baixar' })}
              </a>
            }
          />
        </div>

        <div>
          <SectionTitle>
            {t('section.account', { defaultValue: 'Conta' })}
          </SectionTitle>
          <div className="space-y-2">
            <SettingsRow
              icon={<LockIcon className="w-6 h-6" />}
              title={t('account.change_password.title', {
                defaultValue: 'Mudar Senha',
              })}
              description={t('account.change_password.description', {
                defaultValue: 'Altere sua senha de acesso.',
              })}
              action={
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="h-9 px-4 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 font-bold text-sm text-gray-700 dark:text-gray-200"
                >
                  {t('account.change_password.button', {
                    defaultValue: 'Alterar',
                  })}
                </button>
              }
            />
            <SettingsRow
              icon={<ToolsIcon className="w-6 h-6" />}
              title={t('language.title', { defaultValue: 'Idioma' })}
              description={t('language.description', {
                defaultValue: 'Português (Brasil) · English (US)',
              })}
              action={
                <LocaleSwitcher />
              }
            />
            <SettingsRow
              icon={<AlertIcon className="w-6 h-6" />}
              title={t('notification.title', {
                defaultValue: 'Notificações por email',
              })}
              description={t('notification.description', {
                defaultValue:
                  'Receba resumos diários por email institucional.',
              })}
              action={
                <NotifSwitch
                  checked={notificationsEnabled}
                  onChange={handleNotificationsChange}
                  ariaLabel={t('notification.toggle_aria', {
                    defaultValue: 'Alternar notificações',
                  })}
                />
              }
            />
          </div>
        </div>
      </div>
    </section>
  );
}
