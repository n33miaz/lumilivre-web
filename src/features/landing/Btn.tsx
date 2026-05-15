import { type AnchorHTMLAttributes, type ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

interface BtnProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: Variant;
  icon?: ReactNode;
  children: ReactNode;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-lumi-500 hover:bg-lumi-600 text-white shadow-glow hover:shadow-lg active:translate-y-px',
  secondary:
    'bg-white dark:bg-ink-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 hover:border-lumi-400 hover:text-lumi-500 dark:hover:text-lumi-400',
  ghost:
    'text-gray-700 dark:text-gray-300 hover:text-lumi-500 dark:hover:text-lumi-400',
};

export function Btn({
  variant = 'primary',
  icon,
  children,
  className = '',
  ...rest
}: BtnProps) {
  const base =
    'inline-flex items-center gap-2 rounded-lg font-semibold text-sm px-5 py-3 transition-all duration-150';
  return (
    <a className={`${base} ${VARIANTS[variant]} ${className}`} {...rest}>
      {icon}
      {children}
    </a>
  );
}
