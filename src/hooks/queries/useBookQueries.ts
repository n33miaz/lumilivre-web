import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  buscarLivrosAgrupados,
  buscarLivrosAvancado,
  buscarCdds,
  buscarEnum,
  type LivroFilterParams,
  buscarLivroPorId,
} from '../../services/bookService';
import { buscarGeneros } from '../../services/genreService';
import { buscarExemplaresPorLivroId } from '../../services/bookCopyService';

const STATIC_DATA_CONFIG = {
  staleTime: 1000 * 60 * 60 * 24, // 24 horas
  gcTime: 1000 * 60 * 60 * 24,
  refetchOnMount: false,
};

export function useLivros(
  page: number,
  size: number,
  sort: string,
  termoBusca: string,
  filtrosAvancados: LivroFilterParams,
) {
  return useQuery({
    queryKey: ['livros', page, size, sort, termoBusca, filtrosAvancados],
    queryFn: () => {
      const temFiltro = Object.values(filtrosAvancados).some((v) => !!v);
      if (temFiltro) {
        return buscarLivrosAvancado({ ...filtrosAvancados, page, size, sort });
      }
      return buscarLivrosAgrupados(termoBusca, page, size, sort);
    },
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 2,
  });
}

export function useLivrosOptions() {
  return useQuery({
    queryKey: ['livros-options'],
    queryFn: () =>
      buscarLivrosAgrupados('', 0, 1000).then((res) => res.content),
    staleTime: 1000 * 60 * 5,
  });
}

export function useLivroDetalhes(id?: number | string) {
  return useQuery({
    queryKey: ['livro', id],
    queryFn: () => buscarLivroPorId(id!).then((res) => res.data),
    enabled: !!id,
  });
}

export function useExemplares(livroId: number | string | null) {
  return useQuery({
    queryKey: ['exemplares', livroId],
    queryFn: () => buscarExemplaresPorLivroId(livroId!),
    enabled: !!livroId,
    staleTime: 1000 * 30,
  });
}

export function useGeneros() {
  return useQuery({
    queryKey: ['generos'],
    queryFn: buscarGeneros,
    ...STATIC_DATA_CONFIG,
  });
}

export function useCdds() {
  return useQuery({
    queryKey: ['cdds'],
    queryFn: buscarCdds,
    ...STATIC_DATA_CONFIG,
  });
}

export function useEnum(tipo: string) {
  return useQuery({
    queryKey: ['enum', tipo],
    queryFn: () => buscarEnum(tipo),
    ...STATIC_DATA_CONFIG,
  });
}
