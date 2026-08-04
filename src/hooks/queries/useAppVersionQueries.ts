import { useQuery } from '@tanstack/react-query';
import {
  getAppVersion,
  type AppPlatform,
} from '../../services/appVersionService';

export function useAppVersion(platform: AppPlatform, enabled = true) {
  return useQuery({
    queryKey: ['app-version', platform],
    queryFn: () => getAppVersion(platform),
    enabled,
    // A versão pode não existir ainda (404): não insiste em retentar.
    retry: false,
    staleTime: 1000 * 60,
  });
}
