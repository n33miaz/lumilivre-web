import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { requestPasswordReset } from '../../../services/authService';
import { useToast } from '../../../contexts/ToastContext';
import { InputFloatingLabel } from '../../../components/ui/InputFloatingLabel';
import { AuthShell } from '../../../components/ui/AuthShell';
import { AuthSubmitButton } from '../../../components/ui/AuthSubmitButton';

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
    <AuthShell
      kicker={t('forgot_password.kicker')}
      title={t('forgot_password.title')}
      subtitle={t('forgot_password.description')}
      footer={
        <Link
          to="/login"
          className="rounded-control text-[15px] font-semibold text-paper-600 underline decoration-paper-400 decoration-1 underline-offset-4 transition-colors duration-200 hover:text-lumi-primary hover:decoration-lumi-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-lumi-400 dark:text-ink-400 dark:decoration-white/25 dark:hover:text-lumi-label"
        >
          {t('forgot_password.button.back')}
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <InputFloatingLabel
          id="email"
          type="email"
          label={t('forgot_password.field.email')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={UserIcon}
          required
        />

        <div className="pt-2">
          <AuthSubmitButton
            loading={isLoading}
            loadingLabel={t('forgot_password.button.submitting')}
          >
            {t('forgot_password.button.submit')}
          </AuthSubmitButton>
        </div>
      </form>
    </AuthShell>
  );
}
