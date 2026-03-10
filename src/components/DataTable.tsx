import React, { useRef } from 'react';

import { LoadingIcon } from './LoadingIcon';
import { SortableTh } from './SortableTh';

export interface ColumnDef<T> {
  key: string;
  header: string;
  width?: string;
  isSortable?: boolean;
  render: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading: boolean;
  error: string | null;
  sortConfig: { key: string; direction: 'asc' | 'desc' };
  onSort: (key: string) => void;
  getRowKey: (item: T) => string | number;
  getRowClass?: (item: T) => string;
  emptyStateMessage?: string;
  headerClassName?: string;
  headerTextClassName?: string;
  hoverHeaderClassName?: string;
  hasRoundedBorderTop?: boolean;
  minWidth?: string;
}

export function DataTable<T>({
  data,
  columns,
  isLoading,
  error,
  sortConfig,
  onSort,
  getRowKey,
  getRowClass,
  emptyStateMessage = 'Nenhum item encontrado.',
  headerClassName = 'bg-lumi-primary shadow-md',
  headerTextClassName = 'text-white',
  hoverHeaderClassName = 'hover:bg-white/20',
  hasRoundedBorderTop = true,
  minWidth = 'min-w-[1024px]',
}: DataTableProps<T>) {
  const tableBodyRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className={`flex flex-col h-full overflow-hidden bg-white dark:bg-dark-card ${
        hasRoundedBorderTop ? 'rounded-t-lg' : ''
      }`}
    >
      <div
        ref={tableBodyRef}
        className="flex-1 overflow-auto custom-scrollbar relative"
      >
        {/* Usando a propriedade minWidth aqui */}
        <div className={`${minWidth} w-full flex flex-col`}>
          <div
            className={`sticky top-0 z-20 flex items-stretch shrink-0 min-h-[48px] ${headerClassName}`}
          >
            {columns.map((col) => {
              return col.isSortable === false ? (
                <div
                  key={col.key}
                  className={`h-full px-4 py-3 text-sm font-bold tracking-wider text-center flex items-center justify-center ${headerTextClassName}`}
                  style={{ width: col.width }}
                >
                  {col.header}
                </div>
              ) : (
                <SortableTh
                  key={col.key}
                  onClick={() => onSort(col.key)}
                  sortConfig={sortConfig}
                  sortKey={col.key}
                  className={`px-4 py-3 text-sm font-bold tracking-wider ${headerTextClassName} ${hoverHeaderClassName}`}
                  style={{ width: col.width }}
                >
                  {col.header}
                </SortableTh>
              );
            })}
          </div>

          <div className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <LoadingIcon />
              </div>
            ) : error ? (
              <div className="p-8 text-red-500 text-center">{error}</div>
            ) : data.length === 0 ? (
              <div className="p-8 text-gray-500 text-center">
                {emptyStateMessage}
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {data.map((item) => (
                  <div
                    key={getRowKey(item)}
                    className={`flex items-center w-full ${
                      getRowClass
                        ? getRowClass(item)
                        : 'hover:bg-gray-300 dark:hover:bg-gray-600 hover:duration-0'
                    }`}
                  >
                    {columns.map((col) => (
                      <div
                        key={`${getRowKey(item)}-${col.key}`}
                        className="px-4 py-3 whitespace-nowrap flex justify-center items-center overflow-hidden"
                        style={{ width: col.width }}
                      >
                        <div className="w-full flex justify-center">
                          {col.render(item)}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
