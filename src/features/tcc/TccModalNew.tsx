import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { TccForm } from './TccForm';
import { useCreateTcc } from '../../hooks/mutations/useTccMutations';
import { type TccPayload } from '../../services/tccService';
import { type TccFormData } from '../../schemas/tccSchema';

interface TccModalNewProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function TccModalNew({ isOpen, onClose, onSuccess }: TccModalNewProps) {
  const { mutateAsync: createTcc, isPending } = useCreateTcc();

  const handleSubmit = async (
    data: TccFormData,
    filePdf: File | null,
    fileFoto: File | null,
  ) => {
    try {
      await createTcc({
        payload: data as TccPayload,
        filePdf,
        fileFoto,
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Header title="Cadastrar Novo TCC" />
      <Modal.Body>
        <TccForm formId="form-novo-tcc" onSubmit={handleSubmit} />
      </Modal.Body>
      <Modal.Footer>
        <Button
          type="submit"
          form="form-novo-tcc"
          isLoading={isPending}
          className="w-full"
        >
          CADASTRAR TCC
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
