import { useState, useEffect } from 'react';

import { Modal } from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { LoadingIcon } from '../../components/ui/LoadingIcon';
import { DetailsModalActionFooter } from '../../components/shared/DetailsModalActionFooter';
import { BookForm } from './BookForm';

import {
  type LivroAgrupado,
  type LivroPayload,
} from '../../services/livroService';
import {
  useUpdateBook,
  useDeleteBook,
} from '../../hooks/mutations/useBookMutations';
import { useLivroDetalhes } from '../../hooks/queries/useBookQueries';
import { type BookFormData } from '../../schemas/bookSchema';

interface DetalhesLivroModalProps {
  livro: LivroAgrupado | null;
  isOpen: boolean;
  onClose: (foiAtualizado?: boolean) => void;
}

export function DetalhesLivroModal({
  livro,
  isOpen,
  onClose,
}: DetalhesLivroModalProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'excluir' | null>(null);

  const { mutateAsync: updateBook, isPending: isUpdating } = useUpdateBook();
  const { mutateAsync: deleteBook, isPending: isDeleting } = useDeleteBook();

  const { data: livroDetalhes, isLoading } = useLivroDetalhes(
    isOpen ? livro?.id : undefined,
  );

  useEffect(() => {
    if (isOpen) setIsEditMode(false);
  }, [isOpen]);

  if (!livro || !isOpen) return null;

  const handleSubmit = async (data: BookFormData, file: File | null) => {
    try {
      const payload = {
        ...data,
        cdd: data.cdd || '',
        tipo_capa: data.tipo_capa || '',
      } as LivroPayload;
      await updateBook({ id: livro.id, payload, file });
      setIsEditMode(false);
      onClose(true);
    } catch (error) {
      console.error(error);
    }
  };

  const executarExclusao = async () => {
    try {
      await deleteBook(livro.isbn);
      setConfirmAction(null);
      onClose(true);
    } catch (error) {
      console.error(error);
    }
  };

  const initialData = livroDetalhes
    ? {
        ...livroDetalhes,
        data_lancamento: livroDetalhes.data_lancamento
          ? livroDetalhes.data_lancamento.split('T')[0]
          : '',
        cdd: livroDetalhes.cddCodigo ? String(livroDetalhes.cddCodigo) : '',
        classificacao_etaria: livroDetalhes.classificacaoEtariaRaw
          ? String(livroDetalhes.classificacaoEtariaRaw)
          : '',
        tipo_capa: livroDetalhes.tipoCapaRaw
          ? String(livroDetalhes.tipoCapaRaw)
          : '',
      }
    : undefined;

  return (
    <Modal isOpen={isOpen} onClose={() => onClose()}>
      <Modal.Header
        title={isEditMode ? 'Editando Livro' : 'Detalhes do Livro'}
      />
      <Modal.Body>
        {isLoading ? (
          <LoadingIcon />
        ) : (
          <BookForm
            formId="form-edit-livro"
            initialData={initialData}
            readOnly={!isEditMode}
            onSubmit={handleSubmit}
          />
        )}
      </Modal.Body>
      <DetailsModalActionFooter
        isEditMode={isEditMode}
        isUpdating={isUpdating}
        isDeleting={isDeleting}
        formId="form-edit-livro"
        onEdit={() => setIsEditMode(true)}
        onCancel={() => setIsEditMode(false)}
        onDelete={() => setConfirmAction('excluir')}
      />
      <ConfirmModal
        isOpen={confirmAction === 'excluir'}
        title="Excluir Livro"
        message={`Tem certeza que deseja excluir o livro "${livro.nome}" e TODOS os seus exemplares junto?\nEsta ação não pode ser desfeita.`}
        isDestructive={true}
        onConfirm={executarExclusao}
        onCancel={() => setConfirmAction(null)}
      />
    </Modal>
  );
}
