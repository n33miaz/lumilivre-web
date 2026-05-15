import { useState, useMemo, useRef, useEffect } from 'react';

import { ActionHeader } from '../../components/ui/ActionHeader';
import { DataTable, type ColumnDef } from '../../components/ui/DataTable';
import { TableFooter } from '../../components/ui/TableFooter';
import { Modal } from '../../components/ui/Modal';
import { TccModalNew } from '../../features/tcc/TccModalNew';
import { TccModalDetails } from '../../features/tcc/TccModalDetails';
import { TccFilter } from '../../features/tcc/TccFilter';
import { useDynamicPageSize } from '../../hooks/useDynamicPageSize';
import { useTccs } from '../../hooks/queries/useTccQueries';
import { type TccResponse } from '../../services/thesisService';

export function TccPage() {
  const [termoBusca, setTermoBusca] = useState('');
  const [termoBuscaAtivo, setTermoBuscaAtivo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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

  const [sortConfig, setSortConfig] = useState<{
    key: keyof TccResponse;
    direction: 'asc' | 'desc';
  }>({
    key: 'titulo',
    direction: 'asc',
  });

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const dynamicPageSize = useDynamicPageSize(tableContainerRef, {
    rowHeight: 48,
    footerHeight: 50,
  });

  useEffect(() => {
    if (dynamicPageSize > 0) setItemsPerPage(dynamicPageSize);
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

  const handleSort = (key: string) => {
    const typedKey = key as keyof TccResponse;
    setSortConfig((prev) => ({
      key: typedKey,
      direction:
        prev.key === typedKey && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
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
    setFilterParams({ cursoId: '', semestre: '', ano: '' });
    setActiveFilters({});
    setIsFilterOpen(false);
  };

  const handleSearchSubmit = () => {
    setTermoBuscaAtivo(termoBusca);
    setActiveFilters({});
    setCurrentPage(1);
  };

  const handleResetSearch = () => {
    setTermoBusca('');
    setTermoBuscaAtivo('');
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

  const columns: ColumnDef<TccResponse>[] = [
    {
      key: 'titulo',
      header: 'Título',
      width: '30%',
      render: (item) => (
        <span
          className="font-bold dark:text-white truncate"
          title={item.titulo}
        >
          {item.titulo}
        </span>
      ),
    },
    {
      key: 'alunos',
      header: 'Alunos',
      width: '30%',
      render: (item) => (
        <span className="dark:text-gray-300 truncate" title={item.alunos}>
          {item.alunos}
        </span>
      ),
    },
    {
      key: 'curso',
      header: 'Curso',
      width: '20%',
      render: (item) => (
        <span className="dark:text-gray-300 truncate">{item.curso}</span>
      ),
    },
    {
      key: 'anoConclusao',
      header: 'Ano',
      width: '10%',
      render: (item) => (
        <span className="dark:text-gray-300">{item.anoConclusao}</span>
      ),
    },
    {
      key: 'acoes',
      header: 'Ações',
      width: '10%',
      isSortable: false,
      render: (item) => (
        <button
          onClick={() => handleOpenDetalhes(item)}
          className="bg-lumi-label text-white text-xs font-bold py-1 px-3 rounded hover:bg-opacity-75 hover:scale-105 shadow-md select-none"
        >
          DETALHES
        </button>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 relative z-40 animate-slide-in-left">
        <ActionHeader
          searchTerm={termoBusca}
          onSearchChange={setTermoBusca}
          onSearchSubmit={handleSearchSubmit}
          onReset={handleResetSearch}
          searchPlaceholder="Pesquise por título, aluno ou curso"
          onAddNew={() => setIsModalOpen(true)}
          addNewButtonLabel="NOVO TCC"
          showFilterButton={true}
          isFilterOpen={isFilterOpen}
          onFilterToggle={() => setIsFilterOpen((prev) => !prev)}
          filterComponent={
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
          }
        />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <Modal.Header title="Cadastrar Novo TCC" />
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

      <div
        ref={tableContainerRef}
        className="bg-white dark:bg-dark-card rounded-lg shadow-md flex-grow flex flex-col min-h-0 overflow-hidden"
      >
        <DataTable
          data={paginatedData}
          columns={columns}
          isLoading={isLoading}
          error={error ? 'Erro ao carregar TCCs' : null}
          sortConfig={sortConfig}
          onSort={handleSort}
          getRowKey={(item) => item.id}
          emptyStateMessage="Nenhum TCC encontrado."
        />
        <TableFooter
          pagination={{
            currentPage,
            totalPages: Math.ceil(filteredData.length / itemsPerPage),
            itemsPerPage,
            totalItems: filteredData.length,
          }}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(size) => {
            setItemsPerPage(size);
            setCurrentPage(1);
          }}
        />
      </div>
    </div>
  );
}
