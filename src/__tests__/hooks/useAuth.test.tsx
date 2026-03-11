import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { ToastProvider } from '../../contexts/ToastContext';
import React from 'react';

// Mock do React Router
const navigateMock = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

// Wrapper Helper
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <ToastProvider>
      <AuthProvider>{children}</AuthProvider>
    </ToastProvider>
  </BrowserRouter>
);

describe('Hook: useAuth', () => {
  // Limpa os mocks e o localStorage antes de cada teste para garantir isolamento
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deve iniciar com o usuário não autenticado', () => {
    // Renderiza o hook usando nosso wrapper
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('deve autenticar o usuário corretamente ao chamar a função login', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Espiona o localStorage para verificar se o 'setItem' é chamado
    const localStorageSpy = vi.spyOn(Storage.prototype, 'setItem');

    const mockUser = {
      id: 1,
      email: 'teste@lumilivre.com',
      role: 'ADMIN',
      token: 'fake-token-123',
    };

    // 'act' é usado para envolver qualquer código que cause uma atualização de estado no React
    act(() => {
      result.current.login(mockUser);
    });

    // Verifica o estado atualizado do hook
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);

    // Verifica se os dados foram salvos corretamente no localStorage
    expect(localStorageSpy).toHaveBeenCalledWith(
      'user',
      JSON.stringify(mockUser),
    );
  });

  it('deve deslogar o usuário corretamente ao chamar a função logout', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    const localStorageRemoveSpy = vi.spyOn(Storage.prototype, 'removeItem');

    const mockUser = {
      id: 1,
      email: 'teste@lumilivre.com',
      role: 'ADMIN',
      token: 'fake-token-123',
    };

    // Primeiro, fazemos o login
    act(() => {
      result.current.login(mockUser);
    });

    // Confirma que o login funcionou
    expect(result.current.isAuthenticated).toBe(true);

    // Agora, executa o logout
    act(() => {
      result.current.logout();
    });

    // Verifica se o estado foi resetado
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();

    // Verifica se o localStorage foi limpo
    expect(localStorageRemoveSpy).toHaveBeenCalledWith('user');

    // Verifica se o usuário foi redirecionado para a página de login
    expect(navigateMock).toHaveBeenCalledWith('/login');
  });
});
