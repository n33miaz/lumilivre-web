import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { requestPasswordReset } from '../../../services/authService';
import { useToast } from '../../../contexts/ToastContext';
import { InputFloatingLabel } from '../../../components/ui/InputFloatingLabel';
import { ThemeToggle } from '../../../layouts/components/ThemeToggle';

import LogoIcon from '../../../assets/icons/logo.svg?react';
import UserIcon from '../../../assets/icons/users.svg?react';
import { getErrorMessage } from '../../../utils/errorHandler';

export function EsqueciSenhaPage() {
  const { t } = useTranslation('auth');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { addToast } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    if (!email.includes('@')) {
      addToast({
        type: 'warning',
        title: t('forgot_password.toast.invalid_email.title'),
        description: t('forgot_password.toast.invalid_email.description'),
      });
      setIsLoading(false);
      return;
    }

    try {
      const data = await requestPasswordReset(email);
      addToast({
        type: 'success',
        title: t('forgot_password.toast.success.title'),
        description: data.mensagem || t('forgot_password.toast.success.default'),
        duration: 5000,
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: t('forgot_password.toast.error.title'),
        description: getErrorMessage(err, t('forgot_password.toast.error.description')),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="bg-gray-50 dark:bg-dark-background min-h-screen flex items-center justify-center p-6 relative select-none overflow-hidden">
      <div className="w-full max-w-sm mx-auto flex flex-col justify-center">
        <div className="text-center mb-5">
          <LogoIcon className="h-[200px] w-auto mx-auto pointer-events-none -mb-1 text-lumi-primary" />
          <h1 className="text-[32px] font-bold text-gray-800 dark:text-gray-100">
            {t('forgot_password.title')}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <InputFloatingLabel
            id="email"
            type="email"
            label={t('forgot_password.field.email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={UserIcon}
            required
          />

          <div className="space-y-3 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-lumi-primary hover:bg-lumi-primary-hover active:bg-purple-900 text-white text-[17px] font-bold py-3.5 px-4 border-2 border-transparent rounded-lg shadow-md transform hover:scale-[1.02] active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lumi-primary disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none tracking-wide"
            >
              {isLoading ? t('forgot_password.button.submitting') : t('forgot_password.button.submit')}
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
          <Link
            to="/login"
            className="text-gray-500 dark:text-gray-400 hover:text-lumi-primary dark:hover:text-lumi-label text-sm font-medium"
          >
            {t('forgot_password.button.back')}
          </Link>
        </div>
      </div>

      <div className="absolute bottom-6 left-6">
        <ThemeToggle />
      </div>
    </main>
  );
}
