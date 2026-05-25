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
import { DataTable, type ColumnDef } from '../../components/ui/DataTable';
import { TableFooter } from '../../components/ui/TableFooter';
import { ModalLoanDetails } from '../../features/loans/LoanModalDetails';
import { LoanModalRequest } from '../../features/loans/LoanModalRequest';
import { formatarNome } from '../../utils/formatters';
import { useDynamicPageSize } from '../../hooks/useDynamicPageSize';

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
  const { t } = useTranslation('dashboard');
  const queryClient = useQueryClient();

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
          devolucao: dataDevolucao.toLocaleDateString('pt-BR'),
          statusVencimento,
        };
      })
      .filter((item) => item.statusVencimento !== 'ativo');
  }, [emprestimos.data]);

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
      { name: 'Ativos', total: data.emprestimosAtivos },
      { name: 'Atrasados', total: data.emprestimosAtrasados },
      { name: 'Concluidos', total: data.emprestimosConcluidos },
      { name: 'Solicitacoes', total: data.solicitacoesPendentes },
      { name: 'Reservas', total: data.reservasAguardando },
    ].filter((item) => item.total > 0);
  }, [statsGerenciais.data]);

  const monthlyChartData = useMemo(
    () =>
      (emprestimosPorMes.data ?? []).map((item) => ({
        mes: new Date(`${item.mes}T00:00:00`).toLocaleDateString('pt-BR', {
          month: 'short',
          year: '2-digit',
        }),
        total: item.total,
      })),
    [emprestimosPorMes.data],
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
      { name: 'Atrasados', total: atrasados },
      { name: 'Vence hoje', total: venceHoje },
    ].filter((item) => item.total > 0);
  }, [sortedEmprestimos]);

  const handleExportCsv = () => {
    downloadCsv('dashboard-gerencial.csv', [
      ...(statsGerenciais.data
        ? [
            {
              indicador: 'Emprestimos ativos',
              valor: statsGerenciais.data.emprestimosAtivos,
            },
            {
              indicador: 'Emprestimos atrasados',
              valor: statsGerenciais.data.emprestimosAtrasados,
            },
            {
              indicador: 'Emprestimos concluidos',
              valor: statsGerenciais.data.emprestimosConcluidos,
            },
            {
              indicador: 'Media dias devolucao',
              valor: statsGerenciais.data.mediaDiasDevolucao,
            },
            {
              indicador: 'Solicitacoes pendentes',
              valor: statsGerenciais.data.solicitacoesPendentes,
            },
            {
              indicador: 'Reservas aguardando',
              valor: statsGerenciais.data.reservasAguardando,
            },
          ]
        : []),
      ...(topLivros.data ?? []).map((item) => ({
        indicador: `Livro: ${item.titulo}`,
        valor: item.totalEmprestimos,
      })),
      ...(emprestimosPorMes.data ?? []).map((item) => ({
        indicador: `Mes: ${item.mes}`,
        valor: item.total,
      })),
    ]);
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
          {item.solicitacao.toLocaleDateString('pt-BR')}
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
          title="LIVROS"
          value={statsData?.livros ?? 0}
          isLoading={isStatsLoading}
          hasError={!!statsError}
          animate={shouldAnimateStats}
        />

        <StatCard
          to="/admin/students"
          Icon={UsersIcon}
          title="ALUNOS"
          value={statsData?.alunos ?? 0}
          isLoading={isStatsLoading}
          hasError={!!statsError}
          animate={shouldAnimateStats}
        />

        <StatCard
          to="/admin/loans"
          Icon={LoansIcon}
          title="EMPRÉSTIMOS"
          value={statsData?.emprestimosAtivos ?? 0}
          isLoading={isStatsLoading}
          hasError={!!statsError}
          animate={shouldAnimateStats}
        />

        <StatCard
          to="/admin/loans?filtro=atrasados"
          Icon={AlertIcon}
          title="PENDÊNCIAS"
          value={statsData?.atrasados ?? 0}
          variant="danger"
          isLoading={isStatsLoading}
          hasError={!!statsError}
          animate={shouldAnimateStats}
        />
      </div>

      <div className="bg-white dark:bg-dark-card rounded-lg shadow-md p-4 md:p-6 mb-6 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              Analise gerencial
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Emprestimos, atrasos, reservas e livros mais movimentados.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="bg-lumi-primary text-white text-sm font-bold py-2 px-3 rounded hover:bg-opacity-80"
            >
              Exportar CSV
            </button>
            <button
              type="button"
              onClick={printDashboardPdf}
              className="bg-gray-800 text-white text-sm font-bold py-2 px-3 rounded hover:bg-gray-700 dark:bg-gray-200 dark:text-gray-900 dark:hover:bg-white"
            >
              Exportar PDF
            </button>
          </div>
        </div>

        {statsGerenciais.isLoading ||
        topLivros.isLoading ||
        emprestimosPorMes.isLoading ? (
          <div className="h-72 flex items-center justify-center text-gray-500 dark:text-gray-400">
            Carregando indicadores...
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
            <div className="h-72 border border-gray-100 dark:border-gray-700 rounded-lg p-3">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                Distribuicao geral
              </h3>
              {statusChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="90%">
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      dataKey="total"
                      nameKey="name"
                      innerRadius={45}
                      outerRadius={70}
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
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-gray-400">
                  Sem dados
                </div>
              )}
            </div>

            <div className="h-72 border border-gray-100 dark:border-gray-700 rounded-lg p-3">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                Emprestimos por mes
              </h3>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} width={32} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#0f766e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="h-72 border border-gray-100 dark:border-gray-700 rounded-lg p-3">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                Top livros
              </h3>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={topBooksChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="livro" tick={{ fontSize: 10 }} interval={0} />
                  <YAxis allowDecimals={false} width={32} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#762075" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="h-72 border border-gray-100 dark:border-gray-700 rounded-lg p-3">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                Atrasos
              </h3>
              {dueStatusChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="90%">
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
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-gray-400">
                  Sem atrasos
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div
        ref={dashboardContainerRef}
        className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0"
      >
        <div className="bg-white dark:bg-dark-card p-4 md:p-6 rounded-lg shadow-md flex flex-col min-h-[350px] md:min-h-0 will-change-transform overflow-hidden">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 shrink-0 select-none">
            Solicitações
          </h3>

          <DataTable
            data={paginatedSolicitacoes}
            columns={solicitacoesColumns}
            isLoading={solicitacoes.isLoading}
            error={solicitacoes.error ? 'Erro ao carregar' : null}
            sortConfig={solicitacaoSort}
            onSort={requestSolicitacaoSort}
            getRowKey={(item) => item.id}
            emptyStateMessage="Nenhuma solicitação pendente."
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
            Atrasados e a Vencer
          </h3>

          <DataTable
            data={paginatedEmprestimos}
            columns={emprestimosColumns}
            isLoading={emprestimos.isLoading}
            error={emprestimos.error ? 'Erro ao carregar' : null}
            sortConfig={emprestimoSort}
            onSort={requestEmprestimoSort}
            getRowKey={(item) => item.id}
            getRowClass={getRowClass}
            emptyStateMessage="Nenhum empréstimo ativo no momento."
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
