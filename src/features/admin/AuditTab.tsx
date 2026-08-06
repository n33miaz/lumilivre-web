import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CustomSelect } from '../../components/ui/CustomSelect';
import { TableFooter } from '../../components/ui/TableFooter';
import { useAccessLogs, useAuditLogs } from '../../hooks/queries/useAuditQueries';
import {
  useTablePageSize,
  type PageSizeChoice,
} from '../../hooks/useTablePageSize';
import type { AuditResult } from '../../services/auditService';

type SubTab = 'access' | 'audit';

interface AccessFilterState {
  evento: string;
  canal: string;
  resultado: string;
  ator: string;
  ip: string;
  alvo: string;
  from: string;
  to: string;
}

interface AuditFilterState {
  acao: string;
  resultado: string;
  ator: string;
  from: string;
  to: string;
}

const EMPTY_ACCESS: AccessFilterState = {
  evento: '',
  canal: '',
  resultado: '',
  ator: '',
  ip: '',
  alvo: '',
  from: '',
  to: '',
};

const EMPTY_AUDIT: AuditFilterState = {
  acao: '',
  resultado: '',
  ator: '',
  from: '',
  to: '',
};

function resultPillClass(result: AuditResult): string {
  switch (result) {
    case 'SUCCESS':
      return 'pill pill-success';
    case 'FAILURE':
      return 'pill pill-danger';
    case 'DENIED':
      return 'pill pill-warn';
    default:
      return 'pill pill-info';
  }
}

