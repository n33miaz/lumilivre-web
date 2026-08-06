import { useTranslation } from 'react-i18next';

import { useEnum } from '../../hooks/queries/useBookQueries';
import { FilterPanel } from '../../components/ui/FilterPanel';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { CustomDatePicker } from '../../components/ui/CustomDatePicker';

interface LoanFilterProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    statusEmprestimo: string;
    dataEmprestimo: string;
    dataDevolucao: string;
  };
  onFilterChange: (field: string, value: string) => void;
  onApply: () => void;
  onClear: () => void;
}

interface Option {
  label: string;
  value: string | number;
}

export function LoanFilter({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onApply,
  onClear,
}: LoanFilterProps) {
  const { t } = useTranslation('loan');
  const { data: statusData, isLoading } = useEnum('STATUS_EMPRESTIMO');

  // Rótulo e valor vivem em campos separados: o `value` viaja para a API como
  // filtro, então traduzi-lo quebraria a busca em todo idioma novo.
  const statusOptions: Option[] = [
    { label: t('filter.status.all'), value: '' },
    { label: t('filter.status.due_today'), value: 'VENCE_HOJE' },
    ...(statusData?.map((s) => ({ label: s.status, value: s.nome })) || []),
  ];

  const labelStyles =
    'block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1';

  return (
    <FilterPanel
      isOpen={isOpen}
      onClose={onClose}
      onApply={onApply}
      onClear={onClear}
    >
      {isLoading ? (
        <div className="p-8 text-center text-gray-500">
          {t('common:filter.loading')}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className={labelStyles}>{t('filter.field.status')}</label>
            <CustomSelect
              value={filters.statusEmprestimo}
              onChange={(val) => onFilterChange('statusEmprestimo', val)}
              options={statusOptions}
              invertArrow={true}
            />
          </div>

          <CustomDatePicker
            label={t('filter.field.borrowed_from')}
            value={filters.dataEmprestimo}
            onChange={(e) => onFilterChange('dataEmprestimo', e.target.value)}
          />

          <CustomDatePicker
            label={t('filter.field.due_until')}
            value={filters.dataDevolucao}
            onChange={(e) => onFilterChange('dataDevolucao', e.target.value)}
          />
        </div>
      )}
    </FilterPanel>
  );
}
