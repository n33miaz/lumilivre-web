import { useTranslation } from 'react-i18next';

import { FilterPanel } from '../../components/ui/FilterPanel';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { CustomDatePicker } from '../../components/ui/CustomDatePicker';

import {
  useCursos,
  useModulos,
  useTurnos,
} from '../../hooks/queries/useReaderQueries';
import { useLibraryConfig } from '../../contexts/LibraryConfigContext';

interface ReaderFilterProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    penalidade: string;
    cursoNome: string;
    turno: string;
    modulo: string;
    dataNascimento: string;
  };
  onFilterChange: (field: string, value: string) => void;
  onApply: () => void;
  onClear: () => void;
}

interface Option {
  label: string;
  value: string | number;
}

export function ReaderFilter({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onApply,
  onClear,
}: ReaderFilterProps) {
  const { t } = useTranslation('reader');
  const { data: cursosData, isLoading: isLoadingCursos } = useCursos();
  const { data: modulosData, isLoading: isLoadingModulos } = useModulos();
  const { data: turnosData, isLoading: isLoadingTurnos } = useTurnos();
  const { features } = useLibraryConfig();

  const isLoading = isLoadingCursos || isLoadingModulos || isLoadingTurnos;

  const cursoOptions: Option[] = [
    { label: t('filter.course.all'), value: '' },
    ...(cursosData?.map((c) => ({
      label: c.nome,
      value: c.nome,
    })) || []),
  ];

  const moduloOptions: Option[] = [
    { label: t('filter.module.all'), value: '' },
    ...(modulosData?.map((m) => ({ label: m.nome, value: m.id })) || []),
  ];

  const turnoOptions: Option[] = [
    { label: t('filter.shift.all'), value: '' },
    ...(turnosData?.map((t) => ({ label: t.nome, value: t.id })) || []),
  ];

  // Rótulo e valor em campos separados: o `value` é o código de penalidade que
  // vai para a API, então traduzi-lo quebraria o filtro em todo idioma novo.
  const penalidadeOptions = [
    { label: t('filter.penalty.all'), value: '' },
    { label: t('penalty.record'), value: 'REGISTRO' },
    { label: t('legend.warning'), value: 'ADVERTENCIA' },
    { label: t('legend.suspension'), value: 'SUSPENSAO' },
    { label: t('legend.block'), value: 'BLOQUEIO' },
    { label: t('legend.ban'), value: 'BANIMENTO' },
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
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelStyles}>
                {t('filter.field.penalty_status')}
              </label>
              <CustomSelect
                value={filters.penalidade}
                onChange={(val) => onFilterChange('penalidade', val)}
                options={penalidadeOptions}
                placeholder={t('common:placeholder.select')}
                invertArrow={true}
              />
            </div>

            <div className="md:col-span-2">
              <CustomDatePicker
                label={t('form.field.birth_date')}
                value={filters.dataNascimento}
                onChange={(e) =>
                  onFilterChange('dataNascimento', e.target.value)
                }
              />
            </div>
          </div>

          {features.academicFields && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelStyles}>{t('filter.course')}</label>
                <SearchableSelect
                  value={filters.cursoNome}
                  onChange={(val) => onFilterChange('cursoNome', val)}
                  options={cursoOptions}
                  placeholder={t('filter.course.placeholder')}
                />
              </div>

              <div>
                <label className={labelStyles}>{t('filter.shift')}</label>
                <CustomSelect
                  value={filters.turno}
                  onChange={(val) => onFilterChange('turno', val)}
                  options={turnoOptions}
                  placeholder={t('filter.shift.placeholder')}
                  invertArrow={true}
                />
              </div>

              <div>
                <label className={labelStyles}>{t('filter.module')}</label>
                <CustomSelect
                  value={filters.modulo}
                  onChange={(val) => onFilterChange('modulo', val)}
                  options={moduloOptions}
                  placeholder={t('filter.module.placeholder')}
                  invertArrow={true}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </FilterPanel>
  );
}
