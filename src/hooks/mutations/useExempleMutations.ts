import { createMutationHook } from '../useGenericMutation';
import {
  cadastrarExemplar,
  atualizarExemplar,
  excluirExemplar,
  type ExemplarPayload,
  type ExemplarUpdatePayload,
} from '../../services/bookCopyService';

const EXEMPLAR_QUERY_KEY = ['exemplares'];

interface UpdateExemplarVariables {
  tomboAtual: string;
  payload: ExemplarUpdatePayload;
}
interface DeleteExemplarVariables {
  tombo: string;
  livroId: number | string;
}

export const useCreateExemple = createMutationHook<unknown, ExemplarPayload>({
  mutationFn: (payload) => cadastrarExemplar(payload),
  queryKey: EXEMPLAR_QUERY_KEY,
  successMessage: 'book:toast.copy.created',
  errorMessage: 'book:error.copy.create',
});

export const useUpdateExemplar = createMutationHook<
  unknown,
  UpdateExemplarVariables
>({
  mutationFn: ({ tomboAtual, payload }) =>
    atualizarExemplar(tomboAtual, payload),
  queryKey: EXEMPLAR_QUERY_KEY,
  successMessage: 'book:toast.copy.updated',
  errorMessage: 'book:error.copy.update',
});

export const useDeleteExemplar = createMutationHook<
  unknown,
  DeleteExemplarVariables
>({
  mutationFn: ({ tombo }) => excluirExemplar(tombo),
  queryKey: EXEMPLAR_QUERY_KEY,
  successMessage: 'book:toast.copy.deleted',
  errorMessage: 'book:error.copy.delete',
});
