import { useState } from 'react';
import { Modal } from './Modal';
import { InputFloatingLabel } from './InputFloatingLabel';
import { useToast } from '../contexts/ToastContext';
import api from '../services/api';
import LockIcon from '../assets/icons/lock.svg?react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({
  isOpen,
  onClose,
}: ChangePasswordModalProps) {
  const { addToast } = useToast();

  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

      // Limpa os campos e fecha o modal
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
      onClose();
    } catch (error: any) {
      console.error(error);
      const msg =
        error.response?.data?.mensagem ||
        'Erro ao alterar senha. Verifique sua senha atual.';
      addToast({ type: 'error', title: 'Erro', description: msg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Alterar Senha"
      maxWidth="max-w-lg"
    >
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

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="bg-lumi-primary hover:bg-lumi-primary-hover text-white font-bold py-2 px-6 rounded-lg shadow-md disabled:opacity-70 flex items-center gap-2"
          >
            {isLoading && (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {isLoading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
