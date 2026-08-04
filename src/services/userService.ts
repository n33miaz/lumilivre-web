import api from './api';
import type { Page } from '../types';

/**
 * Perfis gerenciáveis pela tela admin. Os valores correspondem ao nome do enum
 * `Role` no backend (o corpo aceita `ADMIN` | `LIBRARIAN`).
 */
export type ManageableRole = 'ADMIN' | 'LIBRARIAN';

/** Item interno (pt-BR) do usuário, mapeado do `UserSummaryResponse` EN. */
export interface UsuarioResumo {
  id: string;
  email: string;
  /** Nome do enum (ex.: 'ADMIN', 'LIBRARIAN', 'READER'). */
  perfilCode: string;
  /** Rótulo localizado do perfil, vindo do backend. */
  perfilLabel: string;
}

export interface UsuarioPayload {
  email: string;
  /** Opcional na edição; obrigatório na criação. */
  password?: string;
  role: ManageableRole;
}

const mapUserSummary = (item: Record<string, unknown>): UsuarioResumo => {
  const role = (item.role as { code?: string; label?: string } | null) ?? null;
  return {
    id: item.id as string,
    email: (item.email as string) ?? '',
    perfilCode: role?.code ?? '',
    perfilLabel: role?.label ?? role?.code ?? '',
  };
};

const toUserRequest = (payload: UsuarioPayload) => ({
  email: payload.email,
  password: payload.password,
  role: payload.role,
});

export const buscarUsuarios = async (
  texto = '',
  page = 0,
  size = 10,
): Promise<Page<UsuarioResumo>> => {
  const response = await api.get('/api/users', {
    params: { text: texto || undefined, page, size },
  });
  return {
    ...response.data,
    content: (response.data.content ?? []).map(mapUserSummary),
  };
};

export const cadastrarUsuario = async (payload: UsuarioPayload) => {
  const response = await api.post('/api/users', toUserRequest(payload));
  return response.data;
};

export const atualizarUsuario = async (
  id: string,
  payload: UsuarioPayload,
) => {
  const response = await api.put(`/api/users/${id}`, toUserRequest(payload));
  return response.data;
};

export const excluirUsuario = async (id: string) => {
  const response = await api.delete(`/api/users/${id}`);
  return response.data;
};
