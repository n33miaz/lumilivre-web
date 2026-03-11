import { createMutationHook } from '../useGenericMutation';
import {
  cadastrarLivro,
  atualizarLivro,
  excluirLivroComExemplares,
  type LivroPayload,
} from '../../services/livroService';

const BOOK_QUERY_KEY = ['livros'];

interface CreateBookVariables {
  payload: LivroPayload;
  file?: File | null;
}
interface UpdateBookVariables {
  id: number;
  payload: LivroPayload;
  file?: File | null;
}

export const useCreateBook = createMutationHook<unknown, CreateBookVariables>({
  mutationFn: ({ payload, file }) => cadastrarLivro(payload, file),
  queryKey: BOOK_QUERY_KEY,
  successMessage: 'Livro cadastrado com sucesso!',
  errorMessage: 'Erro ao cadastrar livro.',
});

export const useUpdateBook = createMutationHook<unknown, UpdateBookVariables>({
  mutationFn: ({ id, payload, file }) => atualizarLivro(id, payload, file),
  queryKey: BOOK_QUERY_KEY,
  successMessage: 'Livro atualizado com sucesso!',
  errorMessage: 'Erro ao atualizar livro.',
});

export const useDeleteBook = createMutationHook<unknown, string>({
  mutationFn: (isbn) => excluirLivroComExemplares(isbn),
  queryKey: BOOK_QUERY_KEY,
  successMessage: 'Livro e seus exemplares foram excluídos!',
  errorMessage: 'Erro ao excluir livro.',
});
