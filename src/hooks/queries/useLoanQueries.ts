import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  buscarEmprestimosPaginado,
  buscarEmprestimosAvancado,
  buscarEmprestimosAtivosEAtrasados,
  buscarRanking,
  type EmprestimoFilterParams,
} from '../../services/loanService';

export function useEmprestimos(
  page: number,
  size: number,
  sort: string,
  termoBusca: string,
  filtrosAvancados: EmprestimoFilterParams,
) {
  return useQuery({
    queryKey: ['emprestimos', page, size, sort, termoBusca, filtrosAvancados],
    queryFn: () => {
      const temFiltro = Object.values(filtrosAvancados).some((v) => !!v);
      if (temFiltro) {
        return buscarEmprestimosAvancado({
          ...filtrosAvancados,
          page,
          size,
          sort,
        });
      }
      return buscarEmprestimosPaginado(termoBusca, page, size, sort);
    },
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 1, // 1 minuto
  });
}

export function useEmprestimosAtivosEAtrasados() {
  return useQuery({
    queryKey: ['emprestimos-ativos-atrasados'],
    queryFn: buscarEmprestimosAtivosEAtrasados,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

export function useRanking(
  top: number,
  cursoId?: number,
  moduloId?: number,
  turnoId?: number,
) {
  return useQuery({
    queryKey: ['ranking', top, cursoId, moduloId, turnoId],
    queryFn: () => buscarRanking(top, cursoId, moduloId, turnoId),
    staleTime: 1000 * 60 * 10, // 10 minutos
    placeholderData: keepPreviousData,
  });
}
