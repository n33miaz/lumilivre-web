import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { Modal } from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { DetailsModalActionFooter } from '../../components/shared/DetailsModalActionFooter';
import { ContentForm } from './ContentForm';

import { type ContentPayload, type ContentResponse } from '../../services/contentService';
import {
  useUpdateContent,
  useDeleteContent,
} from '../../hooks/mutations/useContentMutations';

interface ContentModalDetailsProps {
  content: ContentResponse | null;
  isOpen: boolean;
  onClose: (foiAlterado?: boolean) => void;
}

export function ContentModalDetails({
  content,
  isOpen,
  onClose,
}: ContentModalDetailsProps) {
  const { t } = useTranslation('contents');
  const [isEditMode, setIsEditMode] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'excluir' | null>(null);

  const { mutateAsync: updateContent, isPending: isUpdating } = useUpdateContent();
  const { mutateAsync: deleteContent, isPending: isDeleting } = useDeleteContent();

  // Mantém o último dado válido durante a animação de saída
  const contentRef = useRef(content);
  useEffect(() => {
    if (content) contentRef.current = content;
  }, [content]);
  const atual = content ?? contentRef.current;

  useEffect(() => {
    if (isOpen) setIsEditMode(false);
  }, [isOpen]);

  const handleSubmit = async (
    payload: ContentPayload,
    coverFile: File | null,
    docFile: File | null,
  ) => {
    if (!atual) return;
    try {
      await updateContent({ id: atual.id, payload, coverFile, docFile });
      setIsEditMode(false);
      onClose(true);
    } catch (error) {
      console.error(error);
    }
  };

  const executarExclusao = async () => {
    if (!atual) return;
    await deleteContent(atual.id);
    setConfirmAction(null);
    onClose(true);
  };

  return (
    <Modal isOpen={isOpen} onClose={() => onClose(false)}>
      <Modal.Header
        title={isEditMode ? t('modal.edit.title') : t('modal.details.title')}
      />
      <Modal.Body>
        {atual && (
          <ContentForm
            formId="form-edit-conteudo"
            initialData={atual}
            readOnly={!isEditMode}
            onSubmit={handleSubmit}
          />
        )}
      </Modal.Body>

      <DetailsModalActionFooter
        isEditMode={isEditMode}
        isUpdating={isUpdating}
        isDeleting={isDeleting}
        formId="form-edit-conteudo"
        onEdit={() => setIsEditMode(true)}
        onCancel={() => setIsEditMode(false)}
        onDelete={() => setConfirmAction('excluir')}
      />

      <ConfirmModal
        isOpen={confirmAction === 'excluir'}
        title={t('confirm.delete.title')}
        message={t('confirm.delete.message', { title: atual?.title })}
        isDestructive={true}
        onConfirm={executarExclusao}
        onCancel={() => setConfirmAction(null)}
      />
    </Modal>
  );
}
