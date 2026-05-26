import { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { StatCard } from '../../components/ui/StatCard';
import { DashboardViewToggle } from '../../components/ui/DashboardViewToggle';
import { DataTable, type ColumnDef } from '../../components/ui/DataTable';
import { TableFooter } from '../../components/ui/TableFooter';
import { ModalLoanDetails } from '../../features/loans/LoanModalDetails';
import { LoanModalRequest } from '../../features/loans/LoanModalRequest';
import { formatarNome } from '../../utils/formatters';
import { useDynamicPageSize } from '../../hooks/useDynamicPageSize';
import {
  useDashboardViewAlerts,
  type AnalyticsFingerprint,
  type DashboardView,
  type TablesFingerprint,
} from '../../hooks/useDashboardViewAlerts';
import { ChartCard } from './components/ChartCard';

import {
  useDashboardStats,
  useDashboardListas,
  useDashboardAnalytics,
} from '../../hooks/useDashboardQueries';
import { downloadCsv, printDashboardPdf } from '../../utils/dashboardExport';

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

function ManagementIcon() {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3v18h18" />
      <rect x="7" y="12" width="3" height="6" rx="0.5" />
      <rect x="12" y="8" width="3" height="10" rx="0.5" />
      <rect x="17" y="5" width="3" height="13" rx="0.5" />
    </svg>
  );
}

function RefreshIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 12a9 9 0 1 1-3.5-7.1" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}

function CsvIcon() {
  return (
    <svg
      aria-hidden="true"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h2m4 0h2M8 17h8" />
    </svg>
  );
}

function PdfIcon() {
  return (
    <svg
      aria-hidden="true"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9V2h9l5 5v15a2 2 0 0 1-2 2H8" />
      <path d="M14 2v6h6" />
      <path d="M3 15h2a1.5 1.5 0 0 1 0 3H3v-3z" />
      <path d="M3 21v-3" />
    </svg>
  );
}

interface PeriodSelectDisabledProps {
  defaultLabel: string;
  ariaLabel: string;
  tooltip: string;
}

function PeriodSelectDisabled({
  defaultLabel,
  ariaLabel,
  tooltip,
}: PeriodSelectDisabledProps) {
  return (
    <div
      className="relative inline-flex items-center"
      title={tooltip}
    >
      <button
        type="button"
        disabled
        aria-label={ariaLabel}
        className="inline-flex items-center gap-2 h-9 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/60 px-3 text-xs sm:text-sm cursor-not-allowed select-none"
      >
        <span className="opacity-80">{defaultLabel}</span>
        <svg
          aria-hidden="true"
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-60"
        >
          <path d="M3 4.5L6 7.5L9 4.5" />
        </svg>
      </button>
    </div>
  );
}

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

