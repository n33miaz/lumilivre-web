import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import {
  validarTokenReset,
  mudarSenhaComToken,
} from '../../../services/authService';
import { useToast } from '../../../contexts/ToastContext';
import { InputFloatingLabel } from '../../../components/ui/InputFloatingLabel';
import { AuthShell } from '../../../components/ui/AuthShell';
import { AuthSubmitButton } from '../../../components/ui/AuthSubmitButton';

import LockIcon from '../../../assets/icons/lock.svg?react';
import { getErrorMessage } from '../../../utils/errorHandler';
import { MIN_PASSWORD_LENGTH } from '../../../utils/passwordPolicy';

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

    if (novaSenha.length < MIN_PASSWORD_LENGTH) {
      addToast({
        type: 'warning',
        title: t('reset_password.toast.too_short.title'),
        description: t('reset_password.toast.too_short.description', {
          min: MIN_PASSWORD_LENGTH,
        }),
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
        <div className="py-6 text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-lumi-primary border-t-transparent" />
          <p className="text-paper-600 dark:text-ink-400">
            {t('reset_password.loading')}
          </p>
        </div>
      );
    }

    if (!isTokenValid) {
      return (
        <div>
          {/* Aviso pautado, não caixa vermelha arredondada: o filete lateral
              basta para marcar erro e o bloco continua sendo papel. */}
          <div className="mb-6 border-l-2 border-red-600 bg-red-50/70 py-3 pl-4 pr-3 text-sm leading-relaxed text-red-800 dark:border-red-400 dark:bg-red-500/10 dark:text-red-200">
            {errorToken}
          </div>
          <Link
            to="/forgot-password"
            className="rounded-[2px] font-semibold text-lumi-primary underline decoration-lumi-500/40 decoration-1 underline-offset-4 transition-colors hover:decoration-lumi-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-lumi-400 dark:text-lumi-label dark:decoration-lumi-label/40"
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
          <AuthSubmitButton
            loading={isSubmitting}
            loadingLabel={t('reset_password.button.submitting')}
          >
            {t('reset_password.button.submit')}
          </AuthSubmitButton>
        </div>
      </form>
    );
  };

  return (
    <AuthShell
      kicker={t('reset_password.kicker')}
      title={t('reset_password.title')}
      subtitle={
        !isLoadingToken && isTokenValid
          ? t('reset_password.description')
          : undefined
      }
      footer={
        !isLoadingToken && isTokenValid ? (
          <Link
            to="/login"
            className="rounded-[2px] text-[15px] font-semibold text-paper-600 underline decoration-paper-400 decoration-1 underline-offset-4 transition-colors hover:text-lumi-primary hover:decoration-lumi-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-lumi-400 dark:text-ink-400 dark:decoration-white/25 dark:hover:text-lumi-label"
          >
            {t('reset_password.link.cancel')}
          </Link>
        ) : undefined
      }
    >
      {renderContent()}
    </AuthShell>
  );
}
