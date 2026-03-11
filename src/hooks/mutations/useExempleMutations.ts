import { createMutationHook } from '../useGenericMutation';
import {
  cadastrarExemplar,
  atualizarExemplar,
  excluirExemplar,
  type ExemplarPayload,
  type ExemplarUpdatePayload,
} from '../../services/exemplarService';

const EXEMPLAR_QUERY_KEY = ['exemplares'];

interface UpdateExemplarVariables {
  tomboAtual: string;
  payload: ExemplarUpdatePayload;
}
interface DeleteExemplarVariables {
  tombo: string;
  livroId: number;
}

export const useCreateExemple = createMutationHook<unknown, ExemplarPayload>({
  mutationFn: (payload) => cadastrarExemplar(payload),
  queryKey: EXEMPLAR_QUERY_KEY,
  successMessage: 'Exemplar cadastrado com sucesso!',
  errorMessage: 'Erro ao cadastrar exemplar. Verifique se o tombo já existe.',
});

export const useUpdateExemplar = createMutationHook<
  unknown,
  UpdateExemplarVariables
>({
  mutationFn: ({ tomboAtual, payload }) =>
    atualizarExemplar(tomboAtual, payload),
  queryKey: EXEMPLAR_QUERY_KEY,
  successMessage: 'Exemplar atualizado com sucesso!',
  errorMessage: 'Erro ao atualizar exemplar.',
});

export const useDeleteExemplar = createMutationHook<
  unknown,
  DeleteExemplarVariables
>({
  mutationFn: ({ tombo }) => excluirExemplar(tombo),
  queryKey: EXEMPLAR_QUERY_KEY,
  successMessage: 'Exemplar excluído com sucesso!',
  errorMessage: 'Erro ao excluir exemplar.',
});
