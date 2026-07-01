import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  Layers,
  PackageCheck,
} from 'lucide-react';

import { LoanFilter } from '../../features/loans/LoanFilter';
import { Modal } from '../../components/ui/Modal';
import { TableSearch } from '../../components/ui/TableSearch';
import { TableFooter } from '../../components/ui/TableFooter';
import { LoanModalNew } from '../../features/loans/LoanModalNew';
import { ModalLoanDetails } from '../../features/loans/LoanModalDetails';

import { useEmprestimos } from '../../hooks/queries/useLoanQueries';
import { type EmprestimoListagemDTO } from '../../services/loanService';
import { formatarNome } from '../../utils/formatters';
import { useDynamicPageSize } from '../../hooks/useDynamicPageSize';

type StatusEmprestimoDisplay =
  | 'ativo'
  | 'atrasado'
  | 'vence-hoje'
  | 'concluido';

type LoanTab = 'all' | StatusEmprestimoDisplay | 'solicitacoes';

interface EmprestimoDisplay {
  id: string;
  rawId: string;
  status: StatusEmprestimoDisplay;
  livro: string;
  isbn: string;
  tombo: string;
  leitor: string;
  matriculaLeitor: string;
  curso: string;
  emprestimo: string;
  devolucao: string;
  devolvido: string;
  devolvidoComAtraso: boolean;
  rawDataEmprestimo: string;
  rawDataDevolucao: string;
}

const formatarDataIso = (dataIso: string): string => {
  if (!dataIso) return '-';
  const [dataPart] = dataIso.split('T');
  if (!dataPart) return '-';
  const [ano, mes, dia] = dataPart.split('-');
  return `${dia}/${mes}/${ano}`;
};

const cleanFilters = (filters: Record<string, unknown>) => {
  const cleaned: Record<string, unknown> = {};
  Object.keys(filters).forEach((key) => {
    if (
      filters[key] !== '' &&
      filters[key] !== null &&
      filters[key] !== undefined
    ) {
      cleaned[key] = filters[key];
    }
  });
  return cleaned;
};

const filtroAtrasadosObj = {
  statusEmprestimo: 'ATRASADO',
  dataEmprestimo: '',
  dataDevolucao: '',
  tombo: '',
  livroNome: '',
  leitorNome: '',
};

function PlusIcon() {
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function SlidersIcon() {
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
    >
      <line x1="21" y1="4" x2="14" y2="4" />
      <line x1="10" y1="4" x2="3" y2="4" />
      <line x1="21" y1="12" x2="12" y2="12" />
      <line x1="8" y1="12" x2="3" y2="12" />
      <line x1="21" y1="20" x2="16" y2="20" />
      <line x1="12" y1="20" x2="3" y2="20" />
      <circle cx="12" cy="4" r="2" fill="currentColor" />
      <circle cx="10" cy="12" r="2" fill="currentColor" />
      <circle cx="14" cy="20" r="2" fill="currentColor" />
    </svg>
  );
}

