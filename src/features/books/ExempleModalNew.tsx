import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { ExempleForm, type ExempleFormData } from './ExempleForm';
import { useCreateExemple } from '../../hooks/mutations/useExempleMutations';

interface ExempleModalNewProps {
  isOpen: boolean;
  onClose: () => void;
  livroId: number;
  livroIsbn: string;
  livroNome: string;
}

export function ExempleModalNew({
  isOpen,
  onClose,
  livroId,
  livroIsbn,
  livroNome,
}: ExempleModalNewProps) {
  const { mutateAsync: createExemplar, isPending } = useCreateExemple();

  const handleSubmit = async (data: ExempleFormData) => {
    try {
      await createExemplar({
        livro_id: livroId,
        status_livro: 'DISPONIVEL',
        ...data,
      });
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Header title="Cadastrar Novo Exemplar" />
      <Modal.Body>
        <ExempleForm
          formId="form-novo-exemplar"
          livroIsbn={livroIsbn}
          livroNome={livroNome}
          onSubmit={handleSubmit}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button
          type="submit"
          form="form-novo-exemplar"
          isLoading={isPending}
          className="w-full"
        >
          CADASTRAR EXEMPLAR
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
