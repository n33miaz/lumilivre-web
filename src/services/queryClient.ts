import { QueryCache, QueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { queryErrorHandler } from '../utils/queryErrorHandler';

/** Erros 4xx (menos 408/429) não devem ser repetidos; rede/5xx sim (cold start). */
function shouldRetry(failureCount: number, error: unknown): boolean {
  const status = (error as AxiosError)?.response?.status;
  if (status && status >= 400 && status < 500 && status !== 408 && status !== 429) {
    return false;
  }
  return failureCount < 4;
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: queryErrorHandler,
  }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      gcTime: 1000 * 60 * 30, // 30 minutos
      refetchOnWindowFocus: false,
      retry: shouldRetry,
      // Backoff exponencial (cap 15s) para sobreviver ao cold start da API.
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 15000),
    },
  },
});
