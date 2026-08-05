import {
  useState,
  useMemo,
  useRef,
  useEffect,
  type RefObject,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Megaphone, Paperclip, GraduationCap, Pin } from 'lucide-react';

import { Modal } from '../../components/ui/Modal';
import { TableSearch } from '../../components/ui/TableSearch';
import { TableFooter } from '../../components/ui/TableFooter';
import { ContentModalNew } from '../../features/contents/ContentModalNew';
import { ContentModalDetails } from '../../features/contents/ContentModalDetails';
import { ContentFilter } from '../../features/contents/ContentFilter';
import {
  usePageSizeChoice,
  type PageSizeChoice,
} from '../../hooks/useTablePageSize';
import { useConteudos } from '../../hooks/queries/useContentQueries';
import {
  type ContentResponse,
  type ContentFilterParams,
} from '../../services/contentService';

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

const TYPE_ICON: Record<string, typeof Megaphone> = {
  ANNOUNCEMENT: Megaphone,
  ATTACHMENT: Paperclip,
  WORK: GraduationCap,
};

const STATUS_PILL: Record<string, string> = {
  PUBLISHED: 'pill pill-success',
  SCHEDULED: 'pill pill-warn',
  EXPIRED: 'pill pill-info',
  HIDDEN: 'pill pill-info',
};

/** Altura média observada do cartão de conteúdo (título + resumo + rodapé). */
const CARD_HEIGHT = 286;
const CARD_GAP = 16;

/**
 * Quantos cartões cabem na altura livre da grade. As colunas espelham os
 * breakpoints do Tailwind usados no `grid` (1 / md:2 / lg:3) — sem isso o
 * cálculo por altura sozinho devolveria uma página curta em telas largas.
 */
function useGridAutoPageSize(containerRef: RefObject<HTMLElement | null>) {
  const [pageSize, setPageSize] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let raf = 0;
    const apply = () => {
      const height = el.getBoundingClientRect().height;
      if (height < CARD_HEIGHT) return;
      const width = window.innerWidth;
      const cols = width >= 1024 ? 3 : width >= 768 ? 2 : 1;
      // Arredonda (em vez de truncar) porque a grade rola por dentro: com
      // truncamento sobrava meia tela vazia quando cabia 1,8 linha de cartões.
      const rows = Math.max(
        1,
        Math.round((height + CARD_GAP) / (CARD_HEIGHT + CARD_GAP)),
      );
      setPageSize((prev) => (prev === cols * rows ? prev : cols * rows));
    };
    const measure = () => {
      window.cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(apply);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      window.cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [containerRef]);

  return pageSize;
}

