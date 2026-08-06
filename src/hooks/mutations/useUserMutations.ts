import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import {
  cadastrarUsuario,
  atualizarUsuario,
  excluirUsuario,
  alterarStatusUsuario,
  type UsuarioPayload,
  type UsuarioStatusPayload,
} from '../../services/userService';
import { useToast } from '../../contexts/ToastContext';
import { getErrorMessage } from '../../utils/errorHandler';

const USERS_QUERY_KEY = ['users'];

export function useCreateUser() {
  const { t } = useTranslation('admin');
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UsuarioPayload) => cadastrarUsuario(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
      addToast({
        type: 'success',
        title: t('users.toast.created.title'),
        description: t('users.toast.created.description'),
      });
    },
    onError: (error) => {
      addToast({
        type: 'error',
        title: t('users.toast.error.title'),
        description: getErrorMessage(error, t('users.toast.error.description')),
      });
    },
  });
}

export function useUpdateUser() {
  const { t } = useTranslation('admin');
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UsuarioPayload }) =>
      atualizarUsuario(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
      addToast({
        type: 'success',
        title: t('users.toast.updated.title'),
        description: t('users.toast.updated.description'),
      });
    },
    onError: (error) => {
      addToast({
        type: 'error',
        title: t('users.toast.error.title'),
        description: getErrorMessage(error, t('users.toast.error.description')),
      });
    },
  });
}

export function useSetUserStatus() {
  const { t } = useTranslation('admin');
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UsuarioStatusPayload }) =>
      alterarStatusUsuario(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
      addToast({
        type: 'success',
        title: t('users.toast.status.title'),
        description: t('users.toast.status.description'),
      });
    },
    onError: (error) => {
      // As recusas de regra (desativar a si mesmo, último admin, nada a mudar)
      // vêm com `message` traduzida pela API nos cinco idiomas — repetir uma
      // copy genérica aqui esconderia justamente o motivo.
      addToast({
        type: 'error',
        title: t('users.toast.status.error.title'),
        description: getErrorMessage(
          error,
          t('users.toast.status.error.description'),
        ),
      });
    },
  });
}

export function useDeleteUser() {
  const { t } = useTranslation('admin');
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => excluirUsuario(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
      addToast({
        type: 'success',
        title: t('users.toast.deleted.title'),
        description: t('users.toast.deleted.description'),
      });
    },
    onError: (error) => {
      addToast({
        type: 'error',
        title: t('users.toast.error.title'),
        description: getErrorMessage(error, t('users.toast.error.description')),
      });
    },
  });
}
