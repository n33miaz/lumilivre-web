import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  cadastrarExemplar,
  atualizarExemplar,
  excluirExemplar,
  type ExemplarPayload,
  type ExemplarUpdatePayload,
} from '../../services/exemplarService';
import { useToast } from '../../contexts/ToastContext';
import { getErrorMessage } from '../../utils/errorHandler';

export function useCreateExemplar() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (payload: ExemplarPayload) => cadastrarExemplar(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['exemplares', variables.livro_id],
      });
      addToast({
        type: 'success',
        title: 'Exemplar Cadastrado',
        description: 'O exemplar foi salvo com sucesso!',
      });
    },
    onError: (error) => {
      addToast({
        type: 'error',
        title: 'Erro ao cadastrar',
        description: getErrorMessage(error, 'Verifique se o tombo já existe.'),
      });
    },
  });
}

export function useUpdateExemplar() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: ({
      tomboAtual,
      payload,
    }: {
      tomboAtual: string;
      payload: ExemplarUpdatePayload;
    }) => atualizarExemplar(tomboAtual, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['exemplares', variables.payload.livro_id],
      });
      addToast({
        type: 'success',
        title: 'Sucesso',
        description: 'Exemplar atualizado com sucesso!',
      });
    },
    onError: (error) => {
      addToast({
        type: 'error',
        title: 'Erro ao atualizar',
        description: getErrorMessage(error),
      });
    },
  });
}

export function useDeleteExemplar() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: ({ tombo }: { tombo: string; livroId: number }) =>
      excluirExemplar(tombo),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['exemplares', variables.livroId],
      });
      addToast({
        type: 'success',
        title: 'Sucesso',
        description: 'Exemplar excluído com sucesso!',
      });
    },
    onError: (error) => {
      addToast({
        type: 'error',
        title: 'Erro ao excluir',
        description: getErrorMessage(error),
      });
    },
  });
}