export function ConteudosPage() {
  const { t } = useTranslation('contents');
  const [termoBusca, setTermoBusca] = useState('');
  const [termoBuscaAtivo, setTermoBuscaAtivo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterParams, setFilterParams] = useState<ContentFilterParams>({
    type: '',
    scope: '',
    courseId: '',
    year: '',
  });
  const [activeFilters, setActiveFilters] = useState<ContentFilterParams>({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetalhesOpen, setIsDetalhesOpen] = useState(false);
  const [selected, setSelected] = useState<ContentResponse | null>(null);

  // A grade de cartões preenche a altura disponível como as tabelas: mede o
  // container (já limitado por `flex-1 min-h-0`) e conta quantas linhas de
  // cartão cabem, multiplicando pelas colunas do breakpoint corrente.
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const autoPageSize = useGridAutoPageSize(gridContainerRef);
  const { pageSizeChoice, setPageSize } = usePageSizeChoice('contents');
  const itemsPerPage =
    pageSizeChoice === 'auto' ? autoPageSize || 6 : pageSizeChoice;

  const {
    data: conteudos = [],
    isLoading,
    error,
    refetch,
  } = useConteudos(termoBuscaAtivo, activeFilters);

  const sorted = useMemo(() => {
    // A API já ordena por destaque/ordem/data; mantém essa ordem.
    return [...conteudos];
  }, [conteudos]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    const start = (safePage - 1) * itemsPerPage;
    return sorted.slice(start, start + itemsPerPage);
  }, [sorted, safePage, itemsPerPage]);

  const handlePageSizeChange = (value: PageSizeChoice) => {
    setPageSize(value);
    setCurrentPage(1);
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    setTermoBusca('');
    setTermoBuscaAtivo('');
    setActiveFilters(filterParams);
    setIsFilterOpen(false);
  };

  const handleClearFilters = () => {
    setCurrentPage(1);
    setFilterParams({ type: '', scope: '', courseId: '', year: '' });
    setActiveFilters({});
    setIsFilterOpen(false);
  };

  const handleSearchSubmit = (event?: React.FormEvent) => {
    event?.preventDefault();
    setTermoBuscaAtivo(termoBusca);
    setActiveFilters({});
    setCurrentPage(1);
  };

  const handleOpenDetalhes = (c: ContentResponse) => {
    setSelected(c);
    setIsDetalhesOpen(true);
  };

  const handleCloseDetalhes = (foiAlterado?: boolean) => {
    setIsDetalhesOpen(false);
    setSelected(null);
    if (foiAlterado) refetch();
  };

  const audienceLabel = (c: ContentResponse) => {
    if (c.audienceScope.code === 'COURSE') return c.courseName ?? c.audienceScope.label;
    if (c.audienceScope.code === 'MODULE') return c.academicModuleName ?? c.audienceScope.label;
    if (c.audienceScope.code === 'SHIFT') return c.studyShiftName ?? c.audienceScope.label;
    return c.audienceScope.label;
  };

  return (
    // Coluna flex limitada: a grade rola por dentro e o rodapé de paginação fica
    // sempre visível, como nas telas de tabela.
    <section className="flex min-h-0 flex-1 flex-col gap-5">
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <Modal.Header title={t('modal.new.title')} />
        <ContentModalNew onClose={() => setIsModalOpen(false)} onSuccess={refetch} />
      </Modal>
      <ContentModalDetails
        isOpen={isDetalhesOpen}
        onClose={handleCloseDetalhes}
        content={selected}
      />

      <div className="shrink-0 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-lumi-primary/10 text-lumi-primary dark:bg-lumi-label/10 dark:text-lumi-label">
            <Megaphone className="h-6 w-6" />
          </span>
          <div>
            <div className="text-xs font-semibold tracking-wider text-lumi-primary dark:text-lumi-label uppercase">
              {t('page.eyebrow')}
            </div>
            <h1 className="font-display font-extrabold text-3xl text-gray-900 dark:text-white mt-1">
              {t('page.title')}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('page.subtitle')}
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

      <div className="shrink-0 flex flex-col gap-3 lg:flex-row">
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
          {/* Montado sempre: quem decide render é o `usePresence` do `FilterPanel`.
              Desmontar aqui matava a animação de fechamento. */}
          <ContentFilter
            isOpen={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
            filters={filterParams}
            onFilterChange={(field, value) =>
              setFilterParams((prev) => ({ ...prev, [field]: value }))
            }
            onApply={handleApplyFilters}
            onClear={handleClearFilters}
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4">
        {/* Piso de altura só no mobile: sem ele a grade ficava com meia linha de
            cartão abaixo do cabeçalho e da busca. Em lg+ preenche o que sobra. */}
        <div
          ref={gridContainerRef}
          className="min-h-[22rem] flex-1 overflow-y-auto custom-scrollbar pr-1 lg:min-h-0"
        >
          {error ? (
            <div className="rounded-2xl bg-white dark:bg-dark-card border border-gray-200/70 dark:border-white/5 p-8 text-center text-sm font-semibold text-red-500">
              {t('error.load')}
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-gray-100 dark:bg-white/5 min-h-[220px] animate-pulse"
                />
              ))}
            </div>
          ) : paginatedData.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10 p-12 text-center text-sm font-semibold text-gray-500 dark:text-gray-400">
              {t('common:empty')}
            </div>
          ) : (
            <div className="grid grid-cols-1 auto-rows-min content-start md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedData.map((c) => {
              const TypeIcon = TYPE_ICON[c.contentType.code] ?? Megaphone;
              const snippet = c.contentType.code === 'WORK' ? c.authors : c.body;
              return (
                <article
                  key={c.id}
                  className="group rounded-2xl bg-white dark:bg-dark-card border border-gray-200/70 dark:border-white/5 p-5 hover:shadow-card hover:-translate-y-0.5 transition-all flex flex-col"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-11 h-11 rounded-xl bg-lumi-gradient text-white flex items-center justify-center shadow-glowSoft">
                      <TypeIcon className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      {c.pinned && (
                        <Pin className="w-4 h-4 text-lumi-primary dark:text-lumi-label" fill="currentColor" />
                      )}
                      <span className={STATUS_PILL[c.status.code] ?? 'pill pill-gray'}>
                        <span className="dot" />
                        {c.status.label}
                      </span>
                    </div>
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-lumi-primary dark:text-lumi-label mb-1">
                    {c.contentType.label}
                  </div>
                  <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white line-clamp-2">
                    {c.title}
                  </h3>
                  {snippet && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                      {snippet}
                    </p>
                  )}
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span className="font-mono">{audienceLabel(c)}</span>
                    {c.contentType.code === 'WORK' && c.completionYear && (
                      <span className="pill pill-purple">
                        <span className="dot" />
                        {c.completionYear}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenDetalhes(c)}
                    className="mt-4 w-full h-9 rounded-lg bg-lumi-50 dark:bg-white/5 text-lumi-primary dark:text-lumi-label text-sm font-bold hover:bg-lumi-100 dark:hover:bg-white/10"
                  >
                    {t('common:button.details')}
                  </button>
                </article>
              );
            })}
            </div>
          )}
        </div>

        {/* Mesmo rodapé das tabelas: contagem, linhas por página e navegação. */}
        <div className="shrink-0 overflow-hidden rounded-2xl border border-gray-200/70 bg-white dark:border-white/5 dark:bg-dark-card">
          <TableFooter
            className="border-t-0"
            allowAutoPageSize
            pageSizeValue={pageSizeChoice}
            onPageSizeChange={handlePageSizeChange}
            pagination={{
              currentPage: safePage,
              totalPages,
              itemsPerPage,
              totalItems: sorted.length,
            }}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </section>
  );
}
