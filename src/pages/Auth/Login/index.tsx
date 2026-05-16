import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { ThemeToggle } from '../../../layouts/components/ThemeToggle';
import { LocaleSwitcher } from '../../../components/ui/LocaleSwitcher';
import { InputFloatingLabel } from '../../../components/ui/InputFloatingLabel';
import { login as apiLogin } from '../../../services/authService';

import LogoIcon from '../../../assets/icons/logo.svg?react';
import UserIcon from '../../../assets/icons/users.svg?react';
import LockIcon from '../../../assets/icons/lock.svg?react';
import DownloadIcon from '../../../assets/icons/upload.svg?react';
import { getErrorMessage } from '../../../utils/errorHandler';
import { getDefaultRouteForRole } from '../../../utils/roleCapabilities';

export function LoginPage() {
  const { t } = useTranslation('auth');
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const navigate = useNavigate();
  const { login: setAuthUser } = useAuth();
  const { addToast } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const responseData = await apiLogin({ user: usuario, senha: senha });

      const userToStore = {
        id: responseData.id,
        email: responseData.email,
        role: responseData.role,
        token: responseData.token,
        isInitialPassword: responseData.isInitialPassword,
      };

      setAuthUser(userToStore);

      addToast({
        type: 'success',
        title: t('login.toast.success.title'),
        description: t('login.toast.success.description'),
        duration: 3000,
      });

      setIsExiting(true);

      setTimeout(() => {
        navigate(getDefaultRouteForRole(userToStore.role));
      }, 500);
    } catch (err) {
      console.error('Erro no login:', err);

      addToast({
        type: 'error',
        title: t('login.toast.error.title'),
        description: getErrorMessage(err, t('login.toast.error.description')),
      });

      setIsLoading(false);
    }
  };

  return (
    <main
      className={`
        bg-gray-50 dark:bg-dark-background min-h-screen flex items-center justify-center p-6 relative select-none overflow-hidden
        ${isExiting ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}
      `}
    >
      <div className="w-full max-w-sm mx-auto flex flex-col justify-center">
        <div className="text-center mb-5">
          <LogoIcon className="h-[200px] w-auto mx-auto pointer-events-none -mb-1 text-lumi-primary" />
          <h1 className="text-[32px] font-bold text-gray-800 dark:text-gray-100">
            LumiLivre
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <InputFloatingLabel
            id="usuario"
            type="text"
            label={t('login.field.user')}
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            icon={UserIcon}
            disabled={isExiting}
            required
          />

          <InputFloatingLabel
            id="senha"
            type="password"
            label={t('login.field.password')}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            icon={LockIcon}
            disabled={isExiting}
            required
          />

          <div className="space-y-3 pt-2">
            <button
              type="submit"
              disabled={isLoading || isExiting}
              className="w-full bg-lumi-primary hover:bg-lumi-primary-hover active:bg-purple-900 text-white text-[17px] font-bold py-3.5 px-4 border-2 border-transparent rounded-lg shadow-md transform hover:scale-[1.02] active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lumi-primary disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none tracking-wide"
            >
              {isLoading || isExiting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('login.button.submitting')}
                </span>
              ) : (
                t('login.button.submit')
              )}
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
          <Link
            to="/forgot-password"
            className="text-gray-500 dark:text-gray-400 hover:text-lumi-primary dark:hover:text-lumi-label text-sm font-medium"
          >
            {t('login.link.forgot_password')}
          </Link>
        </div>

        <div className="pt-4 mt-3 border-t border-gray-200 dark:border-gray-700">
          <a
            href="/lumilivre.apk"
            download="LumiLivre.apk"
            className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-4 px-4 rounded-lg shadow-md transform active:scale-95"
          >
            <DownloadIcon className="w-5 h-5" />
            {t('login.download_app')}
          </a>
        </div>
      </div>

      <div className="absolute bottom-6 left-6 flex items-center gap-2">
        <ThemeToggle />
        <LocaleSwitcher />
      </div>
    </main>
  );
}
