import { useQuery } from '@tanstack/react-query';
import {
  listarConteudos,
  listarConteudosAvancado,
  type ContentFilterParams,
} from '../../services/contentService';

export function useConteudos(termoBusca: string, filtros: ContentFilterParams) {
  return useQuery({
    queryKey: ['contents', termoBusca, filtros],
    queryFn: () => {
      const temFiltro = Object.values(filtros).some((val) => val !== '' && val != null);
      if (temFiltro) {
        return listarConteudosAvancado(filtros);
      }
      return listarConteudos(termoBusca);
    },
    staleTime: 1000 * 60 * 2,
  });
}
