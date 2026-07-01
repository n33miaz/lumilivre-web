import {
  createContext,
  useContext,
  type ReactNode,
} from 'react';
import { useQuery } from '@tanstack/react-query';

import { useAuth } from './AuthContext';
import {
  defaultLibrarySettings,
  getSettings,
  type LibraryFeatures,
  type LibrarySettings,
  type LibraryType,
} from '../services/settingsService';

interface LibraryConfigContextValue extends LibrarySettings {
  isLoading: boolean;
}

const LibraryConfigContext = createContext<LibraryConfigContextValue>({
  ...defaultLibrarySettings,
  isLoading: false,
});

export function LibraryConfigProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['library-settings'],
    queryFn: getSettings,
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 10,
  });

  return (
    <LibraryConfigContext.Provider
      value={{
        ...(data ?? defaultLibrarySettings),
        isLoading,
      }}
    >
      {children}
    </LibraryConfigContext.Provider>
  );
}

export const useLibraryConfig = () => useContext(LibraryConfigContext);

export type { LibraryFeatures, LibraryType };
