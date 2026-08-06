import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { FilterPanel } from '../../components/ui/FilterPanel';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { SearchableSelect } from '../../components/ui/SearchableSelect';

import { buscarLivrosParaAdmin } from '../../services/bookService';
import {
  useGeneros,
  useCdds,
  useEnum,
} from '../../hooks/queries/useBookQueries';

interface BookFilterProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    autor: string;
    editora: string;
    genero: string;
    cdd: string;
    classificacaoEtaria: string;
    tipoCapa: string;
    dataLancamento: string;
  };
  onFilterChange: (field: string, value: string) => void;
  onApply: () => void;
  onClear: () => void;
}

export function BookFilter({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onApply,
  onClear,
}: BookFilterProps) {
  const { t } = useTranslation('book');
  const { data: generosData, isLoading: isLoadingGeneros } = useGeneros();
  const { data: cddData, isLoading: isLoadingCdds } = useCdds();
  const { data: classificacaoData, isLoading: isLoadingClass } = useEnum(
    'CLASSIFICACAO_ETARIA',
  );
  const { data: tipoCapaData, isLoading: isLoadingCapa } = useEnum('TIPO_CAPA');

  const { data: livrosData, isLoading: isLoadingLivros } = useQuery({
    queryKey: ['livros-filtro-admin'],
    queryFn: () => buscarLivrosParaAdmin('', 0, 1000),
    staleTime: 1000 * 60 * 5,
    enabled: isOpen,
  });

  const generosOpts = useMemo(() => {
    if (!generosData) return [];
    return [
      { label: t('filter.genre.all'), value: '' },
      ...generosData.map((g) => ({ label: g.nome, value: g.nome })),
    ];
  }, [generosData, t]);

  const cddOpts = useMemo(() => {
    if (!cddData) return [];
    return [
      { label: t('filter.cdd.all'), value: '' },
      ...cddData.map((c) => ({
        label: t('cdd.option', { code: c.id, name: c.nome }),
        value: c.id,
      })),
    ];
  }, [cddData, t]);

  const classificacaoOpts = useMemo(() => {
    if (!classificacaoData) return [];
    return [
      { label: t('filter.age_rating.all'), value: '' },
      ...classificacaoData.map((c) => ({
        label: c.status,
        value: c.nome,
      })),
    ];
  }, [classificacaoData, t]);

  const tipoCapaOpts = useMemo(() => {
    if (!tipoCapaData) return [];
    return [
      { label: t('filter.cover_type.all'), value: '' },
      ...tipoCapaData.map((c) => ({ label: c.status, value: c.nome })),
    ];
  }, [tipoCapaData, t]);

  const { autoresOpts, editorasOpts } = useMemo(() => {
    if (!livrosData?.content) return { autoresOpts: [], editorasOpts: [] };

    const autoresUnicos = Array.from(
      new Set(livrosData.content.map((l) => l.autor).filter(Boolean)),
    ).sort();

    const editorasUnicas = Array.from(
      new Set(livrosData.content.map((l) => l.editora).filter(Boolean)),
    ).sort();

    return {
      autoresOpts: [
        { label: t('filter.author.all'), value: '' },
        ...autoresUnicos.map((a) => ({ label: a, value: a })),
      ],
      editorasOpts: [
        { label: t('filter.publisher.all'), value: '' },
        ...editorasUnicas.map((e) => ({ label: e, value: e })),
      ],
    };
  }, [livrosData, t]);

  const isLoading =
    isLoadingGeneros ||
    isLoadingCdds ||
    isLoadingClass ||
    isLoadingCapa ||
    (isOpen && isLoadingLivros);

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
          <SearchableSelect
            label={t('form.field.author')}
            value={filters.autor}
            onChange={(val) => onFilterChange('autor', val)}
            options={autoresOpts}
          />

          <SearchableSelect
            label={t('form.field.publisher')}
            value={filters.editora}
            onChange={(val) => onFilterChange('editora', val)}
            options={editorasOpts}
          />

          <SearchableSelect
            label={t('form.field.genre')}
            value={filters.genero}
            onChange={(val) => onFilterChange('genero', val)}
            options={generosOpts}
          />

          <SearchableSelect
            label={t('form.field.cdd')}
            value={filters.cdd}
            onChange={(val) => onFilterChange('cdd', val)}
            options={cddOpts}
          />

          <div>
            <label className={labelStyles}>
              {t('filter.field.classification')}
            </label>
            <CustomSelect
              value={filters.classificacaoEtaria}
              onChange={(val) => onFilterChange('classificacaoEtaria', val)}
              options={classificacaoOpts}
              invertArrow={true}
            />
          </div>

          <div>
            <label className={labelStyles}>{t('filter.field.cover')}</label>
            <CustomSelect
              value={filters.tipoCapa}
              onChange={(val) => onFilterChange('tipoCapa', val)}
              placeholder={t('filter.cover_type.placeholder')}
              options={tipoCapaOpts}
              invertArrow={true}
            />
          </div>

          <div className="hidden md:block"></div>
        </div>
      )}
    </FilterPanel>
  );
}
