import { useMemo, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useLeitoresOptions } from '../../hooks/queries/useReaderQueries';
import {
  useLivrosOptions,
  useExemplares,
} from '../../hooks/queries/useBookQueries';

import { loanSchema, type LoanFormData } from '../../schemas/loanSchema';

import { Label } from '../../components/ui/Label';
import { Input } from '../../components/ui/Input';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { CustomDatePicker } from '../../components/ui/CustomDatePicker';

interface LoanFormProps {
  formId: string;
  initialData?: Partial<LoanFormData> & {
    leitorNome?: string;
    livroNome?: string;
  };
  readOnly?: boolean;
  onSubmit: (data: LoanFormData) => void;
}

export function LoanForm({
  formId,
  initialData,
  readOnly = false,
  onSubmit,
}: LoanFormProps) {
  const { t } = useTranslation('loan');
  const hoje = new Date().toISOString().split('T')[0];
  const dataDevolucaoPadrao = new Date();
  dataDevolucaoPadrao.setDate(dataDevolucaoPadrao.getDate() + 7);
  const devolucaoStr = dataDevolucaoPadrao.toISOString().split('T')[0];

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<LoanFormData>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      data_emprestimo: initialData?.data_emprestimo || hoje,
      data_devolucao: initialData?.data_devolucao || devolucaoStr,
      leitor_matricula: initialData?.leitor_matricula || '',
      livro_id: initialData?.livro_id || '',
      exemplar_tombo: initialData?.exemplar_tombo || '',
    },
  });

  const livroIdSelecionado = watch('livro_id');
  const exemplarTomboAtual = initialData?.exemplar_tombo;

  useEffect(() => {
    if (initialData) {
      reset({
        data_emprestimo: initialData.data_emprestimo || hoje,
        data_devolucao: initialData.data_devolucao || devolucaoStr,
        leitor_matricula: initialData.leitor_matricula || '',
        livro_id: initialData.livro_id || '',
        exemplar_tombo: initialData.exemplar_tombo || '',
      });
    }
  }, [initialData, reset, hoje, devolucaoStr]);

  const { data: leitoresData } = useLeitoresOptions();
  const { data: livrosData } = useLivrosOptions();
  const { data: exemplaresData, isLoading: isLoadingExemplares } =
    useExemplares(Number(livroIdSelecionado));

  const leitoresOptions = useMemo(
    () =>
      leitoresData?.map((a) => ({
        label: t('form.reader.option', {
          name: a.nomeCompleto,
          abbr: t('request.registration_abbr'),
          registration: a.matricula,
        }),
        value: a.matricula,
      })) || [],
    [leitoresData, t],
  );

  const livrosOptions = useMemo(
    () =>
      livrosData?.map((l) => ({
        label: t('form.book.option', {
          name: l.nome,
          isbn: l.isbn || t('form.book.no_isbn'),
        }),
        value: String(l.id),
      })) || [],
    [livrosData, t],
  );

  const exemplaresOptions = useMemo(() => {
    if (!exemplaresData) return [];
    return exemplaresData
      .filter(
        (ex) =>
          ex.status === 'DISPONIVEL' || ex.tomboExemplar === exemplarTomboAtual,
      )
      .map((ex) => ({
        label: t('form.copy.option', {
          code: ex.tomboExemplar,
          location: ex.localizacao_fisica,
          current:
            ex.tomboExemplar === exemplarTomboAtual
              ? t('form.copy.current')
              : '',
        }),
        value: ex.tomboExemplar,
      }));
  }, [exemplaresData, exemplarTomboAtual, t]);

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Controller
          name="data_emprestimo"
          control={control}
          render={({ field }) => (
            <CustomDatePicker
              label={t('form.field.borrowed_at')}
              value={field.value}
              onChange={field.onChange}
              disabled={readOnly}
              error={
                errors.data_emprestimo?.message &&
                t(errors.data_emprestimo.message)
              }
            />
          )}
        />
        <Controller
          name="data_devolucao"
          control={control}
          render={({ field }) => (
            <CustomDatePicker
              label={t('form.field.due_at')}
              value={field.value}
              onChange={field.onChange}
              disabled={readOnly}
              error={
                errors.data_devolucao?.message &&
                t(errors.data_devolucao.message)
              }
            />
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label requiredIndicator={!readOnly}>{t('form.field.reader')}</Label>
          {readOnly ? (
            <Input
              disabled
              value={initialData?.leitorNome || watch('leitor_matricula')}
            />
          ) : (
            <Controller
              name="leitor_matricula"
              control={control}
              render={({ field }) => (
                <div>
                  <SearchableSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={leitoresOptions}
                    placeholder={t('form.reader.placeholder')}
                  />
                  {errors.leitor_matricula && (
                    <span className="text-xs text-red-500 mt-1">
                      {t(errors.leitor_matricula.message ?? '')}
                    </span>
                  )}
                </div>
              )}
            />
          )}
        </div>

        <div>
          <Label requiredIndicator={!readOnly}>{t('form.field.book')}</Label>
          {readOnly ? (
            <Input
              disabled
              value={initialData?.livroNome || watch('livro_id')}
            />
          ) : (
            <Controller
              name="livro_id"
              control={control}
              render={({ field }) => (
                <div>
                  <SearchableSelect
                    value={field.value}
                    onChange={(val) => {
                      field.onChange(val);
                      setValue('exemplar_tombo', '');
                    }}
                    options={livrosOptions}
                    placeholder={t('form.book.placeholder')}
                  />
                  {errors.livro_id && (
                    <span className="text-xs text-red-500 mt-1">
                      {t(errors.livro_id.message ?? '')}
                    </span>
                  )}
                </div>
              )}
            />
          )}
        </div>

        <div>
          <Label requiredIndicator={!readOnly}>{t('form.field.copy')}</Label>
          {readOnly ? (
            <Input disabled value={watch('exemplar_tombo')} />
          ) : (
            <Controller
              name="exemplar_tombo"
              control={control}
              render={({ field }) => (
                <div>
                  <SearchableSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={exemplaresOptions}
                    placeholder={
                      !livroIdSelecionado
                        ? t('form.copy.placeholder_book_first')
                        : t('form.copy.placeholder')
                    }
                    disabled={!livroIdSelecionado || isLoadingExemplares}
                    isLoading={isLoadingExemplares}
                  />
                  {errors.exemplar_tombo && (
                    <span className="text-xs text-red-500 mt-1">
                      {t(errors.exemplar_tombo.message ?? '')}
                    </span>
                  )}
                </div>
              )}
            />
          )}
        </div>
      </div>
    </form>
  );
}
