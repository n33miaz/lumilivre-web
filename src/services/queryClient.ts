import { QueryCache, QueryClient } from '@tanstack/react-query';
import { queryErrorHandler } from '../utils/queryErrorHandler';

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: queryErrorHandler,
  }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      gcTime: 1000 * 60 * 30, // 30 minutos
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
