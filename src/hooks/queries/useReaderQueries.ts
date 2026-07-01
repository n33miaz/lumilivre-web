import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  buscarLeitoresParaAdmin,
  buscarLeitoresAvancado,
  type LeitorFilterParams,
  buscarLeitorPorMatricula,
} from '../../services/readerService';

import {
  buscarCursos,
  buscarEstatisticasGrafico,
} from '../../services/courseService';
import { buscarModulos } from '../../services/academicModuleService';
import { buscarTurnos } from '../../services/studyShiftService';

const STATIC_DATA_CONFIG = {
  staleTime: 1000 * 60 * 60 * 24,
  gcTime: 1000 * 60 * 60 * 24,
  refetchOnMount: false,
};

export function useLeitores(
  page: number,
  size: number,
  sort: string,
  termoBusca: string,
  filtrosAvancados: LeitorFilterParams,
) {
  return useQuery({
    queryKey: ['leitores', page, size, sort, termoBusca, filtrosAvancados],
    queryFn: () => {
      const temFiltro = Object.values(filtrosAvancados).some((v) => !!v);
      if (temFiltro) {
        return buscarLeitoresAvancado({ ...filtrosAvancados, page, size, sort });
      }
      return buscarLeitoresParaAdmin(termoBusca, page, size, sort);
    },
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
  });
}

export function useLeitoresOptions() {
  return useQuery({
    queryKey: ['leitores-options'],
    queryFn: () =>
      buscarLeitoresParaAdmin('', 0, 1000).then((res) => res.content),
    staleTime: 1000 * 60 * 5,
  });
}

export function useLeitorDetalhes(matricula?: string) {
  return useQuery({
    queryKey: ['leitor', matricula],
    queryFn: () => buscarLeitorPorMatricula(matricula!).then((res) => res.data),
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
    // Mantém o cache vivo por 30 min e reaproveita os dados anteriores ao
    // remontar: ao reabrir a Classificação os 3 gráficos não recarregam do
    // zero — atualizam em segundo plano se estiverem velhos.
    gcTime: 1000 * 60 * 30,
    placeholderData: keepPreviousData,
  });
}
