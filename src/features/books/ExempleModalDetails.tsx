import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { Modal } from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { DetailsModalActionFooter } from '../../components/shared/DetailsModalActionFooter';
import { ExempleForm, type ExempleFormData } from './ExempleForm';

import { type ListaLivro } from '../../services/bookService';
import {
  useUpdateExemplar,
  useDeleteExemplar,
} from '../../hooks/mutations/useExempleMutations';

interface ModalExemplarDetailsProps {
  exemplar: ListaLivro | null;
  livroId: string | number | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ModalExemplarDetails({
  exemplar,
  livroId,
  isOpen,
  onClose,
}: ModalExemplarDetailsProps) {
  const { t } = useTranslation('book');
  const [isEditMode, setIsEditMode] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'excluir' | null>(null);

  const { mutateAsync: updateExemplar, isPending: isUpdating } =
    useUpdateExemplar();
  const { mutateAsync: deleteExemplar, isPending: isDeleting } =
    useDeleteExemplar();

  // Mantém os últimos dados válidos durante a animação de saída
  const exemplarRef = useRef(exemplar);
  const livroIdRef = useRef(livroId);
  useEffect(() => {
    if (exemplar) exemplarRef.current = exemplar;
    if (livroId) livroIdRef.current = livroId;
  }, [exemplar, livroId]);
  const exemplarAtual = exemplar ?? exemplarRef.current;
  const livroIdAtual = livroId ?? livroIdRef.current;

  useEffect(() => {
    if (isOpen) setIsEditMode(false);
  }, [isOpen]);

  const handleSubmit = async (data: ExempleFormData) => {
    try {
      await updateExemplar({
        tomboAtual: exemplarAtual?.tomboExemplar ?? '',
        payload: {
          tombo: data.tombo,
          localizacao_fisica: data.localizacao_fisica,
          livro_id: String(livroIdAtual!),
          status_livro: exemplarAtual?.status ?? '',
        },
      });
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  const executarExclusao = async () => {
    try {
      await deleteExemplar({
        tombo: exemplarAtual?.tomboExemplar ?? '',
        livroId: String(livroIdAtual ?? ''),
      });
      setConfirmAction(null);
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Header
        title={
          isEditMode
            ? t('modal.copy.edit.title')
            : t('modal.copy.details.title')
        }
      />
      <Modal.Body>
        {exemplarAtual && livroIdAtual && (
          <ExempleForm
            formId="form-edit-exemplar"
            livroIsbn={exemplarAtual.isbn}
            livroNome={exemplarAtual.nome}
            initialData={{
              tombo: exemplarAtual.tomboExemplar,
              localizacao_fisica: exemplarAtual.localizacao_fisica,
              status: exemplarAtual.status,
              responsavel: exemplarAtual.responsavel,
            }}
            readOnly={!isEditMode}
            onSubmit={handleSubmit}
          />
        )}
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
        title={t('confirm.copy_delete.title')}
        message={t('confirm.copy_delete.message', {
          code: exemplarAtual?.tomboExemplar ?? '',
        })}
        isDestructive={true}
        onConfirm={executarExclusao}
        onCancel={() => setConfirmAction(null)}
      />
    </Modal>
  );
}
