import {
  useMutation,
  useQueryClient,
  type QueryKey,
  type MutationFunction,
} from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { useToast } from '../contexts/ToastContext';
import { getErrorMessage } from '../utils/errorHandler';

interface MutationOptions<TData, TVariables> {
  mutationFn: MutationFunction<TData, TVariables>;
  queryKey: QueryKey;
  /** Chave i18n (`namespace:chave`) do texto de sucesso. */
  successMessage: string;
  /** Chave i18n (`namespace:chave`) do texto de erro. */
  errorMessage: string;
}

/**
 * As mensagens chegam como **chave** de i18n, não como texto: a fábrica roda no
 * carregamento do módulo, fora da árvore React, então resolver a tradução aqui
 * congelaria o idioma do primeiro import. A tradução acontece dentro do hook,
 * a cada render, e acompanha a troca de idioma.
 */
export function createMutationHook<TData, TVariables>({
  mutationFn,
  queryKey,
  successMessage,
  errorMessage,
}: MutationOptions<TData, TVariables>) {
  return () => {
    const queryClient = useQueryClient();
    const { addToast } = useToast();
    const { t } = useTranslation('common');

    return useMutation({
      mutationFn,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey });
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        addToast({
          type: 'success',
          title: t('success'),
          description: t(successMessage),
        });
      },
      onError: (error) => {
        addToast({
          type: 'error',
          title: t('error.title'),
          description: getErrorMessage(error, t(errorMessage)),
        });
      },
    });
  };
}
