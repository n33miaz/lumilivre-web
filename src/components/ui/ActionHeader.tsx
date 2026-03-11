import { type ReactNode } from 'react';

import SearchIcon from '../assets/icons/search.svg?react';
import FilterIcon from '../assets/icons/filter.svg?react';
import AddIcon from '../assets/icons/add.svg?react';
import CloseIcon from '../assets/icons/close-sm.svg?react';

interface ActionHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  searchPlaceholder: string;
  onAddNew: () => void;
  addNewButtonLabel: string;
  onFilterToggle?: () => void;
  showFilterButton?: boolean;
  isFilterOpen?: boolean;
  children?: ReactNode;
  inputWidth?: string;
  filterComponent?: ReactNode;
  onReset?: () => void;
}

export function ActionHeader({
  searchTerm,
  onSearchChange,
  onSearchSubmit,
  searchPlaceholder,
  onAddNew,
  addNewButtonLabel,
  onFilterToggle,
  showFilterButton = false,
  isFilterOpen = false,
  children,
  inputWidth = 'md:w-[500px]',
  filterComponent,
  onReset,
}: ActionHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 shrink-0 relative z-40 w-full">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-3 w-full md:w-auto">
        {children && <div className="w-full md:w-auto">{children}</div>}

        <div className="flex flex-row items-center gap-2 w-full md:w-auto">
          {/* Barra de Pesquisa */}
          <div className="relative flex-1 md:flex-none select-none">
            <button
              onClick={onSearchSubmit}
              aria-label="Pesquisar"
              className="absolute inset-y-0 right-0 px-4 rounded-r-lg flex items-center bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 active:bg-gray-400 dark:active:bg-gray-700 group z-10"
            >
              <SearchIcon className="w-5 h-5 text-lumi-primary dark:text-lumi-label" />
            </button>

            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => {
                const newValue = e.target.value;
                onSearchChange(newValue);

                if (newValue === '' && onReset) {
                  onReset();
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSearchSubmit();
              }}
              className={`pl-5 pr-20 py-2 w-full ${inputWidth} rounded-lg bg-white dark:bg-dark-card dark:text-white focus:ring-2 focus:ring-lumi-primary focus:border-lumi-primary outline-none shadow-md`}
            />

            {searchTerm && onReset && (
              <button
                onClick={onReset}
                className="absolute inset-y-0 right-14 px-2 flex items-center text-gray-400 hover:text-red-500 transition-colors"
                title="Limpar pesquisa"
              >
                <CloseIcon className="w-4 h-4 fill-current" />
              </button>
            )}
          </div>

          {/* Filtro */}
          {showFilterButton && (
            <div className="relative z-50 shrink-0">
              <button
                id="filter-toggle-button"
                onClick={onFilterToggle}
                title="Filtro Avançado"
                className={`flex items-center justify-center bg-white dark:bg-dark-card dark:text-white font-semibold p-2 md:py-2 md:px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 active:bg-gray-400 dark:active:bg-gray-700 shadow-md select-none group transition-colors ${
                  isFilterOpen ? 'ring-2 ring-lumi-primary' : ''
                }`}
              >
                <span className="hidden md:inline">Filtro Avançado</span>
                <FilterIcon
                  className={`w-6 h-6 md:w-5 md:h-5 md:ml-2 md:-mr-1 text-lumi-primary dark:text-lumi-label transition-transform ${
                    isFilterOpen ? '-rotate-90' : ''
                  }`}
                />
              </button>

              {filterComponent}
            </div>
          )}
        </div>
      </div>

      {/* Adicionar */}
      <button
        onClick={onAddNew}
        className="flex items-center justify-center w-full md:w-auto bg-green-500 text-white font-bold py-2 px-4 pl-3 rounded-lg hover:bg-green-600 active:bg-green-700 shadow-md shrink-0"
      >
        <AddIcon className="w-6 h-6 mr-2 text-white" />
        <span>{addNewButtonLabel}</span>
      </button>
    </div>
  );
}
