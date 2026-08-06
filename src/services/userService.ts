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
  /**
   * Estados **independentes**: `ativo=false` é desligamento administrativo (a
   * pessoa saiu da escola) e `bloqueado=true` é bloqueio de segurança. Uma
   * conta pode estar desativada e bloqueada ao mesmo tempo, então não dá para
   * reduzir os dois a um seletor de três posições.
   */
  ativo: boolean;
  bloqueado: boolean;
}

/** Corpo do `PATCH /status`: campo omitido fica inalterado no servidor. */
export interface UsuarioStatusPayload {
  ativo?: boolean;
  bloqueado?: boolean;
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
    // `?? true` / `?? false` cobrem o backend antigo, que não mandava os
    // campos: sem eles toda conta apareceria bloqueada na tela.
    ativo: (item.active as boolean | undefined) ?? true,
    bloqueado: (item.locked as boolean | undefined) ?? false,
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

/**
 * Liga/desliga acesso da conta. Manda **só** o interruptor que mudou: o campo
 * omitido é preservado pelo servidor, então enviar os dois sempre sobrescreveria
 * um estado que outra pessoa acabou de mudar.
 *
 * Recusas (auto-desativação, último admin, nada a mudar) voltam como 400 com
 * `message` já traduzida — quem chama deve mostrar o texto da API.
 */
export const alterarStatusUsuario = async (
  id: string,
  payload: UsuarioStatusPayload,
): Promise<UsuarioResumo> => {
  const response = await api.patch(`/api/users/${id}/status`, {
    active: payload.ativo,
    locked: payload.bloqueado,
  });
  return mapUserSummary(response.data);
};
