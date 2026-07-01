import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { ReaderForm } from './ReaderForm';
import { useCreateReader } from '../../hooks/mutations/useReaderMutations';
import type { LeitorPayload } from '../../services/readerService';
import { type ReaderFormData } from '../../schemas/readerSchema';
import { useLibraryConfig } from '../../contexts/LibraryConfigContext';

interface ReaderModalNewProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function ReaderModalNew({ onClose, onSuccess }: ReaderModalNewProps) {
  const { mutateAsync: createReader, isPending } = useCreateReader();
  const { features } = useLibraryConfig();

  const handleSubmit = async (data: ReaderFormData) => {
    try {
      const payload = {
        ...data,
        cpf: data.cpf ? data.cpf.replace(/\D/g, '') : undefined,
        celular: data.celular ? data.celular.replace(/\D/g, '') : undefined,
        cep: data.cep ? data.cep.replace(/\D/g, '') : undefined,
        cursoId: features.academicFields ? Number(data.cursoId) : undefined,
        turnoId: features.academicFields ? Number(data.turnoId) : undefined,
        moduloId: features.academicFields ? Number(data.moduloId) : undefined,
        readerCategory: features.academicFields ? undefined : data.readerCategory,
        numero_casa: Number(data.numero_casa) || 0,
      };

      await createReader(payload as unknown as LeitorPayload);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao processar formulário:', error);
    }
  };

  return (
    <>
      <Modal.Body>
        <ReaderForm formId="form-novo-leitor" onSubmit={handleSubmit} />
      </Modal.Body>
      <Modal.Footer>
        <Button
          type="submit"
          form="form-novo-leitor"
          isLoading={isPending}
          className="w-full"
        >
          CADASTRAR LEITOR
        </Button>
      </Modal.Footer>
    </>
  );
}
