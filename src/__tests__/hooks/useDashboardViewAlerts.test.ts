import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  useDashboardViewAlerts,
  type AnalyticsFingerprint,
  type DashboardView,
  type TablesFingerprint,
} from '../../hooks/useDashboardViewAlerts';

const STORAGE_KEY = 'lumilivre.dashboard.baseline.test';

const baseAnalytics: AnalyticsFingerprint = {
  ativos: 10,
  atrasados: 2,
  concluidos: 50,
  solicitacoesPendentes: 3,
  reservasAguardando: 1,
};

const baseTables: TablesFingerprint = {
  solicitacoesCount: 3,
  emprestimosCount: 4,
};

interface RenderParams {
  view: DashboardView;
  analytics: AnalyticsFingerprint | null;
  tables: TablesFingerprint | null;
}

const renderAlerts = (initial: RenderParams) =>
  renderHook(
    ({ view, analytics, tables }: RenderParams) =>
      useDashboardViewAlerts({ view, analytics, tables, storageKey: STORAGE_KEY }),
    { initialProps: initial },
  );

describe('useDashboardViewAlerts', () => {
  beforeEach(() => {
    window.localStorage.removeItem(STORAGE_KEY);
  });

  it('primeira renderização sem baseline não acende nenhum badge', () => {
    const { result } = renderAlerts({
      view: 'analytics',
      analytics: baseAnalytics,
      tables: baseTables,
    });

    expect(result.current.analyticsHasNews).toBe(false);
    expect(result.current.tablesHasNews).toBe(false);
  });

  it('analytics: counter sobe enquanto usuário está em tables acende badge', () => {
    const { result, rerender } = renderAlerts({
      view: 'tables',
      analytics: baseAnalytics,
      tables: baseTables,
    });

    rerender({
      view: 'tables',
      analytics: { ...baseAnalytics, solicitacoesPendentes: 5 },
      tables: baseTables,
    });

    expect(result.current.analyticsHasNews).toBe(true);
    expect(result.current.tablesHasNews).toBe(false);
  });

  it('tables: counter cair NÃO acende badge', () => {
    const { result, rerender } = renderAlerts({
      view: 'analytics',
      analytics: baseAnalytics,
      tables: baseTables,
    });

    rerender({
      view: 'analytics',
      analytics: baseAnalytics,
      tables: { ...baseTables, emprestimosCount: 1 },
    });

    expect(result.current.tablesHasNews).toBe(false);
  });

  it('entrar na view zera o badge dessa view', () => {
    const { result, rerender } = renderAlerts({
      view: 'tables',
      analytics: baseAnalytics,
      tables: baseTables,
    });

    rerender({
      view: 'tables',
      analytics: { ...baseAnalytics, solicitacoesPendentes: 7 },
      tables: baseTables,
    });

    expect(result.current.analyticsHasNews).toBe(true);

    rerender({
      view: 'analytics',
      analytics: { ...baseAnalytics, solicitacoesPendentes: 7 },
      tables: baseTables,
    });

    expect(result.current.analyticsHasNews).toBe(false);
  });

  it('acknowledge manual atualiza baseline da view alvo', () => {
    const { result, rerender } = renderAlerts({
      view: 'analytics',
      analytics: baseAnalytics,
      tables: baseTables,
    });

    rerender({
      view: 'analytics',
      analytics: baseAnalytics,
      tables: { ...baseTables, solicitacoesCount: 10 },
    });

    expect(result.current.tablesHasNews).toBe(true);

    act(() => {
      result.current.acknowledge('tables');
    });

    expect(result.current.tablesHasNews).toBe(false);
  });

  it('persiste baseline em localStorage', () => {
    renderAlerts({
      view: 'analytics',
      analytics: baseAnalytics,
      tables: baseTables,
    });

    const raw = window.localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw as string);
    expect(parsed.analytics).toMatchObject(baseAnalytics);
  });

  it('descarta baseline corrompida em localStorage', () => {
    window.localStorage.setItem(STORAGE_KEY, '{not-json');

    const { result } = renderAlerts({
      view: 'analytics',
      analytics: baseAnalytics,
      tables: baseTables,
    });

    expect(result.current.analyticsHasNews).toBe(false);
    expect(result.current.tablesHasNews).toBe(false);
  });
});
