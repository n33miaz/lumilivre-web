import axios, { type InternalAxiosRequestConfig } from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL; // http://localhost:8080

if (import.meta.env.DEV) {
  console.info('API base URL:', baseURL);
}

/**
 * Teto padrão de uma chamada de tela.
 *
 * Sem teto — que era o caso — uma requisição para a instância hibernada do
 * Render fica pendurada até o timeout de rede do navegador: minutos, às vezes
 * a conexão nunca é encerrada. Nesse estado nenhum `AxiosError` é emitido, e
 * sem erro o `ApiHealthContext` não tem o que classificar: o ciclo de
 * health-check nunca começa e o aviso de "servidor reativando" nunca aparece.
 * A tela só congela. Este teto é o que transforma a hibernação em um erro que
 * alguém consegue ver.
 *
 * 20s é cerca de dez vezes o pior caso de um endpoint quente (lista paginada
 * com joins), então nenhuma chamada saudável é cortada por ele.
 */
export const DEFAULT_TIMEOUT_MS = 20_000;

/**
 * Teto das chamadas que demoram por natureza, não por doença: o servidor monta
 * o PDF do relatório sob demanda, e capa/avatar/anexo sobem o arquivo inteiro
 * por uma linha doméstica. Cortar essas em 20s viraria "falha de rede" num
 * relatório grande — e, pior, acenderia o aviso de servidor dormindo com o
 * servidor bem acordado.
 */
export const LONG_TIMEOUT_MS = 120_000;

const api = axios.create({
  baseURL: baseURL,
  timeout: DEFAULT_TIMEOUT_MS,
  // Identifica o canal para a auditoria de acessos. O app envia 'APP'.
  headers: {
    'X-Client': 'WEB',
  },
});

/** As duas formas que uma chamada longa tem: baixar arquivo ou subir arquivo. */
const isLongRequest = (config: InternalAxiosRequestConfig) =>
  config.responseType === 'blob' ||
  (typeof FormData !== 'undefined' && config.data instanceof FormData);

api.interceptors.request.use((config) => {
  // O axios funde os defaults ANTES de rodar os interceptors de requisição,
  // então `config.timeout` já chega preenchido. Um valor diferente do padrão só
  // pode ter vindo de quem chamou (o health-check pede o dele, mais curto) e é
  // respeitado; o padrão intocado é que ganha o teto largo. Assim a regra mora
  // num lugar só, e relatório e upload não precisam repetir a constante em cada
  // serviço para não serem cortados.
  if (config.timeout === DEFAULT_TIMEOUT_MS && isLongRequest(config)) {
    config.timeout = LONG_TIMEOUT_MS;
  }
  return config;
});

export default api;
