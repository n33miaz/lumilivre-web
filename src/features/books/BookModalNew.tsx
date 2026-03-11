import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { BookForm } from './BookForm';
import { useCreateBook } from '../../hooks/mutations/useBookMutations';
import { type LivroPayload } from '../../services/livroService';
import { type BookFormData } from '../../schemas/bookSchema';

interface BookModalNewProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (livroCriado: unknown) => void;
}

export function BookModalNew({
  isOpen,
  onClose,
  onSuccess,
}: BookModalNewProps) {
  const { mutateAsync: createBook, isPending } = useCreateBook();

  const handleSubmit = async (data: BookFormData, file: File | null) => {
    try {
      const payload = {
        ...data,
        cdd: data.cdd || '',
        tipo_capa: data.tipo_capa || '',
      } as LivroPayload;
      const response = await createBook({ payload, file });
      onSuccess(response);
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Header title="Cadastrar Novo Livro" />
      <Modal.Body>
        <BookForm formId="form-novo-livro" onSubmit={handleSubmit} />
      </Modal.Body>
      <Modal.Footer>
        <Button
          type="submit"
          form="form-novo-livro"
          isLoading={isPending}
          className="w-full"
        >
          CADASTRAR LIVRO
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
