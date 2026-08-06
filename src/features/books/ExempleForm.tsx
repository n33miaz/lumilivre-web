import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from '../../schemas/zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { Label } from '../../components/ui/Label';
import { Input } from '../../components/ui/Input';

// Schema de validação local. As mensagens são **chaves** de i18n (namespace
// `book`), porque o schema nasce fora da árvore React; quem traduz é o form.
const exemplarSchema = z.object({
  tombo: z.string().min(1, 'copy.form.error.code_required'),
  localizacao_fisica: z.string().min(1, 'copy.form.error.location_required'),
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
  const { t } = useTranslation('book');
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
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Aviso de Empréstimo (se não estiver disponível) */}
      {initialData?.status && initialData.status !== 'DISPONIVEL' && (
        <div className="bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-md border border-yellow-100 dark:border-yellow-800/30">
          <span className="block text-xs font-bold text-yellow-700 dark:text-yellow-500 uppercase mb-1">
            {t('copy.form.borrowed_to')}
          </span>
          <p className="text-sm font-medium text-gray-800 dark:text-white">
            {initialData.responsavel || '-'}
          </p>
        </div>
      )}

      {/* Contexto do livro (somente leitura). */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 sm:col-span-4">
          <Label htmlFor="livroIsbn">{t('form.field.isbn')}</Label>
          <Input id="livroIsbn" value={livroIsbn} disabled />
        </div>
        <div className="col-span-12 sm:col-span-8">
          <Label htmlFor="livroNome">{t('copy.form.field.book')}</Label>
          <Input id="livroNome" value={livroNome} disabled />
        </div>
      </div>

      <hr className="border-gray-200 dark:border-gray-700" />

      {/* Campos Editáveis do Exemplar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="tombo" requiredIndicator={!readOnly}>
            {t('copy.form.field.code')}
          </Label>
          <Input
            id="tombo"
            disabled={readOnly}
            placeholder={t('copy.form.code.placeholder')}
            {...register('tombo')}
            error={errors.tombo?.message && t(errors.tombo.message)}
          />
        </div>
        <div>
          <Label htmlFor="localizacao_fisica" requiredIndicator={!readOnly}>
            {t('copy.form.field.location')}
          </Label>
          <Input
            id="localizacao_fisica"
            disabled={readOnly}
            placeholder={t('copy.form.location.placeholder')}
            {...register('localizacao_fisica')}
            error={
              errors.localizacao_fisica?.message &&
              t(errors.localizacao_fisica.message)
            }
          />
        </div>
      </div>
    </form>
  );
}
