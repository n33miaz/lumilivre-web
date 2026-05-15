import { useState, useEffect, useRef } from 'react';
import { Modal } from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { DetailsModalActionFooter } from '../../components/shared/DetailsModalActionFooter';
import { TccForm } from './TccForm';

import { type TccResponse, type TccPayload } from '../../services/thesisService';
import {
  useUpdateTcc,
  useDeleteTcc,
} from '../../hooks/mutations/useTccMutations';
import { type TccFormData } from '../../schemas/tccSchema';

interface TccModalDetailsProps {
  tcc: TccResponse | null;
  isOpen: boolean;
  onClose: (foiAlterado?: boolean) => void;
}

export function TccModalDetails({
  tcc,
  isOpen,
  onClose,
}: TccModalDetailsProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'excluir' | null>(null);

  const { mutateAsync: updateTcc, isPending: isUpdating } = useUpdateTcc();
  const { mutateAsync: deleteTcc, isPending: isDeleting } = useDeleteTcc();

  // Mantém o último dado válido durante a animação de saída
  const tccRef = useRef(tcc);
  useEffect(() => {
    if (tcc) tccRef.current = tcc;
  }, [tcc]);
  const tccAtual = tcc ?? tccRef.current;

  useEffect(() => {
    if (isOpen) setIsEditMode(false);
  }, [isOpen]);

  const handleSubmit = async (
    data: TccFormData,
    filePdf: File | null,
    fileFoto: File | null,
  ) => {
    try {
      await updateTcc({
        id: tccAtual?.id ?? 0,
        payload: data as TccPayload,
        filePdf,
        fileFoto,
      });
      setIsEditMode(false);
      onClose(true);
    } catch (error) {
      console.error(error);
    }
  };

  const executarExclusao = async () => {
    await deleteTcc(tccAtual?.id ?? 0);
    setConfirmAction(null);
    onClose(true);
  };

  return (
    <Modal isOpen={isOpen} onClose={() => onClose(false)}>
      <Modal.Header title={isEditMode ? 'Editar TCC' : 'Detalhes do TCC'} />
      <Modal.Body>
        {tccAtual && (
          <TccForm
            formId="form-edit-tcc"
            initialData={tccAtual}
            readOnly={!isEditMode}
            onSubmit={handleSubmit}
          />
        )}
      </Modal.Body>

      <DetailsModalActionFooter
        isEditMode={isEditMode}
        isUpdating={isUpdating}
        isDeleting={isDeleting}
        formId="form-edit-tcc"
        onEdit={() => setIsEditMode(true)}
        onCancel={() => setIsEditMode(false)}
        onDelete={() => setConfirmAction('excluir')}
      />

      <ConfirmModal
        isOpen={confirmAction === 'excluir'}
        title="Excluir TCC"
        message={`Tem certeza que deseja excluir o TCC "${tccAtual?.titulo}"?`}
        isDestructive={true}
        onConfirm={executarExclusao}
        onCancel={() => setConfirmAction(null)}
      />
    </Modal>
  );
}
