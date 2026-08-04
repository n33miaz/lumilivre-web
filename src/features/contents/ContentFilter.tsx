import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { FilterPanel } from '../../components/ui/FilterPanel';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { useCursos } from '../../hooks/queries/useReaderQueries';
import { type ContentFilterParams } from '../../services/contentService';

interface ContentFilterProps {
  isOpen: boolean;
  onClose: () => void;
  filters: ContentFilterParams;
  onFilterChange: (field: keyof ContentFilterParams, value: string) => void;
  onApply: () => void;
  onClear: () => void;
}

export function ContentFilter({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onApply,
  onClear,
}: ContentFilterProps) {
  const { t } = useTranslation('contents');
  const { data: cursosData } = useCursos();

  const cursosOpts = useMemo(
    () => [
      { label: t('audience.ALL'), value: '' },
      ...(cursosData || []).map((c) => ({ label: c.nome, value: String(c.id) })),
    ],
    [cursosData, t],
  );

  const typeOpts = [
    { label: t('audience.ALL'), value: '' },
    { label: t('type.ANNOUNCEMENT'), value: 'ANNOUNCEMENT' },
    { label: t('type.ATTACHMENT'), value: 'ATTACHMENT' },
    { label: t('type.WORK'), value: 'WORK' },
  ];

  const scopeOpts = [
    { label: t('audience.ALL'), value: '' },
    { label: t('audience.COURSE'), value: 'COURSE' },
    { label: t('audience.MODULE'), value: 'MODULE' },
    { label: t('audience.SHIFT'), value: 'SHIFT' },
  ];

  return (
    <FilterPanel isOpen={isOpen} onClose={onClose} onApply={onApply} onClear={onClear}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
              {t('table.column.type')}
            </label>
            <CustomSelect
              value={filters.type ?? ''}
              onChange={(val) => onFilterChange('type', val)}
              options={typeOpts}
              placeholder={t('table.column.type')}
              invertArrow
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
              {t('table.column.audience')}
            </label>
            <CustomSelect
              value={filters.scope ?? ''}
              onChange={(val) => onFilterChange('scope', val)}
              options={scopeOpts}
              placeholder={t('table.column.audience')}
              invertArrow
            />
          </div>
        </div>
        <SearchableSelect
          label={t('form.field.course')}
          value={filters.courseId ?? ''}
          onChange={(val) => onFilterChange('courseId', String(val))}
          options={cursosOpts}
          placeholder={t('form.field.course')}
        />
      </div>
    </FilterPanel>
  );
}
