import { createMutationHook } from '../useGenericMutation';
import {
  cadastrarLeitor,
  atualizarLeitor,
  excluirLeitor,
  resetarSenhaLeitor,
  type LeitorPayload,
} from '../../services/readerService';

const READER_QUERY_KEY = ['leitores'];

// --- Criação ---
export const useCreateReader = createMutationHook<unknown, LeitorPayload>({
  mutationFn: (payload) => cadastrarLeitor(payload),
  queryKey: READER_QUERY_KEY,
  successMessage: 'Leitor cadastrado com sucesso!',
  errorMessage: 'Erro ao cadastrar leitor.',
});

// --- Atualização ---
interface UpdateReaderVariables {
  matricula: string;
  payload: LeitorPayload;
}
export const useUpdateReader = createMutationHook<
  unknown,
  UpdateReaderVariables
>({
  mutationFn: ({ matricula, payload }) => atualizarLeitor(matricula, payload),
  queryKey: READER_QUERY_KEY,
  successMessage: 'Leitor atualizado com sucesso!',
  errorMessage: 'Erro ao atualizar leitor.',
});

// --- Exclusão ---
export const useDeleteReader = createMutationHook<unknown, string>({
  mutationFn: (matricula) => excluirLeitor(matricula),
  queryKey: READER_QUERY_KEY,
  successMessage: 'Leitor excluído com sucesso!',
  errorMessage: 'Erro ao excluir leitor.',
});

// --- Reset de Senha ---
import { useMutation } from '@tanstack/react-query';
import { useToast } from '../../contexts/ToastContext';
import { getErrorMessage } from '../../utils/errorHandler';

export function useResetReaderPassword() {
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (matricula: string) => resetarSenhaLeitor(matricula),
    onSuccess: (_, matricula) => {
      addToast({
        type: 'success',
        title: 'Senha Resetada',
        description: `A senha foi redefinida para: ${matricula}`,
      });
    },
    onError: (error) => {
      addToast({
        type: 'error',
        title: 'Erro',
        description: getErrorMessage(error, 'Erro ao resetar senha.'),
      });
    },
  });
}
