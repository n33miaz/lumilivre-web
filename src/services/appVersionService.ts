import api from './api';

/** Plataformas suportadas para o controle de versão do app (WS-08/WS-09). */
export type AppPlatform = 'ANDROID' | 'IOS';

/** Tipo interno (pt-BR) da versão do app, mapeado da resposta EN da API. */
export interface VersaoApp {
  plataforma: AppPlatform;
  versaoMaisRecente: string;
  buildMaisRecente: number;
  versaoMinima: string;
  buildMinimo: number;
  forcarAtualizacao: boolean;
  mensagemAtualizacao: string;
  /** URL da loja da plataforma consultada (Android → Play, iOS → App Store). */
  urlLoja: string;
  atualizadoEm: string | null;
  atualizadoPor: string | null;
}

/** Payload interno (pt-BR) enviado ao salvar; mapeado para o corpo EN da API. */
export interface VersaoAppPayload {
  plataforma: AppPlatform;
  versaoMaisRecente: string;
  buildMaisRecente: number;
  versaoMinima: string;
  buildMinimo: number;
  forcarAtualizacao: boolean;
  mensagemAtualizacao?: string;
  urlLoja?: string;
}

const mapAppVersion = (item: Record<string, unknown>): VersaoApp => ({
  plataforma: (item.platform as AppPlatform) ?? 'ANDROID',
  versaoMaisRecente: (item.latestVersion as string) ?? '',
  buildMaisRecente: (item.latestBuild as number) ?? 0,
  versaoMinima: (item.minSupportedVersion as string) ?? '',
  buildMinimo: (item.minSupportedBuild as number) ?? 0,
  forcarAtualizacao: Boolean(item.forceUpdate),
  mensagemAtualizacao: (item.updateMessage as string) ?? '',
  urlLoja: (item.storeUrl as string) ?? '',
  atualizadoEm: (item.updatedAt as string) ?? null,
  atualizadoPor: (item.updatedBy as string) ?? null,
});

const toAppVersionRequest = (payload: VersaoAppPayload) => ({
  platform: payload.plataforma,
  latestVersion: payload.versaoMaisRecente,
  latestBuild: payload.buildMaisRecente,
  minSupportedVersion: payload.versaoMinima,
  minSupportedBuild: payload.buildMinimo,
  forceUpdate: payload.forcarAtualizacao,
  updateMessage: payload.mensagemAtualizacao || null,
  // O GET devolve `storeUrl` da plataforma consultada; o PUT aceita as duas
  // colunas. Gravamos a URL apenas na coluna da plataforma editada.
  storeUrlAndroid:
    payload.plataforma === 'ANDROID' ? payload.urlLoja || null : null,
  storeUrlIos: payload.plataforma === 'IOS' ? payload.urlLoja || null : null,
});

export const getAppVersion = async (
  platform: AppPlatform,
): Promise<VersaoApp> => {
  const response = await api.get('/api/app-version', { params: { platform } });
  return mapAppVersion(response.data);
};

export const updateAppVersion = async (
  payload: VersaoAppPayload,
): Promise<VersaoApp> => {
  const response = await api.put(
    '/api/app-version',
    toAppVersionRequest(payload),
  );
  return mapAppVersion(response.data);
};
