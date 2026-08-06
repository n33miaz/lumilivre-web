import { createMutationHook } from '../useGenericMutation';
import {
  cadastrarLivro,
  atualizarLivro,
  excluirLivroComExemplares,
  type LivroPayload,
} from '../../services/bookService';

const BOOK_QUERY_KEY = ['livros'];

interface CreateBookVariables {
  payload: LivroPayload;
  file?: File | null;
}
interface UpdateBookVariables {
  id: number | string;
  payload: LivroPayload;
  file?: File | null;
}

export const useCreateBook = createMutationHook<unknown, CreateBookVariables>({
  mutationFn: ({ payload, file }) => cadastrarLivro(payload, file),
  queryKey: BOOK_QUERY_KEY,
  successMessage: 'book:toast.created',
  errorMessage: 'book:error.create',
});

export const useUpdateBook = createMutationHook<unknown, UpdateBookVariables>({
  mutationFn: ({ id, payload, file }) => atualizarLivro(id, payload, file),
  queryKey: BOOK_QUERY_KEY,
  successMessage: 'book:toast.updated',
  errorMessage: 'book:error.update',
});

export const useDeleteBook = createMutationHook<unknown, number | string>({
  mutationFn: (id) => excluirLivroComExemplares(id),
  queryKey: BOOK_QUERY_KEY,
  successMessage: 'book:toast.deleted_with_copies',
  errorMessage: 'book:error.delete',
});
