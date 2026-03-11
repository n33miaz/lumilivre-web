import {
  useMutation,
  useQueryClient,
  type QueryKey,
  type MutationFunction,
} from '@tanstack/react-query';
import { useToast } from '../contexts/ToastContext';
import { getErrorMessage } from '../utils/errorHandler';

interface MutationOptions<TData, TVariables> {
  mutationFn: MutationFunction<TData, TVariables>;
  queryKey: QueryKey;
  successMessage: string;
  errorMessage: string;
}

export function createMutationHook<TData, TVariables>({
  mutationFn,
  queryKey,
  successMessage,
  errorMessage,
}: MutationOptions<TData, TVariables>) {
  return () => {
    const queryClient = useQueryClient();
    const { addToast } = useToast();

    return useMutation({
      mutationFn,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey });
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        addToast({
          type: 'success',
          title: 'Sucesso',
          description: successMessage,
        });
      },
      onError: (error) => {
        addToast({
          type: 'error',
          title: 'Erro',
          description: getErrorMessage(error, errorMessage),
        });
      },
    });
  };
}
