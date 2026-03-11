import { createMutationHook } from '../useGenericMutation';
import {
  cadastrarTcc,
  atualizarTcc,
  excluirTcc,
  type TccPayload,
} from '../../services/tccService';

const TCC_QUERY_KEY = ['tccs'];

interface CreateTccVariables {
  payload: TccPayload;
  filePdf?: File | null;
  fileFoto?: File | null;
}

interface UpdateTccVariables {
  id: number;
  payload: TccPayload;
  filePdf?: File | null;
  fileFoto?: File | null;
}

export const useCreateTcc = createMutationHook<unknown, CreateTccVariables>({
  mutationFn: ({ payload, filePdf, fileFoto }) =>
    cadastrarTcc(payload, filePdf, fileFoto),
  queryKey: TCC_QUERY_KEY,
  successMessage: 'TCC cadastrado com sucesso!',
  errorMessage: 'Erro ao cadastrar TCC.',
});

export const useUpdateTcc = createMutationHook<unknown, UpdateTccVariables>({
  mutationFn: ({ id, payload, filePdf, fileFoto }) =>
    atualizarTcc(id, payload, filePdf, fileFoto),
  queryKey: TCC_QUERY_KEY,
  successMessage: 'TCC atualizado com sucesso!',
  errorMessage: 'Erro ao atualizar TCC.',
});

export const useDeleteTcc = createMutationHook<unknown, number>({
  mutationFn: (id) => excluirTcc(id),
  queryKey: TCC_QUERY_KEY,
  successMessage: 'TCC excluído com sucesso!',
  errorMessage: 'Erro ao excluir TCC.',
});