export function DashboardPage() {
  const { t, i18n } = useTranslation('dashboard');
  const queryClient = useQueryClient();

  const [view, setView] = useState<DashboardView>(() => readStoredView());

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

  // Estado para controlar se a animação deve ocorrer
  const [shouldAnimateStats, setShouldAnimateStats] = useState(false);

  useEffect(() => {
    if (isStatsLoading) {
      setShouldAnimateStats(true);
    }
  }, [isStatsLoading]);

  const dashboardContainerRef = useRef<HTMLDivElement>(null);
  const dynamicPageSize = useDynamicPageSize(dashboardContainerRef, {
    rowHeight: 48,
    headerHeight: 100,
    footerHeight: 60,
    minRows: 3,
  });

  const [solicitacaoPage, setSolicitacaoPage] = useState(1);
  const [solicitacaoPerPage, setSolicitacaoPerPage] = useState(10);

  const [emprestimoPage, setEmprestimoPage] = useState(1);
  const [emprestimoPerPage, setEmprestimoPerPage] = useState(10);

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

  useEffect(() => {
    setSolicitacaoPerPage(dynamicPageSize);
    setEmprestimoPerPage(dynamicPageSize);
  }, [dynamicPageSize]);

  const [solicitacaoSort, setSolicitacaoSort] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  }>({ key: 'solicitacao', direction: 'asc' });

  const [emprestimoSort, setEmprestimoSort] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  }>({ key: 'devolucao', direction: 'asc' });

  const solicitacoesProcessadas = useMemo(() => {
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

  const sortedSolicitacoes = useMemo(() => {
    const items = [...solicitacoesProcessadas];
    items.sort((a, b) => {
      const key = solicitacaoSort.key as keyof SolicitacaoDisplay;

      if (key === 'solicitacao') {
        return solicitacaoSort.direction === 'asc'
          ? a.solicitacao.getTime() - b.solicitacao.getTime()
          : b.solicitacao.getTime() - a.solicitacao.getTime();
      }

      const valA = a[key] ?? '';
      const valB = b[key] ?? '';

      if (valA < valB) return solicitacaoSort.direction === 'asc' ? -1 : 1;
      if (valA > valB) return solicitacaoSort.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return items;
  }, [solicitacoesProcessadas, solicitacaoSort]);

  const paginatedSolicitacoes = useMemo(() => {
    const start = (solicitacaoPage - 1) * solicitacaoPerPage;
    return sortedSolicitacoes.slice(start, start + solicitacaoPerPage);
  }, [sortedSolicitacoes, solicitacaoPage, solicitacaoPerPage]);

  const emprestimosProcessados = useMemo(() => {
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

  const sortedEmprestimos = useMemo(() => {
    const items = [...emprestimosProcessados];
    items.sort((a, b) => {
      const key = emprestimoSort.key as keyof EmprestimoVencer;
      if (key === 'devolucao') {
        const dateA = new Date(a.devolucao.split('/').reverse().join('-'));
        const dateB = new Date(b.devolucao.split('/').reverse().join('-'));
        return emprestimoSort.direction === 'asc'
          ? dateA.getTime() - dateB.getTime()
          : dateB.getTime() - dateA.getTime();
      }
      if (a[key] < b[key]) return emprestimoSort.direction === 'asc' ? -1 : 1;
      if (a[key] > b[key]) return emprestimoSort.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return items;
  }, [emprestimosProcessados, emprestimoSort]);

  const paginatedEmprestimos = useMemo(() => {
    const start = (emprestimoPage - 1) * emprestimoPerPage;
    return sortedEmprestimos.slice(start, start + emprestimoPerPage);
  }, [sortedEmprestimos, emprestimoPage, emprestimoPerPage]);

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

  const monthlyChartData = useMemo(
    () =>
      (emprestimosPorMes.data ?? []).map((item) => ({
        mes: new Date(`${item.mes}T00:00:00`).toLocaleDateString(i18n.language, {
          month: 'short',
          year: '2-digit',
        }),
        total: item.total,
      })),
    [emprestimosPorMes.data, i18n.language],
  );

  const topBooksChartData = useMemo(
    () =>
      (topLivros.data ?? []).slice(0, 10).map((item) => ({
        livro: item.titulo.length > 18 ? `${item.titulo.slice(0, 18)}...` : item.titulo,
        total: item.totalEmprestimos,
      })),
    [topLivros.data],
  );

  const dueStatusChartData = useMemo(() => {
    const atrasados = sortedEmprestimos.filter(
      (item) => item.statusVencimento === 'atrasado',
    ).length;
    const venceHoje = sortedEmprestimos.filter(
      (item) => item.statusVencimento === 'vence-hoje',
    ).length;

    return [
      { name: t('chart.due.overdue'), total: atrasados },
      { name: t('chart.due.due_today'), total: venceHoje },
    ].filter((item) => item.total > 0);
  }, [sortedEmprestimos, t]);

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

  const handleRefreshAnalytics = async () => {
    if (isRefreshingAnalytics) return;
    setIsRefreshingAnalytics(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['dashboard-gerencial-stats'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-top-livros'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-emprestimos-por-mes'] }),
      ]);
    } finally {
      setIsRefreshingAnalytics(false);
    }
  };

  const handleExportCsv = () => {
    const headerIndicator = t('export.csv.header.indicator');
    const headerValue = t('export.csv.header.value');
    const rows: Array<Record<string, string | number>> = [];

    if (statsGerenciais.data) {
      const indicators: Array<[string, number]> = [
        [t('export.csv.row.active_loans'), statsGerenciais.data.emprestimosAtivos],
        [t('export.csv.row.overdue_loans'), statsGerenciais.data.emprestimosAtrasados],
        [t('export.csv.row.completed_loans'), statsGerenciais.data.emprestimosConcluidos],
        [t('export.csv.row.avg_return_days'), statsGerenciais.data.mediaDiasDevolucao],
        [t('export.csv.row.pending_requests'), statsGerenciais.data.solicitacoesPendentes],
        [t('export.csv.row.waiting_reservations'), statsGerenciais.data.reservasAguardando],
      ];

      indicators.forEach(([label, value]) => {
        rows.push({ [headerIndicator]: label, [headerValue]: value });
      });
    }

    (topLivros.data ?? []).forEach((item) => {
      rows.push({
        [headerIndicator]: `${t('export.csv.row.book_prefix')}: ${item.titulo}`,
        [headerValue]: item.totalEmprestimos,
      });
    });

    (emprestimosPorMes.data ?? []).forEach((item) => {
      rows.push({
        [headerIndicator]: `${t('export.csv.row.month_prefix')}: ${item.mes}`,
        [headerValue]: item.total,
      });
    });

    downloadCsv('dashboard-gerencial.csv', rows);
  };

  const requestSolicitacaoSort = (key: string) => {
    const direction =
      solicitacaoSort.key === key && solicitacaoSort.direction === 'asc'
        ? 'desc'
        : 'asc';
    setSolicitacaoSort({ key, direction });
  };

  const requestEmprestimoSort = (key: string) => {
    const direction =
      emprestimoSort.key === key && emprestimoSort.direction === 'asc'
        ? 'desc'
        : 'asc';
    setEmprestimoSort({ key, direction });
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

  const getRowClass = (item: EmprestimoVencer) => {
    const baseHover = 'hover:duration-0';
    switch (item.statusVencimento) {
      case 'atrasado':
        return `bg-red-500/30 dark:bg-red-500/30 hover:bg-red-500/40 dark:hover:bg-red-500/40 ${baseHover}`;
      case 'vence-hoje':
        return `bg-yellow-300/25 dark:bg-yellow-300/25 hover:bg-yellow-300/40 dark:hover:bg-yellow-300/35 ${baseHover}`;
      case 'ativo':
      default:
        return `hover:bg-gray-300 dark:hover:bg-gray-600 ${baseHover}`;
    }
  };

  const solicitacoesColumns: ColumnDef<SolicitacaoDisplay>[] = [
    {
      key: 'aluno',
      header: t('table.column.student'),
      width: '30%',
      render: (item) => (
        <span className="text-gray-700 dark:text-gray-300 truncate">
          {formatarNome(item.aluno)}
        </span>
      ),
    },
    {
      key: 'livro',
      header: t('table.column.book'),
      width: '40%',
      render: (item) => (
        <span className="text-gray-700 dark:text-gray-300 truncate">
          {item.livro}
        </span>
      ),
    },
    {
      key: 'solicitacao',
      header: t('table.column.requested_at'),
      width: '16%',
      render: (item) => (
        <span className="dark:text-white font-bold">
          {item.solicitacao.toLocaleDateString(i18n.language)}
        </span>
      ),
    },
    {
      key: 'acoes',
      header: t('common:actions'),
      width: '14%',
      isSortable: false,
      render: (item) => (
        <button
          onClick={() => handleAbrirDetalhesSolicitacao(item)}
          className="bg-lumi-label text-white text-xs font-bold py-1 px-3 rounded hover:bg-opacity-75 hover:scale-105 shadow-md select-none"
        >
          {t('common:button.details')}
        </button>
      ),
    },
  ];

  const emprestimosColumns: ColumnDef<EmprestimoVencer>[] = [
    {
      key: 'aluno',
      header: t('table.column.student'),
      width: '30%',
      render: (item) => (
        <span className="text-gray-700 dark:text-gray-300 truncate">
          {formatarNome(item.aluno)}
        </span>
      ),
    },
    {
      key: 'livro',
      header: t('table.column.book'),
      width: '40%',
      render: (item) => (
        <span className="text-gray-700 dark:text-gray-300 truncate">
          {item.livro}
        </span>
      ),
    },
    {
      key: 'devolucao',
      header: t('table.column.due_at'),
      width: '16%',
      render: (item) => (
        <span className="dark:text-white font-bold">{item.devolucao}</span>
      ),
    },
    {
      key: 'acoes',
      header: t('common:actions'),
      width: '14%',
      isSortable: false,
      render: (item) => (
        <button
          onClick={() => handleAbrirDetalhesEmprestimo(item)}
          className="bg-lumi-label text-white text-xs font-bold py-1 px-3 rounded hover:bg-opacity-75 hover:scale-105 shadow-md select-none"
        >
          {t('common:button.details')}
        </button>
      ),
    },
  ];

  const dashboardHeaderClass =
    'h-8 bg-white dark:bg-dark-card border-gray-200 dark:border-gray-700 shadow-sm';
  const dashboardHeaderTextClass = 'text-gray-800 dark:text-white';
  const dashboardHoverClass = 'hover:bg-gray-200 dark:hover:bg-gray-700';

  return (
    <div className="flex flex-col h-full will-change-transform">
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 shrink-0">
        <StatCard
          to="/admin/books"
          Icon={BookIcon}
          title={t('stat.books')}
          value={statsData?.livros ?? 0}
          isLoading={isStatsLoading}
          hasError={!!statsError}
          animate={shouldAnimateStats}
        />

        <StatCard
          to="/admin/students"
          Icon={UsersIcon}
          title={t('stat.students')}
          value={statsData?.alunos ?? 0}
          isLoading={isStatsLoading}
          hasError={!!statsError}
          animate={shouldAnimateStats}
        />

        <StatCard
          to="/admin/loans"
          Icon={LoansIcon}
          title={t('stat.loans')}
          value={statsData?.emprestimosAtivos ?? 0}
          isLoading={isStatsLoading}
          hasError={!!statsError}
          animate={shouldAnimateStats}
        />

        <StatCard
          to="/admin/loans?filtro=atrasados"
          Icon={AlertIcon}
          title={t('stat.overdue')}
          value={statsData?.atrasados ?? 0}
          variant="danger"
          isLoading={isStatsLoading}
          hasError={!!statsError}
          animate={shouldAnimateStats}
        />
      </div>

      <div className="flex justify-end mb-4 shrink-0 print:hidden">
        <DashboardViewToggle
          value={view}
          onChange={setView}
          analyticsHasNews={analyticsHasNews}
          tablesHasNews={tablesHasNews}
        />
      </div>

      <div
        data-dashboard-block="analytics"
        className={`bg-white dark:bg-dark-card rounded-2xl shadow-md p-4 md:p-6 mb-6 shrink-0 ${
          view === 'analytics' ? 'block animate-fade-in' : 'hidden'
        }`}
      >
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-lumi-primary/10 dark:bg-lumi-primary/25 text-lumi-primary dark:text-lumi-label"
            >
              <ManagementIcon />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white truncate">
                {t('section.management')}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('section.management.subtitle')}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <PeriodSelectDisabled
              ariaLabel={t('section.management.period.aria')}
              defaultLabel={t('section.management.period.30d')}
              tooltip={t('feature_coming_soon', { ns: 'common' })}
            />
            <button
              type="button"
              onClick={handleRefreshAnalytics}
              disabled={isRefreshingAnalytics || isAnalyticsLoading}
              aria-label={t('section.management.refresh.aria')}
              title={
                isRefreshingAnalytics
                  ? t('section.management.refreshing')
                  : t('section.management.refresh')
              }
              className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshIcon
                className={isRefreshingAnalytics ? 'animate-spin' : ''}
              />
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 bg-lumi-primary text-white text-xs sm:text-sm font-semibold py-2 px-3 rounded-lg hover:bg-opacity-90 hover:shadow-md transition-all"
            >
              <CsvIcon />
              <span className="hidden sm:inline">{t('button.export_csv')}</span>
            </button>
            <button
              type="button"
              onClick={printDashboardPdf}
              className="inline-flex items-center gap-1.5 bg-gray-800 text-white text-xs sm:text-sm font-semibold py-2 px-3 rounded-lg hover:bg-gray-700 dark:bg-gray-200 dark:text-gray-900 dark:hover:bg-white hover:shadow-md transition-all"
            >
              <PdfIcon />
              <span className="hidden sm:inline">{t('button.export_pdf')}</span>
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-4">
          <ChartCard
            title={t('chart.general_distribution')}
            total={statusChartTotal}
            totalLabel={t('chart.total_label')}
            isLoading={isAnalyticsLoading}
            isEmpty={statusChartData.length === 0}
            emptyMessage={t('chart.no_data')}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusChartData}
                  dataKey="total"
                  nameKey="name"
                  innerRadius={45}
                  outerRadius={70}
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
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title={t('chart.loans_per_month')}
            total={monthlyChartTotal}
            totalLabel={t('chart.total_label')}
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
                <Bar dataKey="total" fill="#0f766e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title={t('chart.top_books')}
            total={topBooksChartTotal}
            totalLabel={t('chart.total_label')}
            isLoading={isAnalyticsLoading}
            isEmpty={topBooksChartData.length === 0}
            emptyMessage={t('chart.no_data')}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topBooksChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="livro" tick={{ fontSize: 10 }} interval={0} />
                <YAxis allowDecimals={false} width={32} />
                <Tooltip />
                <Bar dataKey="total" fill="#762075" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title={t('chart.overdue')}
            total={dueStatusChartTotal}
            totalLabel={t('chart.total_label')}
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
        </div>
      </div>

      <div
        ref={dashboardContainerRef}
        data-dashboard-block="tables"
        className={`flex-grow grid-cols-1 lg:grid-cols-2 gap-6 min-h-0 ${
          view === 'tables' ? 'grid animate-fade-in' : 'hidden'
        }`}
      >
        <div className="bg-white dark:bg-dark-card p-4 md:p-6 rounded-lg shadow-md flex flex-col min-h-[350px] md:min-h-0 will-change-transform overflow-hidden">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 shrink-0 select-none">
            {t('section.requests')}
          </h3>

          <DataTable
            data={paginatedSolicitacoes}
            columns={solicitacoesColumns}
            isLoading={solicitacoes.isLoading}
            error={solicitacoes.error ? t('error.load') : null}
            sortConfig={solicitacaoSort}
            onSort={requestSolicitacaoSort}
            getRowKey={(item) => item.id}
            emptyStateMessage={t('table.empty.requests')}
            headerClassName={dashboardHeaderClass}
            headerTextClassName={dashboardHeaderTextClass}
            hoverHeaderClassName={dashboardHoverClass}
            hasRoundedBorderTop={false}
            minWidth="min-w-[600px]"
          />

          <TableFooter
            viewMode={'exception'}
            className="h-8"
            selectClassName="h-6"
            pagination={{
              currentPage: solicitacaoPage,
              totalPages: Math.ceil(
                sortedSolicitacoes.length / solicitacaoPerPage,
              ),
              itemsPerPage: solicitacaoPerPage,
              totalItems: sortedSolicitacoes.length,
            }}
            onPageChange={setSolicitacaoPage}
            onItemsPerPageChange={(size) => {
              setSolicitacaoPerPage(size);
              setSolicitacaoPage(1);
            }}
          />
        </div>

        <div className="bg-white dark:bg-dark-card p-4 md:p-6 rounded-lg shadow-md flex flex-col min-h-[350px] md:min-h-0 will-change-transform overflow-hidden">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 shrink-0 select-none">
            {t('section.overdue_due')}
          </h3>

          <DataTable
            data={paginatedEmprestimos}
            columns={emprestimosColumns}
            isLoading={emprestimos.isLoading}
            error={emprestimos.error ? t('error.load') : null}
            sortConfig={emprestimoSort}
            onSort={requestEmprestimoSort}
            getRowKey={(item) => item.id}
            getRowClass={getRowClass}
            emptyStateMessage={t('table.empty.loans')}
            headerClassName={dashboardHeaderClass}
            headerTextClassName={dashboardHeaderTextClass}
            hoverHeaderClassName={dashboardHoverClass}
            hasRoundedBorderTop={false}
            minWidth="min-w-[600px]"
          />

          <TableFooter
            viewMode={'exception'}
            className="h-8"
            selectClassName="h-6"
            pagination={{
              currentPage: emprestimoPage,
              totalPages: Math.ceil(
                sortedEmprestimos.length / emprestimoPerPage,
              ),
              itemsPerPage: emprestimoPerPage,
              totalItems: sortedEmprestimos.length,
            }}
            onPageChange={setEmprestimoPage}
            onItemsPerPageChange={(size) => {
              setEmprestimoPerPage(size);
              setEmprestimoPage(1);
            }}
          />
        </div>
      </div>
    </div>
  );
}
