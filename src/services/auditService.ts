import api from './api';
import type { Page } from '../types';

/** Resultado registrado em uma trilha (acesso ou negócio). */
export type AuditResult = 'SUCCESS' | 'FAILURE' | 'DENIED' | string;

/** Canal de origem de um acesso. */
export type AccessChannel = 'WEB' | 'APP' | string;

/** Item interno (pt-BR) da trilha de acessos, mapeado da resposta EN. */
export interface RegistroAcesso {
  id: number;
  ator: string;
  perfilAtor: string;
  evento: string;
  canal: AccessChannel;
  resultado: AuditResult;
  ip: string;
  userAgent: string;
  correlationId: string;
  mensagemErro: string;
  ocorridoEm: string;
}

/** Item interno (pt-BR) da auditoria de negócio, mapeado da resposta EN. */
export interface RegistroAuditoria {
  id: number;
  ator: string;
  perfilAtor: string;
  alvoId: string;
  acao: string;
  resultado: AuditResult;
  ip: string;
  mensagemErro: string;
  ocorridoEm: string;
}

export interface AccessLogFilters {
  evento?: string;
  canal?: string;
  resultado?: string;
  ator?: string;
  ip?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

export interface AuditLogFilters {
  acao?: string;
  resultado?: string;
  ator?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

const mapAccessLog = (item: Record<string, unknown>): RegistroAcesso => ({
  id: item.id as number,
  ator: (item.actor as string) ?? '',
  perfilAtor: (item.actorRole as string) ?? '',
  evento: (item.event as string) ?? '',
  canal: (item.channel as string) ?? '',
  resultado: (item.result as string) ?? '',
  ip: (item.ipAddress as string) ?? '',
  userAgent: (item.userAgent as string) ?? '',
  correlationId: (item.correlationId as string) ?? '',
  mensagemErro: (item.errorMessage as string) ?? '',
  ocorridoEm: (item.occurredAt as string) ?? '',
});

const mapAuditLog = (item: Record<string, unknown>): RegistroAuditoria => ({
  id: item.id as number,
  ator: (item.actor as string) ?? '',
  perfilAtor: (item.actorRole as string) ?? '',
  alvoId: (item.targetId as string) ?? '',
  acao: (item.action as string) ?? '',
  resultado: (item.result as string) ?? '',
  ip: (item.ipAddress as string) ?? '',
  mensagemErro: (item.errorMessage as string) ?? '',
  ocorridoEm: (item.occurredAt as string) ?? '',
});

// Normaliza strings vazias para `undefined` (evita enviar params vazios).
const clean = (value?: string) => (value && value.trim() ? value.trim() : undefined);

// Converte uma data (yyyy-MM-dd) em ISO datetime com offset para o backend.
const toIsoStart = (date?: string) =>
  date ? new Date(`${date}T00:00:00`).toISOString() : undefined;
const toIsoEnd = (date?: string) =>
  date ? new Date(`${date}T23:59:59`).toISOString() : undefined;

export const buscarAccessLogs = async (
  filters: AccessLogFilters,
): Promise<Page<RegistroAcesso>> => {
  const response = await api.get('/api/access-logs', {
    params: {
      event: clean(filters.evento),
      channel: clean(filters.canal),
      result: clean(filters.resultado),
      actor: clean(filters.ator),
      ip: clean(filters.ip),
      from: toIsoStart(filters.from),
      to: toIsoEnd(filters.to),
      page: filters.page ?? 0,
      size: filters.size ?? 20,
    },
  });
  return {
    ...response.data,
    content: (response.data.content ?? []).map(mapAccessLog),
  };
};

export const buscarAuditLogs = async (
  filters: AuditLogFilters,
): Promise<Page<RegistroAuditoria>> => {
  const response = await api.get('/api/audit-logs', {
    params: {
      action: clean(filters.acao),
      result: clean(filters.resultado),
      actor: clean(filters.ator),
      from: toIsoStart(filters.from),
      to: toIsoEnd(filters.to),
      page: filters.page ?? 0,
      size: filters.size ?? 20,
    },
  });
  return {
    ...response.data,
    content: (response.data.content ?? []).map(mapAuditLog),
  };
};
