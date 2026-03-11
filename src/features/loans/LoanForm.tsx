import { useMemo, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAlunosOptions } from '../../hooks/queries/useStudentQueries';
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
    alunoNome?: string;
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
      aluno_matricula: initialData?.aluno_matricula || '',
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
        aluno_matricula: initialData.aluno_matricula || '',
        livro_id: initialData.livro_id || '',
        exemplar_tombo: initialData.exemplar_tombo || '',
      });
    }
  }, [initialData, reset, hoje, devolucaoStr]);

  const { data: alunosData } = useAlunosOptions();
  const { data: livrosData } = useLivrosOptions();
  const { data: exemplaresData, isLoading: isLoadingExemplares } =
    useExemplares(Number(livroIdSelecionado));

  const alunosOptions = useMemo(
    () =>
      alunosData?.map((a) => ({
        label: `${a.nomeCompleto} (Mat: ${a.matricula})`,
        value: a.matricula,
      })) || [],
    [alunosData],
  );

  const livrosOptions = useMemo(
    () =>
      livrosData?.map((l) => ({
        label: `${l.nome} (ISBN: ${l.isbn || 'S/N'})`,
        value: String(l.id),
      })) || [],
    [livrosData],
  );

  const exemplaresOptions = useMemo(() => {
    if (!exemplaresData) return [];
    return exemplaresData
      .filter(
        (ex) =>
          ex.status === 'DISPONIVEL' || ex.tomboExemplar === exemplarTomboAtual,
      )
      .map((ex) => ({
        label: `${ex.tomboExemplar} - Local: ${ex.localizacao_fisica} ${ex.tomboExemplar === exemplarTomboAtual ? '(Atual)' : ''}`,
        value: ex.tomboExemplar,
      }));
  }, [exemplaresData, exemplarTomboAtual]);

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Controller
          name="data_emprestimo"
          control={control}
          render={({ field }) => (
            <CustomDatePicker
              label="Data do Empréstimo"
              value={field.value}
              onChange={field.onChange}
              disabled={readOnly}
              error={errors.data_emprestimo?.message}
            />
          )}
        />
        <Controller
          name="data_devolucao"
          control={control}
          render={({ field }) => (
            <CustomDatePicker
              label="Data de Devolução"
              value={field.value}
              onChange={field.onChange}
              disabled={readOnly}
              error={errors.data_devolucao?.message}
            />
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label requiredIndicator={!readOnly}>Aluno</Label>
          {readOnly ? (
            <Input
              disabled
              value={initialData?.alunoNome || watch('aluno_matricula')}
            />
          ) : (
            <Controller
              name="aluno_matricula"
              control={control}
              render={({ field }) => (
                <div>
                  <SearchableSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={alunosOptions}
                    placeholder="Selecione o aluno"
                  />
                  {errors.aluno_matricula && (
                    <span className="text-xs text-red-500 mt-1">
                      {errors.aluno_matricula.message}
                    </span>
                  )}
                </div>
              )}
            />
          )}
        </div>

        <div>
          <Label requiredIndicator={!readOnly}>Livro</Label>
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
                    placeholder="Selecione o livro"
                  />
                  {errors.livro_id && (
                    <span className="text-xs text-red-500 mt-1">
                      {errors.livro_id.message}
                    </span>
                  )}
                </div>
              )}
            />
          )}
        </div>

        <div>
          <Label requiredIndicator={!readOnly}>Exemplar</Label>
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
                        ? 'Selecione um livro'
                        : 'Selecione um exemplar'
                    }
                    disabled={!livroIdSelecionado || isLoadingExemplares}
                    isLoading={isLoadingExemplares}
                  />
                  {errors.exemplar_tombo && (
                    <span className="text-xs text-red-500 mt-1">
                      {errors.exemplar_tombo.message}
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
