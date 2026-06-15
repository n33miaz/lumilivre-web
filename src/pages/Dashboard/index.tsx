import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { FileDown, FileSpreadsheet, RefreshCw } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { StatCard } from '../../components/ui/StatCard';
import {
  DashboardViewToggle,
  type DashboardTablesAlert,
} from '../../components/ui/DashboardViewToggle';
import { SlideStage } from '../../components/ui/SlideStage';
import { TableFooter } from '../../components/ui/TableFooter';
import { Modal } from '../../components/ui/Modal';
import { ModalLoanDetails } from '../../features/loans/LoanModalDetails';
import { LoanModalRequest } from '../../features/loans/LoanModalRequest';
import { formatarNome } from '../../utils/formatters';
import { useToast } from '../../contexts/ToastContext';
import {
  useDashboardViewAlerts,
  type AnalyticsFingerprint,
  type DashboardView,
  type TablesFingerprint,
} from '../../hooks/useDashboardViewAlerts';
import { ChartCard } from './components/ChartCard';
import {
  PeriodDropdown,
  type CustomRange,
  type DashboardPeriod,
} from './components/PeriodDropdown';

import {
  useDashboardStats,
  useDashboardListas,
  useDashboardAnalytics,
} from '../../hooks/useDashboardQueries';
import {
  exportDashboardXlsx,
  exportDashboardPdf,
  type DashboardReport,
  type ReportTable,
} from '../../utils/dashboardExport';

import BookIcon from '../../assets/icons/books-active.svg?react';
import UsersIcon from '../../assets/icons/users-active.svg?react';
import AlertIcon from '../../assets/icons/alert.svg?react';
import LoansIcon from '../../assets/icons/loans-active.svg?react';
import type { EmprestimoAtivoDTO } from '../../services/loanService';

const CHART_COLORS = ['#762075', '#0f766e', '#dc2626', '#ca8a04', '#2563eb'];
const DASHBOARD_VIEW_STORAGE_KEY = 'lumilivre.dashboard.view';

const readStoredView = (): DashboardView => {
  if (typeof window === 'undefined') return 'analytics';
  const stored = window.localStorage.getItem(DASHBOARD_VIEW_STORAGE_KEY);
  return stored === 'tables' ? 'tables' : 'analytics';
};

interface EmprestimoVencer {
  id: string;
  livro: string;
  isbn: string;
  aluno: string;
  alunoMatricula: string;
  tombo: string;
  retirada: string;
  devolucao: string;
  rawDevolucao: string;
  statusVencimento: 'atrasado' | 'vence-hoje' | 'ativo';
}

interface SolicitacaoDisplay {
  id: string;
  aluno: string;
  alunoMatricula?: string;
  livro: string;
  exemplarTombo?: string;
  solicitacao: Date;
  rawDataSolicitacao: string;
}

const PERIOD_MONTHS: Record<'30d' | '60d' | '90d', number> = {
  '30d': 1,
  '60d': 2,
  '90d': 3,
};

/**
 * Mini-tendências decorativas no canto inferior direito dos cards (paridade com
 * o protótipo). O card de empréstimos usa a série real (loansSparkline); os
 * demais não possuem série temporal própria, então recebem um traçado ambiente
 * estável — arte sutil em opacity-60, sem eixos nem rótulos, apenas ritmo
 * visual. Mantidos como constantes para não remontar a cada render.
 */
const SPARK_BOOKS = [8, 10, 13, 18, 16, 21, 23, 25];
const SPARK_STUDENTS = [10, 14, 11, 17, 19, 16, 21, 24];
const SPARK_OVERDUE = [22, 18, 20, 14, 16, 11, 9, 7];

/** Client-side pagination for the small dashboard widget tables. */
function useClientPagination<T>(items: T[], initialSize = 10) {
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(initialSize);
  const totalPages = Math.max(1, Math.ceil(items.length / size));
  const currentPage = Math.min(page, totalPages);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paged = items.slice((currentPage - 1) * size, currentPage * size);
  return {
    paged,
    page: currentPage,
    setPage,
    size,
    setSize,
    totalPages,
    total: items.length,
  };
}

