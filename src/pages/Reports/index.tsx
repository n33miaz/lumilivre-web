import { useState, useEffect, useRef, useMemo, type ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import {
  AlertTriangle,
  ArrowRightLeft,
  BookOpen,
  FileBarChart2,
  GraduationCap,
  Layers,
  LibraryBig,
  Users,
} from 'lucide-react';

import {
  baixarRelatorioPDF,
  type FiltrosRelatorio,
  type ReportType,
} from '../../services/reportService';
import { buscarLivrosParaAdmin } from '../../services/bookService';
import { buscarAlunosParaAdmin } from '../../services/studentService';
import { useDashboardStats } from '../../hooks/useDashboardQueries';

import {
  useGeneros,
  useCdds,
  useEnum,
} from '../../hooks/queries/useBookQueries';
import {
  useCursos,
  useModulos,
  useTurnos,
} from '../../hooks/queries/useStudentQueries';

import { useToast } from '../../contexts/ToastContext';
import { Modal } from '../../components/ui/Modal';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { CustomDatePicker } from '../../components/ui/CustomDatePicker';
import { SearchableSelect } from '../../components/ui/SearchableSelect';

import { LoadingIcon } from '../../components/ui/LoadingIcon';
import AddIcon from '../../assets/icons/add.svg?react';
import DownloadIcon from '../../assets/icons/upload.svg';

type ReportIcon = ComponentType<{ className?: string }>;

interface ReportItemProps {
  title: string;
  description: string;
  buttonLabel: string;
  metaLabel: string;
  formatLabel: string;
  onGenerate: () => void;
}

interface Option {
  label: string;
  value: string | number;
}

type ReportTone = 'lumi' | 'blue' | 'emerald' | 'violet' | 'amber' | 'cyan';

const REPORT_CARDS = [
  {
    type: 'alunos',
    titleKey: 'item.students.title',
    descriptionKey: 'item.students.description',
    metaKey: 'item.students.meta',
    tone: 'blue',
    Icon: Users,
  },
  {
    type: 'livros',
    titleKey: 'item.books.title',
    descriptionKey: 'item.books.description',
    metaKey: 'item.books.meta',
    tone: 'lumi',
    Icon: BookOpen,
  },
  {
    type: 'exemplares',
    titleKey: 'item.copies.title',
    descriptionKey: 'item.copies.description',
    metaKey: 'item.copies.meta',
    tone: 'emerald',
    Icon: Layers,
  },
  {
    type: 'emprestimos',
    titleKey: 'item.loans.title',
    descriptionKey: 'item.loans.description',
    metaKey: 'item.loans.meta',
    tone: 'violet',
    Icon: ArrowRightLeft,
  },
  {
    type: 'cursos',
    titleKey: 'item.courses.title',
    descriptionKey: 'item.courses.description',
    metaKey: 'item.courses.meta',
    tone: 'amber',
    Icon: GraduationCap,
    direct: true,
  },
  {
    type: 'estatisticas',
    titleKey: 'item.statistics.title',
    descriptionKey: 'item.statistics.description',
    metaKey: 'item.statistics.meta',
    tone: 'cyan',
    Icon: FileBarChart2,
    direct: true,
  },
] as const satisfies ReadonlyArray<{
  type: ReportType;
  titleKey: string;
  descriptionKey: string;
  metaKey: string;
  tone: ReportTone;
  Icon: ReportIcon;
  direct?: boolean;
}>;

const TONE_CLASSES: Record<ReportTone, string> = {
  lumi: 'bg-lumi-50 dark:bg-lumi-500/10 text-lumi-primary dark:text-lumi-label',
  blue: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
  emerald:
    'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  violet:
    'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400',
  amber:
    'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
  cyan: 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
};

interface ReportItemPropsExt extends ReportItemProps {
  tone: keyof typeof TONE_CLASSES;
  Icon: ReportIcon;
}

const ReportItem = ({
  title,
  description,
  buttonLabel,
  metaLabel,
  formatLabel,
  tone,
  Icon,
  onGenerate,
}: ReportItemPropsExt) => (
  <article className="group rounded-2xl bg-white dark:bg-dark-card border border-gray-200/70 dark:border-white/5 p-5 hover:shadow-card transition-all">
    <div className="flex items-start gap-4">
      <div
        className={`w-12 h-12 rounded-xl ${TONE_CLASSES[tone]} flex items-center justify-center shrink-0`}
      >
        <Icon className="h-6 w-6" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white">
              {title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {description}
            </p>
          </div>
          <button
            type="button"
            onClick={onGenerate}
            className="h-9 px-4 rounded-lg bg-lumi-primary text-white text-sm font-bold hover:bg-lumi-primary-hover shrink-0 inline-flex items-center gap-1.5"
          >
            <AddIcon className="h-4 w-4" />
            {buttonLabel}
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          <span className="pill pill-purple">
            <span className="dot" />
            {metaLabel}
          </span>
          <span className="pill pill-info">
            <span className="dot" />
            {formatLabel}
          </span>
        </div>
      </div>
    </div>
  </article>
);

interface ModalFiltrosProps {
  isOpen: boolean;
  onClose: () => void;
  tipoRelatorio: ReportType | null;
  titulo: string;
}

function ModalFiltrosRelatorio({
  isOpen,
  onClose,
  tipoRelatorio,
  titulo,
}: ModalFiltrosProps) {
  const { t } = useTranslation('report');
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isDynamicDataLoading, setIsDynamicDataLoading] = useState(false);
  const [filtros, setFiltros] = useState<FiltrosRelatorio>({});

  const { data: cursosData, isLoading: isLoadingCursos } = useCursos();
  const { data: modulosData, isLoading: isLoadingModulos } = useModulos();
  const { data: turnosData, isLoading: isLoadingTurnos } = useTurnos();
  const { data: generosData, isLoading: isLoadingGeneros } = useGeneros();
  const { data: cddsData, isLoading: isLoadingCdds } = useCdds();

  const { data: penalidadeData, isLoading: isLoadingPenalidade } =
    useEnum('PENALIDADE');
  const { data: classificacaoData, isLoading: isLoadingClassificacao } =
    useEnum('CLASSIFICACAO_ETARIA');
  const { data: tipoCapaData, isLoading: isLoadingTipoCapa } =
    useEnum('TIPO_CAPA');
  const { data: statusLivroData, isLoading: isLoadingStatusLivro } =
    useEnum('STATUS_LIVRO');
  const { data: statusEmpData, isLoading: isLoadingStatusEmp } =
    useEnum('STATUS_EMPRESTIMO');

  const [autoresOpts, setAutoresOpts] = useState<Option[]>([]);
  const [editorasOpts, setEditorasOpts] = useState<Option[]>([]);
  const [livrosSelectOpts, setLivrosSelectOpts] = useState<Option[]>([]);
  const [alunosSelectOpts, setAlunosSelectOpts] = useState<Option[]>([]);

  const [progress, setProgress] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const cursosOpts = useMemo(() => {
    if (!cursosData) return [];
    return [
      { label: t('filter.all'), value: '' },
      ...cursosData.map((c) => ({ label: c.nome, value: c.id })),
    ];
  }, [cursosData, t]);

  const modulosOpts = useMemo(() => {
    if (!modulosData) return [];
    return [
      { label: t('filter.all'), value: '' },
      ...modulosData.map((m) => ({ label: m.nome, value: m.id })),
    ];
  }, [modulosData, t]);

  const turnoOpts = useMemo(() => {
    if (!turnosData) return [];
    return [
      { label: t('filter.all'), value: '' },
      ...turnosData.map((item) => ({ label: item.nome, value: item.id })),
    ];
  }, [turnosData, t]);

  const generosOpts = useMemo(() => {
    if (!generosData) return [];
    return [
      { label: t('filter.all'), value: '' },
      ...generosData.map((g) => ({ label: g.nome, value: g.nome })),
    ];
  }, [generosData, t]);

  const cddOpts = useMemo(() => {
    if (!cddsData) return [];
    return [
      { label: t('filter.all'), value: '' },
      ...cddsData.map((c) => ({
        label: `${c.id} - ${c.nome}`,
        value: c.id,
      })),
    ];
  }, [cddsData, t]);

  const penalidadeOpts = useMemo(() => {
    if (!penalidadeData) return [];
    return [
      { label: t('filter.all_feminine'), value: '' },
      ...penalidadeData.map((p) => ({ label: p.status, value: p.nome })),
    ];
  }, [penalidadeData, t]);

  const classificacaoOpts = useMemo(() => {
    if (!classificacaoData) return [];
    return [
      { label: t('filter.all_feminine'), value: '' },
      ...classificacaoData.map((c) => ({ label: c.status, value: c.nome })),
    ];
  }, [classificacaoData, t]);

  const tipoCapaOpts = useMemo(() => {
    if (!tipoCapaData) return [];
    return [
      { label: t('filter.all_feminine'), value: '' },
      ...tipoCapaData.map((item) => ({
        label: item.status,
        value: item.nome,
      })),
    ];
  }, [tipoCapaData, t]);

  const statusLivroOpts = useMemo(() => {
    if (!statusLivroData) return [];
    return [
      { label: t('filter.all'), value: '' },
      ...statusLivroData.map((s) => ({ label: s.status, value: s.nome })),
    ];
  }, [statusLivroData, t]);

  const statusEmpOpts = useMemo(() => {
    if (!statusEmpData) return [];
    return [
      { label: t('filter.all'), value: '' },
      ...statusEmpData.map((s) => ({ label: s.status, value: s.nome })),
    ];
  }, [statusEmpData, t]);

  useEffect(() => {
    if (isOpen && tipoRelatorio) {
      setFiltros({});
      setIsLoading(false);
      setIsDynamicDataLoading(true);

      const carregarDadosDinamicos = async () => {
        try {
          const promises: Array<Promise<void>> = [];

          if (['livros', 'exemplares', 'emprestimos'].includes(tipoRelatorio)) {
            promises.push(
              buscarLivrosParaAdmin('', 0, 1000).then((res) => {
                const livrosUnicos = new Map();
                res.content.forEach((l) => {
                  if (l.isbn && !livrosUnicos.has(l.isbn)) {
                    livrosUnicos.set(l.isbn, l.nome);
                  }
                });
                const opts = Array.from(livrosUnicos.entries()).map(
                  ([isbn, nome]) => ({
                    label: `${nome} (ISBN: ${isbn})`,
                    value: isbn,
                  }),
                );
                setLivrosSelectOpts([
                  { label: t('filter.all'), value: '' },
                  ...opts,
                ]);

                const autoresUnicos = Array.from(
                  new Set(res.content.map((l) => l.autor).filter(Boolean)),
                ).sort();
                setAutoresOpts([
                  { label: t('filter.all'), value: '' },
                  ...autoresUnicos.map((a) => ({ label: a, value: a })),
                ]);

                const editorasUnicas = Array.from(
                  new Set(res.content.map((l) => l.editora).filter(Boolean)),
                ).sort();
                setEditorasOpts([
                  { label: t('filter.all_feminine'), value: '' },
                  ...editorasUnicas.map((e) => ({ label: e, value: e })),
                ]);
              }),
            );
          }

          if (tipoRelatorio === 'emprestimos') {
            promises.push(
              buscarAlunosParaAdmin('', 0, 1000).then((res) => {
                const opts = res.content.map((a) => ({
                  label: `${a.nomeCompleto} (${t('filter.registration_abbr')}: ${a.matricula})`,
                  value: a.matricula,
                }));
                setAlunosSelectOpts([
                  { label: t('filter.all'), value: '' },
                  ...opts,
                ]);
              }),
            );
          }

          await Promise.all(promises);
        } catch (error) {
          console.error('Error loading dynamic report data', error);
        } finally {
          setIsDynamicDataLoading(false);
        }
      };

      carregarDadosDinamicos();
    }
  }, [isOpen, tipoRelatorio, t]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (isLoading) {
      setProgress(10);

      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            return 90;
          }
          const increment = Math.random() * 15;
          return Math.min(prev + increment, 90);
        });
      }, 800);
    } else {
      setProgress(0);
    }

    return () => clearInterval(interval);
  }, [isLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFiltros((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string | number) => {
    setFiltros((prev) => ({ ...prev, [name]: value }));
  };

  const handleBaixar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tipoRelatorio) return;

    abortControllerRef.current = new AbortController();
    setIsLoading(true);

    try {
      await baixarRelatorioPDF(
        tipoRelatorio,
        filtros,
        abortControllerRef.current.signal,
      );

      setProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 600));

      onClose();
    } catch (error) {
      if (
        axios.isCancel(error) ||
        (error instanceof Error && error.name === 'CanceledError')
      ) {
        console.log('Report download cancelled by user');
        return;
      }

      console.error(error);
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        addToast({
          type: 'warning',
          title: t('toast.no_data.title'),
          description: t('toast.no_data.description'),
        });
      } else {
        addToast({
          type: 'error',
          title: t('toast.error.title'),
          description: t('toast.error.description'),
        });
      }
    } finally {
      if (progress !== 100) {
        setIsLoading(false);
      }
    }
  };

  const handleCancelar = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsLoading(false);
    setProgress(0);
  };

  const labelClass =
    'mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-300';

  const isInitialLoading =
    isDynamicDataLoading ||
    isLoadingCursos ||
    isLoadingModulos ||
    isLoadingTurnos ||
    isLoadingGeneros ||
    isLoadingCdds ||
    isLoadingPenalidade ||
    isLoadingClassificacao ||
    isLoadingTipoCapa ||
    isLoadingStatusLivro ||
    isLoadingStatusEmp;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex min-h-[300px] flex-col items-center justify-center px-8 pb-10">
          <div className="scale-110">
            <LoadingIcon />
          </div>

          <p className="mb-3 animate-pulse text-lg font-bold text-lumi-primary dark:text-lumi-label">
            {progress === 100
              ? t('loading.download_started')
              : t('loading.generating')}
          </p>

          <div className="mb-6 h-2.5 w-full max-w-xs overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-2.5 rounded-full bg-lumi-primary duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {progress < 100 && (
            <button
              type="button"
              onClick={handleCancelar}
              className="rounded-md px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"
            >
              {t('button.cancel')}
            </button>
          )}
        </div>
      );
    }

    if (isInitialLoading) {
      return (
        <div className="flex min-h-[300px] flex-col items-center justify-center pb-20">
          <div className="scale-110">
            <LoadingIcon />
          </div>
          <p className="-mt-12 animate-pulse text-lg font-semibold text-lumi-primary">
            {t('loading.filters')}
          </p>
        </div>
      );
    }

    return (
      <form onSubmit={handleBaixar} className="space-y-4">
        <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            {t('hint.empty_filters')}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 border-b border-gray-200 pb-4 dark:border-gray-700 md:grid-cols-2">
          <CustomDatePicker
            label={t('filter.start_date')}
            id="dataInicio"
            name="dataInicio"
            value={filtros.dataInicio || ''}
            onChange={handleInputChange}
          />
          <CustomDatePicker
            label={t('filter.end_date')}
            id="dataFim"
            name="dataFim"
            value={filtros.dataFim || ''}
            onChange={handleInputChange}
          />
        </div>

        {tipoRelatorio === 'alunos' && (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>{t('filter.course')}</label>
                <SearchableSelect
                  value={filtros.idCurso || ''}
                  onChange={(val) => handleSelectChange('idCurso', val)}
                  placeholder={t('filter.select_course')}
                  options={cursosOpts}
                />
              </div>
              <div>
                <label className={labelClass}>{t('filter.module')}</label>
                <CustomSelect
                  value={filtros.idModulo || ''}
                  onChange={(val) => handleSelectChange('idModulo', val)}
                  placeholder={t('filter.select_module')}
                  options={modulosOpts}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>{t('filter.shift')}</label>
                <CustomSelect
                  value={filtros.idTurno || ''}
                  onChange={(val) => handleSelectChange('idTurno', val)}
                  placeholder={t('filter.select_shift')}
                  options={turnoOpts}
                />
              </div>
              <div>
                <label className={labelClass}>{t('filter.penalty')}</label>
                <CustomSelect
                  value={filtros.penalidade || ''}
                  onChange={(val) => handleSelectChange('penalidade', val)}
                  placeholder={t('filter.select_penalty')}
                  options={penalidadeOpts}
                />
              </div>
            </div>
          </>
        )}

        {tipoRelatorio === 'livros' && (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <SearchableSelect
                label={t('filter.genre')}
                value={filtros.genero || ''}
                onChange={(val) => handleSelectChange('genero', val)}
                options={generosOpts}
              />
              <SearchableSelect
                label={t('filter.author')}
                value={filtros.autor || ''}
                onChange={(val) => handleSelectChange('autor', val)}
                options={autoresOpts}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <SearchableSelect
                label={t('filter.publisher')}
                value={filtros.editora || ''}
                onChange={(val) => handleSelectChange('editora', val)}
                options={editorasOpts}
              />
              <SearchableSelect
                label={t('filter.cdd')}
                value={filtros.cdd || ''}
                onChange={(val) => handleSelectChange('cdd', val)}
                options={cddOpts}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>{t('filter.age_rating')}</label>
                <CustomSelect
                  value={filtros.classificacaoEtaria || ''}
                  onChange={(val) =>
                    handleSelectChange('classificacaoEtaria', val)
                  }
                  options={classificacaoOpts}
                />
              </div>
              <div>
                <label className={labelClass}>{t('filter.cover_type')}</label>
                <CustomSelect
                  value={filtros.tipoCapa || ''}
                  onChange={(val) => handleSelectChange('tipoCapa', val)}
                  placeholder={t('filter.select_cover_type')}
                  options={tipoCapaOpts}
                />
              </div>
            </div>
          </>
        )}

        {tipoRelatorio === 'exemplares' && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>{t('filter.copy_status')}</label>
              <CustomSelect
                value={filtros.statusLivro || ''}
                onChange={(val) => handleSelectChange('statusLivro', val)}
                options={statusLivroOpts}
              />
            </div>
            <SearchableSelect
              label={t('filter.book')}
              value={filtros.isbnOuTombo || ''}
              onChange={(val) => handleSelectChange('isbnOuTombo', val)}
              options={livrosSelectOpts}
            />
          </div>
        )}

        {tipoRelatorio === 'emprestimos' && (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>{t('filter.status')}</label>
                <CustomSelect
                  value={filtros.statusEmprestimo || ''}
                  onChange={(val) =>
                    handleSelectChange('statusEmprestimo', val)
                  }
                  options={statusEmpOpts}
                />
              </div>
              <div>
                <label className={labelClass}>{t('filter.course')}</label>
                <SearchableSelect
                  value={filtros.idCurso || ''}
                  onChange={(val) => handleSelectChange('idCurso', val)}
                  placeholder={t('filter.select_course')}
                  options={cursosOpts}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <SearchableSelect
                label={t('filter.student_lookup')}
                value={filtros.matriculaAluno || ''}
                onChange={(val) => handleSelectChange('matriculaAluno', val)}
                options={alunosSelectOpts}
              />
              <SearchableSelect
                label={t('filter.book')}
                value={filtros.isbnOuTombo || ''}
                onChange={(val) => handleSelectChange('isbnOuTombo', val)}
                options={livrosSelectOpts}
              />
            </div>
          </>
        )}

        <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-3 font-bold text-white shadow-lg transition-all duration-200 hover:bg-green-700 active:scale-95"
          >
            <img
              src={DownloadIcon}
              className="h-5 w-5 invert brightness-0"
              alt=""
            />
            <span>{t('button.download_pdf')}</span>
          </button>
        </div>
      </form>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Header title={titulo} />
      <Modal.Body>{renderContent()}</Modal.Body>
    </Modal>
  );
}

