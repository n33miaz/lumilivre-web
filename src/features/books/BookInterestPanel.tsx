import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, PackageX } from 'lucide-react';

import { BookCover } from '../../components/ui/BookCover';
import { TableFooter } from '../../components/ui/TableFooter';
import { ToggleSwitch } from '../../components/ui/ToggleSwitch';
import { useResumoInteresse } from '../../hooks/queries/useBookQueries';
import {
  useTablePageSize,
  type PageSizeChoice,
} from '../../hooks/useTablePageSize';
import type { ResumoInteresse } from '../../services/bookService';

interface BookInterestPanelProps {
  /** Só busca quando a visão está à frente (o stage mantém as três montadas). */
  isActive: boolean;
  onOpenBook: (linha: ResumoInteresse) => void;
}

/**
 * Indicador de interesse — a fila de compra do acervo.
 *
 * A pergunta que esta tela responde não é "quem curtiu", é "o que os alunos
 * querem e nós não conseguimos emprestar". Por isso o filtro de *sem exemplar
 * disponível* nasce ligado: sem ele a lista vira ranking de popularidade, que é
 * interessante mas não gera ação nenhuma.
 *
 * Não existe — nem deve existir — visão nominal: interesse é comportamento de
 * menor de idade e a API expõe só o agregado.
 */
export function BookInterestPanel({
  isActive,
  onOpenBook,
}: BookInterestPanelProps) {
  const { t } = useTranslation('book');
  const [apenasSemDisponivel, setApenasSemDisponivel] = useState(true);
  const [page, setPage] = useState(1);

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const { pageSizeChoice, itemsPerPage, setPageSize } = useTablePageSize(
    'books.interest',
    tableContainerRef,
    { rowHeight: 61, footerHeight: 50, observeKey: String(isActive) },
  );

  const { data, isLoading, isError } = useResumoInteresse(
    apenasSemDisponivel,
    page - 1,
    itemsPerPage,
    isActive,
  );

  const linhas = data?.content ?? [];

  const handlePageSizeChange = (value: PageSizeChoice) => {
    setPageSize(value);
    setPage(1);
  };

  const handleFilterChange = () => {
    setApenasSemDisponivel((current) => !current);
    setPage(1);
  };

  // Zero disponível é o que transforma interesse em pedido de compra; ter
  // exemplar mas nenhum livre é fila, não falta de acervo.
  const disponibilidadePill = (linha: ResumoInteresse) => {
    if (linha.exemplares === 0) {
      return { className: 'pill pill-danger', label: t('interest.state.none') };
    }
    if (linha.disponiveis === 0) {
      return { className: 'pill pill-warn', label: t('interest.state.all_out') };
    }
    return { className: 'pill pill-success', label: t('interest.state.ok') };
  };

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
            <Heart className="h-6 w-6" />
          </span>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-lumi-primary dark:text-lumi-label">
              {t('interest.eyebrow')}
            </div>
            <h2 className="mt-1 font-display text-2xl font-extrabold text-gray-900 dark:text-white">
              {t('interest.title')}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t('interest.subtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start rounded-xl border border-gray-200 bg-white p-3 dark:border-white/10 dark:bg-dark-card sm:self-center">
          <PackageX className="h-5 w-5 shrink-0 text-amber-500" />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-800 dark:text-white">
              {t('interest.filter.unmet_only')}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('interest.filter.unmet_only_hint')}
            </p>
          </div>
          <ToggleSwitch
            checked={apenasSemDisponivel}
            onChange={handleFilterChange}
            ariaLabel={t('interest.filter.unmet_only')}
          />
        </div>
      </div>

      {/* Piso de altura só no mobile, como nas demais tabelas da tela. */}
      <div
        ref={tableContainerRef}
        className="flex min-h-[22rem] flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200/70 bg-white dark:border-white/5 dark:bg-dark-card lg:min-h-0"
      >
        <div className="tbl-scroll tbl-fill min-h-0 flex-1">
          <table className="w-full text-sm">
            <thead className="tbl-head-dark text-[11px] font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5 text-left">
                  {t('interest.column.book')}
                </th>
                <th className="px-5 py-3.5 text-center">
                  {t('interest.column.wanted')}
                </th>
                <th className="px-5 py-3.5 text-center">
                  {t('interest.column.copies')}
                </th>
                <th className="px-5 py-3.5 text-center">
                  {t('interest.column.available')}
                </th>
                <th className="px-5 py-3.5 text-center">
                  {t('interest.column.state')}
                </th>
                <th className="px-5 py-3.5 text-center">{t('common:actions')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                    {t('common:loading')}
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-red-500">
                    {t('common:error.load')}
                  </td>
                </tr>
              ) : linhas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                    {apenasSemDisponivel
                      ? t('interest.empty.unmet')
                      : t('interest.empty.all')}
                  </td>
                </tr>
              ) : (
                linhas.map((linha) => {
                  const pill = disponibilidadePill(linha);
                  return (
                    <tr
                      key={linha.livroId}
                      className="row-hover border-t border-gray-100 dark:border-white/5"
                    >
                      <td className="px-5 py-2">
                        <div className="flex items-center gap-3">
                          <BookCover
                            title={linha.titulo}
                            bookId={linha.livroId}
                            coverUrl={linha.capaUrl}
                            className="h-12 w-9 shrink-0 rounded"
                          />
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-gray-800 dark:text-white">
                              {linha.titulo}
                            </div>
                            <div className="truncate text-xs text-gray-500 dark:text-gray-400">
                              {linha.autor || '-'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-2 text-center">
                        <span className="inline-flex items-center gap-1.5 font-display text-lg font-extrabold text-rose-600 dark:text-rose-400">
                          <Heart className="h-4 w-4 fill-current" />
                          {linha.interessados}
                        </span>
                      </td>
                      <td className="px-5 py-2 text-center font-semibold tabular-nums text-gray-700 dark:text-gray-200">
                        {linha.exemplares}
                      </td>
                      <td
                        className={`px-5 py-2 text-center font-semibold tabular-nums ${
                          linha.disponiveis === 0
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-gray-700 dark:text-gray-200'
                        }`}
                      >
                        {linha.disponiveis}
                      </td>
                      <td className="px-5 py-2 text-center">
                        <span className={pill.className}>
                          <span className="dot" />
                          {pill.label}
                        </span>
                      </td>
                      <td className="px-5 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => onOpenBook(linha)}
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
          allowAutoPageSize
          pageSizeValue={pageSizeChoice}
          onPageSizeChange={handlePageSizeChange}
          legendItems={[
            { color: 'bg-red-500', label: t('interest.state.none') },
            { color: 'bg-amber-500', label: t('interest.state.all_out') },
            { color: 'bg-emerald-500', label: t('interest.state.ok') },
          ]}
          pagination={{
            currentPage: page,
            totalPages: data?.totalPages ?? 1,
            itemsPerPage,
            totalItems: data?.totalElements ?? 0,
          }}
          onPageChange={setPage}
        />
      </div>
    </>
  );
}
