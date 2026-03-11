import { useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';

import { buscarAlunosParaAdmin } from '../../services/alunoService';
import { buscarLivrosAgrupados } from '../../services/livroService';
import { buscarExemplaresPorLivroId } from '../../services/exemplarService';
import { type EmprestimoPayload } from '../../services/emprestimoService';

import { useCreateLoan } from '../../hooks/mutations/useLoanMutations';
import { loanSchema, type LoanFormData } from '../../schemas/loanSchema';

import { Label } from '../ui/Label';
import { Button } from '../ui/Button';
import { SearchableSelect } from '../SearchableSelect';
import { CustomDatePicker } from '../CustomDatePicker';

interface NewLoanProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function NovoEmprestimo({ onClose, onSuccess }: NewLoanProps) {
  const { mutateAsync: createLoan, isPending } = useCreateLoan();

  const hoje = new Date().toISOString().split('T')[0];
  const dataDevolucaoPadrao = new Date();
  dataDevolucaoPadrao.setDate(dataDevolucaoPadrao.getDate() + 7);
  const devolucaoStr = dataDevolucaoPadrao.toISOString().split('T')[0];

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LoanFormData>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      data_emprestimo: hoje,
      data_devolucao: devolucaoStr,
      aluno_matricula: '',
      livro_id: '',
      exemplar_tombo: '',
    },
  });

  const livroIdSelecionado = watch('livro_id');

  const { data: alunosData } = useQuery({
    queryKey: ['alunos-options'],
    queryFn: () =>
      buscarAlunosParaAdmin('', 0, 1000).then((res) => res.content),
    staleTime: 1000 * 60 * 5,
  });

  const { data: livrosData } = useQuery({
    queryKey: ['livros-options'],
    queryFn: () =>
      buscarLivrosAgrupados('', 0, 1000).then((res) => res.content),
    staleTime: 1000 * 60 * 5,
  });

  const { data: exemplaresData, isLoading: isLoadingExemplares } = useQuery({
    queryKey: ['exemplares-options', livroIdSelecionado],
    queryFn: () => buscarExemplaresPorLivroId(Number(livroIdSelecionado)),
    enabled: !!livroIdSelecionado,
  });

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
      .filter((ex) => ex.status === 'DISPONIVEL')
      .map((ex) => ({
        label: `${ex.tomboExemplar} - Local: ${ex.localizacao_fisica}`,
        value: ex.tomboExemplar,
      }));
  }, [exemplaresData]);

  const formatarDataParaBackend = (dataIso: string): string => {
    if (!dataIso) return '';
    const [ano, mes, dia] = dataIso.split('-');
    const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour12: false });
    return `${dia}/${mes}/${ano} ${horaAtual}`;
  };

  const onSubmit = async (data: LoanFormData) => {
    try {
      const payload: EmprestimoPayload = {
        aluno_matricula: data.aluno_matricula,
        exemplar_tombo: data.exemplar_tombo,
        data_emprestimo: formatarDataParaBackend(data.data_emprestimo),
        data_devolucao: formatarDataParaBackend(data.data_devolucao),
      };

      await createLoan(payload);
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[600px] overflow-hidden">
      <form
        id="form-novo-emprestimo"
        onSubmit={handleSubmit(onSubmit)}
        className="overflow-y-auto p-1 flex-grow custom-scrollbar pr-2 space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            name="data_emprestimo"
            control={control}
            render={({ field }) => (
              <CustomDatePicker
                label="Data do Empréstimo*"
                value={field.value}
                onChange={field.onChange}
                error={errors.data_emprestimo?.message}
              />
            )}
          />
          <Controller
            name="data_devolucao"
            control={control}
            render={({ field }) => (
              <CustomDatePicker
                label="Data de Devolução*"
                value={field.value}
                onChange={field.onChange}
                error={errors.data_devolucao?.message}
              />
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label requiredIndicator>Aluno</Label>
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
          </div>

          <div>
            <Label requiredIndicator>Livro</Label>
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
          </div>

          <div>
            <Label requiredIndicator>Exemplar Disponível</Label>
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
          </div>
        </div>
      </form>

      <div className="pt-3 mt-4 border-t border-gray-200 dark:border-gray-700 shrink-0">
        <Button
          type="submit"
          form="form-novo-emprestimo"
          isLoading={isPending}
          className="w-full py-3.5 text-[17px]"
        >
          CONFIRMAR EMPRÉSTIMO
        </Button>
      </div>
    </div>
  );
}
