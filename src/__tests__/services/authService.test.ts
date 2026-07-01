import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  login,
  validarTokenReset,
  requestPasswordReset,
} from '../../services/authService';
import api from '../../services/api';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('login uses the v2 contract and maps the response', async () => {
    mockedApi.post.mockResolvedValue({
      data: {
        id: 'user-1',
        email: 'admin@test.com',
        role: 'ADMIN',
        token: 'jwt-token-123',
        initialPasswordChange: false,
        readerRegistrationNumber: '2024001',
      },
    });

    const result = await login({ user: 'admin', senha: '1234' });

    expect(mockedApi.post).toHaveBeenCalledWith('/api/auth/login', {
      username: 'admin',
      password: '1234',
    });
    expect(result.token).toBe('jwt-token-123');
    expect(result.matriculaLeitor).toBe('2024001');
  });

  it('validarTokenReset returns true for a valid v2 token', async () => {
    mockedApi.get.mockResolvedValue({ data: { valid: true } });

    const result = await validarTokenReset('token-valido');

    expect(mockedApi.get).toHaveBeenCalledWith(
      '/api/auth/validate-token/token-valido',
    );
    expect(result).toBe(true);
  });

  it('requestPasswordReset calls the v2 endpoint and returns a generic message', async () => {
    mockedApi.post.mockResolvedValue({ data: {} });

    const result = await requestPasswordReset('user@email.com');

    expect(mockedApi.post).toHaveBeenCalledWith('/api/auth/forgot-password', {
      email: 'user@email.com',
    });
    expect(result.mensagem).toContain('link para redefini');
  });
});
