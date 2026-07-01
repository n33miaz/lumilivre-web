import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import type { AxiosAdapter, AxiosError } from 'axios';
import React from 'react';
import api from '../../services/api';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { ToastProvider } from '../../contexts/ToastContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter initialEntries={['/protected']}>
    <ToastProvider>
      <AuthProvider>
        <Routes>
          <Route path="/protected" element={<>{children}</>} />
          <Route path="/login" element={<div data-testid="login-page" />} />
        </Routes>
      </AuthProvider>
    </ToastProvider>
  </MemoryRouter>
);

const rejectWith = (status: number): AxiosAdapter => (config) =>
  Promise.reject({
    isAxiosError: true,
    name: 'AxiosError',
    message: 'Request failed',
    config,
    response: { status, data: {}, statusText: '', headers: {}, config },
  } satisfies Partial<AxiosError> as unknown as AxiosError);

describe('AuthContext — logout on 401', () => {
  const originalAdapter = api.defaults.adapter;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    api.defaults.adapter = originalAdapter;
  });

  it('does not force logout when 401 comes from /auth/login', async () => {
    api.defaults.adapter = rejectWith(401);

    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login({
        id: 1,
        email: 'admin@lumilivre.test',
        role: 'ADMIN',
        token: 'jwt-token',
      });
    });

    await expect(
      api.post('/auth/login', { email: 'x', senha: 'y' }),
    ).rejects.toBeDefined();

    expect(result.current.isAuthenticated).toBe(true);
  });

  it('forces logout when 401 comes from a protected route', async () => {
    api.defaults.adapter = rejectWith(401);

    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login({
        id: 1,
        email: 'admin@lumilivre.test',
        role: 'ADMIN',
        token: 'jwt-token',
      });
    });

    await expect(api.get('/api/readers/me')).rejects.toBeDefined();

    await waitFor(() => expect(result.current.isAuthenticated).toBe(false));
  });
});