export function AuditTab() {
  const { t, i18n } = useTranslation('admin');
  const [subTab, setSubTab] = useState<SubTab>('access');

  const [accessFilters, setAccessFilters] =
    useState<AccessFilterState>(EMPTY_ACCESS);
  const [auditFilters, setAuditFilters] =
    useState<AuditFilterState>(EMPTY_AUDIT);
  const [accessDraft, setAccessDraft] =
    useState<AccessFilterState>(EMPTY_ACCESS);
  const [auditDraft, setAuditDraft] = useState<AuditFilterState>(EMPTY_AUDIT);

  const [accessPage, setAccessPage] = useState(0);
  const [auditPage, setAuditPage] = useState(0);

  // Uma preferência por sub-aba: antes as duas dividiam o mesmo `size` fixo em
  // 20, valor que nem existia na lista de opções — o seletor mostrava "-".
  const accessTableRef = useRef<HTMLDivElement>(null);
  const auditTableRef = useRef<HTMLDivElement>(null);
  // `observeKey: subTab` porque cada tabela só existe na sua sub-aba: sem isso o
  // container da aba ainda não montada nunca era medido e ficava no fallback.
  const accessPageSize = useTablePageSize('admin.access', accessTableRef, {
    rowHeight: 61,
    footerHeight: 50,
    observeKey: subTab,
  });
  const auditPageSize = useTablePageSize('admin.audit', auditTableRef, {
    rowHeight: 61,
    footerHeight: 50,
    observeKey: subTab,
  });

  const { data: accessData, isLoading: accessLoading } = useAccessLogs(
    { ...accessFilters, page: accessPage, size: accessPageSize.itemsPerPage },
    subTab === 'access',
  );
  const { data: auditData, isLoading: auditLoading } = useAuditLogs(
    { ...auditFilters, page: auditPage, size: auditPageSize.itemsPerPage },
    subTab === 'audit',
  );

  // Paginação do servidor: novo tamanho reinicia a página da sub-aba.
  const handleAccessPageSizeChange = (value: PageSizeChoice) => {
    accessPageSize.setPageSize(value);
    setAccessPage(0);
  };
  const handleAuditPageSizeChange = (value: PageSizeChoice) => {
    auditPageSize.setPageSize(value);
    setAuditPage(0);
  };

  const resultOptions = useMemo(
    () => [
      { label: t('audit.result.all'), value: '' },
      { label: t('audit.result.success'), value: 'SUCCESS' },
      { label: t('audit.result.failure'), value: 'FAILURE' },
      { label: t('audit.result.denied'), value: 'DENIED' },
    ],
    [t],
  );

  const channelOptions = useMemo(
    () => [
      { label: t('audit.channel.all'), value: '' },
      { label: t('audit.channel.web'), value: 'WEB' },
      { label: t('audit.channel.app'), value: 'APP' },
    ],
    [t],
  );

  const formatDate = (iso: string) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString(i18n.language);
    } catch {
      return iso;
    }
  };

  const resultLabel = (result: AuditResult) => {
    const key = String(result).toLowerCase();
    return t(`audit.result.${key}`, { defaultValue: result });
  };

  const inputClass =
    'w-full h-[38px] px-3 border rounded-md outline-none text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-lumi-primary focus:border-lumi-primary';
  const labelClass =
    'block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1';

  const applyAccess = () => {
    setAccessPage(0);
    setAccessFilters(accessDraft);
  };
  const clearAccess = () => {
    setAccessPage(0);
    setAccessDraft(EMPTY_ACCESS);
    setAccessFilters(EMPTY_ACCESS);
  };
  const applyAudit = () => {
    setAuditPage(0);
    setAuditFilters(auditDraft);
  };
  const clearAudit = () => {
    setAuditPage(0);
    setAuditDraft(EMPTY_AUDIT);
    setAuditFilters(EMPTY_AUDIT);
  };

  const subTabButton = (tab: SubTab, label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={subTab === tab}
      onClick={() => setSubTab(tab)}
      className={`px-4 py-1.5 rounded-lg text-sm font-bold transition ${
        subTab === tab
          ? 'bg-white dark:bg-lumi-primary text-lumi-primary dark:text-white shadow-md'
          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div>
        <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white">
          {t('audit.title')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t('audit.subtitle')}
        </p>
      </div>

      <div
        className="inline-flex w-fit p-1 rounded-xl bg-gray-100 dark:bg-white/5"
        role="tablist"
        aria-label={t('audit.title')}
      >
        {subTabButton('access', t('audit.tab.access'))}
        {subTabButton('audit', t('audit.tab.business'))}
      </div>

      {subTab === 'access' ? (
        <>
          {/* Filtros de acessos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className={labelClass} htmlFor="acc-evento">
                {t('audit.filter.event')}
              </label>
              <input
                id="acc-evento"
                className={inputClass}
                value={accessDraft.evento}
                onChange={(e) =>
                  setAccessDraft((p) => ({ ...p, evento: e.target.value }))
                }
              />
            </div>
            <div>
              <label className={labelClass}>{t('audit.filter.channel')}</label>
              <CustomSelect
                value={accessDraft.canal}
                onChange={(v) => setAccessDraft((p) => ({ ...p, canal: v }))}
                options={channelOptions}
                placeholder={t('audit.channel.all')}
              />
            </div>
            <div>
              <label className={labelClass}>{t('audit.filter.result')}</label>
              <CustomSelect
                value={accessDraft.resultado}
                onChange={(v) =>
                  setAccessDraft((p) => ({ ...p, resultado: v }))
                }
                options={resultOptions}
                placeholder={t('audit.result.all')}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="acc-ator">
                {t('audit.filter.actor')}
              </label>
              <input
                id="acc-ator"
                className={inputClass}
                value={accessDraft.ator}
                onChange={(e) =>
                  setAccessDraft((p) => ({ ...p, ator: e.target.value }))
                }
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="acc-ip">
                {t('audit.filter.ip')}
              </label>
              <input
                id="acc-ip"
                className={inputClass}
                value={accessDraft.ip}
                onChange={(e) =>
                  setAccessDraft((p) => ({ ...p, ip: e.target.value }))
                }
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="acc-alvo">
                {t('audit.filter.target')}
              </label>
              <input
                id="acc-alvo"
                className={inputClass}
                placeholder={t('audit.filter.target_placeholder')}
                value={accessDraft.alvo}
                onChange={(e) =>
                  setAccessDraft((p) => ({ ...p, alvo: e.target.value }))
                }
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="acc-from">
                {t('audit.filter.from')}
              </label>
              <input
                id="acc-from"
                type="date"
                className={inputClass}
                value={accessDraft.from}
                onChange={(e) =>
                  setAccessDraft((p) => ({ ...p, from: e.target.value }))
                }
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="acc-to">
                {t('audit.filter.to')}
              </label>
              <input
                id="acc-to"
                type="date"
                className={inputClass}
                value={accessDraft.to}
                onChange={(e) =>
                  setAccessDraft((p) => ({ ...p, to: e.target.value }))
                }
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={applyAccess}
                className="h-[38px] px-4 rounded-md bg-lumi-primary hover:bg-lumi-primary-hover text-white text-sm font-bold"
              >
                {t('audit.filter.apply')}
              </button>
              <button
                type="button"
                onClick={clearAccess}
                className="h-[38px] px-4 rounded-md bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-sm font-bold text-gray-700 dark:text-gray-200"
              >
                {t('audit.filter.clear')}
              </button>
            </div>
          </div>

          <div
            ref={accessTableRef}
            /* Piso de altura só no mobile: os filtros ocupam a tela pequena. */
            className="flex min-h-[22rem] flex-1 flex-col rounded-2xl bg-white dark:bg-dark-card border border-gray-200/70 dark:border-white/5 overflow-hidden lg:min-h-0"
          >
            <div className="tbl-scroll tbl-fill min-h-0 flex-1">
              <table className="w-full text-sm">
                <thead className="tbl-head-dark text-[11px] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-4 py-3">
                      {t('audit.column.date')}
                    </th>
                    <th className="text-left px-4 py-3">
                      {t('audit.column.actor')}
                    </th>
                    <th className="text-left px-4 py-3">
                      {t('audit.column.event')}
                    </th>
                    <th className="text-left px-4 py-3">
                      {t('audit.column.target')}
                    </th>
                    <th className="text-center px-4 py-3">
                      {t('audit.column.channel')}
                    </th>
                    <th className="text-center px-4 py-3">
                      {t('audit.column.result')}
                    </th>
                    <th className="text-left px-4 py-3">
                      {t('audit.column.ip')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {accessLoading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                        {t('common:loading')}
                      </td>
                    </tr>
                  ) : (accessData?.content.length ?? 0) === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                        {t('common:empty')}
                      </td>
                    </tr>
                  ) : (
                    accessData?.content.map((row) => (
                      <tr
                        key={row.id}
                        className="border-t border-gray-100 dark:border-white/5 row-hover"
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-gray-300">
                          {formatDate(row.ocorridoEm)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-800 dark:text-white">
                            {row.ator || '—'}
                          </div>
                          {row.perfilAtor && (
                            <div className="text-xs text-gray-400">
                              {row.perfilAtor}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                          {row.evento}
                          {row.mensagemErro && (
                            <div className="text-xs text-red-500 truncate max-w-[220px]">
                              {row.mensagemErro}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {row.alvoId ? (
                            <span
                              className="block max-w-[180px] truncate font-mono text-xs text-gray-500 dark:text-gray-400"
                              title={row.alvoId}
                            >
                              {row.alvoId}
                            </span>
                          ) : (
                            /* `CATALOG_SEARCH` não declara alvo por projeto —
                               o traço precisa parecer ausência esperada, não
                               dado que faltou carregar. */
                            <span
                              className="text-xs text-gray-300 dark:text-gray-600"
                              title={t('audit.target.none_hint')}
                            >
                              {t('audit.target.none')}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="pill pill-purple">{row.canal || '—'}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={resultPillClass(row.resultado)}>
                            <span className="dot" />
                            {resultLabel(row.resultado)}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">
                          {row.ip || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <TableFooter
              allowAutoPageSize
              pageSizeValue={accessPageSize.pageSizeChoice}
              onPageSizeChange={handleAccessPageSizeChange}
              pagination={{
                currentPage: accessPage + 1,
                totalPages: accessData?.totalPages ?? 1,
                itemsPerPage: accessPageSize.itemsPerPage,
                totalItems: accessData?.totalElements ?? 0,
              }}
              onPageChange={(p) => setAccessPage(p - 1)}
            />
          </div>
        </>
      ) : (
        <>
          {/* Filtros de auditoria de negócio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className={labelClass} htmlFor="aud-acao">
                {t('audit.filter.action')}
              </label>
              <input
                id="aud-acao"
                className={inputClass}
                value={auditDraft.acao}
                onChange={(e) =>
                  setAuditDraft((p) => ({ ...p, acao: e.target.value }))
                }
              />
            </div>
            <div>
              <label className={labelClass}>{t('audit.filter.result')}</label>
              <CustomSelect
                value={auditDraft.resultado}
                onChange={(v) => setAuditDraft((p) => ({ ...p, resultado: v }))}
                options={resultOptions}
                placeholder={t('audit.result.all')}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="aud-ator">
                {t('audit.filter.actor')}
              </label>
              <input
                id="aud-ator"
                className={inputClass}
                value={auditDraft.ator}
                onChange={(e) =>
                  setAuditDraft((p) => ({ ...p, ator: e.target.value }))
                }
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={applyAudit}
                className="h-[38px] px-4 rounded-md bg-lumi-primary hover:bg-lumi-primary-hover text-white text-sm font-bold"
              >
                {t('audit.filter.apply')}
              </button>
              <button
                type="button"
                onClick={clearAudit}
                className="h-[38px] px-4 rounded-md bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-sm font-bold text-gray-700 dark:text-gray-200"
              >
                {t('audit.filter.clear')}
              </button>
            </div>
            <div>
              <label className={labelClass} htmlFor="aud-from">
                {t('audit.filter.from')}
              </label>
              <input
                id="aud-from"
                type="date"
                className={inputClass}
                value={auditDraft.from}
                onChange={(e) =>
                  setAuditDraft((p) => ({ ...p, from: e.target.value }))
                }
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="aud-to">
                {t('audit.filter.to')}
              </label>
              <input
                id="aud-to"
                type="date"
                className={inputClass}
                value={auditDraft.to}
                onChange={(e) =>
                  setAuditDraft((p) => ({ ...p, to: e.target.value }))
                }
              />
            </div>
          </div>

          <div
            ref={auditTableRef}
            /* Piso de altura só no mobile: os filtros ocupam a tela pequena. */
            className="flex min-h-[22rem] flex-1 flex-col rounded-2xl bg-white dark:bg-dark-card border border-gray-200/70 dark:border-white/5 overflow-hidden lg:min-h-0"
          >
            <div className="tbl-scroll tbl-fill min-h-0 flex-1">
              <table className="w-full text-sm">
                <thead className="tbl-head-dark text-[11px] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-4 py-3">
                      {t('audit.column.date')}
                    </th>
                    <th className="text-left px-4 py-3">
                      {t('audit.column.actor')}
                    </th>
                    <th className="text-left px-4 py-3">
                      {t('audit.column.action')}
                    </th>
                    <th className="text-left px-4 py-3">
                      {t('audit.column.target')}
                    </th>
                    <th className="text-center px-4 py-3">
                      {t('audit.column.result')}
                    </th>
                    <th className="text-left px-4 py-3">
                      {t('audit.column.ip')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {auditLoading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                        {t('common:loading')}
                      </td>
                    </tr>
                  ) : (auditData?.content.length ?? 0) === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                        {t('common:empty')}
                      </td>
                    </tr>
                  ) : (
                    auditData?.content.map((row) => (
                      <tr
                        key={row.id}
                        className="border-t border-gray-100 dark:border-white/5 row-hover"
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-gray-300">
                          {formatDate(row.ocorridoEm)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-800 dark:text-white">
                            {row.ator || '—'}
                          </div>
                          {row.perfilAtor && (
                            <div className="text-xs text-gray-400">
                              {row.perfilAtor}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                          {row.acao}
                          {row.mensagemErro && (
                            <div className="text-xs text-red-500 truncate max-w-[220px]">
                              {row.mensagemErro}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400 truncate max-w-[180px]">
                          {row.alvoId || '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={resultPillClass(row.resultado)}>
                            <span className="dot" />
                            {resultLabel(row.resultado)}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">
                          {row.ip || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <TableFooter
              allowAutoPageSize
              pageSizeValue={auditPageSize.pageSizeChoice}
              onPageSizeChange={handleAuditPageSizeChange}
              pagination={{
                currentPage: auditPage + 1,
                totalPages: auditData?.totalPages ?? 1,
                itemsPerPage: auditPageSize.itemsPerPage,
                totalItems: auditData?.totalElements ?? 0,
              }}
              onPageChange={(p) => setAuditPage(p - 1)}
            />
          </div>
        </>
      )}
    </div>
  );
}
