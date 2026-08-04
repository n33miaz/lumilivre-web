import { createMutationHook } from '../useGenericMutation';
import {
  cadastrarConteudo,
  atualizarConteudo,
  excluirConteudo,
  type ContentPayload,
} from '../../services/contentService';

const CONTENT_QUERY_KEY = ['contents'];

interface CreateContentVariables {
  payload: ContentPayload;
  coverFile?: File | null;
  docFile?: File | null;
}

interface UpdateContentVariables {
  id: string;
  payload: ContentPayload;
  coverFile?: File | null;
  docFile?: File | null;
}

export const useCreateContent = createMutationHook<unknown, CreateContentVariables>({
  mutationFn: ({ payload, coverFile, docFile }) =>
    cadastrarConteudo(payload, coverFile, docFile),
  queryKey: CONTENT_QUERY_KEY,
  successMessage: 'Conteúdo publicado com sucesso!',
  errorMessage: 'Erro ao publicar conteúdo.',
});

export const useUpdateContent = createMutationHook<unknown, UpdateContentVariables>({
  mutationFn: ({ id, payload, coverFile, docFile }) =>
    atualizarConteudo(id, payload, coverFile, docFile),
  queryKey: CONTENT_QUERY_KEY,
  successMessage: 'Conteúdo atualizado com sucesso!',
  errorMessage: 'Erro ao atualizar conteúdo.',
});

export const useDeleteContent = createMutationHook<unknown, string>({
  mutationFn: (id) => excluirConteudo(id),
  queryKey: CONTENT_QUERY_KEY,
  successMessage: 'Conteúdo excluído com sucesso!',
  errorMessage: 'Erro ao excluir conteúdo.',
});
