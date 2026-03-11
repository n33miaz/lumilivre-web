import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import { ProtectedRoute } from '../../components/ProtectedRoute';
import * as AuthContext from '../../contexts/AuthContext';

// Mock do hook useAuth
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('Componente: ProtectedRoute', () => {
  it('deve redirecionar para /login quando não estiver autenticado', () => {
    // Simula usuário deslogado
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
      user: null,
      isLoggingOut: false,
      login: vi.fn(),
      logout: vi.fn(),
      logoutWithAnimation: vi.fn(),
      completePasswordChange: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/login" element={<div>Página de Login</div>} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Conteúdo do Dashboard</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    // Verifica se foi redirecionado para o login e o dashboard não apareceu
    expect(screen.getByText('Página de Login')).toBeInTheDocument();
    expect(screen.queryByText('Conteúdo do Dashboard')).not.toBeInTheDocument();
  });

  it('deve renderizar o conteúdo quando estiver autenticado', () => {
    // Simula usuário logado
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      user: { id: 1, email: 'admin@teste.com', role: 'ADMIN', token: '123' },
      isLoggingOut: false,
      login: vi.fn(),
      logout: vi.fn(),
      logoutWithAnimation: vi.fn(),
      completePasswordChange: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Conteúdo do Dashboard</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    // Verifica se o conteúdo protegido foi renderizado
    expect(screen.getByText('Conteúdo do Dashboard')).toBeInTheDocument();
  });
});
