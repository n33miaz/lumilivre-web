import { useContext, useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';

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
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { useToast } from '../../contexts/ToastContext';
import { useLibraryConfig } from '../../contexts/LibraryConfigContext';
import {
  updateSettings,
  type LibraryType,
} from '../../services/settingsService';
import { AppVersionTab } from '../../features/admin/AppVersionTab';
import { AuditTab } from '../../features/admin/AuditTab';
import { UsersTab } from '../../features/users/UsersTab';

type ThemeValue = 'light' | 'dark' | 'system';
type AdminTab = 'geral' | 'version' | 'audit' | 'users';

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
  disabled?: boolean;
}

function NotifSwitch({ checked, onChange, ariaLabel, disabled }: NotifSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onChange}
      className={`switch ${checked ? 'on' : ''} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
    />
  );
}

export function ConfiguracoesPage() {
  const { t } = useTranslation(['settings', 'admin']);
  const { theme, setTheme } = useContext(ThemeContext);
  const { user, logoutWithAnimation } = useAuth();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const {
    libraryType,
    readerCanEditAvatar,
    isLoading: isConfigLoading,
  } = useLibraryConfig();
  const isAdmin = user?.role === 'ADMIN';

  const [activeTab, setActiveTab] = useState<AdminTab>('geral');
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [pendingLibraryType, setPendingLibraryType] =
    useState<LibraryType | null>(null);
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

  const updateLibraryTypeMutation = useMutation({
    mutationFn: (next: LibraryType) => updateSettings(next),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-settings'] });
      addToast({
        type: 'success',
        title: t('library.type.success.title'),
        description: t('library.type.success.description'),
      });
    },
    onError: () => {
      addToast({
        type: 'error',
        title: t('library.type.error.title'),
        description: t('library.type.error.description'),
      });
    },
  });

  const updateAvatarMutation = useMutation({
    mutationFn: (next: boolean) => updateSettings(libraryType, next),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-settings'] });
      addToast({
        type: 'success',
        title: t('reader_avatar.success.title'),
        description: t('reader_avatar.success.description'),
      });
    },
    onError: () => {
      addToast({
        type: 'error',
        title: t('reader_avatar.error.title'),
        description: t('reader_avatar.error.description'),
      });
    },
  });

  const handleLibraryTypeChange = (next: LibraryType) => {
    if (next !== libraryType) {
      setPendingLibraryType(next);
    }
  };

  const confirmLibraryTypeChange = () => {
    if (pendingLibraryType) {
      updateLibraryTypeMutation.mutate(pendingLibraryType);
    }
  };

  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => {};
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [theme]);

  const adminTabs: Array<{ id: AdminTab; label: string }> = [
    { id: 'geral', label: t('admin:tab.general') },
    { id: 'version', label: t('admin:tab.version') },
    { id: 'audit', label: t('admin:tab.audit') },
    { id: 'users', label: t('admin:tab.users') },
  ];

  const generalContent = (
    <div className="space-y-6">
      {isAdmin && (
        <div>
          <SectionTitle>{t('section.library')}</SectionTitle>
          <div className="space-y-2">
            <SettingsRow
              icon={<ToolsIcon className="w-6 h-6" />}
              title={t('library.type.title')}
              description={t('library.type.description')}
              action={
                <div className="inline-flex p-1 rounded-xl bg-gray-100 dark:bg-white/5">
                  {(
                    [
                      ['SCHOOL', t('library.type.school')],
                      ['STANDARD', t('library.type.standard')],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      disabled={updateLibraryTypeMutation.isPending}
                      aria-pressed={libraryType === value}
                      onClick={() => handleLibraryTypeChange(value)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-bold transition ${
                        libraryType === value
                          ? 'bg-white dark:bg-lumi-primary text-lumi-primary dark:text-white shadow-md'
                          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              }
            />
            <SettingsRow
              icon={<UploadIcon className="w-6 h-6" />}
              title={t('reader_avatar.title')}
              description={t('reader_avatar.description')}
              action={
                <NotifSwitch
                  checked={readerCanEditAvatar}
                  // Sem o config carregado, o PUT usaria o libraryType default
                  // (SCHOOL) e poderia flipar o tipo de uma biblioteca STANDARD.
                  disabled={updateAvatarMutation.isPending || isConfigLoading}
                  onChange={() =>
                    updateAvatarMutation.mutate(!readerCanEditAvatar)
                  }
                  ariaLabel={t('reader_avatar.toggle_aria')}
                />
              }
            />
          </div>
        </div>
      )}

      <div>
        <SectionTitle>{t('section.appearance')}</SectionTitle>
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
          title={t('theme.title')}
          description={t('theme.description')}
          action={
            <ThemePicker
              theme={theme as ThemeValue}
              onChange={setTheme}
              labels={{
                light: t('theme.light'),
                system: t('theme.system'),
                dark: t('theme.dark'),
              }}
            />
          }
        />
      </div>

      <div>
        <SectionTitle>{t('section.app')}</SectionTitle>
        <SettingsRow
          icon={<UploadIcon className="w-6 h-6" />}
          title={t('app.android.title')}
          description={t('app.android.description')}
          action={
            <a
              href="/lumilivre.apk"
              download="LumiLivre.apk"
              className="h-9 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm inline-flex items-center gap-2"
            >
              {t('app.android.button')}
            </a>
          }
        />
      </div>

      <div>
        <SectionTitle>{t('section.account')}</SectionTitle>
        <div className="space-y-2">
          <SettingsRow
            icon={<LockIcon className="w-6 h-6" />}
            title={t('account.change_password.title')}
            description={t('account.change_password.description')}
            action={
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(true)}
                className="h-9 px-4 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 font-bold text-sm text-gray-700 dark:text-gray-200"
              >
                {t('account.change_password.button')}
              </button>
            }
          />
          <SettingsRow
            icon={<ToolsIcon className="w-6 h-6" />}
            title={t('language.title')}
            description={t('language.description')}
            action={<LocaleSwitcher />}
          />
          <SettingsRow
            icon={<AlertIcon className="w-6 h-6" />}
            title={t('notification.title')}
            description={t('notification.description')}
            action={
              <NotifSwitch
                checked={notificationsEnabled}
                onChange={handleNotificationsChange}
                ariaLabel={t('notification.toggle_aria')}
              />
            }
          />
        </div>
      </div>
    </div>
  );

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-5">
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />

      <ConfirmModal
        isOpen={pendingLibraryType !== null}
        title={t('library.type.confirm.title')}
        message={
          pendingLibraryType === 'STANDARD'
            ? t('library.type.confirm.to_standard')
            : t('library.type.confirm.to_school')
        }
        confirmText={t('library.type.confirm.confirm')}
        cancelText={t('library.type.confirm.cancel')}
        onConfirm={confirmLibraryTypeChange}
        onCancel={() => setPendingLibraryType(null)}
      />

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-lumi-gradient flex items-center justify-center text-white shadow-glowSoft">
            <ToolsIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-3xl text-gray-900 dark:text-white">
              {isAdmin
                ? t('page.title.admin')
                : t('page.title.librarian')}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('page.subtitle')}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={logoutWithAnimation}
          className="h-10 px-4 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-bold inline-flex items-center gap-2 shadow-md"
        >
          <LogoutIcon className="w-4 h-4" />
          {t('button.logout')}
        </button>
      </div>

      {isAdmin && (
        <div
          className="flex flex-wrap gap-1 rounded-xl bg-gray-100 dark:bg-white/5 p-1 w-fit shrink-0"
          role="tablist"
          aria-label={t('admin:tabs_aria')}
        >
          {adminTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 h-9 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-lumi-primary text-lumi-primary dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200/70 dark:hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 min-h-0 flex flex-col">
        {!isAdmin || activeTab === 'geral' ? (
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1">
            {generalContent}
          </div>
        ) : activeTab === 'version' ? (
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1">
            <AppVersionTab />
          </div>
        ) : activeTab === 'audit' ? (
          <AuditTab />
        ) : (
          <UsersTab />
        )}
      </div>
    </section>
  );
}
