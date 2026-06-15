import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { FunctionComponent, SVGProps, ReactNode } from 'react';

type StatCardTone = 'lumi' | 'blue' | 'violet' | 'danger';

interface StatCardProps {
  Icon: FunctionComponent<SVGProps<SVGSVGElement>>;
  title: string;
  value: number | string;
  to: string;
  tone?: StatCardTone;
  isLoading?: boolean;
  hasError?: boolean;
  animate?: boolean;
  sparkline?: number[];
  badge?: ReactNode;
}

interface ToneTokens {
  borderClass: string;
  bgGlowStyle?: React.CSSProperties;
  iconTileClass: string;
  iconColorClass: string;
  valueClass: string;
  eyebrowClass: string;
  sparklineColor: string;
}

const TONE_MAP: Record<StatCardTone, ToneTokens> = {
  lumi: {
    borderClass: 'border-gray-200/70 dark:border-white/5',
    iconTileClass: 'bg-lumi-gradient shadow-glowSoft',
    iconColorClass: 'text-white',
    valueClass: 'text-gray-900 dark:text-white',
    eyebrowClass: 'text-gray-500 dark:text-gray-400',
    sparklineColor: '#762075',
  },
  blue: {
    borderClass: 'border-gray-200/70 dark:border-white/5',
    bgGlowStyle: {
      background:
        'radial-gradient(circle,rgba(29,111,191,0.15),transparent 70%)',
    },
    iconTileClass: 'bg-gradient-to-br from-blue-500 to-blue-700 shadow-md',
    iconColorClass: 'text-white',
    valueClass: 'text-gray-900 dark:text-white',
    eyebrowClass: 'text-gray-500 dark:text-gray-400',
    sparklineColor: '#1D6FBF',
  },
  violet: {
    borderClass: 'border-gray-200/70 dark:border-white/5',
    bgGlowStyle: {
      background:
        'radial-gradient(circle,rgba(139,92,246,0.15),transparent 70%)',
    },
    iconTileClass: 'bg-gradient-to-br from-violet-500 to-violet-700 shadow-md',
    iconColorClass: 'text-white',
    valueClass: 'text-gray-900 dark:text-white',
    eyebrowClass: 'text-gray-500 dark:text-gray-400',
    sparklineColor: '#8B5CF6',
  },
  danger: {
    borderClass: 'border-red-200/40 dark:border-red-500/20',
    bgGlowStyle: {
      background: 'radial-gradient(circle,rgba(239,68,68,0.18),transparent 70%)',
    },
    iconTileClass: 'bg-gradient-to-br from-red-500 to-red-700 shadow-md',
    iconColorClass: 'text-white',
    valueClass: 'text-red-500',
    eyebrowClass: 'text-red-500',
    sparklineColor: '#ef4444',
  },
};

function AnimatedNumber({
  value,
  animate,
}: {
  value: number;
  animate: boolean;
}) {
  const [displayValue, setDisplayValue] = useState(animate ? 0 : value);

  useEffect(() => {
    if (!animate) {
      setDisplayValue(value);
      return;
    }

    let startTimestamp: number | null = null;
    const duration = 1500;
    let animationFrame: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(Math.floor(easeOutQuart * value));
      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
      }
    };

    animationFrame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [value, animate]);

  return <>{displayValue.toLocaleString()}</>;
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);
  const width = 100;
  const height = 28;
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${width} ${height}`}
      className="absolute bottom-2 right-3 w-20 h-7 opacity-60"
      fill="none"
    >
      <polyline
        points={points}
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function StatCard({
  Icon,
  title,
  value,
  to,
  tone = 'lumi',
  isLoading = false,
  hasError = false,
  animate = false,
  sparkline,
  badge,
}: StatCardProps) {
  const tokens = TONE_MAP[tone];

  return (
    <Link
      to={to}
      className={`group relative rounded-2xl bg-white dark:bg-dark-card border ${tokens.borderClass} p-5 hover:shadow-card transition-all hover:-translate-y-0.5 overflow-hidden cursor-pointer block`}
    >
      <div
        className="absolute -top-8 -right-8 w-32 h-32 rounded-full"
        style={
          tokens.bgGlowStyle ?? {
            background:
              'linear-gradient(135deg, rgba(118,32,117,0.10) 0%, rgba(201,100,197,0.10) 100%)',
          }
        }
      />
      <div className="relative flex items-start justify-between">
        <div
          className={`w-11 h-11 rounded-xl ${tokens.iconTileClass} flex items-center justify-center ${tokens.iconColorClass}`}
        >
          <Icon className="w-5 h-5 fill-current" />
        </div>
        {badge}
      </div>
      <div className="relative mt-4">
        <div
          className={`text-[11px] font-bold tracking-wider uppercase ${tokens.eyebrowClass}`}
        >
          {title}
        </div>
        <div
          className={`font-display font-extrabold text-3xl mt-1 ${tokens.valueClass}`}
        >
          {isLoading ? (
            '…'
          ) : hasError ? (
            '-'
          ) : typeof value === 'number' ? (
            <AnimatedNumber value={value} animate={animate} />
          ) : (
            value
          )}
        </div>
      </div>
      {sparkline && (
        <Sparkline values={sparkline} color={tokens.sparklineColor} />
      )}
    </Link>
  );
}
