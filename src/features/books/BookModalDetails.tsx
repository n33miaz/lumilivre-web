import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { Modal } from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { LoadingIcon } from '../../components/ui/LoadingIcon';
import { DetailsModalActionFooter } from '../../components/shared/DetailsModalActionFooter';
import { BookForm } from './BookForm';

import {
  type LivroAgrupado,
  type LivroPayload,
} from '../../services/bookService';
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
  const { t } = useTranslation('book');
  const [isEditMode, setIsEditMode] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'excluir' | null>(null);

  const { mutateAsync: updateBook, isPending: isUpdating } = useUpdateBook();
  const { mutateAsync: deleteBook, isPending: isDeleting } = useDeleteBook();

  // Mantém o último dado válido durante a animação de saída
  const livroRef = useRef(livro);
  useEffect(() => {
    if (livro) livroRef.current = livro;
  }, [livro]);
  const livroAtual = livro ?? livroRef.current;

  const { data: livroDetalhes, isLoading } = useLivroDetalhes(
    isOpen ? livroAtual?.id : undefined,
  );

  useEffect(() => {
    if (isOpen) setIsEditMode(false);
  }, [isOpen]);

  const handleSubmit = async (data: BookFormData, file: File | null) => {
    try {
      const payload = {
        ...data,
        cdd: data.cdd || '',
        tipo_capa: data.tipo_capa || '',
      } as LivroPayload;
      await updateBook({ id: livroAtual?.id ?? 0, payload, file });
      setIsEditMode(false);
      onClose(true);
    } catch (error) {
      console.error(error);
    }
  };

  const executarExclusao = async () => {
    try {
      await deleteBook(livroAtual?.id ?? 0);
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
          livroAtual && (
            <BookForm
              formId="form-edit-livro"
              initialData={initialData}
              readOnly={!isEditMode}
              onSubmit={handleSubmit}
            />
          )
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
        title={t('confirm.delete.title')}
        message={t('confirm.delete.message', { name: livroAtual?.nome ?? '' })}
        isDestructive={true}
        onConfirm={executarExclusao}
        onCancel={() => setConfirmAction(null)}
      />
    </Modal>
  );
}
