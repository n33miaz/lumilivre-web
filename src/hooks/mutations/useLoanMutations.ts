import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  cadastrarEmprestimo,
  atualizarEmprestimo,
  concluirEmprestimo,
  excluirEmprestimo,
  type EmprestimoPayload,
} from '../../services/emprestimoService';
import { useToast } from '../../contexts/ToastContext';
import { getErrorMessage } from '../../utils/errorHandler';

export function useCreateLoan() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (payload: EmprestimoPayload) => cadastrarEmprestimo(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emprestimos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({
        queryKey: ['dashboard-emprestimos-lista'],
      });
      addToast({
        type: 'success',
        title: 'Sucesso',
        description: 'Empréstimo realizado com sucesso!',
      });
    },
    onError: (error) => {
      addToast({
        type: 'error',
        title: 'Erro',
        description: getErrorMessage(error, 'Erro ao realizar empréstimo.'),
      });
    },
  });
}

export function useUpdateLoan() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: EmprestimoPayload }) =>
      atualizarEmprestimo(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emprestimos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({
        queryKey: ['dashboard-emprestimos-lista'],
      });
      addToast({
        type: 'success',
        title: 'Sucesso',
        description: 'Empréstimo atualizado com sucesso!',
      });
    },
    onError: (error) => {
      addToast({
        type: 'error',
        title: 'Erro',
        description: getErrorMessage(error, 'Erro ao atualizar empréstimo.'),
      });
    },
  });
}

export function useCompleteLoan() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (id: number) => concluirEmprestimo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emprestimos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({
        queryKey: ['dashboard-emprestimos-lista'],
      });
      addToast({
        type: 'success',
        title: 'Devolução registrada',
        description: 'Devolução registrada com sucesso!',
      });
    },
    onError: (error) => {
      addToast({
        type: 'error',
        title: 'Erro',
        description: getErrorMessage(error, 'Erro ao registrar devolução.'),
      });
    },
  });
}

export function useDeleteLoan() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (id: number) => excluirEmprestimo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emprestimos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({
        queryKey: ['dashboard-emprestimos-lista'],
      });
      addToast({
        type: 'success',
        title: 'Sucesso',
        description: 'Empréstimo excluído com sucesso!',
      });
    },
    onError: (error) => {
      addToast({
        type: 'error',
        title: 'Erro',
        description: getErrorMessage(error, 'Erro ao excluir empréstimo.'),
      });
    },
  });
}
