import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type DashboardView = 'analytics' | 'tables';

export interface AnalyticsFingerprint {
  ativos: number;
  atrasados: number;
  concluidos: number;
  solicitacoesPendentes: number;
  reservasAguardando: number;
}

export interface TablesFingerprint {
  solicitacoesCount: number;
  emprestimosCount: number;
}

interface Baseline {
  analytics: AnalyticsFingerprint | null;
  tables: TablesFingerprint | null;
  updatedAt: string;
}

interface UseDashboardViewAlertsParams {
  view: DashboardView;
  analytics: AnalyticsFingerprint | null;
  tables: TablesFingerprint | null;
  storageKey?: string;
}

interface UseDashboardViewAlertsResult {
  analyticsHasNews: boolean;
  tablesHasNews: boolean;
  acknowledge: (view: DashboardView) => void;
}

const DEFAULT_KEY = 'lumilivre.dashboard.baseline';

const emptyBaseline = (): Baseline => ({
  analytics: null,
  tables: null,
  updatedAt: new Date(0).toISOString(),
});

const isAnalyticsFingerprint = (v: unknown): v is AnalyticsFingerprint => {
  if (!v || typeof v !== 'object') return false;
  const keys: (keyof AnalyticsFingerprint)[] = [
    'ativos',
    'atrasados',
    'concluidos',
    'solicitacoesPendentes',
    'reservasAguardando',
  ];
  return keys.every((k) => typeof (v as Record<string, unknown>)[k] === 'number');
};

const isTablesFingerprint = (v: unknown): v is TablesFingerprint => {
  if (!v || typeof v !== 'object') return false;
  const obj = v as Record<string, unknown>;
  return (
    typeof obj.solicitacoesCount === 'number' &&
    typeof obj.emprestimosCount === 'number'
  );
};

const parseBaseline = (raw: string | null): Baseline => {
  if (!raw) return emptyBaseline();
  try {
    const parsed = JSON.parse(raw) as Partial<Baseline>;
    return {
      analytics: isAnalyticsFingerprint(parsed.analytics) ? parsed.analytics : null,
      tables: isTablesFingerprint(parsed.tables) ? parsed.tables : null,
      updatedAt:
        typeof parsed.updatedAt === 'string'
          ? parsed.updatedAt
          : new Date(0).toISOString(),
    };
  } catch {
    return emptyBaseline();
  }
};

const hasAnalyticsNews = (
  current: AnalyticsFingerprint | null,
  baseline: AnalyticsFingerprint | null,
): boolean => {
  if (!current) return false;
  if (!baseline) return false;
  return (
    current.ativos > baseline.ativos ||
    current.atrasados > baseline.atrasados ||
    current.concluidos > baseline.concluidos ||
    current.solicitacoesPendentes > baseline.solicitacoesPendentes ||
    current.reservasAguardando > baseline.reservasAguardando
  );
};

const hasTablesNews = (
  current: TablesFingerprint | null,
  baseline: TablesFingerprint | null,
): boolean => {
  if (!current) return false;
  if (!baseline) return false;
  return (
    current.solicitacoesCount > baseline.solicitacoesCount ||
    current.emprestimosCount > baseline.emprestimosCount
  );
};

export function useDashboardViewAlerts({
  view,
  analytics,
  tables,
  storageKey = DEFAULT_KEY,
}: UseDashboardViewAlertsParams): UseDashboardViewAlertsResult {
  const readBaseline = useCallback((): Baseline => {
    if (typeof window === 'undefined') return emptyBaseline();
    return parseBaseline(window.localStorage.getItem(storageKey));
  }, [storageKey]);

  const [baseline, setBaseline] = useState<Baseline>(() => readBaseline());

  const persist = useCallback(
    (next: Baseline) => {
      setBaseline(next);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      }
    },
    [storageKey],
  );

  const lastSnapshotRef = useRef<{ analytics?: string; tables?: string }>({});

  useEffect(() => {
    if (view !== 'analytics' || !analytics) return;
    const fingerprint = JSON.stringify(analytics);
    if (lastSnapshotRef.current.analytics === fingerprint) return;
    lastSnapshotRef.current.analytics = fingerprint;
    persist({
      ...baseline,
      analytics,
      updatedAt: new Date().toISOString(),
    });
  }, [view, analytics, baseline, persist]);

  useEffect(() => {
    if (view !== 'tables' || !tables) return;
    const fingerprint = JSON.stringify(tables);
    if (lastSnapshotRef.current.tables === fingerprint) return;
    lastSnapshotRef.current.tables = fingerprint;
    persist({
      ...baseline,
      tables,
      updatedAt: new Date().toISOString(),
    });
  }, [view, tables, baseline, persist]);

  useEffect(() => {
    if (baseline.analytics || !analytics) return;
    persist({ ...baseline, analytics, updatedAt: new Date().toISOString() });
  }, [analytics, baseline, persist]);

  useEffect(() => {
    if (baseline.tables || !tables) return;
    persist({ ...baseline, tables, updatedAt: new Date().toISOString() });
  }, [tables, baseline, persist]);

  const analyticsHasNews = useMemo(
    () => view !== 'analytics' && hasAnalyticsNews(analytics, baseline.analytics),
    [view, analytics, baseline.analytics],
  );

  const tablesHasNews = useMemo(
    () => view !== 'tables' && hasTablesNews(tables, baseline.tables),
    [view, tables, baseline.tables],
  );

  const acknowledge = useCallback(
    (target: DashboardView) => {
      if (target === 'analytics' && analytics) {
        persist({
          ...baseline,
          analytics,
          updatedAt: new Date().toISOString(),
        });
      } else if (target === 'tables' && tables) {
        persist({
          ...baseline,
          tables,
          updatedAt: new Date().toISOString(),
        });
      }
    },
    [analytics, tables, baseline, persist],
  );

  return { analyticsHasNews, tablesHasNews, acknowledge };
}
