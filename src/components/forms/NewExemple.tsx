import { useState } from 'react';
import { type ExemplarPayload } from '../../services/exemplarService';
import { useToast } from '../../contexts/ToastContext';
import { Label } from '../ui/Label';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useCreateExemplar } from '../../hooks/mutations/useExemplarMutations';

interface NewExemplarProps {
  livroId: number;
  livroIsbn: string;
  livroNome: string;
  onClose: () => void;
}

export function NovoExemplar({
  livroId,
  livroIsbn,
  livroNome,
  onClose,
}: NewExemplarProps) {
  const [tombo, setTombo] = useState('');
  const [localizacao, setLocalizacao] = useState('');
  const { addToast } = useToast();

  const { mutate: createExemplar, isPending } = useCreateExemplar();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!tombo.trim() || !localizacao.trim()) {
      addToast({
        type: 'warning',
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos.',
      });
      return;
    }

    const payload: ExemplarPayload = {
      livro_id: livroId,
      tombo: tombo,
      status_livro: 'DISPONIVEL',
      localizacao_fisica: localizacao,
    };

    createExemplar(payload, {
      onSuccess: () => onClose(),
    });
  };

  return (
    <div className="flex flex-col h-full">
      <form
        id="form-novo-exemplar"
        onSubmit={handleSubmit}
        className="overflow-y-auto p-1 flex-grow custom-scrollbar space-y-4"
      >
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-4">
            <Label htmlFor="livroIsbn">ISBN</Label>
            <Input id="livroIsbn" value={livroIsbn} disabled />
          </div>
          <div className="col-span-8">
            <Label htmlFor="livroNome">Livro</Label>
            <Input id="livroNome" value={livroNome} disabled />
          </div>
        </div>

        <hr className="border-gray-200 dark:border-gray-700" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="tombo" requiredIndicator>
              Tombo do Exemplar
            </Label>
            <Input
              id="tombo"
              value={tombo}
              onChange={(e) => setTombo(e.target.value)}
              required
              placeholder="Ex: 001234"
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor="localizacao" requiredIndicator>
              Localização Física
            </Label>
            <Input
              id="localizacao"
              value={localizacao}
              onChange={(e) => setLocalizacao(e.target.value)}
              required
              placeholder="Ex: Corredor B, Prateleira 2"
            />
          </div>
        </div>
      </form>

      <div className="pt-3 mt-4 border-t border-gray-200 dark:border-gray-700 shrink-0">
        <Button
          type="submit"
          form="form-novo-exemplar"
          isLoading={isPending}
          loadingText="CADASTRANDO..."
          className="w-full py-3.5 text-[17px]"
        >
          CADASTRAR EXEMPLAR
        </Button>
      </div>
    </div>
  );
}
