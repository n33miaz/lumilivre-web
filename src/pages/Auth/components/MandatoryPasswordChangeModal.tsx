import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Modal } from '../../../components/ui/Modal';
import { InputFloatingLabel } from '../../../components/ui/InputFloatingLabel';
import { AuthSubmitButton } from '../../../components/ui/AuthSubmitButton';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { changePassword } from '../../../services/authService';

import LockIcon from '../../../assets/icons/lock.svg?react';
import { getErrorMessage } from '../../../utils/errorHandler';
import { MIN_PASSWORD_LENGTH } from '../../../utils/passwordPolicy';

/**
 * Portão da primeira senha.
 *
 * É a **primeira tela que todo aluno e toda bibliotecária veem por dentro do
 * sistema** — e era a mais descuidada das cinco: título genérico, uma tarja
 * amarela de aviso, três campos e um botão chapado. A tarja amarela é a
 * linguagem de erro; usá-la para receber alguém diz, no primeiro segundo, que
 * algo deu errado. Não deu: a conta está pronta.
 *
 * Agora é uma ficha como as outras quatro superfícies de acesso — mesma cota
 * `025.5`, mesmo filete, mesmo botão com a luz que segue o ponteiro — com uma
 * saudação, o motivo em uma linha e a exigência de tamanho dita ANTES de a
 * pessoa digitar, em vez de só depois, num toast de erro.
 *
 * Nada de comportamento mudou: mesmos três campos, mesma validação, mesmo
 * `preventClose`, mesma chamada de serviço. O `Modal.Header` saiu porque com
 * `preventClose` ele já não renderizava botão nenhum — só um título solto acima
 * do corpo, que agora vive dentro da ficha.
 */
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
    <Modal isOpen={true} onClose={() => {}} preventClose={true} maxWidth="max-w-xl">
      {/* `rounded-lg` acompanha o raio da caixa do `Modal`: o corpo é o único
          filho e cobre a caixa inteira, então sem isso o branco do contêiner
          apareceria nos quatro cantos. */}
      <Modal.Body className="ficha-plana rounded-lg px-6 pb-8 pt-7 sm:px-9">
        <div className="flex items-baseline justify-between gap-4 border-b border-paper-300 pb-3 dark:border-white/10">
          <span
            aria-hidden="true"
            className="cota text-sm text-lumi-600 dark:text-lumi-200"
          >
            025.5
          </span>
          <span className="cota truncate text-[10px] uppercase text-paper-500 dark:text-ink-400">
            {t('mandatory_change.kicker')}
          </span>
        </div>

        <h2 className="mt-6 font-display text-[1.75rem] font-extrabold leading-[1.15] tracking-[-0.025em] text-paper-900 dark:text-ink-100 sm:text-[2rem]">
          {t('mandatory_change.headline')}
        </h2>
        <p className="mt-2.5 max-w-[52ch] text-[15px] leading-relaxed text-paper-600 dark:text-ink-400">
          {t('mandatory_change.notice')}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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

          {/* A exigência de tamanho dita antes, e não num toast depois da
              tentativa. É texto: a validação continua sendo a mesma do envio. */}
          <p className="border-l-2 border-lumi-500 py-1 pl-3 font-mono text-[11px] leading-relaxed text-paper-600 dark:border-lumi-label dark:text-ink-400">
            {t('mandatory_change.hint', { min: MIN_PASSWORD_LENGTH })}
          </p>

          <InputFloatingLabel
            id="confirmarSenha"
            label={t('change_password.field.confirm')}
            type="password"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            icon={LockIcon}
            required
          />

          <div className="pt-3">
            <AuthSubmitButton
              loading={isLoading}
              loadingLabel={t('mandatory_change.button.submitting')}
            >
              {t('mandatory_change.button.submit')}
            </AuthSubmitButton>
          </div>
        </form>
      </Modal.Body>
    </Modal>
  );
}
