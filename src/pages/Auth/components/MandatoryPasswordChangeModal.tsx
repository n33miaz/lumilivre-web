import { useState } from 'react';

import { Modal } from '../../../components/ui/Modal';
import { InputFloatingLabel } from '../../../components/ui/InputFloatingLabel';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import api from '../../../services/api';

import LockIcon from '../assets/icons/lock.svg?react';
import { getErrorMessage } from '../../../utils/errorHandler';

export function MandatoryPasswordChangeModal() {
  const { user, completePasswordChange } = useAuth();
  const { addToast } = useToast();

  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!user?.isInitialPassword) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (novaSenha.length < 6) {
      addToast({
        type: 'warning',
        title: 'Senha curta',
        description: 'A nova senha deve ter no mínimo 6 caracteres.',
      });
      return;
    }

    if (novaSenha !== confirmarSenha) {
      addToast({
        type: 'warning',
        title: 'Erro',
        description: 'As novas senhas não conferem.',
      });
      return;
    }

    setIsLoading(true);

    try {
      await api.put('/usuarios/alterar-senha', {
        matricula: '',
        senhaAtual: senhaAtual,
        novaSenha: novaSenha,
      });

      addToast({
        type: 'success',
        title: 'Sucesso',
        description: 'Senha alterada com sucesso!',
      });
      completePasswordChange();
    } catch (error) {
      console.error(error);
      addToast({
        type: 'error',
        title: 'Erro',
        description: getErrorMessage(error, 'Erro ao alterar senha.'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={() => {}} preventClose={true}>
      <Modal.Header title="Alteração de Primeira Senha" />
      <Modal.Body>
        <div className="space-y-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800 mb-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Por motivos de segurança, você deve alterar sua senha inicial
              antes de continuar utilizando o sistema.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <InputFloatingLabel
              id="senhaAtual"
              label="Senha Atual"
              type="password"
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
              icon={LockIcon}
              required
            />

            <InputFloatingLabel
              id="novaSenha"
              label="Nova Senha"
              type="password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              icon={LockIcon}
              required
            />

            <InputFloatingLabel
              id="confirmarSenha"
              label="Confirmar Nova Senha"
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
                {isLoading ? 'SALVANDO...' : 'SALVAR'}
              </button>
            </div>
          </form>
        </div>
      </Modal.Body>
    </Modal>
  );
}
