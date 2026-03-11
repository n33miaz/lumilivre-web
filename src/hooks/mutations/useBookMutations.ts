import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  cadastrarLivro,
  atualizarLivro,
  excluirLivroComExemplares,
  type LivroPayload,
} from '../../services/livroService';
import { useToast } from '../../contexts/ToastContext';
import { getErrorMessage } from '../../utils/errorHandler';

interface CreateBookVariables {
  payload: LivroPayload;
  file?: File | null;
}

interface UpdateBookVariables {
  id: number;
  payload: LivroPayload;
  file?: File | null;
}

export function useCreateBook() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: ({ payload, file }: CreateBookVariables) =>
      cadastrarLivro(payload, file),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['livros'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      addToast({
        type: 'success',
        title: 'Sucesso',
        description: `Livro "${variables.payload.nome}" cadastrado!`,
      });
    },
    onError: (error) => {
      addToast({
        type: 'error',
        title: 'Erro',
        description: getErrorMessage(error),
      });
    },
  });
}

export function useUpdateBook() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: ({ id, payload, file }: UpdateBookVariables) =>
      atualizarLivro(id, payload, file),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['livros'] });
      queryClient.invalidateQueries({ queryKey: ['livro', variables.id] });
      addToast({
        type: 'success',
        title: 'Sucesso',
        description: 'Livro atualizado com sucesso!',
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

export function useDeleteBook() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (isbn: string) => excluirLivroComExemplares(isbn),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['livros'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      addToast({
        type: 'success',
        title: 'Sucesso',
        description: 'Livro e exemplares excluídos!',
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
