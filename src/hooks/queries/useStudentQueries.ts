import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  buscarAlunosParaAdmin,
  buscarAlunosAvancado,
  type AlunoFilterParams,
  buscarAlunoPorMatricula,
} from '../../services/alunoService';

import {
  buscarCursos,
  buscarEstatisticasGrafico,
} from '../../services/cursoService';
import { buscarModulos } from '../../services/moduloService';
import { buscarTurnos } from '../../services/turnoService';

const STATIC_DATA_CONFIG = {
  staleTime: 1000 * 60 * 60 * 24,
  gcTime: 1000 * 60 * 60 * 24,
  refetchOnMount: false,
};

export function useAlunos(
  page: number,
  size: number,
  sort: string,
  termoBusca: string,
  filtrosAvancados: AlunoFilterParams,
) {
  return useQuery({
    queryKey: ['alunos', page, size, sort, termoBusca, filtrosAvancados],
    queryFn: () => {
      const temFiltro = Object.values(filtrosAvancados).some((v) => !!v);
      if (temFiltro) {
        return buscarAlunosAvancado({ ...filtrosAvancados, page, size, sort });
      }
      return buscarAlunosParaAdmin(termoBusca, page, size, sort);
    },
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
  });
}

export function useAlunosOptions() {
  return useQuery({
    queryKey: ['alunos-options'],
    queryFn: () =>
      buscarAlunosParaAdmin('', 0, 1000).then((res) => res.content),
    staleTime: 1000 * 60 * 5,
  });
}

export function useAlunoDetalhes(matricula?: string) {
  return useQuery({
    queryKey: ['aluno', matricula],
    queryFn: () => buscarAlunoPorMatricula(matricula!).then((res) => res.data),
    enabled: !!matricula,
  });
}

export function useCursos() {
  return useQuery({
    queryKey: ['cursos'],
    queryFn: async () => {
      const response = await buscarCursos();
      return response.content;
    },
    ...STATIC_DATA_CONFIG,
  });
}

export function useModulos() {
  return useQuery({
    queryKey: ['modulos'],
    queryFn: buscarModulos,
    ...STATIC_DATA_CONFIG,
  });
}

export function useTurnos() {
  return useQuery({
    queryKey: ['turnos'],
    queryFn: buscarTurnos,
    ...STATIC_DATA_CONFIG,
  });
}

export function useEstatisticasGrafico() {
  return useQuery({
    queryKey: ['estatisticas-grafico-dashboard'],
    queryFn: async () => {
      const [curso, modulo, turno] = await Promise.all([
        buscarEstatisticasGrafico('curso'),
        buscarEstatisticasGrafico('modulo'),
        buscarEstatisticasGrafico('turno'),
      ]);
      return { curso, modulo, turno };
    },
    staleTime: 1000 * 60 * 60,
  });
}
