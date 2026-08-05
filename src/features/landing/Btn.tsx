import { type AnchorHTMLAttributes, type ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md';

interface BtnProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  /** Ícone à direita — sinaliza avanço (seta) sem competir com o rótulo. */
  trailingIcon?: ReactNode;
  children: ReactNode;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-lumi-500 hover:bg-lumi-600 text-white shadow-glow hover:shadow-lg active:translate-y-px',
  secondary:
    'bg-white/80 dark:bg-white/5 backdrop-blur text-gray-900 dark:text-white border border-gray-300 dark:border-white/15 hover:border-lumi-400 hover:text-lumi-600 dark:hover:text-lumi-200',
  ghost:
    'text-gray-700 dark:text-gray-300 hover:text-lumi-600 dark:hover:text-lumi-200',
};

const SIZES: Record<Size, string> = {
  sm: 'px-3.5 py-2 text-[13px]',
  md: 'px-5 py-3 text-sm',
};

// Anel de foco explícito: o `outline-none` dos resets deixaria a navegação por
// teclado sem pista nenhuma nos botões sobre fundo escuro do hero.
const FOCUS =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-lumi-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-ink-950';

export function Btn({
  variant = 'primary',
  size = 'md',
  icon,
  trailingIcon,
  children,
  className = '',
  ...rest
}: BtnProps) {
  const base =
    'group inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-150';
  return (
    <a
      className={`${base} ${SIZES[size]} ${VARIANTS[variant]} ${FOCUS} ${className}`}
      {...rest}
    >
      {icon}
      {children}
      {trailingIcon && (
        <span className="transition-transform duration-200 group-hover:translate-x-0.5">
          {trailingIcon}
        </span>
      )}
    </a>
  );
}
