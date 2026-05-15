import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

import { LoginPage } from '../../../pages/Auth/Login';
import { AuthProvider } from '../../../contexts/AuthContext';
import { ToastProvider } from '../../../contexts/ToastContext';
import i18n, { DEFAULT_LOCALE } from '../../../i18n';
import * as authService from '../../../services/authService';

// Mocks

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../../services/authService');
const mockedLogin = vi.mocked(authService.login);

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <ToastProvider>
      <AuthProvider>{children}</AuthProvider>
    </ToastProvider>
  </BrowserRouter>
);

describe('Página: Login', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage(DEFAULT_LOCALE);
  });

  it('deve realizar login com sucesso e redirecionar para o dashboard', async () => {
    // Arrange: Prepara o mock da API para retornar sucesso
    mockedLogin.mockResolvedValue({
      id: 1,
      email: 'admin@lumilivre.com',
      role: 'ADMIN',
      token: 'fake-jwt-token',
      isInitialPassword: false,
    });

    render(<LoginPage />, { wrapper });

    // Act: Preenche os campos e clica no botão
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'admin@lumilivre.com' },
    });
    fireEvent.change(screen.getByLabelText(/Senha/i), {
      target: { value: 'senha123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /ENTRAR/i }));

    // Assert: Verifica se a API foi chamada e o redirecionamento ocorreu
    await waitFor(() => {
      expect(mockedLogin).toHaveBeenCalledWith({
        user: 'admin@lumilivre.com',
        senha: 'senha123',
      });
    });

    // O redirecionamento no seu código tem um setTimeout de 500ms
    await waitFor(
      () => {
        expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard');
      },
      { timeout: 1000 },
    );
  });

  it('deve exibir erro ao falhar no login', async () => {
    // Arrange: Simula erro na API
    mockedLogin.mockRejectedValue(new Error('Credenciais inválidas'));

    render(<LoginPage />, { wrapper });

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'errado@lumilivre.com' },
    });
    fireEvent.change(screen.getByLabelText(/Senha/i), {
      target: { value: 'senhaerrada' },
    });

    fireEvent.click(screen.getByRole('button', { name: /ENTRAR/i }));

    // Assert: Verifica se o botão volta ao estado normal (não está mais carregando)
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /ENTRAR/i }),
      ).not.toBeDisabled();
    });

    // O Toast de erro será renderizado na tela
    expect(screen.getByText('Falha no Login')).toBeInTheDocument();
  });
});
