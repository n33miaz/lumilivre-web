import { useState } from 'react';
import { Modal } from './Modal';
import { InputFloatingLabel } from './InputFloatingLabel';
import { useToast } from '../contexts/ToastContext';
import api from '../services/api';
import LockIcon from '../assets/icons/lock.svg?react';
import { getErrorMessage } from '../utils/errorHandler';
import { Button } from './ui/Button';

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

      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
      onClose();
    } catch (error) {
      console.error(error);
      addToast({
        type: 'error',
        title: 'Erro',
        description: getErrorMessage(
          error,
          'Erro ao alterar senha. Verifique sua senha atual.',
        ),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-lg">
      <Modal.Header title="Alterar Senha" />

      <Modal.Body>
        <form
          id="change-password-form"
          onSubmit={handleSubmit}
          className="space-y-4"
        >
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
        </form>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="ghost" onClick={onClose} disabled={isLoading}>
          Cancelar
        </Button>
        <Button
          type="submit"
          form="change-password-form"
          isLoading={isLoading}
          loadingText="Salvando..."
        >
          Salvar
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