export function DashboardPage() {
  const { t, i18n } = useTranslation('dashboard');
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [view, setView] = useState<DashboardView>(() => readStoredView());
  const [period, setPeriod] = useState<DashboardPeriod>('90d');
  const [customRange, setCustomRange] = useState<CustomRange>({
    start: '',
    end: '',
  });
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    window.localStorage.setItem(DASHBOARD_VIEW_STORAGE_KEY, view);
  }, [view]);

  const {
    data: statsData,
    isLoading: isStatsLoading,
    error: statsError,
  } = useDashboardStats();
  const { solicitacoes, emprestimos } = useDashboardListas();
  const { statsGerenciais, topLivros, emprestimosPorMes } =
    useDashboardAnalytics();

  const [shouldAnimateStats, setShouldAnimateStats] = useState(false);
  useEffect(() => {
    if (isStatsLoading) setShouldAnimateStats(true);
  }, [isStatsLoading]);

  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<{
    id: string;
    alunoMatricula: string;
    livroIsbn: string;
    livroNome?: string;
    exemplarTombo: string;
    dataEmprestimo: string;
    dataDevolucao: string;
  } | null>(null);

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<{
    id: string;
    alunoNome: string;
    alunoMatricula?: string;
    livroNome: string;
    exemplarTombo?: string;
    dataSolicitacao: string;
  } | null>(null);

  const solicitacoesProcessadas = useMemo<SolicitacaoDisplay[]>(() => {
    if (!solicitacoes.data) return [];
    return solicitacoes.data.map((s) => ({
      id: s.id,
      aluno: s.alunoNome,
      alunoMatricula: s.alunoMatricula,
      livro: s.livroNome,
      exemplarTombo: s.exemplarTombo,
      solicitacao: new Date(s.dataSolicitacao),
      rawDataSolicitacao: s.dataSolicitacao,
    }));
  }, [solicitacoes.data]);

  const emprestimosProcessados = useMemo<EmprestimoVencer[]>(() => {
    if (!emprestimos.data) return [];
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    return emprestimos.data
      .map((e: EmprestimoAtivoDTO) => {
        const dataDevolucao = new Date(e.dataDevolucao + 'T00:00:00');
        dataDevolucao.setHours(0, 0, 0, 0);

        let statusVencimento: EmprestimoVencer['statusVencimento'] = 'ativo';
        if (e.statusEmprestimo === 'ATRASADO') {
          statusVencimento = 'atrasado';
        } else if (dataDevolucao.getTime() < hoje.getTime()) {
          statusVencimento = 'atrasado';
        } else if (dataDevolucao.getTime() === hoje.getTime()) {
          statusVencimento = 'vence-hoje';
        }

        return {
          id: e.id,
          livro: e.livroNome,
          isbn: '-',
          aluno: e.alunoNome,
          alunoMatricula: e.alunoMatricula,
          tombo: e.tombo,
          rawDevolucao: e.dataDevolucao,
          retirada: e.dataEmprestimo || '-',
          devolucao: dataDevolucao.toLocaleDateString(i18n.language),
          statusVencimento,
        };
      })
      .filter((item) => item.statusVencimento !== 'ativo');
  }, [emprestimos.data, i18n.language]);

  const requestsPagination = useClientPagination(solicitacoesProcessadas);
  const overduePagination = useClientPagination(emprestimosProcessados);

  const statusChartData = useMemo(() => {
    const data = statsGerenciais.data;
    if (!data) return [];
    return [
      { name: t('chart.status.active'), total: data.emprestimosAtivos },
      { name: t('chart.status.overdue'), total: data.emprestimosAtrasados },
      { name: t('chart.status.completed'), total: data.emprestimosConcluidos },
      { name: t('chart.status.requests'), total: data.solicitacoesPendentes },
      { name: t('chart.status.reservations'), total: data.reservasAguardando },
    ].filter((item) => item.total > 0);
  }, [statsGerenciais.data, t]);

  const filteredMonthly = useMemo(() => {
    const src = emprestimosPorMes.data ?? [];
    if (period === 'ytd') {
      const year = new Date().getFullYear();
      return src.filter(
        (item) => new Date(`${item.mes}T00:00:00`).getFullYear() === year,
      );
    }
    if (period === 'custom') {
      if (!customRange.start || !customRange.end) return src;
      const start = new Date(`${customRange.start}T00:00:00`);
      const end = new Date(`${customRange.end}T23:59:59`);
      return src.filter((item) => {
        const date = new Date(`${item.mes}T00:00:00`);
        return date >= start && date <= end;
      });
    }
    return src.slice(-PERIOD_MONTHS[period]);
  }, [emprestimosPorMes.data, period, customRange]);

  const monthlyChartData = useMemo(
    () =>
      filteredMonthly.map((item) => ({
        mes: new Date(`${item.mes}T00:00:00`).toLocaleDateString(
          i18n.language,
          { month: 'short', year: '2-digit' },
        ),
        total: item.total,
      })),
    [filteredMonthly, i18n.language],
  );

  const loansSparkline = useMemo(
    () => (emprestimosPorMes.data ?? []).map((item) => item.total).slice(-8),
    [emprestimosPorMes.data],
  );

  const topBooksChartData = useMemo(
    () =>
      (topLivros.data ?? []).slice(0, 5).map((item) => ({
        livro:
          item.titulo.length > 18 ? `${item.titulo.slice(0, 18)}…` : item.titulo,
        total: item.totalEmprestimos,
      })),
    [topLivros.data],
  );

  const dueStatusChartData = useMemo(() => {
    const atrasados = emprestimosProcessados.filter(
      (item) => item.statusVencimento === 'atrasado',
    ).length;
    const venceHoje = emprestimosProcessados.filter(
      (item) => item.statusVencimento === 'vence-hoje',
    ).length;
    return [
      { name: t('chart.due.overdue'), total: atrasados },
      { name: t('chart.due.due_today'), total: venceHoje },
    ].filter((item) => item.total > 0);
  }, [emprestimosProcessados, t]);

  const analyticsFingerprint = useMemo<AnalyticsFingerprint | null>(() => {
    const data = statsGerenciais.data;
    if (!data) return null;
    return {
      ativos: data.emprestimosAtivos,
      atrasados: data.emprestimosAtrasados,
      concluidos: data.emprestimosConcluidos,
      solicitacoesPendentes: data.solicitacoesPendentes,
      reservasAguardando: data.reservasAguardando,
    };
  }, [statsGerenciais.data]);

  const tablesFingerprint = useMemo<TablesFingerprint | null>(() => {
    if (!solicitacoes.data || !emprestimos.data) return null;
    return {
      solicitacoesCount: solicitacoes.data.length,
      emprestimosCount: emprestimosProcessados.length,
    };
  }, [solicitacoes.data, emprestimos.data, emprestimosProcessados]);

  const { analyticsHasNews, tablesHasNews } = useDashboardViewAlerts({
    view,
    analytics: analyticsFingerprint,
    tables: tablesFingerprint,
  });

  const tablesAlert: DashboardTablesAlert = useMemo(() => {
    const pending = statsGerenciais.data?.solicitacoesPendentes ?? 0;
    const overdue = statsGerenciais.data?.emprestimosAtrasados ?? 0;
    if (pending > 0) return 'requests';
    if (overdue > 0) return 'overdue';
    return 'none';
  }, [statsGerenciais.data]);

  const statusChartTotal = useMemo(
    () => statusChartData.reduce((sum, item) => sum + item.total, 0),
    [statusChartData],
  );
  const monthlyChartTotal = useMemo(
    () => monthlyChartData.reduce((sum, item) => sum + item.total, 0),
    [monthlyChartData],
  );
  const topBooksChartTotal = useMemo(
    () => topBooksChartData.reduce((sum, item) => sum + item.total, 0),
    [topBooksChartData],
  );
  const dueStatusChartTotal = useMemo(
    () => dueStatusChartData.reduce((sum, item) => sum + item.total, 0),
    [dueStatusChartData],
  );

  const [isRefreshingAnalytics, setIsRefreshingAnalytics] = useState(false);
  const isAnalyticsLoading =
    statsGerenciais.isLoading ||
    topLivros.isLoading ||
    emprestimosPorMes.isLoading;
  const [refreshedAt, setRefreshedAt] = useState<Date>(() => new Date());

  const handleRefreshAnalytics = async () => {
    if (isRefreshingAnalytics) return;
    setIsRefreshingAnalytics(true);
    const startedAt = Date.now();
    try {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['dashboard-gerencial-stats'],
        }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-top-livros'] }),
        queryClient.invalidateQueries({
          queryKey: ['dashboard-emprestimos-por-mes'],
        }),
      ]);
      setRefreshedAt(new Date());
    } finally {
      // Hold the spin a beat even when the cache resolves instantly.
      const MIN_SPIN_MS = 650;
      const remaining = Math.max(0, MIN_SPIN_MS - (Date.now() - startedAt));
      window.setTimeout(() => setIsRefreshingAnalytics(false), remaining);
    }
  };

  const buildDashboardReport = (): DashboardReport => {
    const indicators: ReportTable = {
      name: t('export.section.indicators', { defaultValue: 'Indicadores' }),
      columns: [t('export.csv.header.indicator'), t('export.csv.header.value')],
      rows: [],
    };
    if (statsData) {
      indicators.rows.push(
        [
          t('card.total_books', { defaultValue: 'Total de Livros' }),
          statsData.livros,
        ],
        [
          t('card.total_students', { defaultValue: 'Total de Alunos' }),
          statsData.alunos,
        ],
      );
    }
    if (statsGerenciais.data) {
      const g = statsGerenciais.data;
      indicators.rows.push(
        [t('export.csv.row.active_loans'), g.emprestimosAtivos],
        [t('export.csv.row.overdue_loans'), g.emprestimosAtrasados],
        [t('export.csv.row.completed_loans'), g.emprestimosConcluidos],
        [t('export.csv.row.avg_return_days'), g.mediaDiasDevolucao],
        [t('export.csv.row.pending_requests'), g.solicitacoesPendentes],
        [t('export.csv.row.waiting_reservations'), g.reservasAguardando],
      );
    }

    const topBooks: ReportTable = {
      name: t('chart.top_books', { defaultValue: 'Top Livros' }),
      columns: [
        t('table.column.book', { defaultValue: 'Livro' }),
        t('export.column.author', { defaultValue: 'Autor' }),
        t('export.column.loans', { defaultValue: 'Empréstimos' }),
      ],
      rows: (topLivros.data ?? []).map((item) => [
        item.titulo,
        item.autor ?? '—',
        item.totalEmprestimos,
      ]),
    };

    const byMonth: ReportTable = {
      name: t('chart.loans_per_month', { defaultValue: 'Empréstimos por Mês' }),
      columns: [
        t('export.column.month', { defaultValue: 'Mês' }),
        t('chart.total_label', { defaultValue: 'Total' }),
      ],
      rows: (emprestimosPorMes.data ?? []).map((item) => [
        new Date(`${item.mes}T00:00:00`).toLocaleDateString(i18n.language, {
          month: 'short',
          year: 'numeric',
        }),
        item.total,
      ]),
    };

    const generatedAt = new Date().toLocaleString(i18n.language, {
      dateStyle: 'short',
      timeStyle: 'short',
    });

    return {
      title: t('export.report.title', {
        defaultValue: 'Relatório do Dashboard',
      }),
      generatedAtLabel: t('export.report.generated_at', {
        date: generatedAt,
        defaultValue: `Gerado em ${generatedAt}`,
      }),
      tables: [indicators, topBooks, byMonth].filter(
        (table) => table.rows.length > 0,
      ),
    };
  };

  const handleExport = async (format: 'xlsx' | 'pdf') => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const report = buildDashboardReport();
      if (report.tables.length === 0) {
        addToast({
          type: 'info',
          title: t('export.empty.title', { defaultValue: 'Nada para exportar' }),
          description: t('export.empty.description', {
            defaultValue:
              'Ainda não há dados disponíveis para gerar o relatório.',
          }),
        });
        return;
      }
      const stamp = new Date().toISOString().slice(0, 10);
      const filename = `lumilivre-dashboard-${stamp}.${format}`;
      if (format === 'xlsx') {
        await exportDashboardXlsx(report, filename);
      } else {
        await exportDashboardPdf(report, filename);
      }
      setIsExportOpen(false);
    } catch (error) {
      console.error('Erro ao exportar dashboard:', error);
      addToast({
        type: 'error',
        title: t('export.error.title', { defaultValue: 'Falha ao exportar' }),
        description: t('export.error.description', {
          defaultValue: 'Não foi possível gerar o arquivo. Tente novamente.',
        }),
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleAbrirDetalhesEmprestimo = (item: EmprestimoVencer) => {
    setSelectedLoan({
      id: item.id,
      alunoMatricula: item.alunoMatricula,
      exemplarTombo: item.tombo,
      dataDevolucao: item.rawDevolucao,
      livroIsbn: item.isbn,
      livroNome: item.livro,
      dataEmprestimo: item.retirada,
    });
    setIsLoanModalOpen(true);
  };
  const handleFecharDetalhesEmprestimo = (foiAtualizado?: boolean) => {
    setIsLoanModalOpen(false);
    if (foiAtualizado) {
      emprestimos.refetch();
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    }
  };
  const handleAbrirDetalhesSolicitacao = (item: SolicitacaoDisplay) => {
    setSelectedRequest({
      id: item.id,
      alunoNome: item.aluno,
      alunoMatricula: item.alunoMatricula,
      livroNome: item.livro,
      exemplarTombo: item.exemplarTombo,
      dataSolicitacao: item.rawDataSolicitacao,
    });
    setIsRequestModalOpen(true);
  };
  const handleFecharDetalhesSolicitacao = (foiProcessado?: boolean) => {
    setIsRequestModalOpen(false);
    if (foiProcessado) {
      solicitacoes.refetch();
      emprestimos.refetch();
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    }
  };

  const todayLabel = useMemo(() => {
    const today = new Date();
    return today
      .toLocaleDateString(i18n.language, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
      .replace('.', '');
  }, [i18n.language]);

  return (
    <section className="space-y-6">
      <ModalLoanDetails
        isOpen={isLoanModalOpen}
        onClose={handleFecharDetalhesEmprestimo}
        emprestimo={selectedLoan}
      />
      <LoanModalRequest
        isOpen={isRequestModalOpen}
        onClose={handleFecharDetalhesSolicitacao}
        solicitacao={selectedRequest}
      />

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="text-xs font-semibold tracking-wider text-lumi-primary dark:text-lumi-label uppercase">
            {t('page.eyebrow', { defaultValue: 'Visão geral' })} · {todayLabel}
          </div>
          <h1 className="font-display font-extrabold text-3xl text-gray-900 dark:text-white mt-1">
            {t('page.title', { defaultValue: 'Dashboard' })}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('page.subtitle', {
              defaultValue: 'Visão geral da sua biblioteca ao vivo.',
            })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <PeriodDropdown
            value={period}
            onChange={setPeriod}
            customRange={customRange}
            onCustomRangeChange={setCustomRange}
          />
          <button
            type="button"
            onClick={handleRefreshAnalytics}
            disabled={isRefreshingAnalytics || isAnalyticsLoading}
            aria-label={t('section.management.refresh.aria')}
            title={t('section.management.refresh')}
            className="group h-9 w-9 rounded-lg bg-white dark:bg-dark-card border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-lumi-primary hover:text-lumi-primary active:scale-95 inline-flex items-center justify-center transition-[transform,color,border-color] duration-200 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 transition-transform duration-300 ease-out ${
                isRefreshingAnalytics
                  ? 'animate-spin-smooth'
                  : 'group-hover:-rotate-180'
              }`}
            />
          </button>
          <button
            type="button"
            onClick={() => setIsExportOpen(true)}
            className="h-9 px-3.5 rounded-lg bg-lumi-gradient text-white text-sm font-semibold inline-flex items-center gap-2 hover:shadow-glow"
          >
            <FileDown className="h-4 w-4" /> {t('button.export')}
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          to="/admin/books"
          Icon={BookIcon}
          title={t('stat.books')}
          value={statsData?.livros ?? 0}
          tone="lumi"
          isLoading={isStatsLoading}
          hasError={!!statsError}
          animate={shouldAnimateStats}
          sparkline={SPARK_BOOKS}
        />
        <StatCard
          to="/admin/students"
          Icon={UsersIcon}
          title={t('stat.students')}
          value={statsData?.alunos ?? 0}
          tone="blue"
          isLoading={isStatsLoading}
          hasError={!!statsError}
          animate={shouldAnimateStats}
          sparkline={SPARK_STUDENTS}
        />
        <StatCard
          to="/admin/loans"
          Icon={LoansIcon}
          title={t('stat.loans')}
          value={statsData?.emprestimosAtivos ?? 0}
          tone="violet"
          isLoading={isStatsLoading}
          hasError={!!statsError}
          animate={shouldAnimateStats}
          sparkline={loansSparkline}
          // badge={
          //   <span className="pill pill-purple">
          //     <span className="dot" />
          //     {t('chart.status.active')}
          //   </span>
          // }
        />
        <StatCard
          to="/admin/loans?filtro=atrasados"
          Icon={AlertIcon}
          title={t('stat.overdue')}
          value={statsData?.atrasados ?? 0}
          tone="danger"
          isLoading={isStatsLoading}
          hasError={!!statsError}
          animate={shouldAnimateStats}
          sparkline={SPARK_OVERDUE}
        />
      </div>

      {/* View toggle */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <DashboardViewToggle
          value={view}
          onChange={setView}
          analyticsHasNews={analyticsHasNews}
          tablesHasNews={tablesHasNews}
          tablesAlert={tablesAlert}
        />
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <RefreshedAgo
            at={refreshedAt}
            locale={i18n.language}
            label={t('refreshed_label', { defaultValue: 'Atualizado' })}
          />
        </div>
      </div>

      {/* Slide stage */}
      <SlideStage
        className="min-h-0"
        trackClassName="items-stretch"
        itemClassName=""
        currentIndex={view === 'analytics' ? 0 : 1}
        viewDataAttribute="dashboard-block"
        viewDataValues={['analytics', 'tables']}
        views={[
          <div
            key="analytics"
            className="grid grid-cols-1 lg:grid-cols-2 gap-4 pr-1"
          >
            <ChartCard
              eyebrow={t('chart.general_distribution_eyebrow', {
                defaultValue: 'Distribuição geral',
              })}
              title={t('chart.general_distribution_title', {
                defaultValue: 'Status dos Empréstimos',
              })}
              badge={
                statusChartTotal > 0 ? (
                  <span className="pill pill-purple">
                    <span className="dot" />
                    {statusChartTotal}
                  </span>
                ) : undefined
              }
              isLoading={isAnalyticsLoading}
              isEmpty={statusChartData.length === 0}
              emptyMessage={t('chart.no_data')}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ left: 4, right: 4 }}>
                  <Pie
                    data={statusChartData}
                    dataKey="total"
                    nameKey="name"
                    cx="65%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={66}
                    paddingAngle={2}
                  >
                    {statusChartData.map((_, index) => (
                      <Cell
                        key={`status-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend
                    layout="vertical"
                    verticalAlign="middle"
                    align="left"
                    iconType="circle"
                    wrapperStyle={{ fontSize: 11, fontWeight: 600 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              eyebrow={t('chart.activity_eyebrow', { defaultValue: 'Atividade' })}
              title={t('chart.loans_per_month')}
              badge={
                monthlyChartTotal > 0 ? (
                  <span className="pill pill-info">
                    <span className="dot" />
                    {monthlyChartTotal}
                  </span>
                ) : undefined
              }
              isLoading={isAnalyticsLoading}
              isEmpty={monthlyChartData.length === 0}
              emptyMessage={t('chart.no_data')}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} width={32} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#1D6FBF" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              eyebrow={t('chart.catalog_eyebrow', { defaultValue: 'Catálogo' })}
              title={t('chart.top_books')}
              badge={
                topBooksChartTotal > 0 ? (
                  <span className="pill pill-purple">
                    <span className="dot" />
                    top 5
                  </span>
                ) : undefined
              }
              isLoading={isAnalyticsLoading}
              isEmpty={topBooksChartData.length === 0}
              emptyMessage={t('chart.no_data')}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topBooksChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} hide />
                  <YAxis
                    type="category"
                    dataKey="livro"
                    width={90}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip />
                  <Bar dataKey="total" fill="#762075" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              eyebrow={t('chart.attention_eyebrow', { defaultValue: 'Atenção' })}
              title={t('chart.overdue_and_due', {
                defaultValue: 'Atrasos & Vencendo',
              })}
              badge={
                dueStatusChartTotal > 0 ? (
                  <span className="pill pill-danger">
                    <span className="dot" />
                    {dueStatusChartTotal}
                  </span>
                ) : undefined
              }
              isLoading={isAnalyticsLoading}
              isEmpty={dueStatusChartData.length === 0}
              emptyMessage={t('chart.no_overdue')}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dueStatusChartData}
                    dataKey="total"
                    nameKey="name"
                    outerRadius={70}
                    label
                  >
                    {dueStatusChartData.map((_, index) => (
                      <Cell
                        key={`due-${index}`}
                        fill={index === 0 ? '#dc2626' : '#ca8a04'}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>,

          <div
            key="tables"
            className="grid grid-cols-1 xl:grid-cols-2 gap-4 pl-1"
          >
            <DashboardTableCard
              title={t('section.requests')}
              subtitle={t('section.requests.subtitle', {
                defaultValue: 'Aguardam aprovação do bibliotecário',
              })}
              badge={
                solicitacoesProcessadas.length > 0 ? (
                  <span className="pill pill-warn">
                    <span className="dot" />
                    {solicitacoesProcessadas.length}{' '}
                    {t('open', { defaultValue: 'abertas' })}
                  </span>
                ) : (
                  <span className="pill pill-success">
                    <span className="dot" />
                    0
                  </span>
                )
              }
              isLoading={solicitacoes.isLoading}
              error={solicitacoes.error ? t('error.load') : null}
              empty={solicitacoesProcessadas.length === 0}
              emptyMessage={t('table.empty.requests')}
              footer={
                solicitacoesProcessadas.length > 0 ? (
                  <TableFooter
                    viewMode="exception"
                    pagination={{
                      currentPage: requestsPagination.page,
                      totalPages: requestsPagination.totalPages,
                      itemsPerPage: requestsPagination.size,
                      totalItems: requestsPagination.total,
                    }}
                    onPageChange={requestsPagination.setPage}
                    onItemsPerPageChange={(size) => {
                      requestsPagination.setSize(size);
                      requestsPagination.setPage(1);
                    }}
                  />
                ) : undefined
              }
            >
              <table className="w-full text-sm">
                <thead className="tbl-head-light text-[11px] font-bold uppercase">
                  <tr>
                    <th className="text-left px-5 py-3">
                      {t('table.column.student')}
                    </th>
                    <th className="text-left px-5 py-3">
                      {t('table.column.book')}
                    </th>
                    <th className="text-left px-5 py-3">
                      {t('table.column.requested_at')}
                    </th>
                    <th className="text-right px-5 py-3">{t('actions', { ns: 'common' })}</th>
                  </tr>
                </thead>
                <tbody>
                  {requestsPagination.paged.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t border-gray-100 dark:border-white/5 row-hover"
                    >
                      <td className="px-5 py-3 font-semibold dark:text-gray-200">
                        {formatarNome(item.aluno)}
                      </td>
                      <td className="px-5 py-3 text-gray-600 dark:text-gray-300 max-w-[240px] truncate">
                        {item.livro}
                      </td>
                      <td className="px-5 py-3 text-gray-600 dark:text-gray-300 font-mono text-xs">
                        {item.solicitacao.toLocaleDateString(i18n.language)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleAbrirDetalhesSolicitacao(item)}
                          className="pill pill-purple hover:bg-lumi-primary hover:text-white"
                        >
                          {t('common:button.details')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DashboardTableCard>

            <DashboardTableCard
              title={t('section.overdue_due')}
              subtitle={t('section.overdue_due.subtitle', {
                defaultValue: 'Empréstimos ativos próximos da data limite',
              })}
              badge={
                emprestimosProcessados.length > 0 ? (
                  <span className="pill pill-danger">
                    <span className="dot" />
                    {emprestimosProcessados.length}{' '}
                    {t('items', { defaultValue: 'itens' })}
                  </span>
                ) : (
                  <span className="pill pill-success">
                    <span className="dot" />
                    0
                  </span>
                )
              }
              isLoading={emprestimos.isLoading}
              error={emprestimos.error ? t('error.load') : null}
              empty={emprestimosProcessados.length === 0}
              emptyMessage={t('table.empty.loans')}
              footer={
                emprestimosProcessados.length > 0 ? (
                  <TableFooter
                    viewMode="exception"
                    pagination={{
                      currentPage: overduePagination.page,
                      totalPages: overduePagination.totalPages,
                      itemsPerPage: overduePagination.size,
                      totalItems: overduePagination.total,
                    }}
                    onPageChange={overduePagination.setPage}
                    onItemsPerPageChange={(size) => {
                      overduePagination.setSize(size);
                      overduePagination.setPage(1);
                    }}
                  />
                ) : undefined
              }
            >
              <table className="w-full text-sm">
                <thead className="tbl-head-light text-[11px] font-bold uppercase">
                  <tr>
                    <th className="text-left px-5 py-3">
                      {t('table.column.student')}
                    </th>
                    <th className="text-left px-5 py-3">
                      {t('table.column.book')}
                    </th>
                    <th className="text-left px-5 py-3">
                      {t('table.column.due_at')}
                    </th>
                    <th className="text-right px-5 py-3">{t('actions', { ns: 'common' })}</th>
                  </tr>
                </thead>
                <tbody>
                  {overduePagination.paged.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t border-gray-100 dark:border-white/5 row-hover"
                    >
                      <td className="px-5 py-3 font-semibold dark:text-gray-200">
                        {formatarNome(item.aluno)}
                      </td>
                      <td className="px-5 py-3 text-gray-600 dark:text-gray-300 max-w-[240px] truncate">
                        {item.livro}
                      </td>
                      <td className="px-5 py-3">
                        {item.statusVencimento === 'atrasado' ? (
                          <span className="pill pill-danger">
                            <span className="dot" />
                            {item.devolucao}
                          </span>
                        ) : (
                          <span className="pill pill-warn">
                            <span className="dot" />
                            {item.devolucao}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleAbrirDetalhesEmprestimo(item)}
                          className="pill pill-purple hover:bg-lumi-primary hover:text-white"
                        >
                          {t('common:button.details')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DashboardTableCard>
          </div>,
        ]}
      />

      <Modal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        maxWidth="max-w-md"
      >
        <Modal.Header title={t('export.modal.title')} />
        <Modal.Body className="space-y-3">
          <p className="-mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('export.modal.subtitle')}
          </p>
          <button
            type="button"
            onClick={() => handleExport('xlsx')}
            disabled={isExporting}
            className="flex w-full items-center gap-3 rounded-xl border border-gray-200 dark:border-white/10 p-4 text-left transition hover:border-lumi-primary hover:bg-lumi-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10">
              <FileSpreadsheet className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-semibold text-gray-800 dark:text-gray-100">
                {t('export.option.csv.title')}
              </span>
              <span className="block text-xs text-gray-500 dark:text-gray-400">
                {t('export.option.csv.desc')}
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => handleExport('pdf')}
            disabled={isExporting}
            className="flex w-full items-center gap-3 rounded-xl border border-gray-200 dark:border-white/10 p-4 text-left transition hover:border-lumi-primary hover:bg-lumi-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-500/10">
              <FileDown className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-semibold text-gray-800 dark:text-gray-100">
                {t('export.option.pdf.title')}
              </span>
              <span className="block text-xs text-gray-500 dark:text-gray-400">
                {t('export.option.pdf.desc')}
              </span>
            </span>
          </button>
        </Modal.Body>
      </Modal>
    </section>
  );
}

interface DashboardTableCardProps {
  title: string;
  subtitle: string;
  badge?: React.ReactNode;
  isLoading: boolean;
  error: string | null;
  empty: boolean;
  emptyMessage: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

function DashboardTableCard({
  title,
  subtitle,
  badge,
  isLoading,
  error,
  empty,
  emptyMessage,
  footer,
  children,
}: DashboardTableCardProps) {
  const showContent = !isLoading && !error && !empty;
  return (
    <div className="rounded-2xl bg-white dark:bg-dark-card border border-gray-200/70 dark:border-white/5 overflow-hidden flex flex-col">
      <div className="px-5 py-4 border-b border-gray-200/70 dark:border-white/5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="font-display font-bold text-lg text-gray-900 dark:text-white truncate">
            {title}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {subtitle}
          </div>
        </div>
        {badge && <div className="shrink-0">{badge}</div>}
      </div>
      <div className="tbl-scroll tbl-short flex-1">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-400">…</div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-red-500">{error}</div>
        ) : empty ? (
          <div className="p-8 text-center text-sm text-gray-400">
            {emptyMessage}
          </div>
        ) : (
          children
        )}
      </div>
      {showContent && footer}
    </div>
  );
}

interface RefreshedAgoProps {
  at: Date;
  locale: string;
  label: string;
}

/** Live "updated X ago" label. Keeps its own 1s ticker so the heavy dashboard
 *  (and its charts) don't re-render every second. */
function RefreshedAgo({ at, locale, label }: RefreshedAgoProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const rtf = useMemo(
    () => new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }),
    [locale],
  );

  const seconds = Math.max(0, Math.round((Date.now() - at.getTime()) / 1000));
  const relative =
    seconds < 60
      ? rtf.format(-seconds, 'second')
      : seconds < 3600
        ? rtf.format(-Math.floor(seconds / 60), 'minute')
        : rtf.format(-Math.floor(seconds / 3600), 'hour');

  return (
    <>
      {label} <span className="font-mono">{relative}</span>
    </>
  );
}
