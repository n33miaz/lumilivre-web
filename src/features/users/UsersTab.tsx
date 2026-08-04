import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Modal } from '../../components/ui/Modal';
import { TableSearch } from '../../components/ui/TableSearch';
import { TableFooter } from '../../components/ui/TableFooter';
import { UserModalNew } from './UserModalNew';
import { UserModalDetails } from './UserModalDetails';
import { useUsuarios } from '../../hooks/queries/useUserQueries';
import type { UsuarioResumo } from '../../services/userService';

export function UsersTab() {
  const { t } = useTranslation('admin');
  const [termoBusca, setTermoBusca] = useState('');
  const [textoAtivo, setTextoAtivo] = useState('');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  const [isNewOpen, setIsNewOpen] = useState(false);
  const [selected, setSelected] = useState<UsuarioResumo | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const { data, isLoading, isError } = useUsuarios(textoAtivo, page, size);

  const handleSearch = () => {
    setPage(0);
    setTextoAtivo(termoBusca.trim());
  };

  const openDetails = (usuario: UsuarioResumo) => {
    setSelected(usuario);
    setIsDetailsOpen(true);
  };

  const closeDetails = () => {
    setIsDetailsOpen(false);
    setSelected(null);
  };

  const rolePill = (code: string) =>
    code === 'ADMIN' ? 'pill pill-danger' : 'pill pill-purple';

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <Modal isOpen={isNewOpen} onClose={() => setIsNewOpen(false)} maxWidth="max-w-xl">
        <Modal.Header title={t('users.modal.new_title')} />
        <UserModalNew
          onClose={() => setIsNewOpen(false)}
          onSuccess={() => setPage(0)}
        />
      </Modal>

      <UserModalDetails
        usuario={selected}
        isOpen={isDetailsOpen}
        onClose={closeDetails}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white">
            {t('users.title')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('users.subtitle')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsNewOpen(true)}
          className="h-10 shrink-0 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold inline-flex items-center justify-center gap-2 shadow-md self-start sm:self-center"
        >
          {t('users.action.new')}
        </button>
      </div>

      <TableSearch
        value={termoBusca}
        onChange={setTermoBusca}
        onSubmit={handleSearch}
        onClear={() => {
          setTermoBusca('');
          setTextoAtivo('');
          setPage(0);
        }}
        placeholder={t('users.search.placeholder')}
      />

      <div className="flex min-h-0 flex-1 flex-col rounded-2xl bg-white dark:bg-dark-card border border-gray-200/70 dark:border-white/5 overflow-hidden">
        <div className="tbl-scroll tbl-fill min-h-0 flex-1">
          <table className="w-full text-sm">
            <thead className="tbl-head-dark text-[11px] font-bold uppercase tracking-wider">
              <tr>
                <th className="text-left px-5 py-3.5">{t('users.column.email')}</th>
                <th className="text-center px-5 py-3.5">{t('users.column.role')}</th>
                <th className="text-center px-5 py-3.5">{t('common:actions')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="px-5 py-12 text-center text-gray-400">
                    {t('common:loading')}
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={3} className="px-5 py-12 text-center text-red-500">
                    {t('common:error.load')}
                  </td>
                </tr>
              ) : (data?.content.length ?? 0) === 0 ? (
                <tr>
                  <td colSpan={3} className="px-5 py-12 text-center text-gray-400">
                    {t('common:empty')}
                  </td>
                </tr>
              ) : (
                data?.content.map((usuario) => (
                  <tr
                    key={usuario.id}
                    className="border-t border-gray-100 dark:border-white/5 row-hover"
                  >
                    <td className="px-5 py-3 font-medium text-gray-800 dark:text-white">
                      {usuario.email}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={rolePill(usuario.perfilCode)}>
                        {usuario.perfilLabel}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => openDetails(usuario)}
                        className="pill pill-purple hover:bg-lumi-primary hover:text-white"
                      >
                        {t('common:button.details')}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <TableFooter
          pagination={{
            currentPage: page + 1,
            totalPages: data?.totalPages ?? 1,
            itemsPerPage: size,
            totalItems: data?.totalElements ?? 0,
          }}
          onPageChange={(p) => setPage(p - 1)}
          onItemsPerPageChange={(s) => {
            setSize(s);
            setPage(0);
          }}
        />
      </div>
    </div>
  );
}
