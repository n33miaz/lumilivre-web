import { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';

import { type AlunoRanking } from '../../services/loanService';
import { type EstatisticaGrafico } from '../../services/courseService';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { SearchableSelect } from '../../components/ui/SearchableSelect';

import { LoadingIcon } from '../../components/ui/LoadingIcon';
import CrownIcon from '../../assets/icons/crown.svg?react';
import Medal1Icon from '../../assets/icons/medal1.svg?react';
import Medal2Icon from '../../assets/icons/medal2.svg?react';
import Medal3Icon from '../../assets/icons/medal3.svg?react';

import { useRanking } from '../../hooks/queries/useLoanQueries';
import {
  useCursos,
  useEstatisticasGrafico,
  useModulos,
  useTurnos,
} from '../../hooks/queries/useStudentQueries';

const BAR_WIDTH = 40;
const MIN_GAP = 20;
const Y_AXIS_WIDTH = 60;
const CHART_PADDING = 40;

const BAR_COLORS = ['#762075', '#9b2c9a', '#bf3abf', '#d65ad6', '#e085e0'];
const TOP_3_COLORS = ['#EAB308', '#9CA3AF', '#F97316'];
const PIE_COLORS = [
  '#762075',
  '#1D6FBF',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#06B6D4',
  '#84CC16',
];

interface PieCardProps {
  title: string;
  data: EstatisticaGrafico[];
  emptyMessage: string;
}

function PieChartCard({ title, data, emptyMessage }: PieCardProps) {
  return (
    <div className="text-center">
      <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
        {title}
      </div>
      <div className="h-44">
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data as unknown as Record<string, unknown>[]}
                dataKey="total"
                nameKey="nome"
                cx="50%"
                cy="50%"
                outerRadius={55}
                innerRadius={32}
                paddingAngle={4}
              >
                {data.map((_, idx) => (
                  <Cell
                    key={`pie-${idx}`}
                    fill={PIE_COLORS[idx % PIE_COLORS.length]}
                    stroke="none"
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend
                verticalAlign="bottom"
                height={28}
                iconType="circle"
                wrapperStyle={{ fontSize: 10 }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-gray-400 dark:text-gray-500 px-4">
            {emptyMessage}
          </div>
        )}
      </div>
    </div>
  );
}

interface PodiumProps {
  aluno?: AlunoRanking;
  position: 1 | 2 | 3;
}

function PodiumItem({ aluno, position }: PodiumProps) {
  const { t } = useTranslation('ranking');

  const config = {
    1: {
      tileBg: 'bg-gradient-to-br from-amber-400 to-amber-600',
      bgBar: 'bg-gradient-to-b from-amber-300 to-amber-500',
      Medal: Medal1Icon,
      barHeight: 176,
      barText: '1',
      glow: 'shadow-glow animate-float',
      badgeClass:
        'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10',
      order: 'order-2',
    },
    2: {
      tileBg: 'bg-gradient-to-br from-gray-300 to-gray-400',
      bgBar:
        'bg-gradient-to-b from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800',
      Medal: Medal2Icon,
      barHeight: 116,
      barText: '2',
      glow: '',
      badgeClass:
        'text-lumi-primary dark:text-lumi-label bg-lumi-50 dark:bg-white/5',
      order: 'order-1',
    },
    3: {
      tileBg: 'bg-gradient-to-br from-orange-400 to-orange-600',
      bgBar: 'bg-gradient-to-b from-orange-300 to-orange-500',
      Medal: Medal3Icon,
      barHeight: 80,
      barText: '3',
      glow: '',
      badgeClass:
        'text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-500/10',
      order: 'order-3',
    },
  } as const;

  const cfg = config[position];
  const Medal = cfg.Medal;
  const firstName = aluno?.nome.split(' ')[0]?.toUpperCase() ?? '—';

  return (
    <div className={`flex-1 flex flex-col items-center ${cfg.order}`}>
      <div
        className={`w-12 h-12 rounded-xl ${cfg.tileBg} flex items-center justify-center text-white mb-1.5 ${cfg.glow}`}
      >
        <Medal className="w-5 h-5" />
      </div>
      {aluno ? (
        <>
          <div className="font-display font-extrabold text-sm dark:text-white">
            {firstName}
          </div>
          <div
            className={`text-[10px] font-mono ${cfg.badgeClass} px-2 py-0.5 rounded-full mt-1`}
          >
            {t('books_count', { count: aluno.emprestimosCount })}
          </div>
        </>
      ) : (
        <div className="text-xs text-gray-400">-</div>
      )}
      <div
        className={`w-full mt-3 rounded-t-xl ${cfg.bgBar} flex items-center justify-center text-3xl font-display font-extrabold text-white`}
        style={{ height: `${cfg.barHeight}px` }}
      >
        {cfg.barText}
      </div>
    </div>
  );
}

export function ClassificacaoPage() {
  const { t } = useTranslation('ranking');
  const [filtroCurso, setFiltroCurso] = useState<string>('');
  const [filtroModulo, setFiltroModulo] = useState<string>('');
  const [filtroTurno, setFiltroTurno] = useState<string>('');

  const [chartLimit, setChartLimit] = useState(15);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const { data: podiumData = [], isLoading: isLoadingPodium } = useRanking(3);

  const { data: chartData = [], isLoading: isLoadingChart } = useRanking(
    chartLimit,
    filtroCurso ? Number(filtroCurso) : undefined,
    filtroModulo ? Number(filtroModulo) : undefined,
    filtroTurno ? Number(filtroTurno) : undefined,
  );

  const { data: cursosList = [], isLoading: isLoadingCursos } = useCursos();
  const { data: modulosList = [], isLoading: isLoadingModulos } = useModulos();
  const { data: turnosList = [], isLoading: isLoadingTurnos } = useTurnos();

  const { data: statsData, isLoading: isLoadingStats } =
    useEstatisticasGrafico();

  const pieDataCurso = statsData?.curso || [];
  const pieDataModulo = statsData?.modulo || [];
  const pieDataTurno = statsData?.turno || [];

  useEffect(() => {
    const calculateLimit = () => {
      if (chartContainerRef.current) {
        const containerWidth =
          chartContainerRef.current.getBoundingClientRect().width;
        if (containerWidth <= 0) return;
        const availableSpace = containerWidth - Y_AXIS_WIDTH - CHART_PADDING;
        const itemSize = BAR_WIDTH + MIN_GAP;
        const calculatedLimit = Math.floor(availableSpace / itemSize);
        setChartLimit((prev) => {
          const newValue = Math.max(5, calculatedLimit);
          return prev !== newValue ? newValue : prev;
        });
      }
    };

    const resizeObserver = new ResizeObserver(calculateLimit);
    window.addEventListener('resize', calculateLimit);
    if (chartContainerRef.current) {
      resizeObserver.observe(chartContainerRef.current);
      calculateLimit();
    }
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', calculateLimit);
    };
  }, []);

  const cursoOptions = useMemo(
    () => [
      { label: t('filter.all_courses'), value: '' },
      ...cursosList.map((c) => ({ label: c.nome, value: c.id })),
    ],
    [cursosList, t],
  );

  const moduloOptions = useMemo(
    () => [
      { label: t('filter.all_modules'), value: '' },
      ...modulosList.map((m) => ({ label: m.nome, value: m.id })),
    ],
    [modulosList, t],
  );

  const turnoOptions = useMemo(
    () => [
      { label: t('filter.all_shifts'), value: '' },
      ...turnosList.map((t2) => ({ label: t2.nome, value: t2.id })),
    ],
    [turnosList, t],
  );

  const isLoading =
    isLoadingPodium ||
    isLoadingChart ||
    isLoadingStats ||
    isLoadingCursos ||
    isLoadingModulos ||
    isLoadingTurnos;

  if (isLoading) return <LoadingIcon />;

  return (
    <section className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white shadow-lg">
            <CrownIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold tracking-wider text-lumi-primary dark:text-lumi-label uppercase">
              {t('page.eyebrow', { defaultValue: 'Engajamento' })}
            </div>
            <h1 className="font-display font-extrabold text-3xl text-gray-900 dark:text-white">
              {t('page.title')}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('page.subtitle')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1.4fr] gap-4">
        <div className="rounded-2xl bg-white dark:bg-dark-card border border-gray-200/70 dark:border-white/5 p-6">
          <div className="flex items-center gap-2 mb-6">
            <span className="w-1 h-5 rounded bg-lumi-primary" />
            <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white">
              {t('section.podium')}
            </h3>
          </div>
          <div className="flex items-end justify-center gap-3 h-72">
            <PodiumItem aluno={podiumData[1]} position={2} />
            <PodiumItem aluno={podiumData[0]} position={1} />
            <PodiumItem aluno={podiumData[2]} position={3} />
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-dark-card border border-gray-200/70 dark:border-white/5 p-6">
          <div className="flex items-center gap-2 mb-6">
            <span className="w-1 h-5 rounded bg-lumi-primary" />
            <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white">
              {t('section.distribution')}
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <PieChartCard
              title={t('pie.by_course')}
              data={pieDataCurso}
              emptyMessage={t('pie.empty.course')}
            />
            <PieChartCard
              title={t('pie.by_module')}
              data={pieDataModulo}
              emptyMessage={t('pie.empty.module')}
            />
            <PieChartCard
              title={t('pie.by_shift')}
              data={pieDataTurno}
              emptyMessage={t('pie.empty.shift')}
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-dark-card border border-gray-200/70 dark:border-white/5 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-1 h-5 rounded bg-lumi-primary" />
            <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white">
              {t('section.top_students')}
            </h3>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {t('filter.label')}
            </span>
            <div className="w-44">
              <SearchableSelect
                value={filtroCurso}
                onChange={setFiltroCurso}
                options={cursoOptions}
                placeholder={t('filter.all_courses')}
              />
            </div>
            <div className="w-44">
              <CustomSelect
                value={filtroModulo}
                onChange={setFiltroModulo}
                options={moduloOptions}
                placeholder={t('filter.all_modules')}
                invertArrow
              />
            </div>
            <div className="w-40">
              <CustomSelect
                value={filtroTurno}
                onChange={setFiltroTurno}
                options={turnoOptions}
                placeholder={t('filter.all_shifts')}
                invertArrow
              />
            </div>
          </div>
        </div>

        <div className="w-full h-72" ref={chartContainerRef}>
          {chartData && chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e5e7eb"
                />
                <XAxis
                  dataKey="nome"
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  height={60}
                  tickFormatter={(value: string) => {
                    const names = value.split(' ');
                    return names.length > 1
                      ? `${names[0]} ${names[names.length - 1]}`
                      : value;
                  }}
                />
                <YAxis tick={{ fill: '#6b7280' }} allowDecimals={false} />
                <Tooltip
                  formatter={(value) => [
                    `${value} ${t('tooltip.books')}`,
                    t('tooltip.total_loans'),
                  ]}
                />
                <Bar
                  dataKey="emprestimosCount"
                  radius={[6, 6, 0, 0]}
                  animationDuration={1200}
                  barSize={BAR_WIDTH}
                >
                  {chartData.map((_, index) => {
                    let fillColor = BAR_COLORS[index % BAR_COLORS.length];
                    if (index === 0) fillColor = TOP_3_COLORS[0];
                    if (index === 1) fillColor = TOP_3_COLORS[1];
                    if (index === 2) fillColor = TOP_3_COLORS[2];
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={fillColor}
                        className="hover:opacity-80 transition-opacity cursor-pointer dark:hover:brightness-110"
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
              {t('chart.empty')}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
