import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { buscarUsuarios } from '../../services/userService';

export function useUsuarios(
  texto: string,
  page: number,
  size: number,
  enabled = true,
) {
  return useQuery({
    queryKey: ['users', texto, page, size],
    queryFn: () => buscarUsuarios(texto, page, size),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60,
  });
}
