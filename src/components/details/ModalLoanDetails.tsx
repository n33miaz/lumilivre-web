import { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';

import { Modal } from '../Modal';
import { ConfirmModal } from '../ConfirmModal';
import { Label } from '../ui/Label';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { SearchableSelect } from '../SearchableSelect';
import { CustomDatePicker } from '../CustomDatePicker';

import { buscarAlunosParaAdmin } from '../../services/alunoService';
import { buscarLivrosAgrupados } from '../../services/livroService';
import { buscarExemplaresPorLivroId } from '../../services/exemplarService';
import { type EmprestimoPayload } from '../../services/emprestimoService';

import {
  useUpdateLoan,
  useCompleteLoan,
  useDeleteLoan,
} from '../../hooks/mutations/useLoanMutations';
import { loanSchema, type LoanFormData } from '../../schemas/loanSchema';

interface EmprestimoDados {
  id: string | number;
  alunoMatricula: string;
  alunoNome?: string;
  livroIsbn: string;
  livroNome?: string;
  exemplarTombo: string;
  dataEmprestimo: string;
  dataDevolucao: string;
}

interface ModalLoanDetailsProps {
  emprestimo: EmprestimoDados | null;
  isOpen: boolean;
  onClose: (foiAtualizado?: boolean) => void;
}

export function ModalLoanDetails({
  emprestimo,
  isOpen,
  onClose,
}: ModalLoanDetailsProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    'devolucao' | 'excluir' | null
  >(null);

  const { mutateAsync: updateLoan, isPending: isUpdating } = useUpdateLoan();
  const { mutateAsync: completeLoan, isPending: isCompleting } =
    useCompleteLoan();
  const { mutateAsync: deleteLoan, isPending: isDeleting } = useDeleteLoan();

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LoanFormData>({
    resolver: zodResolver(loanSchema),
  });

  const livroIdSelecionado = watch('livro_id');
  const exemplarTomboAtual = watch('exemplar_tombo');

  const { data: alunosData } = useQuery({
    queryKey: ['alunos-options'],
    queryFn: () =>
      buscarAlunosParaAdmin('', 0, 1000).then((res) => res.content),
    staleTime: 1000 * 60 * 5,
    enabled: isOpen,
  });

  const { data: livrosData } = useQuery({
    queryKey: ['livros-options'],
    queryFn: () =>
      buscarLivrosAgrupados('', 0, 1000).then((res) => res.content),
    staleTime: 1000 * 60 * 5,
    enabled: isOpen,
  });

  const { data: exemplaresData, isLoading: isLoadingExemplares } = useQuery({
    queryKey: ['exemplares-options', livroIdSelecionado],
    queryFn: () => buscarExemplaresPorLivroId(Number(livroIdSelecionado)),
    enabled: !!livroIdSelecionado && isOpen,
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
      .filter(
        (ex) =>
          ex.status === 'DISPONIVEL' || ex.tomboExemplar === exemplarTomboAtual,
      )
      .map((ex) => ({
        label: `${ex.tomboExemplar} - Local: ${ex.localizacao_fisica} ${ex.tomboExemplar === exemplarTomboAtual ? '(Atual)' : ''}`,
        value: ex.tomboExemplar,
      }));
  }, [exemplaresData, exemplarTomboAtual]);

  useEffect(() => {
    if (emprestimo && isOpen && livrosOptions.length > 0) {
      const formatarData = (data: string) =>
        data ? new Date(data).toISOString().split('T')[0] : '';

      let livroIdEncontrado = '';
      if (emprestimo.livroIsbn && emprestimo.livroIsbn !== '-') {
        const found = livrosOptions.find((opt) =>
          opt.label.includes(emprestimo.livroIsbn),
        );
        if (found) livroIdEncontrado = String(found.value);
      }
      if (!livroIdEncontrado && emprestimo.livroNome) {
        const found = livrosOptions.find((opt) =>
          opt.label.toLowerCase().includes(emprestimo.livroNome!.toLowerCase()),
        );
        if (found) livroIdEncontrado = String(found.value);
      }

      reset({
        aluno_matricula: emprestimo.alunoMatricula || '',
        livro_id: livroIdEncontrado,
        exemplar_tombo: emprestimo.exemplarTombo || '',
        data_emprestimo: formatarData(emprestimo.dataEmprestimo),
        data_devolucao: formatarData(emprestimo.dataDevolucao),
      });
      setIsEditMode(false);
    }
  }, [emprestimo, isOpen, livrosOptions, reset]);

  if (!emprestimo || !isOpen) return null;

  const formatarDataParaBackend = (dataIso: string): string => {
    if (!dataIso) return '';
    const [ano, mes, dia] = dataIso.split('-');
    const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour12: false });
    return `${dia}/${mes}/${ano} ${horaAtual}`;
  };

  const onSubmit = async (data: LoanFormData) => {
    try {
      const payload: EmprestimoPayload = {
        id: Number(emprestimo.id),
        aluno_matricula: data.aluno_matricula,
        exemplar_tombo: data.exemplar_tombo,
        data_emprestimo: formatarDataParaBackend(data.data_emprestimo),
        data_devolucao: formatarDataParaBackend(data.data_devolucao),
      };

      await updateLoan({ id: Number(emprestimo.id), payload });
      setIsEditMode(false);
      onClose(true);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDevolucao = async () => {
    try {
      await completeLoan(Number(emprestimo.id));
      setConfirmAction(null);
      onClose(true);
    } catch (error) {
      console.error(error);
    }
  };

  const handleExcluir = async () => {
    try {
      await deleteLoan(Number(emprestimo.id));
      setConfirmAction(null);
      onClose(true);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => onClose(false)}>
      <Modal.Header
        title={isEditMode ? 'Editar Empréstimo' : 'Detalhes do Empréstimo'}
      />

      <Modal.Body>
        <form
          id="form-edit-emprestimo"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              name="data_emprestimo"
              control={control}
              render={({ field }) => (
                <CustomDatePicker
                  label="Data do Empréstimo"
                  value={field.value}
                  onChange={field.onChange}
                  disabled={!isEditMode}
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
                  disabled={!isEditMode}
                  error={errors.data_devolucao?.message}
                />
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label requiredIndicator={isEditMode}>Aluno</Label>
              {isEditMode ? (
                <Controller
                  name="aluno_matricula"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <SearchableSelect
                        value={field.value}
                        onChange={field.onChange}
                        options={alunosOptions}
                      />
                      {errors.aluno_matricula && (
                        <span className="text-xs text-red-500 mt-1">
                          {errors.aluno_matricula.message}
                        </span>
                      )}
                    </div>
                  )}
                />
              ) : (
                <Input
                  disabled
                  value={
                    alunosOptions.find(
                      (a) => a.value === watch('aluno_matricula'),
                    )?.label ||
                    emprestimo.alunoNome ||
                    watch('aluno_matricula')
                  }
                />
              )}
            </div>

            <div>
              <Label requiredIndicator={isEditMode}>Livro</Label>
              {isEditMode ? (
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
                      />
                      {errors.livro_id && (
                        <span className="text-xs text-red-500 mt-1">
                          {errors.livro_id.message}
                        </span>
                      )}
                    </div>
                  )}
                />
              ) : (
                <Input
                  disabled
                  value={emprestimo.livroNome || emprestimo.livroIsbn}
                />
              )}
            </div>

            <div>
              <Label requiredIndicator={isEditMode}>Exemplar</Label>
              {isEditMode ? (
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
              ) : (
                <Input disabled value={watch('exemplar_tombo')} />
              )}
            </div>
          </div>
        </form>
      </Modal.Body>

      <Modal.Footer className="justify-between w-full">
        <Button
          variant="danger"
          onClick={() => setConfirmAction('excluir')}
          disabled={isUpdating || isEditMode}
          isLoading={isDeleting}
        >
          Excluir
        </Button>

        {isEditMode ? (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => setIsEditMode(false)}
              disabled={isUpdating}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="form-edit-emprestimo"
              variant="success"
              isLoading={isUpdating}
            >
              Salvar Alterações
            </Button>
          </div>
        ) : (
          <div className="flex gap-3">
            <Button onClick={() => setIsEditMode(true)}>Editar</Button>
            <Button
              variant="primary"
              onClick={() => setConfirmAction('devolucao')}
              isLoading={isCompleting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Registrar Devolução
            </Button>
          </div>
        )}
      </Modal.Footer>

      <ConfirmModal
        isOpen={confirmAction !== null}
        title={
          confirmAction === 'devolucao'
            ? 'Registro de Devolução'
            : 'Excluir Empréstimo'
        }
        message={
          confirmAction === 'devolucao'
            ? 'Deseja confirmar a devolução deste livro?'
            : 'Tem certeza que deseja excluir este empréstimo?\nEssa ação não pode ser desfeita.'
        }
        isDestructive={confirmAction === 'excluir'}
        onConfirm={
          confirmAction === 'devolucao' ? handleDevolucao : handleExcluir
        }
        onCancel={() => setConfirmAction(null)}
      />
    </Modal>
  );
}
