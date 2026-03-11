import { describe, it, expect, vi } from 'vitest';
import { getErrorMessage } from '../../utils/errorHandler';

// Mock do axios para simular erros de API
vi.mock('axios', () => ({
  default: {
    isAxiosError: (error: unknown): boolean => {
      return (
        typeof error === 'object' && error !== null && '_isAxiosError' in error
      );
    },
  },
  isAxiosError: (error: unknown): boolean => {
    return (
      typeof error === 'object' && error !== null && '_isAxiosError' in error
    );
  },
}));

describe('getErrorMessage', () => {
  it('deve retornar a mensagem de um erro genérico do JavaScript', () => {
    const error = new Error('Algo deu errado');
    expect(getErrorMessage(error)).toBe('Algo deu errado');
  });

  it('deve retornar a mensagem padrão quando o erro não tem mensagem', () => {
    expect(getErrorMessage(null)).toBe('Ocorreu um erro inesperado.');
    expect(getErrorMessage(undefined)).toBe('Ocorreu um erro inesperado.');
  });

  it('deve retornar mensagem personalizada como fallback', () => {
    expect(getErrorMessage(null, 'Erro customizado')).toBe('Erro customizado');
  });

  it('deve extrair mensagem de erro do Axios (response.data.mensagem)', () => {
    const axiosError = {
      _isAxiosError: true,
      response: {
        data: { mensagem: 'Matrícula já cadastrada' },
      },
    };
    expect(getErrorMessage(axiosError)).toBe('Matrícula já cadastrada');
  });

  it('deve extrair mensagem de erro do Axios (response.data.message)', () => {
    const axiosError = {
      _isAxiosError: true,
      response: {
        data: { message: 'Token expirado' },
      },
    };
    expect(getErrorMessage(axiosError)).toBe('Token expirado');
  });

  it('deve converter strings para mensagem de erro', () => {
    expect(getErrorMessage('Erro de rede')).toBe('Erro de rede');
  });
});
