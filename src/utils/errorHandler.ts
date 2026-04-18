import axios from 'axios';

export type ErrorKind = 'validation' | 'authorization' | 'network' | 'unexpected';

/**
 * Extrai a mensagem de erro de forma segura, verificando se é um erro do Axios (API)
 * ou um erro genérico do JavaScript.
 */
export function getErrorMessage(
  error: unknown,
  defaultMessage = 'Ocorreu um erro inesperado.',
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

export function getErrorTitle(error: unknown): string {
  const kind = getErrorKind(error);

  switch (kind) {
    case 'validation':
      return 'Verifique os dados';
    case 'authorization':
      return 'Acesso não autorizado';
    case 'network':
      return 'Falha de conexão';
    default:
      return 'Erro inesperado';
  }
}
