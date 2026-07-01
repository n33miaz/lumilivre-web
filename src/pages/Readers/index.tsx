import { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Users } from 'lucide-react';

import { Modal } from '../../components/ui/Modal';
import { TableSearch } from '../../components/ui/TableSearch';
import { TableFooter } from '../../components/ui/TableFooter';
import { StudentModalNew } from '../../features/students/StudentModalNew';
import { StudentFilter } from '../../features/students/StudentFilter';
import { ModalStudentDetails } from '../../features/students/StudentModalDetails';
import { formatarNome } from '../../utils/formatters';
import { useDynamicPageSize } from '../../hooks/useDynamicPageSize';
import { useAlunos } from '../../hooks/queries/useStudentQueries';

import { type ListaAluno } from '../../services/studentService';

type StatusPenalidade =
  | 'sem-penalidade'
  | 'advertencia'
  | 'suspensao'
  | 'bloqueio'
  | 'banimento';

type AlunoDisplay = ListaAluno & {
  nascimentoDate: Date;
  penalidadeStatus: StatusPenalidade;
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

function CheckIcon() {
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
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function AlertCircleIcon() {
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
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function ClockIcon() {
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
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function BanIcon() {
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
      <circle cx="12" cy="12" r="10" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
  );
}

export function AlunosPage() {
  const { t, i18n } = useTranslation('student');
  const [currentPage, setCurrentPage] = useState(1);
  const [termoBusca, setTermoBusca] = useState('');
  const [filtroAtivo, setFiltroAtivo] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterParams, setFilterParams] = useState({
    penalidade: '',
    cursoNome: '',
    turno: '',
    modulo: '',
    dataNascimento: '',
  });
  const [activeFilters, setActiveFilters] = useState({});
  const [penaltyBadge, setPenaltyBadge] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetalhesOpen, setIsDetalhesOpen] = useState(false);
  const [alunoSelecionado, setAlunoSelecionado] = useState<ListaAluno | null>(
    null,
  );

  const [sortConfig] = useState<{
    key: keyof AlunoDisplay;
    direction: 'asc' | 'desc';
  }>({ key: 'nomeCompleto', direction: 'asc' });

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

  const mapSortKey: Record<string, string> = {
    penalidadeStatus: 'penaltyCode',
    cursoNome: 'course.name',
    nascimentoDate: 'birthDate',
    matricula: 'registrationNumber',
    nomeCompleto: 'fullName',
  };

  const sortKeyBackend = mapSortKey[sortConfig.key] || sortConfig.key;
  const sortString = `${sortKeyBackend},${sortConfig.direction}`;

  const {
    data: pageData,
    isLoading,
    isError,
    refetch,
  } = useAlunos(
    currentPage - 1,
    itemsPerPage || 10,
    sortString,
    filtroAtivo,
    activeFilters,
  );

  const alunos = useMemo<AlunoDisplay[]>(() => {
    if (!pageData?.content) return [];

    const toStatusPenalidade = (status: string | null): StatusPenalidade => {
      if (status === null) return 'sem-penalidade';
      const lowerStatus = status.toLowerCase();
      switch (lowerStatus) {
        case 'advertencia':
        case 'suspensao':
        case 'bloqueio':
        case 'banimento':
          return lowerStatus as StatusPenalidade;
        default:
          return 'sem-penalidade';
      }
    };

    return pageData.content.map((dto) => ({
      ...dto,
      nascimentoDate: new Date(dto.dataNascimento),
      penalidadeStatus: toStatusPenalidade(dto.penalidade),
    }));
  }, [pageData]);

  const statsCards = useMemo(() => {
    const counters = {
      'sem-penalidade': 0,
      advertencia: 0,
      suspensao: 0,
      bloqueio: 0,
      banimento: 0,
    } as Record<StatusPenalidade, number>;
    alunos.forEach((aluno) => {
      counters[aluno.penalidadeStatus] =
        (counters[aluno.penalidadeStatus] ?? 0) + 1;
    });

    return [
      {
        key: 'no_penalty',
        icon: <CheckIcon />,
        tileClass: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600',
        ringClass: 'ring-emerald-400',
        label: t('legend.no_penalty'),
        total: counters['sem-penalidade'],
        filterCode: '',
      },
      {
        key: 'warning',
        icon: <AlertCircleIcon />,
        tileClass: 'bg-amber-100 dark:bg-amber-500/10 text-amber-600',
        ringClass: 'ring-amber-400',
        label: t('legend.warning'),
        total: counters.advertencia,
        filterCode: 'ADVERTENCIA',
      },
      {
        key: 'suspension',
        icon: <ClockIcon />,
        tileClass: 'bg-orange-100 dark:bg-orange-500/10 text-orange-600',
        ringClass: 'ring-orange-400',
        label: t('legend.suspension'),
        total: counters.suspensao,
        filterCode: 'SUSPENSAO',
      },
      {
        key: 'block',
        icon: <BanIcon />,
        tileClass: 'bg-red-100 dark:bg-red-500/10 text-red-600',
        ringClass: 'ring-red-400',
        label: t('legend.block'),
        total: counters.bloqueio + counters.banimento,
        filterCode: 'BLOQUEIO',
      },
    ];
  }, [alunos, t]);

  const handleBadgeFilter = (code: string) => {
    const next = code === '' ? '' : penaltyBadge === code ? '' : code;
    setPenaltyBadge(next);
    setCurrentPage(1);
    setTermoBusca('');
    setFiltroAtivo('');
    setActiveFilters(next ? { penalidade: next } : {});
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    setActiveFilters(filterParams);
    setIsFilterOpen(false);
  };

  const handleClearFilters = () => {
    setCurrentPage(1);
    setFilterParams({
      penalidade: '',
      cursoNome: '',
      turno: '',
      modulo: '',
      dataNascimento: '',
    });
    setActiveFilters({});
    setIsFilterOpen(false);
  };

  const handleBusca = (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!termoBusca.trim()) return;
    setCurrentPage(1);
    setActiveFilters({});
    setFiltroAtivo(termoBusca);
  };

  const handleAbrirDetalhes = (aluno: ListaAluno) => {
    setAlunoSelecionado(aluno);
    setIsDetalhesOpen(true);
  };

  const handleFecharDetalhes = (foiAtualizado?: boolean) => {
    setIsDetalhesOpen(false);
    setAlunoSelecionado(null);
    if (foiAtualizado) refetch();
  };

  const pillForStatus = (status: StatusPenalidade) => {
    switch (status) {
      case 'sem-penalidade':
        return { class: 'pill pill-success', label: t('penalty.no_penalty') };
      case 'advertencia':
        return { class: 'pill pill-warn', label: t('legend.warning') };
      case 'suspensao':
        return {
          class:
            'pill bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
          label: t('legend.suspension'),
        };
      case 'bloqueio':
        return { class: 'pill pill-danger', label: t('legend.block') };
      case 'banimento':
        return {
          class:
            'pill bg-gray-200 text-gray-800 dark:bg-gray-500/20 dark:text-gray-200',
          label: t('legend.ban'),
        };
      default:
        return { class: 'pill pill-info', label: status };
    }
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-5">
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <Modal.Header title={t('modal.new.title')} />
        <StudentModalNew
          onClose={() => setIsModalOpen(false)}
          onSuccess={refetch}
        />
      </Modal>

      <ModalStudentDetails
        isOpen={isDetalhesOpen}
        onClose={handleFecharDetalhes}
        aluno={alunoSelecionado}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-lumi-primary/10 text-lumi-primary dark:bg-lumi-label/10 dark:text-lumi-label">
            <Users className="h-6 w-6" />
          </span>
          <div>
            <div className="text-xs font-semibold tracking-wider text-lumi-primary dark:text-lumi-label uppercase">
              {t('page.eyebrow', { defaultValue: 'Comunidade' })}
            </div>
            <h1 className="font-display font-extrabold text-3xl text-gray-900 dark:text-white mt-1">
              {t('page.title', { defaultValue: 'Alunos' })}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('page.subtitle', {
                defaultValue:
                  'Leitores cadastrados e seu status de penalidade.',
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statsCards.map((card) => {
          const isActive =
            card.filterCode === ''
              ? penaltyBadge === ''
              : penaltyBadge === card.filterCode;
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => handleBadgeFilter(card.filterCode)}
              aria-pressed={isActive}
              className={`flex items-center gap-3 rounded-xl border bg-white dark:bg-dark-card p-4 text-left transition hover:-translate-y-0.5 hover:shadow-card ${
                isActive
                  ? `border-transparent ring-2 ${card.ringClass}`
                  : 'border-gray-200/70 dark:border-white/5'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${card.tileClass}`}
              >
                {card.icon}
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {card.label}
                </div>
                <div className="font-display font-bold text-xl text-gray-800 dark:text-white">
                  {card.total}
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
            <SlidersIcon /> 
            {t('common:action.advanced_filter')}
          </button>
          {isFilterOpen && (
            <StudentFilter
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
                  {t('table.column.penalty')}
                </th>
                <th className="text-center px-5 py-3.5">
                  {t('table.column.registration')}
                </th>
                <th className="text-center px-5 py-3.5">
                  {t('table.column.name')}
                </th>
                <th className="text-center px-5 py-3.5">
                  {t('table.column.course')}
                </th>
                <th className="text-center px-5 py-3.5">
                  {t('table.column.birth_date')}
                </th>
                <th className="text-center px-5 py-3.5">
                  {t('common:actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-gray-400"
                  >
                    …
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-red-500"
                  >
                    {t('error.load')}
                  </td>
                </tr>
              ) : alunos.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-gray-400"
                  >
                    {t('common:empty')}
                  </td>
                </tr>
              ) : (
                alunos.map((aluno) => {
                  const pill = pillForStatus(aluno.penalidadeStatus);
                  return (
                    <tr
                      key={aluno.matricula}
                      className="border-t border-gray-100 dark:border-white/5 row-hover"
                    >
                      <td className="px-5 py-3 text-center">
                        <span className={pill.class}>
                          <span className="dot" />
                          {pill.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center font-mono text-xs text-gray-500">
                        {aluno.matricula}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-center gap-3">
                          <span className="font-semibold text-gray-800 dark:text-white truncate">
                            {formatarNome(aluno.nomeCompleto)}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-center text-gray-600 dark:text-gray-300">
                        {aluno.cursoNome}
                      </td>
                      <td className="px-5 py-3 text-center text-gray-600 dark:text-gray-300 text-sm">
                        {aluno.nascimentoDate.toLocaleDateString(i18n.language)}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleAbrirDetalhes(aluno)}
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
