import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { Label } from '../../components/ui/Label';
import { Input } from '../../components/ui/Input';

// Schema de validação local
const exemplarSchema = z.object({
  tombo: z.string().min(1, 'O tombo é obrigatório'),
  localizacao_fisica: z.string().min(1, 'A localização é obrigatória'),
});

export type ExempleFormData = z.infer<typeof exemplarSchema>;

interface ExemplarFormProps {
  formId: string;
  livroIsbn: string;
  livroNome: string;
  initialData?: Partial<ExempleFormData> & {
    status?: string;
    responsavel?: string;
  };
  readOnly?: boolean;
  onSubmit: (data: ExempleFormData) => void;
}

export function ExempleForm({
  formId,
  livroIsbn,
  livroNome,
  initialData,
  readOnly = false,
  onSubmit,
}: ExemplarFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ExempleFormData>({
    resolver: zodResolver(exemplarSchema),
    defaultValues: {
      tombo: initialData?.tombo || '',
      localizacao_fisica: initialData?.localizacao_fisica || '',
    },
  });

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Aviso de Empréstimo (se não estiver disponível) */}
      {initialData?.status && initialData.status !== 'DISPONIVEL' && (
        <div className="bg-yellow-50 dark:bg-yellow-900/10 p-3 mb-4 rounded-md border border-yellow-100 dark:border-yellow-800/30">
          <label className="block text-xs font-bold text-yellow-700 dark:text-yellow-500 uppercase mb-1">
            Emprestado para
          </label>
          <p className="text-sm font-medium text-gray-800 dark:text-white">
            {initialData.responsavel || '-'}
          </p>
        </div>
      )}

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

      {/* Campos Editáveis do Exemplar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="tombo" requiredIndicator={!readOnly}>
            Tombo do Exemplar
          </Label>
          <Input
            id="tombo"
            disabled={readOnly}
            placeholder="Ex: 001234"
            {...register('tombo')}
            error={errors.tombo?.message}
          />
        </div>
        <div>
          <Label htmlFor="localizacao_fisica" requiredIndicator={!readOnly}>
            Localização Física
          </Label>
          <Input
            id="localizacao_fisica"
            disabled={readOnly}
            placeholder="Ex: Corredor B, Prateleira 2"
            {...register('localizacao_fisica')}
            error={errors.localizacao_fisica?.message}
          />
        </div>
      </div>
    </form>
  );
}
