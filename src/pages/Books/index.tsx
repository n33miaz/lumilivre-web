import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, Layers, Library, PackageX } from 'lucide-react';

import { useDynamicPageSize } from '../../hooks/useDynamicPageSize';
import { Modal } from '../../components/ui/Modal';
import { TableSearch } from '../../components/ui/TableSearch';
import { BookCover } from '../../components/ui/BookCover';
import { SlideStage } from '../../components/ui/SlideStage';
import { TableFooter } from '../../components/ui/TableFooter';
import { BookModalNew } from '../../features/books/BookModalNew';
import { ExempleModalNew } from '../../features/books/ExempleModalNew';
import { DetalhesLivroModal } from '../../features/books/BookModalDetails';
import { ModalExemplarDetails } from '../../features/books/ExempleModalDetails';
import { BookFilter } from '../../features/books/BookFilter';

import {
  type LivroAgrupado,
  type ListaLivro,
} from '../../services/bookService';
import { type EmprestimoAtivoDTO } from '../../services/loanService';
import { useLivros, useExemplares } from '../../hooks/queries/useBookQueries';
import { useEmprestimosAtivosEAtrasados } from '../../hooks/queries/useLoanQueries';

type BooksViewMode = 'list' | 'grid';

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

function ListIcon() {
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
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function GridIcon() {
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
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}

function ChevronLeftIcon() {
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
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

export function LivrosPage() {
  const { t } = useTranslation('book');
  const [isExemplarView, setIsExemplarView] = useState(false);
  const [booksViewMode, setBooksViewMode] = useState<BooksViewMode>('list');
  const [selectedBook, setSelectedBook] = useState<LivroAgrupado | null>(null);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [tempBookCreated, setTempBookCreated] = useState<LivroAgrupado | null>(
    null,
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  }>({
    key: 'nome',
    direction: 'asc',
  });

  const [termoBusca, setTermoBusca] = useState('');
  const [termoBuscaAtivo, setTermoBuscaAtivo] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetalhesOpen, setIsDetalhesOpen] = useState(false);
  const [livroSelecionado, setLivroSelecionado] =
    useState<LivroAgrupado | null>(null);
  const [isDetalhesExemplarOpen, setIsDetalhesExemplarOpen] = useState(false);
  const [exemplarSelecionado, setExemplarSelecionado] =
    useState<ListaLivro | null>(null);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterParams, setFilterParams] = useState({
    autor: '',
    editora: '',
    genero: '',
    cdd: '',
    classificacaoEtaria: '',
    tipoCapa: '',
    dataLancamento: '',
  });
  const [activeFilters, setActiveFilters] = useState({});

  // Filtro rápido acionado pelos cards de KPI (escopo da página carregada, em
  // linha com as métricas dos próprios cards, que também são por página).
  const [quickFilter, setQuickFilter] = useState<
    'all' | 'with_copies' | 'no_copies'
  >('all');

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

  // Page size do grid: calculado a partir do espaço disponível para que a grade
  // sempre preencha a tela (sem faixa vazia embaixo) em vez de mostrar só ~10.
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const [gridPageSize, setGridPageSize] = useState(0);

  useEffect(() => {
    if (booksViewMode !== 'grid') return;
    const el = gridContainerRef.current;
    if (!el) return;
    let raf = 0;
    const apply = () => {
      const width = el.clientWidth;
      const height = el.getBoundingClientRect().height;
      if (width <= 0 || height <= 0) return;
      // Colunas espelham os breakpoints do Tailwind (2/3/4/5/6).
      const w = window.innerWidth;
      const cols = w >= 1280 ? 6 : w >= 1024 ? 5 : w >= 768 ? 4 : w >= 640 ? 3 : 2;
      const gap = 16;
      const cardWidth = (width - (cols - 1) * gap) / cols;
      const cardHeight = cardWidth * (4 / 3) + 36; // capa 3:4 + rótulo
      const rows = Math.max(1, Math.floor((height + gap) / (cardHeight + gap)));
      setGridPageSize((prev) => {
        const next = cols * rows;
        return prev === next ? prev : next;
      });
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
  }, [booksViewMode]);

  // Tamanho de página efetivo: grade usa o cálculo do grid; lista usa o dinâmico.
  const effectivePageSize =
    (booksViewMode === 'grid' ? gridPageSize : itemsPerPage) || 10;

  const {
    data: livrosPageData,
    isLoading: isLivrosLoading,
    error: livrosErrorRaw,
    refetch: refetchLivros,
  } = useLivros(
    currentPage - 1,
    effectivePageSize,
    `${sortConfig.key},${sortConfig.direction}`,
    termoBuscaAtivo,
    activeFilters,
  );

  const {
    data: exemplaresData,
    isLoading: isExemplaresLoading,
    error: exemplaresError,
  } = useExemplares(selectedBook?.id || null);

  const { data: emprestimosAtivos } = useEmprestimosAtivosEAtrasados();

  const livrosErrorMsg = livrosErrorRaw ? t('error.load_books') : null;
  const exemplaresErrorMsg = exemplaresError ? t('error.load_copies') : null;

  const handleLivroCriado = (livroResponse: unknown) => {
    refetchLivros();
    const response = livroResponse as LivroAgrupado;
    const novoLivro: LivroAgrupado = {
      id: response.id,
      isbn: response.isbn,
      nome: response.nome,
      autor: response.autor,
      editora: response.editora,
      quantidade: 0,
    };
    setTempBookCreated(novoLivro);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmarCadastroExemplar = () => {
    setIsConfirmModalOpen(false);
    if (tempBookCreated) {
      setSelectedBook(tempBookCreated);
      setIsExemplarView(true);
      setTermoBusca('');
      setTermoBuscaAtivo('');
      setCurrentPage(1);
      setIsModalOpen(true);
    }
  };

  const handleRecusarCadastroExemplar = () => {
    setIsConfirmModalOpen(false);
    setTempBookCreated(null);
  };

  const exemplaresProcessados = useMemo(() => {
    if (!exemplaresData) return [];
    const mapaEmprestimos = new Map<string, string>();
    if (emprestimosAtivos) {
      emprestimosAtivos.forEach((emp: EmprestimoAtivoDTO) => {
        if (emp.tombo) mapaEmprestimos.set(emp.tombo, emp.leitorNome);
      });
    }
    const lista = exemplaresData.map((ex) => ({
      ...ex,
      responsavel: mapaEmprestimos.get(ex.tomboExemplar) || '-',
    }));
    return lista.sort((a, b) => {
      if (a.status === 'DISPONIVEL' && b.status !== 'DISPONIVEL') return -1;
      if (a.status !== 'DISPONIVEL' && b.status === 'DISPONIVEL') return 1;
      return a.tomboExemplar.localeCompare(b.tomboExemplar);
    });
  }, [exemplaresData, emprestimosAtivos]);

  const exemplaresFiltrados = useMemo(() => {
    if (!termoBusca.trim()) return exemplaresProcessados;
    return exemplaresProcessados.filter((ex) =>
      ex.tomboExemplar.toLowerCase().includes(termoBusca.toLowerCase()),
    );
  }, [exemplaresProcessados, termoBusca]);

  const handleApplyFilters = () => {
    setCurrentPage(1);
    setTermoBusca('');
    setActiveFilters(filterParams);
    setIsFilterOpen(false);
  };

  const handleClearFilters = () => {
    setCurrentPage(1);
    setFilterParams({
      autor: '',
      editora: '',
      genero: '',
      cdd: '',
      classificacaoEtaria: '',
      tipoCapa: '',
      dataLancamento: '',
    });
    setActiveFilters({});
    setIsFilterOpen(false);
  };

  const handleSearchSubmit = (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!termoBusca.trim()) return;
    setTermoBuscaAtivo(termoBusca);
    setCurrentPage(1);
  };

  const handleVerExemplares = useCallback((livro: LivroAgrupado) => {
    setSelectedBook(livro);
    setIsExemplarView(true);
    setActiveFilters({});
    setTermoBusca('');
    setCurrentPage(1);
  }, []);

  const handleVoltarParaLivros = () => {
    setIsExemplarView(false);
    setSelectedBook(null);
    setTermoBusca('');
    setTermoBuscaAtivo('');
    setCurrentPage(1);
  };

  const handleAbrirDetalhes = useCallback((livro: LivroAgrupado) => {
    setLivroSelecionado(livro);
    setIsDetalhesOpen(true);
  }, []);

  const handleAbrirDetalhesExemplar = useCallback((exemplar: ListaLivro) => {
    setExemplarSelecionado(exemplar);
    setIsDetalhesExemplarOpen(true);
  }, []);

  const handleFecharDetalhesLivro = (foiAtualizado?: boolean) => {
    setIsDetalhesOpen(false);
    setLivroSelecionado(null);
    if (foiAtualizado) refetchLivros();
  };

  const handleFecharDetalhesExemplar = () => {
    setIsDetalhesExemplarOpen(false);
    setExemplarSelecionado(null);
  };

  const livros = livrosPageData?.content ?? [];
  const totalPages = livrosPageData?.totalPages ?? 1;
  const exemplaresNaPagina = livros.reduce(
    (sum, b) => sum + (b.quantidade ?? 0),
    0,
  );
  const semExemplares = livros.filter((b) => (b.quantidade ?? 0) === 0).length;

  // Aplica o filtro rápido dos cards de KPI sobre a página carregada.
  const livrosExibidos =
    quickFilter === 'no_copies'
      ? livros.filter((b) => (b.quantidade ?? 0) === 0)
      : quickFilter === 'with_copies'
        ? livros.filter((b) => (b.quantidade ?? 0) > 0)
        : livros;

  const toggleQuickFilter = (next: 'with_copies' | 'no_copies') =>
    setQuickFilter((prev) => (prev === next ? 'all' : next));

  const statusPillFor = (status: string) => {
    switch (status) {
      case 'DISPONIVEL':
        return { class: 'pill pill-success', label: t('legend.available') };
      case 'EMPRESTADO':
        return { class: 'pill pill-warn', label: t('legend.borrowed') };
      default:
        return { class: 'pill pill-info', label: t('legend.unknown') };
    }
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <Modal.Header
          title={
            isExemplarView ? t('modal.copy.new.title') : t('modal.new.title')
          }
        />
        {isExemplarView && selectedBook ? (
          <ExempleModalNew
            livroId={selectedBook.id}
            livroIsbn={selectedBook.isbn}
            livroNome={selectedBook.nome}
            onClose={() => setIsModalOpen(false)}
          />
        ) : (
          <BookModalNew
            onClose={() => setIsModalOpen(false)}
            onSuccess={handleLivroCriado}
          />
        )}
      </Modal>

      <Modal
        isOpen={isConfirmModalOpen}
        onClose={handleRecusarCadastroExemplar}
      >
        <Modal.Header title={t('confirm.copy_register.title')} />
        <Modal.Body>
          <div className="flex flex-col gap-4">
            <p className="text-gray-700 dark:text-gray-300 text-lg">
              {t('confirm.copy_register.message')} <br />
              <strong>{t('confirm.copy_register.question')}</strong>
            </p>
            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={handleRecusarCadastroExemplar}
                className="px-4 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold"
              >
                {t('confirm.copy_register.no')}
              </button>
              <button
                type="button"
                onClick={handleConfirmarCadastroExemplar}
                className="px-6 py-2 rounded-lg bg-lumi-primary text-white hover:bg-lumi-primary-hover font-bold shadow-md"
              >
                {t('confirm.copy_register.yes')}
              </button>
            </div>
          </div>
        </Modal.Body>
      </Modal>

      <DetalhesLivroModal
        isOpen={isDetalhesOpen}
        onClose={handleFecharDetalhesLivro}
        livro={livroSelecionado}
      />
      <ModalExemplarDetails
        isOpen={isDetalhesExemplarOpen}
        onClose={handleFecharDetalhesExemplar}
        exemplar={exemplarSelecionado}
        livroId={selectedBook ? selectedBook.id : null}
      />

      <SlideStage
        className="flex-1 min-h-0"
        trackClassName="items-stretch"
        itemClassName=""
        currentIndex={isExemplarView ? 1 : 0}
        viewDataAttribute="books-block"
        viewDataValues={['list', 'exemplares']}
        views={[
          <div
            key="books-list"
            className="flex min-h-0 flex-1 flex-col gap-5 px-1 pt-1"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-lumi-primary/10 text-lumi-primary dark:bg-lumi-label/10 dark:text-lumi-label">
                  <BookOpen className="h-6 w-6" />
                </span>
                <div>
                  <div className="text-xs font-semibold tracking-wider text-lumi-primary dark:text-lumi-label uppercase">
                    {t('page.eyebrow', { defaultValue: 'Acervo' })}
                  </div>
                  <h1 className="font-display font-extrabold text-3xl text-gray-900 dark:text-white mt-1">
                    {t('page.title', { defaultValue: 'Livros' })}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {t('page.subtitle', {
                      defaultValue:
                        'Catálogo completo, com busca por ISBN e exemplares físicos.',
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-center">
                <div className="relative inline-flex rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-dark-card p-1">
                  {/* Indicador deslizante (mesmo padrão do toggle do Dashboard). */}
                  <span
                    aria-hidden="true"
                    className="absolute top-1 left-1 h-7 w-9 rounded bg-lumi-primary shadow-sm transition-transform duration-300 ease-out"
                    style={{
                      transform:
                        booksViewMode === 'grid'
                          ? 'translateX(100%)'
                          : 'translateX(0)',
                    }}
                  />
                  <button
                    type="button"
                    aria-label={t('view.list')}
                    aria-pressed={booksViewMode === 'list'}
                    title={t('view.list')}
                    onClick={() => setBooksViewMode('list')}
                    className={`relative z-10 flex h-7 w-9 items-center justify-center rounded text-sm font-semibold transition-colors ${
                      booksViewMode === 'list'
                        ? 'text-white'
                        : 'text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    <ListIcon />
                  </button>
                  <button
                    type="button"
                    aria-label={t('view.grid')}
                    aria-pressed={booksViewMode === 'grid'}
                    title={t('view.grid')}
                    onClick={() => setBooksViewMode('grid')}
                    className={`relative z-10 flex h-7 w-9 items-center justify-center rounded text-sm font-semibold transition-colors ${
                      booksViewMode === 'grid'
                        ? 'text-white'
                        : 'text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    <GridIcon />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="h-10 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold inline-flex items-center gap-2 shadow-md"
                >
                  <PlusIcon /> {t('button.new')}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setQuickFilter('all')}
                aria-pressed={quickFilter === 'all'}
                className={`flex items-center gap-3 rounded-xl bg-white dark:bg-dark-card border p-4 text-left transition hover:shadow-card ${
                  quickFilter === 'all'
                    ? 'border-lumi-primary ring-1 ring-lumi-primary'
                    : 'border-gray-200/70 dark:border-white/5'
                }`}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-lumi-primary/10 text-lumi-primary dark:bg-lumi-label/10 dark:text-lumi-label">
                  <Library className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t('badge.titles')}
                  </div>
                  <div className="font-display font-bold text-xl text-gray-800 dark:text-white">
                    {livrosPageData?.totalElements ?? 0}
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => toggleQuickFilter('with_copies')}
                aria-pressed={quickFilter === 'with_copies'}
                className={`flex items-center gap-3 rounded-xl bg-white dark:bg-dark-card border p-4 text-left transition hover:shadow-card ${
                  quickFilter === 'with_copies'
                    ? 'border-blue-500 ring-1 ring-blue-500'
                    : 'border-gray-200/70 dark:border-white/5'
                }`}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-blue-100 text-blue-600 dark:bg-blue-500/10">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t('badge.copies')}
                  </div>
                  <div className="font-display font-bold text-xl text-gray-800 dark:text-white">
                    {exemplaresNaPagina}
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => toggleQuickFilter('no_copies')}
                aria-pressed={quickFilter === 'no_copies'}
                className={`flex items-center gap-3 rounded-xl bg-white dark:bg-dark-card border p-4 text-left transition hover:shadow-card ${
                  quickFilter === 'no_copies'
                    ? 'border-amber-500 ring-1 ring-amber-500'
                    : 'border-gray-200/70 dark:border-white/5'
                }`}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-amber-100 text-amber-600 dark:bg-amber-500/10">
                  <PackageX className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t('badge.no_copies')}
                  </div>
                  <div className="font-display font-bold text-xl text-gray-800 dark:text-white">
                    {semExemplares}
                  </div>
                </div>
              </button>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row">
              <TableSearch
                className="flex-1"
                value={termoBusca}
                onChange={setTermoBusca}
                onSubmit={handleSearchSubmit}
                onClear={() => {
                  setTermoBusca('');
                  setTermoBuscaAtivo('');
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
                  <BookFilter
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

            {booksViewMode === 'list' ? (
              <div
                key="books-view-list"
                ref={tableContainerRef}
                className="flex min-h-0 flex-1 flex-col rounded-2xl bg-white dark:bg-dark-card border border-gray-200/70 dark:border-white/5 overflow-hidden animate-slide-in-left"
              >
                <div className="tbl-scroll tbl-fill min-h-0 flex-1">
                  <table className="w-full text-sm">
                    <thead className="tbl-head-dark text-[11px] font-bold uppercase tracking-wider">
                      <tr>
                        <th className="text-center px-5 py-3.5">
                          {t('table.column.isbn')}
                        </th>
                        <th className="text-center px-5 py-3.5">
                          {t('table.column.title')}
                        </th>
                        <th className="text-center px-5 py-3.5">
                          {t('table.column.author')}
                        </th>
                        <th className="text-center px-5 py-3.5">
                          {t('table.column.publisher')}
                        </th>
                        <th className="text-center px-5 py-3.5">
                          {t('table.column.quantity')}
                        </th>
                        <th className="text-center px-5 py-3.5">
                          {t('common:actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLivrosLoading ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-5 py-12 text-center text-gray-400"
                          >
                            …
                          </td>
                        </tr>
                      ) : livrosErrorMsg ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-5 py-12 text-center text-red-500"
                          >
                            {livrosErrorMsg}
                          </td>
                        </tr>
                      ) : livrosExibidos.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-5 py-12 text-center text-gray-400"
                          >
                            {t('common:empty')}
                          </td>
                        </tr>
                      ) : (
                        livrosExibidos.map((book) => (
                          <tr
                            key={book.id}
                            className="border-t border-gray-100 dark:border-white/5 row-hover"
                          >
                            <td className="px-5 py-3 text-center font-mono text-xs text-gray-500">
                              {book.isbn || '-'}
                            </td>
                            <td className="px-5 py-3 text-center font-semibold text-gray-800 dark:text-white">
                              {book.nome}
                            </td>
                            <td className="px-5 py-3 text-center text-gray-600 dark:text-gray-300">
                              {book.autor || '-'}
                            </td>
                            <td className="px-5 py-3 text-center text-gray-600 dark:text-gray-300">
                              {book.editora || '-'}
                            </td>
                            <td className="px-5 py-3 text-center font-bold text-gray-800 dark:text-white">
                              {book.quantidade ?? '-'}
                            </td>
                            <td className="px-5 py-3 text-center">
                              <div className="flex justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleVerExemplares(book)}
                                  className="pill pill-info hover:bg-lumi-action hover:text-white"
                                >
                                  {t('button.copies')}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAbrirDetalhes(book)}
                                  className="pill pill-purple hover:bg-lumi-primary hover:text-white"
                                >
                                  {t('common:button.details')}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <TableFooter
                  showPageSizeSelector={false}
                  pagination={{
                    currentPage,
                    totalPages,
                    itemsPerPage: itemsPerPage || 10,
                    totalItems: livrosPageData?.totalElements ?? 0,
                  }}
                  onPageChange={setCurrentPage}
                />
              </div>
            ) : (
              <div
                key="books-view-grid"
                className="flex min-h-0 flex-1 flex-col gap-4 animate-slide-in-right"
              >
                <div
                  ref={gridContainerRef}
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 auto-rows-min content-start gap-4 flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1"
                >
                  {isLivrosLoading
                    ? Array.from({ length: effectivePageSize || 12 }).map(
                        (_, i) => (
                          <div
                            key={i}
                            className="aspect-[3/4] rounded-xl skeleton"
                          />
                        ),
                      )
                    : livrosExibidos.map((book) => (
                        <div key={book.id} className="group">
                          <button
                            type="button"
                            onClick={() => handleAbrirDetalhes(book)}
                            className="block w-full text-left"
                          >
                            <BookCover
                              title={book.nome}
                              coverUrl={book.imagem}
                              isbn={book.isbn}
                              className="aspect-[3/4] rounded-xl flex items-end p-3 text-white transition group-hover:-translate-y-0.5 group-hover:shadow-card"
                            >
                              <div className="relative z-10">
                                <div className="text-[11px] font-mono opacity-70">
                                  {book.isbn || '—'}
                                </div>
                                <div className="font-display font-extrabold text-sm leading-tight line-clamp-3">
                                  {book.nome}
                                </div>
                              </div>
                            </BookCover>
                          </button>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <span className="pill pill-purple">
                              <span className="dot" />
                              {book.quantidade ?? 0}
                            </span>
                            <span className="text-xs text-gray-500 truncate">
                              {book.autor || '-'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleVerExemplares(book)}
                            className="row-hover mt-1.5 w-full rounded-md py-1 text-xs font-semibold text-lumi-primary dark:text-lumi-label"
                          >
                            {t('button.copies')}
                          </button>
                        </div>
                      ))}
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>
                    {t('common:items_range', {
                      start:
                        (currentPage - 1) * effectivePageSize +
                        (livrosExibidos.length > 0 ? 1 : 0),
                      end:
                        (currentPage - 1) * effectivePageSize +
                        livrosExibidos.length,
                      total: livrosPageData?.totalElements ?? 0,
                    })}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      aria-label={t('common:previous')}
                      title={t('common:previous')}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="w-8 h-8 rounded-lg border border-gray-200 dark:border-white/10 hover:border-lumi-primary flex items-center justify-center disabled:opacity-40"
                    >
                      <ChevronLeftIcon />
                    </button>
                    <span className="px-2.5 py-1 rounded-lg bg-lumi-primary text-white text-xs font-bold">
                      {currentPage}
                    </span>
                    <span className="text-xs px-1">/ {totalPages}</span>
                    <button
                      type="button"
                      aria-label={t('common:next')}
                      title={t('common:next')}
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage >= totalPages}
                      className="w-8 h-8 rounded-lg border border-gray-200 dark:border-white/10 hover:border-lumi-primary flex items-center justify-center rotate-180 disabled:opacity-40"
                    >
                      <ChevronLeftIcon />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>,

          <div
            key="books-exemplares"
            className="flex min-h-0 flex-1 flex-col gap-5 px-1 pt-1"
          >
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleVoltarParaLivros}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-lumi-primary inline-flex items-center gap-1.5"
              >
                <ChevronLeftIcon />{' '}
                {t('back_to_books', {
                  defaultValue: 'Voltar para Livros',
                })}
              </button>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <BookCover
                    title={selectedBook?.nome ?? ''}
                    coverUrl={selectedBook?.imagem}
                    isbn={selectedBook?.isbn}
                    className="w-14 h-20 shrink-0 rounded-lg"
                  />
                  <div>
                    <div className="text-xs font-semibold tracking-wider text-lumi-primary dark:text-lumi-label uppercase">
                      {t('copies_of')}
                    </div>
                    <h1 className="font-display font-extrabold text-2xl text-gray-900 dark:text-white">
                      {selectedBook?.nome ?? '-'}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedBook?.autor
                        ? `${t('by', { defaultValue: 'por' })} ${selectedBook.autor}`
                        : ''}
                      {selectedBook?.isbn ? ` · ISBN ${selectedBook.isbn}` : ''}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="h-10 self-start sm:self-auto px-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold inline-flex items-center gap-2 shadow-md"
                >
                  <PlusIcon /> {t('button.new_copy')}
                </button>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col rounded-2xl bg-white dark:bg-dark-card border border-gray-200/70 dark:border-white/5 overflow-hidden">
              <div className="tbl-scroll tbl-fill min-h-0 flex-1">
                <table className="w-full text-sm">
                  <thead className="tbl-head-dark text-[11px] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="text-left px-5 py-3.5">
                        {t('copy.table.column.status')}
                      </th>
                      <th className="text-left px-5 py-3.5">
                        {t('copy.table.column.code')}
                      </th>
                      <th className="text-left px-5 py-3.5">
                        {t('copy.table.column.location')}
                      </th>
                      <th className="text-left px-5 py-3.5">
                        {t('copy.table.column.responsible')}
                      </th>
                      <th className="text-right px-5 py-3.5">
                        {t('common:actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {isExemplaresLoading ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-5 py-12 text-center text-gray-400"
                        >
                          …
                        </td>
                      </tr>
                    ) : exemplaresErrorMsg ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-5 py-12 text-center text-red-500"
                        >
                          {exemplaresErrorMsg}
                        </td>
                      </tr>
                    ) : exemplaresFiltrados.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-5 py-12 text-center text-gray-400"
                        >
                          {t('common:empty')}
                        </td>
                      </tr>
                    ) : (
                      exemplaresFiltrados.map((ex) => {
                        const pill = statusPillFor(ex.status);
                        return (
                          <tr
                            key={ex.tomboExemplar}
                            className="border-t border-gray-100 dark:border-white/5 row-hover"
                          >
                            <td className="px-5 py-3">
                              <span className={pill.class}>
                                <span className="dot" />
                                {pill.label}
                              </span>
                            </td>
                            <td className="px-5 py-3 font-mono font-semibold text-gray-800 dark:text-white">
                              {ex.tomboExemplar}
                            </td>
                            <td className="px-5 py-3 text-gray-600 dark:text-gray-300">
                              {ex.localizacao_fisica || '-'}
                            </td>
                            <td className="px-5 py-3 text-gray-600 dark:text-gray-300">
                              {ex.responsavel || '-'}
                            </td>
                            <td className="px-5 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleAbrirDetalhesExemplar(ex)}
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
            </div>
          </div>,
        ]}
      />
    </section>
  );
}
