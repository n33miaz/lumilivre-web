import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  cadastrarTcc,
  atualizarTcc,
  excluirTcc,
  type TccPayload,
} from '../../services/tccService';
import { useToast } from '../../contexts/ToastContext';
import { getErrorMessage } from '../../utils/errorHandler';

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

export function useCreateTcc() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: ({ payload, filePdf, fileFoto }: CreateTccVariables) =>
      cadastrarTcc(payload, filePdf, fileFoto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tccs'] });
      addToast({
        type: 'success',
        title: 'Sucesso',
        description: 'TCC cadastrado com sucesso!',
      });
    },
    onError: (error) => {
      addToast({
        type: 'error',
        title: 'Erro',
        description: getErrorMessage(error, 'Erro ao cadastrar TCC.'),
      });
    },
  });
}

export function useUpdateTcc() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: ({ id, payload, filePdf, fileFoto }: UpdateTccVariables) =>
      atualizarTcc(id, payload, filePdf, fileFoto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tccs'] });
      addToast({
        type: 'success',
        title: 'Sucesso',
        description: 'TCC atualizado com sucesso!',
      });
    },
    onError: (error) => {
      addToast({
        type: 'error',
        title: 'Erro',
        description: getErrorMessage(error, 'Erro ao atualizar TCC.'),
      });
    },
  });
}

export function useDeleteTcc() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (id: number) => excluirTcc(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tccs'] });
      addToast({
        type: 'success',
        title: 'Sucesso',
        description: 'TCC excluído com sucesso!',
      });
    },
    onError: (error) => {
      addToast({
        type: 'error',
        title: 'Erro',
        description: getErrorMessage(error, 'Erro ao excluir TCC.'),
      });
    },
  });
}
