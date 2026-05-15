import { Button } from '../../components/ui/Button';
import { ExempleForm, type ExempleFormData } from './ExempleForm';
import { useCreateExemple } from '../../hooks/mutations/useExempleMutations';

interface ExempleModalNewProps {
  onClose: () => void;
  livroId: string | number;
  livroIsbn: string;
  livroNome: string;
}

export function ExempleModalNew({
  onClose,
  livroId,
  livroIsbn,
  livroNome,
}: ExempleModalNewProps) {
  const { mutateAsync: createExemplar, isPending } = useCreateExemple();

  const handleSubmit = async (data: ExempleFormData) => {
    try {
      await createExemplar({
        livro_id: String(livroId),
        status_livro: 'DISPONIVEL',
        ...data,
      });
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <div className="p-6 overflow-y-auto custom-scrollbar flex-grow">
        <ExempleForm
          formId="form-novo-exemplar"
          livroIsbn={livroIsbn}
          livroNome={livroNome}
          onSubmit={handleSubmit}
        />
      </div>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 shrink-0 flex justify-end gap-3">
        <Button
          type="submit"
          form="form-novo-exemplar"
          isLoading={isPending}
          className="w-full"
        >
          CADASTRAR EXEMPLAR
        </Button>
      </div>
    </>
  );
}
