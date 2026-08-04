import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { createMutationHook } from '../useGenericMutation';
import { useToast } from '../../contexts/ToastContext';
import { getErrorMessage } from '../../utils/errorHandler';
import {
  cadastrarLeitor,
  atualizarLeitor,
  excluirLeitor,
  resetarSenhaLeitor,
  uploadReaderAvatar,
  type LeitorPayload,
} from '../../services/readerService';

const READER_QUERY_KEY = ['leitores'];

function invalidateReaderQueries(queryClient: QueryClient, matricula?: string) {
  queryClient.invalidateQueries({ queryKey: READER_QUERY_KEY });
  queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
  // O modal de detalhes usa ['leitor', matricula] — sem isso, reabrir em até
  // 5 min (staleTime) mostraria dados/foto antigos.
  if (matricula) {
    queryClient.invalidateQueries({ queryKey: ['leitor', matricula] });
  }
}

/**
 * Cria/atualiza o leitor e, se houver foto, encadeia o upload do avatar.
 * Falha no upload NÃO desfaz o save: a lista é invalidada mesmo assim e o
 * usuário recebe um aviso específico (evita retry que duplicaria a matrícula).
 */
async function saveWithAvatar(
  save: () => Promise<unknown>,
  matricula: string,
  avatarFile?: File | null,
) {
  const saved = await save();
  let avatarError: unknown = null;
  if (avatarFile) {
    try {
      await uploadReaderAvatar(matricula, avatarFile);
    } catch (error) {
      avatarError = error;
    }
  }
  return { saved, avatarError };
}

// --- Criação ---
interface CreateReaderVariables {
  payload: LeitorPayload;
  avatarFile?: File | null;
}
export function useCreateReader() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: ({ payload, avatarFile }: CreateReaderVariables) =>
      saveWithAvatar(() => cadastrarLeitor(payload), payload.matricula, avatarFile),
    onSuccess: ({ avatarError }, { payload }) => {
      invalidateReaderQueries(queryClient, payload.matricula);
      if (avatarError) {
        addToast({
          type: 'error',
          title: 'Erro',
          description: 'Leitor cadastrado, mas o envio da foto falhou.',
        });
      } else {
        addToast({
          type: 'success',
          title: 'Sucesso',
          description: 'Leitor cadastrado com sucesso!',
        });
      }
    },
    onError: (error) => {
      addToast({
        type: 'error',
        title: 'Erro',
        description: getErrorMessage(error, 'Erro ao cadastrar leitor.'),
      });
    },
  });
}

// --- Atualização ---
interface UpdateReaderVariables {
  matricula: string;
  payload: LeitorPayload;
  avatarFile?: File | null;
}
export function useUpdateReader() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: ({ matricula, payload, avatarFile }: UpdateReaderVariables) =>
      saveWithAvatar(() => atualizarLeitor(matricula, payload), matricula, avatarFile),
    onSuccess: ({ avatarError }, { matricula }) => {
      invalidateReaderQueries(queryClient, matricula);
      if (avatarError) {
        addToast({
          type: 'error',
          title: 'Erro',
          description: 'Leitor atualizado, mas o envio da foto falhou.',
        });
      } else {
        addToast({
          type: 'success',
          title: 'Sucesso',
          description: 'Leitor atualizado com sucesso!',
        });
      }
    },
    onError: (error) => {
      addToast({
        type: 'error',
        title: 'Erro',
        description: getErrorMessage(error, 'Erro ao atualizar leitor.'),
      });
    },
  });
}

// --- Exclusão ---
export const useDeleteReader = createMutationHook<unknown, string>({
  mutationFn: (matricula) => excluirLeitor(matricula),
  queryKey: READER_QUERY_KEY,
  successMessage: 'Leitor excluído com sucesso!',
  errorMessage: 'Erro ao excluir leitor.',
});

// --- Reset de Senha ---
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
