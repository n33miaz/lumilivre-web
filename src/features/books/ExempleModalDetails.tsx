import { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { DetailsModalActionFooter } from '../../components/shared/DetailsModalActionFooter';
import { ExempleForm, type ExempleFormData } from './ExempleForm';

import { type ListaLivro } from '../../services/livroService';
import {
  useUpdateExemplar,
  useDeleteExemplar,
} from '../../hooks/mutations/useExempleMutations';

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
  const [confirmAction, setConfirmAction] = useState<'excluir' | null>(null);

  const { mutateAsync: updateExemplar, isPending: isUpdating } =
    useUpdateExemplar();
  const { mutateAsync: deleteExemplar, isPending: isDeleting } =
    useDeleteExemplar();

  useEffect(() => {
    if (isOpen) setIsEditMode(false);
  }, [isOpen]);

  if (!isOpen || !exemplar || !livroId) return null;

  const handleSubmit = async (data: ExempleFormData) => {
    try {
      await updateExemplar({
        tomboAtual: exemplar.tomboExemplar,
        payload: {
          tombo: data.tombo,
          localizacao_fisica: data.localizacao_fisica,
          livro_id: livroId,
          status_livro: exemplar.status,
        },
      });
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  const executarExclusao = async () => {
    try {
      await deleteExemplar({ tombo: exemplar.tomboExemplar, livroId });
      setConfirmAction(null);
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Header
        title={isEditMode ? 'Editar Exemplar' : 'Detalhes do Exemplar'}
      />
      <Modal.Body>
        <ExempleForm
          formId="form-edit-exemplar"
          livroIsbn={exemplar.isbn}
          livroNome={exemplar.nome}
          initialData={{
            tombo: exemplar.tomboExemplar,
            localizacao_fisica: exemplar.localizacao_fisica,
            status: exemplar.status,
            responsavel: exemplar.responsavel,
          }}
          readOnly={!isEditMode}
          onSubmit={handleSubmit}
        />
      </Modal.Body>
      <DetailsModalActionFooter
        isEditMode={isEditMode}
        isUpdating={isUpdating}
        isDeleting={isDeleting}
        formId="form-edit-exemplar"
        onEdit={() => setIsEditMode(true)}
        onCancel={() => setIsEditMode(false)}
        onDelete={() => setConfirmAction('excluir')}
      />
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
