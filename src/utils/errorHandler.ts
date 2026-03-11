import axios from 'axios';

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
