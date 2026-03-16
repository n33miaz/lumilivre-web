import { Button } from '../../components/ui/Button';
import { BookForm } from './BookForm';
import { useCreateBook } from '../../hooks/mutations/useBookMutations';
import { type LivroPayload } from '../../services/livroService';
import { type BookFormData } from '../../schemas/bookSchema';

interface BookModalNewProps {
  onClose: () => void;
  onSuccess: (livroCriado: unknown) => void;
}

export function BookModalNew({ onClose, onSuccess }: BookModalNewProps) {
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
    <>
      <div className="p-6 overflow-y-auto custom-scrollbar flex-grow">
        <BookForm formId="form-novo-livro" onSubmit={handleSubmit} />
      </div>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 shrink-0 flex justify-end gap-3">
        <Button
          type="submit"
          form="form-novo-livro"
          isLoading={isPending}
          className="w-full"
        >
          CADASTRAR LIVRO
        </Button>
      </div>
    </>
  );
}