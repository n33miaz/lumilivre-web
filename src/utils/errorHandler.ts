import axios from 'axios';

import i18n from '../i18n';

export type ErrorKind = 'validation' | 'authorization' | 'network' | 'unexpected';

/**
 * Extrai a mensagem de erro de forma segura, verificando se é um erro do Axios (API)
 * ou um erro genérico do JavaScript.
 */
export function getErrorMessage(
  error: unknown,
  defaultMessage = i18n.t('common:error.unexpected'),
): string {
  if (error === null || error === undefined) {
    return defaultMessage;
  }

  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.mensagem ||
      error.response?.data?.message ||
      defaultMessage
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error || defaultMessage;
  }

  return defaultMessage;
}

export function getErrorKind(error: unknown): ErrorKind {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return 'network';
    }

    if (error.response.status === 400 || error.response.status === 422) {
      return 'validation';
    }

    if (error.response.status === 401 || error.response.status === 403) {
      return 'authorization';
    }
  }

  return 'unexpected';
}

/**
 * Traduz pela instância global do i18next (e não por hook) porque estes helpers
 * também rodam fora de componente — o `queryErrorHandler` do TanStack Query, por
 * exemplo, é chamado pelo cliente, sem árvore React por perto.
 */
export function getErrorTitle(error: unknown): string {
  const kind = getErrorKind(error);

  switch (kind) {
    case 'validation':
      return i18n.t('common:error.title.validation');
    case 'authorization':
      return i18n.t('common:error.title.authorization');
    case 'network':
      return i18n.t('common:error.title.network');
    default:
      return i18n.t('common:error.title.unexpected');
  }
}