const INSIGHT_CARDS = [
  { key: 'titles', field: 'livros', tone: 'lumi', Icon: LibraryBig },
  { key: 'readers', field: 'alunos', tone: 'blue', Icon: Users },
  { key: 'active_loans', field: 'emprestimosAtivos', tone: 'violet', Icon: ArrowRightLeft },
  { key: 'overdue', field: 'atrasados', tone: 'amber', Icon: AlertTriangle },
] as const;

export function RelatoriosPage() {
  const { t } = useTranslation('report');
  const { addToast } = useToast();
  const { data: stats } = useDashboardStats();
  const [modalOpen, setModalOpen] = useState(false);
  const [downloadingType, setDownloadingType] = useState<ReportType | null>(
    null,
  );
  const [selectedReport, setSelectedReport] = useState<{
    type: ReportType;
    title: string;
  } | null>(null);

  const handleGenerate = async (card: (typeof REPORT_CARDS)[number]) => {
    const title = t(card.titleKey);
    const isDirect = 'direct' in card && card.direct;
    if (!isDirect) {
      setSelectedReport({ type: card.type, title });
      setModalOpen(true);
      return;
    }

    setDownloadingType(card.type);
    addToast({
      type: 'info',
      title: t('toast.generating.title'),
      description: t('toast.generating.description'),
    });
    try {
      await baixarRelatorioPDF(card.type, {});
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        addToast({
          type: 'warning',
          title: t('toast.no_data.title'),
          description: t('toast.no_data.description'),
        });
      } else {
        addToast({
          type: 'error',
          title: t('toast.error.title'),
          description: t('toast.error.description'),
        });
      }
    } finally {
      setDownloadingType(null);
    }
  };

  return (
    <section className="space-y-5">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-lumi-gradient flex items-center justify-center text-white shadow-glowSoft shrink-0">
          <FileBarChart2 className="w-6 h-6" />
        </div>
        <div>
          <div className="text-xs font-semibold tracking-wider text-lumi-primary dark:text-lumi-label uppercase">
            {t('page.eyebrow')}
          </div>
          <h1 className="font-display font-extrabold text-3xl text-gray-900 dark:text-white">
            {t('page.title')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('page.subtitle')}
          </p>
        </div>
      </div>

      {/* Panorama da biblioteca (dados reais) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {INSIGHT_CARDS.map(({ key, field, tone, Icon }) => (
          <div
            key={key}
            className="flex items-center gap-3 rounded-xl bg-white dark:bg-dark-card border border-gray-200/70 dark:border-white/5 p-4"
          >
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${TONE_CLASSES[tone]}`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t(`insight.${key}`)}
              </div>
              <div className="font-display font-bold text-xl text-gray-800 dark:text-white">
                {stats?.[field] ?? '—'}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REPORT_CARDS.map((card) => (
          <ReportItem
            key={card.type}
            title={t(card.titleKey)}
            description={t(card.descriptionKey)}
            metaLabel={t(card.metaKey)}
            formatLabel={t('card.format_pdf')}
            buttonLabel={
              downloadingType === card.type
                ? t('loading.generating')
                : t('button.generate')
            }
            tone={card.tone}
            Icon={card.Icon}
            onGenerate={() => handleGenerate(card)}
          />
        ))}
      </div>

      <ModalFiltrosRelatorio
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        tipoRelatorio={selectedReport?.type || null}
        titulo={selectedReport?.title || ''}
      />
    </section>
  );
}
