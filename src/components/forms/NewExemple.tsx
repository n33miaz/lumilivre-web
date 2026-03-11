import { useState } from 'react';

import {
  cadastrarExemplar,
  type ExemplarPayload,
} from '../../services/exemplarService';
import { useToast } from '../../contexts/ToastContext';
import { getErrorMessage } from '../../utils/errorHandler';

import { Label } from '../ui/Label';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface NewExemplarProps {
  livroId: number;
  livroIsbn: string;
  livroNome: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function NovoExemplar({
  livroId,
  livroIsbn,
  livroNome,
  onClose,
  onSuccess,
}: NewExemplarProps) {
  const [tombo, setTombo] = useState('');
  const [localizacao, setLocalizacao] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!tombo.trim() || !localizacao.trim()) {
      addToast({
        type: 'warning',
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos.',
      });
      return;
    }

    setIsLoading(true);

    const payload: ExemplarPayload = {
      livro_id: livroId,
      tombo: tombo,
      status_livro: 'DISPONIVEL',
      localizacao_fisica: localizacao,
    };

    try {
      await cadastrarExemplar(payload);
      addToast({
        type: 'success',
        title: 'Exemplar Cadastrado',
        description: 'O exemplar foi salvo com sucesso!',
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao cadastrar exemplar:', error);
      addToast({
        type: 'error',
        title: 'Erro ao cadastrar',
        description: getErrorMessage(
          error,
          'Erro ao cadastrar exemplar. Verifique se o tombo já existe.',
        ),
      });
    } finally {
      setIsLoading(false);
    }
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
          isLoading={isLoading}
          loadingText="CADASTRANDO..."
          className="w-full py-3.5 text-[17px]"
        >
          CADASTRAR EXEMPLAR
        </Button>
      </div>
    </div>
  );
}
