import { useState, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { GraduationCap } from 'lucide-react';

import { Modal } from '../../components/ui/Modal';
import { TableSearch } from '../../components/ui/TableSearch';
import { TccModalNew } from '../../features/tcc/TccModalNew';
import { TccModalDetails } from '../../features/tcc/TccModalDetails';
import { TccFilter } from '../../features/tcc/TccFilter';
import { useDynamicPageSize } from '../../hooks/useDynamicPageSize';
import { useTccs } from '../../hooks/queries/useTccQueries';
import { type TccResponse } from '../../services/thesisService';

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

function GraduationIcon() {
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
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}

const AVATAR_COLORS = [
  'bg-lumi-gradient',
  'bg-blue-500',
  'bg-pink-500',
  'bg-emerald-500',
  'bg-orange-500',
];

function authorInitials(name: string) {
  return (
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('') || 'TC'
  );
}

export function TccPage() {
  const { t } = useTranslation('tcc');
  const [termoBusca, setTermoBusca] = useState('');
  const [termoBuscaAtivo, setTermoBuscaAtivo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterParams, setFilterParams] = useState({
    cursoId: '',
    semestre: '',
    ano: '',
  });
  const [activeFilters, setActiveFilters] = useState({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetalhesOpen, setIsDetalhesOpen] = useState(false);
  const [selectedTcc, setSelectedTcc] = useState<TccResponse | null>(null);

  const [sortConfig] = useState<{
    key: keyof TccResponse;
    direction: 'asc' | 'desc';
  }>({ key: 'titulo', direction: 'asc' });

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const dynamicPageSize = useDynamicPageSize(tableContainerRef, {
    rowHeight: 280,
    footerHeight: 0,
  });

  useEffect(() => {
    if (dynamicPageSize > 0) setItemsPerPage(Math.max(dynamicPageSize, 6));
  }, [dynamicPageSize]);

  const {
    data: tccs = [],
    isLoading,
    error,
    refetch,
  } = useTccs(termoBuscaAtivo, activeFilters);

  const filteredData = useMemo(() => {
    const data = [...tccs];
    data.sort((a, b) => {
      const valA = a[sortConfig.key] || '';
      const valB = b[sortConfig.key] || '';
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return data;
  }, [tccs, sortConfig]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const handleApplyFilters = () => {
    setCurrentPage(1);
    setTermoBusca('');
    setTermoBuscaAtivo('');
    setActiveFilters(filterParams);
    setIsFilterOpen(false);
  };

  const handleClearFilters = () => {
    setCurrentPage(1);
    setFilterParams({ cursoId: '', semestre: '', ano: '' });
    setActiveFilters({});
    setIsFilterOpen(false);
  };

  const handleSearchSubmit = (event?: React.FormEvent) => {
    event?.preventDefault();
    setTermoBuscaAtivo(termoBusca);
    setActiveFilters({});
    setCurrentPage(1);
  };

  const handleOpenDetalhes = (tcc: TccResponse) => {
    setSelectedTcc(tcc);
    setIsDetalhesOpen(true);
  };

  const handleCloseDetalhes = (foiAlterado?: boolean) => {
    setIsDetalhesOpen(false);
    setSelectedTcc(null);
    if (foiAlterado) refetch();
  };

  return (
    <section className="space-y-5">
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <Modal.Header title={t('modal.new.title')} />
        <TccModalNew
          onClose={() => setIsModalOpen(false)}
          onSuccess={refetch}
        />
      </Modal>
      <TccModalDetails
        isOpen={isDetalhesOpen}
        onClose={handleCloseDetalhes}
        tcc={selectedTcc}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-lumi-primary/10 text-lumi-primary dark:bg-lumi-label/10 dark:text-lumi-label">
            <GraduationCap className="h-6 w-6" />
          </span>
          <div>
            <div className="text-xs font-semibold tracking-wider text-lumi-primary dark:text-lumi-label uppercase">
              {t('page.eyebrow', { defaultValue: 'Produção acadêmica' })}
            </div>
            <h1 className="font-display font-extrabold text-3xl text-gray-900 dark:text-white mt-1">
              {t('page.title', { defaultValue: 'TCCs' })}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('page.subtitle', {
                defaultValue:
                  'Banco de Trabalhos de Conclusão de Curso digitalizados.',
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

      <div className="flex flex-col gap-3 lg:flex-row">
        <TableSearch
          className="flex-1"
          value={termoBusca}
          onChange={setTermoBusca}
          onSubmit={handleSearchSubmit}
          onClear={() => setTermoBusca('')}
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
            {t('common:action.advanced_filter')}
          </button>
          {isFilterOpen && (
            <TccFilter
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

      <div ref={tableContainerRef}>
        {error ? (
          <div className="rounded-2xl bg-white dark:bg-dark-card border border-gray-200/70 dark:border-white/5 p-8 text-center text-sm font-semibold text-red-500">
            {t('error.load')}
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl bg-gray-100 dark:bg-white/5 min-h-[240px] animate-pulse"
              />
            ))}
          </div>
        ) : paginatedData.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10 p-12 text-center text-sm font-semibold text-gray-500 dark:text-gray-400">
            {t('common:empty')}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedData.map((tcc) => {
              const leitores = (tcc.leitores || '')
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
                .slice(0, 5);
              return (
                <article
                  key={tcc.id}
                  className="group rounded-2xl bg-white dark:bg-dark-card border border-gray-200/70 dark:border-white/5 p-5 hover:shadow-card hover:-translate-y-0.5 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-11 h-11 rounded-xl bg-lumi-gradient text-white flex items-center justify-center shadow-glowSoft">
                      <GraduationIcon />
                    </div>
                    <span className="pill pill-purple">
                      <span className="dot" />
                      {tcc.anoConclusao}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white line-clamp-3">
                    {tcc.titulo}
                  </h3>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-mono">
                    {tcc.curso}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                      {t('authors_label', { defaultValue: 'Leitores' })}
                    </div>
                    <div className="flex items-center -space-x-2">
                      {leitores.map((name, idx) => (
                        <span
                          key={`${name}-${idx}`}
                          title={name}
                          className={`w-7 h-7 rounded-full ${
                            AVATAR_COLORS[idx % AVATAR_COLORS.length]
                          } text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-dark-card`}
                        >
                          {authorInitials(name)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenDetalhes(tcc)}
                    className="mt-4 w-full h-9 rounded-lg bg-lumi-50 dark:bg-white/5 text-lumi-primary dark:text-lumi-label text-sm font-bold hover:bg-lumi-100 dark:hover:bg-white/10"
                  >
                    {t('common:button.details')}
                  </button>
                </article>
              );
            })}
          </div>
        )}

        {filteredData.length > itemsPerPage && (
          <div className="mt-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>
              {t('common:items_range', {
                start: (currentPage - 1) * itemsPerPage + 1,
                end: Math.min(currentPage * itemsPerPage, filteredData.length),
                total: filteredData.length,
              })}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 h-8 rounded-lg border border-gray-200 dark:border-white/10 hover:border-lumi-primary disabled:opacity-40 text-xs font-bold"
              >
                ‹
              </button>
              <span className="px-2.5 py-1 rounded-lg bg-lumi-primary text-white text-xs font-bold">
                {currentPage}
              </span>
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((p) =>
                    Math.min(
                      Math.ceil(filteredData.length / itemsPerPage),
                      p + 1,
                    ),
                  )
                }
                disabled={
                  currentPage >= Math.ceil(filteredData.length / itemsPerPage)
                }
                className="px-3 h-8 rounded-lg border border-gray-200 dark:border-white/10 hover:border-lumi-primary disabled:opacity-40 text-xs font-bold"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
