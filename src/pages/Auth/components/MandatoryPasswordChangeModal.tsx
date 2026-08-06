import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Modal } from '../../../components/ui/Modal';
import { InputFloatingLabel } from '../../../components/ui/InputFloatingLabel';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { changePassword } from '../../../services/authService';

import LockIcon from '../../../assets/icons/lock.svg?react';
import { getErrorMessage } from '../../../utils/errorHandler';
import { MIN_PASSWORD_LENGTH } from '../../../utils/passwordPolicy';

export function MandatoryPasswordChangeModal() {
  const { t } = useTranslation('auth');
  const { user, completePasswordChange } = useAuth();
  const { addToast } = useToast();

  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!user?.isInitialPassword) return null;

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
      // A troca revoga o token que fez a requisição; o devolvido aqui é o que
      // mantém o usuário dentro do painel logo depois de fechar este modal —
      // que é obrigatório e vale para todo leitor e bibliotecário novo.
      const renewedToken = await changePassword('', senhaAtual, novaSenha);

      addToast({
        type: 'success',
        title: t('change_password.toast.success.title'),
        description: t('change_password.toast.success.description'),
      });
      completePasswordChange(renewedToken);
    } catch (error) {
      console.error(error);
      addToast({
        type: 'error',
        title: t('change_password.toast.error.title'),
        description: getErrorMessage(
          error,
          t('mandatory_change.toast.error.description'),
        ),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={() => {}} preventClose={true}>
      <Modal.Header title={t('mandatory_change.modal.title')} />
      <Modal.Body>
        <div className="space-y-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800 mb-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              {t('mandatory_change.notice')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-lumi-primary hover:bg-lumi-primary-hover text-white font-bold py-3 px-4 rounded-lg shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading && (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {isLoading
                  ? t('mandatory_change.button.submitting')
                  : t('mandatory_change.button.submit')}
              </button>
            </div>
          </form>
        </div>
      </Modal.Body>
    </Modal>
  );
}
