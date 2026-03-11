import { useState, useEffect } from 'react';
import { Modal } from '../Modal';
import { ConfirmModal } from '../ConfirmModal';
import { useToast } from '../../contexts/ToastContext';
import { type ListaLivro } from '../../services/livroService';
import { Label } from '../ui/Label';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import {
  useUpdateExemplar,
  useDeleteExemplar,
} from '../../hooks/mutations/useExemplarMutations';

interface ModalExemplarDetailsProps {
  exemplar: ListaLivro | null;
  livroId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ModalExemplarDetails({
  exemplar,
  livroId,
  isOpen,
  onClose,
}: ModalExemplarDetailsProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [tombo, setTombo] = useState('');
  const [localizacao, setLocalizacao] = useState('');
  const [confirmAction, setConfirmAction] = useState<'excluir' | null>(null);

  const { addToast } = useToast();

  const { mutate: updateExemplar, isPending: isUpdating } = useUpdateExemplar();
  const { mutate: deleteExemplar, isPending: isDeleting } = useDeleteExemplar();

  useEffect(() => {
    if (exemplar && isOpen) {
      setTombo(exemplar.tomboExemplar);
      setLocalizacao(exemplar.localizacao_fisica);
      setIsEditMode(false);
    }
  }, [exemplar, isOpen]);

  if (!isOpen || !exemplar) return null;

  const handleClose = () => {
    setIsEditMode(false);
    onClose();
  };

  const handleSalvar = () => {
    if (!tombo.trim() || !localizacao.trim()) {
      addToast({
        type: 'warning',
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos.',
      });
      return;
    }

    if (!livroId) return;

    updateExemplar(
      {
        tomboAtual: exemplar.tomboExemplar,
        payload: {
          tombo,
          localizacao_fisica: localizacao,
          livro_id: livroId,
          status_livro: exemplar.status,
        },
      },
      { onSuccess: () => handleClose() },
    );
  };

  const executarExclusao = () => {
    if (!livroId) return;
    deleteExemplar(
      { tombo: exemplar.tomboExemplar, livroId },
      {
        onSuccess: () => {
          setConfirmAction(null);
          handleClose();
        },
      },
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <Modal.Header
        title={isEditMode ? 'Editar Exemplar' : 'Detalhes do Exemplar'}
      />

      <Modal.Body>
        {exemplar.status !== 'DISPONIVEL' && (
          <div className="bg-yellow-50 dark:bg-yellow-900/10 p-3 mb-4 rounded-md border border-yellow-100 dark:border-yellow-800/30">
            <label className="block text-xs font-bold text-yellow-700 dark:text-yellow-500 uppercase mb-1">
              Emprestado para
            </label>
            <p className="text-sm font-medium text-gray-800 dark:text-white">
              {exemplar.responsavel || '-'}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="tombo">Tombo</Label>
            <Input
              id="tombo"
              value={tombo}
              onChange={(e) => setTombo(e.target.value)}
              disabled={!isEditMode}
            />
          </div>
          <div>
            <Label htmlFor="localizacao">Localização Física</Label>
            <Input
              id="localizacao"
              value={localizacao}
              onChange={(e) => setLocalizacao(e.target.value)}
              disabled={!isEditMode}
            />
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer className="justify-between">
        <Button
          variant="danger"
          onClick={() => setConfirmAction('excluir')}
          disabled={isUpdating || isEditMode}
          isLoading={isDeleting}
        >
          Excluir
        </Button>

        {isEditMode ? (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => setIsEditMode(false)}
              disabled={isUpdating}
            >
              Cancelar
            </Button>
            <Button
              variant="success"
              onClick={handleSalvar}
              isLoading={isUpdating}
            >
              Salvar
            </Button>
          </div>
        ) : (
          <Button onClick={() => setIsEditMode(true)}>Editar Cadastro</Button>
        )}
      </Modal.Footer>

      <ConfirmModal
        isOpen={confirmAction === 'excluir'}
        title="Excluir Exemplar"
        message={`Tem certeza que deseja excluir o exemplar de tombo "${exemplar.tomboExemplar}"?`}
        isDestructive={true}
        onConfirm={executarExclusao}
        onCancel={() => setConfirmAction(null)}
      />
    </Modal>
  );
}