export function EmprestimosPage() {
  const { t } = useTranslation('loan');
  const [searchParams] = useSearchParams();

  const [sortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  }>({ key: 'status', direction: 'asc' });

  const [currentPage, setCurrentPage] = useState(1);
  const [activeLoanTab, setActiveLoanTab] = useState<LoanTab>('all');
  const [termoBusca, setTermoBusca] = useState('');
  const [filtroAtivo, setFiltroAtivo] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetalhesOpen, setIsDetalhesOpen] = useState(false);
  const [emprestimoSelecionado, setEmprestimoSelecionado] = useState<{
    id: string;
    leitorMatricula: string;
    livroIsbn: string;
    livroNome?: string;
    exemplarTombo: string;
    dataEmprestimo: string;
    dataDevolucao: string;
  } | null>(null);

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [filterParams, setFilterParams] = useState(() => {
    if (searchParams.get('filtro') === 'atrasados') {
      return filtroAtrasadosObj;
    }
    return {
      statusEmprestimo: '',
      dataEmprestimo: '',
      dataDevolucao: '',
      tombo: '',
      livroNome: '',
      leitorNome: '',
    };
  });

  const [activeFilters, setActiveFilters] = useState(() => {
    if (searchParams.get('filtro') === 'atrasados') {
      return filtroAtrasadosObj;
    }
    return {};
  });

  useEffect(() => {
    const filtroUrl = searchParams.get('filtro');
    if (filtroUrl === 'atrasados') {
      setFilterParams(filtroAtrasadosObj);
      setActiveFilters(filtroAtrasadosObj);
      setActiveLoanTab('atrasado');
    }
  }, [searchParams]);

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const dynamicPageSizeOptions = useMemo(
    () => ({ rowHeight: 48, footerHeight: 50 }),
    [],
  );
  const dynamicPageSize = useDynamicPageSize(
    tableContainerRef,
    dynamicPageSizeOptions,
  );
  const [itemsPerPage, setItemsPerPage] = useState(0);

  useEffect(() => {
    if (dynamicPageSize > 0) setItemsPerPage(dynamicPageSize);
  }, [dynamicPageSize]);

  const sortParam = useMemo(() => {
    const sortMap: Record<string, string> = {
      status: 'status',
      tombo: 'bookCopy.copyCode',
      livro: 'bookCopy.book.title',
      leitor: 'reader.fullName',
      emprestimo: 'borrowedAt',
      devolucao: 'dueAt',
    };
    const backendKey = sortMap[sortConfig.key] || sortConfig.key;
    return `${backendKey},${sortConfig.direction}`;
  }, [sortConfig]);

  const filtersForHook = useMemo(() => {
    const filtrosParaApi: Record<string, unknown> = { ...activeFilters };
    if (filtrosParaApi.statusEmprestimo === 'VENCE_HOJE') {
      const hoje = new Date().toISOString().split('T')[0];
      filtrosParaApi.dataDevolucao = hoje;
      filtrosParaApi.dataDevolucaoInicio = hoje;
      delete filtrosParaApi.statusEmprestimo;
    }
    return cleanFilters(filtrosParaApi);
  }, [activeFilters]);

  const {
    data: pageData,
    isLoading,
    error,
    refetch,
  } = useEmprestimos(
    currentPage - 1,
    itemsPerPage || 10,
    sortParam,
    filtroAtivo,
    filtersForHook,
  );

  const emprestimos = useMemo<EmprestimoDisplay[]>(() => {
    if (!pageData?.content) return [];
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    return pageData.content.map(
      (item: EmprestimoListagemDTO, index: number) => {
        const dataDevolucaoObj = new Date(item.dataDevolucao);
        dataDevolucaoObj.setHours(0, 0, 0, 0);

        let devolvidoComAtraso = false;
        if (item.dataRetorno) {
          const dataRetornoObj = new Date(item.dataRetorno);
          dataRetornoObj.setHours(0, 0, 0, 0);
          devolvidoComAtraso =
            dataRetornoObj.getTime() > dataDevolucaoObj.getTime();
        }

        let status: StatusEmprestimoDisplay;
        if (item.statusEmprestimo === 'CONCLUIDO') {
          status = 'concluido';
        } else if (
          item.statusEmprestimo === 'ATRASADO' ||
          dataDevolucaoObj.getTime() < hoje.getTime()
        ) {
          status = 'atrasado';
        } else if (dataDevolucaoObj.getTime() === hoje.getTime()) {
          status = 'vence-hoje';
        } else {
          status = 'ativo';
        }

        return {
          id: item.id || `${item.livroTombo}-${index}`,
          rawId: item.id,
          status,
          livro: item.livroNome,
          isbn: '',
          tombo: item.livroTombo,
          leitor: item.nomeLeitor,
          matriculaLeitor: item.matriculaLeitor,
          curso: item.curso || '-',
          emprestimo: formatarDataIso(item.dataEmprestimo),
          devolucao: formatarDataIso(item.dataDevolucao),
          devolvido: formatarDataIso(item.dataRetorno),
          devolvidoComAtraso,
          rawDataEmprestimo: item.dataEmprestimo
            ? item.dataEmprestimo.split('T')[0]
            : '',
          rawDataDevolucao: item.dataDevolucao
            ? item.dataDevolucao.split('T')[0]
            : '',
        };
      },
    );
  }, [pageData]);

  const statusPill = (status: StatusEmprestimoDisplay) => {
    switch (status) {
      case 'ativo':
        return { class: 'pill pill-success', label: t('legend.active') };
      case 'atrasado':
        return { class: 'pill pill-danger', label: t('legend.overdue') };
      case 'vence-hoje':
        return { class: 'pill pill-warn', label: t('legend.due_today') };
      case 'concluido':
        return {
          class:
            'pill bg-gray-200 text-gray-700 dark:bg-gray-500/20 dark:text-gray-200',
          label: t('legend.completed'),
        };
    }
  };

  const statusBadges = useMemo(() => {
    const countBy = (status: StatusEmprestimoDisplay) =>
      emprestimos.filter((item) => item.status === status).length;
    return [
      {
        value: 'all' as LoanTab,
        label: t('tabs.all'),
        total: emprestimos.length,
        icon: <Layers className="h-5 w-5" />,
        tile: 'bg-lumi-primary/10 text-lumi-primary dark:bg-lumi-label/10 dark:text-lumi-label',
        ring: 'ring-lumi-primary',
      },
      {
        value: 'ativo' as LoanTab,
        label: t('tabs.active'),
        total: countBy('ativo'),
        icon: <CheckCircle2 className="h-5 w-5" />,
        tile: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10',
        ring: 'ring-emerald-400',
      },
      {
        value: 'atrasado' as LoanTab,
        label: t('tabs.overdue'),
        total: countBy('atrasado'),
        icon: <AlertTriangle className="h-5 w-5" />,
        tile: 'bg-red-100 text-red-600 dark:bg-red-500/10',
        ring: 'ring-red-400',
      },
      {
        value: 'vence-hoje' as LoanTab,
        label: t('tabs.due_today'),
        total: countBy('vence-hoje'),
        icon: <Clock className="h-5 w-5" />,
        tile: 'bg-amber-100 text-amber-600 dark:bg-amber-500/10',
        ring: 'ring-amber-400',
      },
      {
        value: 'concluido' as LoanTab,
        label: t('tabs.completed'),
        total: countBy('concluido'),
        icon: <PackageCheck className="h-5 w-5" />,
        tile: 'bg-gray-200 text-gray-600 dark:bg-gray-500/20 dark:text-gray-300',
        ring: 'ring-gray-400',
      },
    ];
  }, [emprestimos, t]);

  const filteredEmprestimos = useMemo(
    () =>
      activeLoanTab === 'all' || activeLoanTab === 'solicitacoes'
        ? emprestimos
        : emprestimos.filter((item) => item.status === activeLoanTab),
    [activeLoanTab, emprestimos],
  );

  const handleBusca = (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!termoBusca.trim()) return;
    setCurrentPage(1);
    setActiveFilters({});
    setFiltroAtivo(termoBusca);
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    setTermoBusca('');
    setFiltroAtivo('');
    setActiveFilters(filterParams);
    setIsFilterOpen(false);
  };

  const handleClearFilters = () => {
    setCurrentPage(1);
    setFilterParams({
      statusEmprestimo: '',
      dataEmprestimo: '',
      dataDevolucao: '',
      tombo: '',
      livroNome: '',
      leitorNome: '',
    });
    setActiveFilters({});
    setIsFilterOpen(false);
  };

  const handleAbrirDetalhes = (item: EmprestimoDisplay) => {
    setEmprestimoSelecionado({
      id: item.rawId,
      leitorMatricula: item.matriculaLeitor,
      livroIsbn: item.isbn,
      livroNome: item.livro,
      exemplarTombo: item.tombo,
      dataEmprestimo: item.rawDataEmprestimo,
      dataDevolucao: item.rawDataDevolucao,
    });
    setIsDetalhesOpen(true);
  };

  const handleFecharDetalhes = (foiAtualizado?: boolean) => {
    setIsDetalhesOpen(false);
    if (foiAtualizado) refetch();
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-5">
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <Modal.Header title={t('modal.new.title')} />
        <LoanModalNew
          onClose={() => setIsModalOpen(false)}
          onSuccess={refetch}
        />
      </Modal>

      <ModalLoanDetails
        isOpen={isDetalhesOpen}
        onClose={handleFecharDetalhes}
        emprestimo={emprestimoSelecionado}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-lumi-primary/10 text-lumi-primary dark:bg-lumi-label/10 dark:text-lumi-label">
            <ArrowRightLeft className="h-6 w-6" />
          </span>
          <div>
            <div className="text-xs font-semibold tracking-wider text-lumi-primary dark:text-lumi-label uppercase">
              {t('page.eyebrow', { defaultValue: 'Movimentação' })}
            </div>
            <h1 className="font-display font-extrabold text-3xl text-gray-900 dark:text-white mt-1">
              {t('page.title', { defaultValue: 'Empréstimos' })}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('page.subtitle', {
                defaultValue:
                  'Solicitações, ativos, atrasos e devoluções em um único fluxo.',
              })}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="h-10 shrink-0 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold inline-flex items-center justify-center gap-2 shadow-md self-start sm:self-center"
        >
          <PlusIcon /> {t('button.new')}
        </button>
      </div>

      <div
        role="group"
        aria-label={t('tabs.aria')}
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
      >
        {statusBadges.map((badge) => {
          const active = activeLoanTab === badge.value;
          return (
            <button
              key={badge.value}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setActiveLoanTab(badge.value);
                setCurrentPage(1);
              }}
              className={`flex items-center gap-3 rounded-xl border bg-white dark:bg-dark-card p-4 text-left transition hover:-translate-y-0.5 hover:shadow-card ${
                active
                  ? `border-transparent ring-2 ${badge.ring}`
                  : 'border-gray-200/70 dark:border-white/5'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${badge.tile}`}
              >
                {badge.icon}
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {badge.label}
                </div>
                <div className="font-display font-bold text-xl text-gray-800 dark:text-white">
                  {badge.total}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        <TableSearch
          className="flex-1"
          value={termoBusca}
          onChange={setTermoBusca}
          onSubmit={handleBusca}
          onClear={() => {
            setTermoBusca('');
            setFiltroAtivo('');
            setCurrentPage(1);
          }}
          placeholder={t('search.placeholder')}
        />
        <div className="relative shrink-0">
          <button
            id="filter-toggle-button"
            type="button"
            onClick={() => setIsFilterOpen((prev) => !prev)}
            className={`h-11 w-full lg:w-auto px-4 rounded-xl bg-white dark:bg-dark-card border inline-flex items-center justify-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 transition-colors ${
              isFilterOpen
                ? 'border-lumi-primary ring-2 ring-lumi-primary'
                : 'border-gray-200 dark:border-white/10 hover:border-lumi-primary'
            }`}
          >
            <SlidersIcon /> {t('common:action.advanced_filter')}
          </button>
          {isFilterOpen && (
            <LoanFilter
              isOpen={isFilterOpen}
              onClose={() => setIsFilterOpen(false)}
              filters={filterParams}
              onFilterChange={(field, value) =>
                setFilterParams((prev) => ({ ...prev, [field]: value }))
              }
              onApply={handleApplyFilters}
              onClear={handleClearFilters}
            />
          )}
        </div>
      </div>

      <div
        ref={tableContainerRef}
        className="flex min-h-0 flex-1 flex-col rounded-2xl bg-white dark:bg-dark-card border border-gray-200/70 dark:border-white/5 overflow-hidden"
      >
        <div className="tbl-scroll tbl-fill min-h-0 flex-1">
          <table className="w-full text-sm">
            <thead className="tbl-head-dark text-[11px] font-bold uppercase tracking-wider">
              <tr>
                <th className="text-center px-5 py-3.5">
                  {t('table.column.status')}
                </th>
                <th className="text-center px-5 py-3.5">
                  {t('table.column.copy_code')}
                </th>
                <th className="text-center px-5 py-3.5">
                  {t('table.column.book')}
                </th>
                <th className="text-center px-5 py-3.5">
                  {t('table.column.reader')}
                </th>
                <th className="text-center px-5 py-3.5">
                  {t('table.column.borrowed_at')}
                </th>
                <th className="text-center px-5 py-3.5">
                  {t('table.column.returned_at')}
                </th>
                <th className="text-center px-5 py-3.5">
                  {t('table.column.agreed')}
                </th>
                <th className="text-center px-5 py-3.5">
                  {t('common:actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-gray-400">
                    …
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-red-500">
                    {t('error.load')}
                  </td>
                </tr>
              ) : filteredEmprestimos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-gray-400">
                    {t('common:empty')}
                  </td>
                </tr>
              ) : (
                filteredEmprestimos.map((emp) => {
                  const pill = statusPill(emp.status);
                  return (
                    <tr
                      key={emp.id}
                      className="border-t border-gray-100 dark:border-white/5 row-hover"
                    >
                      <td className="px-5 py-3 text-center">
                        <span className={pill.class}>
                          <span className="dot" />
                          {pill.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center font-mono text-xs text-gray-500">
                        {emp.tombo}
                      </td>
                      <td className="px-5 py-3 text-center text-gray-700 dark:text-gray-200 max-w-[260px] truncate">
                        {emp.livro}
                      </td>
                      <td className="px-5 py-3 text-center font-semibold text-gray-800 dark:text-white truncate">
                        {formatarNome(emp.leitor)}
                      </td>
                      <td className="px-5 py-3 text-center text-gray-600 dark:text-gray-300 text-sm">
                        {emp.emprestimo}
                      </td>
                      <td className="px-5 py-3 text-center text-sm">
                        {emp.devolvido && emp.devolvido !== '-' ? (
                          <span
                            className={`font-semibold ${
                              emp.devolvidoComAtraso
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-emerald-600 dark:text-emerald-400'
                            }`}
                            title={
                              emp.devolvidoComAtraso
                                ? t('returned_late')
                                : undefined
                            }
                          >
                            {emp.devolvido}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-center font-semibold text-gray-800 dark:text-white">
                        {emp.devolucao}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleAbrirDetalhes(emp)}
                          className="pill pill-purple hover:bg-lumi-primary hover:text-white"
                        >
                          {t('common:button.details')}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <TableFooter
          showPageSizeSelector={false}
          legendItems={[
            { color: 'bg-emerald-500', label: t('legend.active') },
            { color: 'bg-red-500', label: t('legend.overdue') },
            { color: 'bg-amber-500', label: t('legend.due_today') },
            { color: 'bg-gray-400', label: t('legend.completed') },
          ]}
          pagination={{
            currentPage,
            totalPages: pageData?.totalPages ?? 1,
            itemsPerPage: itemsPerPage || 10,
            totalItems: pageData?.totalElements ?? 0,
          }}
          onPageChange={setCurrentPage}
        />
      </div>
    </section>
  );
}
