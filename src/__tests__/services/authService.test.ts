import { describe, it, expect, vi, beforeEach } from 'vitest';
import { login, validarTokenReset, requestPasswordReset } from '../../services/authService';
import api from '../../services/api';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('deve enviar credenciais e retornar dados do usuário', async () => {
      const mockResponse = {
        data: {
          id: 1,
          email: 'admin@teste.com',
          role: 'ADMIN',
          token: 'jwt-token-123',
          isInitialPassword: false,
        },
      };
      mockedApi.post.mockResolvedValue(mockResponse);

      const result = await login({ user: 'admin', senha: '1234' });

      expect(mockedApi.post).toHaveBeenCalledWith('/auth/login', {
        user: 'admin',
        senha: '1234',
      });
      expect(result.token).toBe('jwt-token-123');
      expect(result.role).toBe('ADMIN');
    });

    it('deve propagar erro quando credenciais são inválidas', async () => {
      mockedApi.post.mockRejectedValue(new Error('Credenciais inválidas'));

      await expect(login({ user: 'admin', senha: 'errada' })).rejects.toThrow(
        'Credenciais inválidas',
      );
    });
  });

  describe('validarTokenReset', () => {
    it('deve retornar true quando token é válido', async () => {
      mockedApi.get.mockResolvedValue({ data: { valido: true } });

      const result = await validarTokenReset('token-valido');

      expect(mockedApi.get).toHaveBeenCalledWith('/auth/validar-token/token-valido');
      expect(result).toBe(true);
    });

    it('deve retornar false quando token é inválido', async () => {
      mockedApi.get.mockRejectedValue(new Error('Token inválido'));

      const result = await validarTokenReset('token-invalido');

      expect(result).toBe(false);
    });
  });

  describe('requestPasswordReset', () => {
    it('deve retornar mensagem de sucesso', async () => {
      mockedApi.post.mockResolvedValue({
        data: { mensagem: 'Link enviado com sucesso.' },
      });

      const result = await requestPasswordReset('user@email.com');

      expect(mockedApi.post).toHaveBeenCalledWith('/auth/esqueci-senha', {
        email: 'user@email.com',
      });
      expect(result.mensagem).toBe('Link enviado com sucesso.');
    });

    it('deve retornar mensagem genérica em caso de erro', async () => {
      mockedApi.post.mockRejectedValue(new Error('Erro'));

      const result = await requestPasswordReset('nao-existe@email.com');

      expect(result.mensagem).toContain('link para redefinição será enviado');
    });
  });
});
