import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import {
  validarTokenReset,
  mudarSenhaComToken,
} from '../../../services/authService';
import { useToast } from '../../../contexts/ToastContext';
import { InputFloatingLabel } from '../../../components/ui/InputFloatingLabel';
import { ThemeToggle } from '../../../layouts/components/ThemeToggle';

import LogoIcon from '../../../assets/icons/logo.svg?react';
import LockIcon from '../../../assets/icons/lock.svg?react';
import { getErrorMessage } from '../../../utils/errorHandler';

export function MudarSenhaPage() {
  const { t } = useTranslation('auth');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [token, setToken] = useState<string | null>(null);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [isLoadingToken, setIsLoadingToken] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [errorToken, setErrorToken] = useState<string | null>(null);

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (!tokenFromUrl) {
      setErrorToken(t('reset_password.error.token_not_found'));
      setIsLoadingToken(false);
      return;
    }
    setToken(tokenFromUrl);

    const verificarToken = async () => {
      try {
        const isValid = await validarTokenReset(tokenFromUrl);
        if (isValid) {
          setIsTokenValid(true);
        } else {
          setErrorToken(t('reset_password.error.invalid_link'));
        }
      } catch {
        setErrorToken(t('reset_password.error.validate_failed'));
      } finally {
        setIsLoadingToken(false);
      }
    };
    verificarToken();
  }, [searchParams, t]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (novaSenha.length < 6) {
      addToast({
        type: 'warning',
        title: t('reset_password.toast.too_short.title'),
        description: t('reset_password.toast.too_short.description'),
      });
      return;
    }
    if (novaSenha !== confirmarSenha) {
      addToast({
        type: 'warning',
        title: t('reset_password.toast.mismatch.title'),
        description: t('reset_password.toast.mismatch.description'),
      });
      return;
    }
    if (!token) {
      addToast({
        type: 'error',
        title: t('reset_password.toast.invalid_token.title'),
        description: t('reset_password.toast.invalid_token.description'),
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await mudarSenhaComToken(token, novaSenha);

      addToast({
        type: 'success',
        title: t('reset_password.toast.success.title'),
        description: t('reset_password.toast.success.description'),
      });

      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      addToast({
        type: 'error',
        title: t('reset_password.toast.error.title'),
        description: getErrorMessage(err, t('reset_password.toast.error.description')),
      });
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    if (isLoadingToken) {
      return (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-lumi-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">
            {t('reset_password.loading')}
          </p>
        </div>
      );
    }

    if (!isTokenValid) {
      return (
        <div className="text-center">
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-md text-sm mb-6">
            {errorToken}
          </div>
          <Link
            to="/forgot-password"
            className="text-lumi-primary hover:underline font-bold"
          >
            {t('reset_password.link.request_new')}
          </Link>
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputFloatingLabel
          id="novaSenha"
          type="password"
          label={t('reset_password.field.new_password')}
          value={novaSenha}
          onChange={(e) => setNovaSenha(e.target.value)}
          icon={LockIcon}
          required
        />

        <InputFloatingLabel
          id="confirmarSenha"
          type="password"
          label={t('reset_password.field.confirm_password')}
          value={confirmarSenha}
          onChange={(e) => setConfirmarSenha(e.target.value)}
          icon={LockIcon}
          required
        />

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-lumi-primary hover:bg-lumi-primary-hover active:bg-purple-900 text-white text-[17px] font-bold py-3.5 px-4 border-2 border-transparent rounded-lg shadow-md transform hover:scale-[1.02] active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lumi-primary disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none tracking-wide"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t('reset_password.button.submitting')}
              </span>
            ) : (
              t('reset_password.button.submit')
            )}
          </button>
        </div>
      </form>
    );
  };

  return (
    <main className="bg-gray-50 dark:bg-dark-background min-h-screen flex items-center justify-center p-6 relative select-none overflow-hidden">
      <div className="w-full max-w-sm mx-auto flex flex-col justify-center">
        <div className="text-center mb-5">
          <LogoIcon className="h-[200px] w-auto mx-auto pointer-events-none -mb-1 text-lumi-primary" />
          <h1 className="text-[32px] font-bold text-gray-800 dark:text-gray-100">
            {t('reset_password.title')}
          </h1>
        </div>

        {renderContent()}

        {!isLoadingToken && isTokenValid && (
          <div className="text-center mt-4">
            <Link
              to="/login"
              className="text-gray-500 dark:text-gray-400 hover:text-lumi-primary dark:hover:text-lumi-label text-sm font-medium"
            >
              {t('reset_password.link.cancel')}
            </Link>
          </div>
        )}
      </div>

      <div className="absolute bottom-6 left-6">
        <ThemeToggle />
      </div>
    </main>
  );
}
