import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { FunctionComponent, SVGProps } from 'react';

interface StatCardProps {
  Icon: FunctionComponent<SVGProps<SVGSVGElement>>;
  title: string;
  value: number | string;
  variant?: 'default' | 'danger';
  to: string;
  isLoading?: boolean;
  hasError?: boolean;
  animate?: boolean;
}

// Componente auxiliar para animar os números
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

      // Efeito easeOutQuart para desacelerar no final
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

  return <>{displayValue}</>;
}

export function StatCard({
  Icon,
  title,
  value,
  variant = 'default',
  to,
  isLoading = false,
  hasError = false,
  animate = false,
}: StatCardProps) {
  const isDanger = variant === 'danger';

  return (
    <Link
      to={to}
      className="group flex items-stretch bg-white dark:bg-dark-card rounded-lg shadow-md overflow-hidden hover:bg-gray-50 dark:hover:bg-gray-700 hover:scale-105 hover:shadow-lg"
    >
      <div
        className={`w-14 md:w-24 flex items-center justify-center shrink-0
          ${isDanger ? 'bg-red-500' : 'bg-lumi-primary'}`}
      >
        <Icon className="w-7 h-7 md:w-10 md:h-10 text-white fill-current" />
      </div>

      <div className="flex-1 p-2 md:p-4 flex flex-col justify-center min-w-0">
        <p
          className={`text-[10px] md:text-base font-bold uppercase tracking-wide truncate
            ${isDanger ? 'text-red-400' : 'text-gray-500 dark:text-gray-400'}`}
        >
          {title}
        </p>
        <p
          className={`text-xl md:text-3xl font-bold truncate mt-0.5 md:mt-1
            ${isDanger ? 'text-red-500' : 'text-gray-800 dark:text-white'}`}
          title={String(value)}
        >
          {isLoading ? (
            '...'
          ) : hasError ? (
            '-'
          ) : typeof value === 'number' ? (
            <AnimatedNumber value={value} animate={animate} />
          ) : (
            value
          )}
        </p>
      </div>
    </Link>
  );
}
