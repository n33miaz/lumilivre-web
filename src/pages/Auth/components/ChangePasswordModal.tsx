import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Modal } from '../../../components/ui/Modal';
import { InputFloatingLabel } from '../../../components/ui/InputFloatingLabel';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { changePassword } from '../../../services/authService';
import LockIcon from '../../../assets/icons/lock.svg?react';
import { getErrorMessage } from '../../../utils/errorHandler';
import { Button } from '../../../components/ui/Button';
import { MIN_PASSWORD_LENGTH } from '../../../utils/passwordPolicy';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({
  isOpen,
  onClose,
}: ChangePasswordModalProps) {
  const { t } = useTranslation('auth');
  const { addToast } = useToast();
  const { adoptRenewedToken } = useAuth();

  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (novaSenha.length < MIN_PASSWORD_LENGTH) {
      addToast({
        type: 'warning',
        title: t('change_password.toast.too_short.title'),
        description: t('change_password.toast.too_short.description', {
          min: MIN_PASSWORD_LENGTH,
        }),
      });
      return;
    }

    if (novaSenha !== confirmarSenha) {
      addToast({
        type: 'warning',
        title: t('change_password.toast.mismatch.title'),
        description: t('change_password.toast.mismatch.description'),
      });
      return;
    }

    setIsLoading(true);

    try {
      // Sem adotar o token devolvido, a próxima requisição do painel usaria o
      // JWT que a própria troca acabou de revogar — e o usuário seria deslogado
      // logo depois de trocar a senha com sucesso.
      const renewedToken = await changePassword('', senhaAtual, novaSenha);
      if (renewedToken) {
        adoptRenewedToken(renewedToken);
      }

      addToast({
        type: 'success',
        title: t('change_password.toast.success.title'),
        description: t('change_password.toast.success.description'),
      });

      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
      onClose();
    } catch (error) {
      console.error(error);
      addToast({
        type: 'error',
        title: t('change_password.toast.error.title'),
        description: getErrorMessage(
          error,
          t('change_password.toast.error.description'),
        ),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-lg">
      <Modal.Header title={t('change_password.modal.title')} />

      <Modal.Body>
        {/* Mesma cota das outras quatro superfícies de acesso. O `Modal.Header`
            fica porque é ele que carrega o botão de fechar — a faixa de cota
            entra como primeira linha do corpo e costura o modal à família. */}
        <div className="mb-8 flex items-baseline justify-between gap-4 border-b-2 border-paper-900 pb-3 dark:border-ink-100/80">
          <span
            aria-hidden="true"
            className="cota text-sm text-lumi-600 dark:text-lumi-200"
          >
            025.5
          </span>
          <span className="cota truncate text-[10px] uppercase text-paper-500 dark:text-ink-400">
            {t('change_password.kicker')}
          </span>
        </div>

        <form
          id="change-password-form"
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <InputFloatingLabel
            id="senhaAtual"
            label={t('change_password.field.current')}
            type="password"
            value={senhaAtual}
            onChange={(e) => setSenhaAtual(e.target.value)}
            icon={LockIcon}
            required
          />
          <InputFloatingLabel
            id="novaSenha"
            label={t('change_password.field.new')}
            type="password"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            icon={LockIcon}
            required
          />
          <InputFloatingLabel
            id="confirmarSenha"
            label={t('change_password.field.confirm')}
            type="password"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            icon={LockIcon}
            required
          />
        </form>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="ghost" onClick={onClose} disabled={isLoading}>
          {t('common:cancel')}
        </Button>
        <Button
          type="submit"
          form="change-password-form"
          isLoading={isLoading}
          loadingText={t('change_password.button.loading')}
        >
          {t('common:save')}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
