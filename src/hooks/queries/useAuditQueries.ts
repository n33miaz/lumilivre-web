import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  buscarAccessLogs,
  buscarAuditLogs,
  type AccessLogFilters,
  type AuditLogFilters,
} from '../../services/auditService';

export function useAccessLogs(filters: AccessLogFilters, enabled = true) {
  return useQuery({
    queryKey: ['access-logs', filters],
    queryFn: () => buscarAccessLogs(filters),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30,
  });
}

export function useAuditLogs(filters: AuditLogFilters, enabled = true) {
  return useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: () => buscarAuditLogs(filters),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30,
  });
}
