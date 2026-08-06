import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('reader');

  return useMutation({
    mutationFn: ({ payload, avatarFile }: CreateReaderVariables) =>
      saveWithAvatar(() => cadastrarLeitor(payload), payload.matricula, avatarFile),
    onSuccess: ({ avatarError }, { payload }) => {
      invalidateReaderQueries(queryClient, payload.matricula);
      if (avatarError) {
        addToast({
          type: 'error',
          title: t('common:error.title'),
          description: t('toast.avatar_failed.created'),
        });
      } else {
        addToast({
          type: 'success',
          title: t('common:success'),
          description: t('toast.created'),
        });
      }
    },
    onError: (error) => {
      addToast({
        type: 'error',
        title: t('common:error.title'),
        description: getErrorMessage(error, t('error.create')),
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
  const { t } = useTranslation('reader');

  return useMutation({
    mutationFn: ({ matricula, payload, avatarFile }: UpdateReaderVariables) =>
      saveWithAvatar(() => atualizarLeitor(matricula, payload), matricula, avatarFile),
    onSuccess: ({ avatarError }, { matricula }) => {
      invalidateReaderQueries(queryClient, matricula);
      if (avatarError) {
        addToast({
          type: 'error',
          title: t('common:error.title'),
          description: t('toast.avatar_failed.updated'),
        });
      } else {
        addToast({
          type: 'success',
          title: t('common:success'),
          description: t('toast.updated'),
        });
      }
    },
    onError: (error) => {
      addToast({
        type: 'error',
        title: t('common:error.title'),
        description: getErrorMessage(error, t('error.update')),
      });
    },
  });
}

// --- Exclusão ---
export const useDeleteReader = createMutationHook<unknown, string>({
  mutationFn: (matricula) => excluirLeitor(matricula),
  queryKey: READER_QUERY_KEY,
  successMessage: 'reader:toast.deleted',
  errorMessage: 'reader:error.delete',
});

// --- Reset de Senha ---
export function useResetReaderPassword() {
  const { addToast } = useToast();
  const { t } = useTranslation('reader');

  return useMutation({
    mutationFn: (matricula: string) => resetarSenhaLeitor(matricula),
    onSuccess: (_, matricula) => {
      addToast({
        type: 'success',
        title: t('toast.password_reset.title'),
        description: t('toast.password_reset.description', {
          registration: matricula,
        }),
      });
    },
    onError: (error) => {
      addToast({
        type: 'error',
        title: t('common:error.title'),
        description: getErrorMessage(error, t('error.reset_password')),
      });
    },
  });
}
