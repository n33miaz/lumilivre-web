import { type AnchorHTMLAttributes, type ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'quiet';
type Size = 'sm' | 'md';

interface BtnProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  /** Ícone à direita — sinaliza avanço (seta) sem competir com o rótulo. */
  trailingIcon?: ReactNode;
  children: ReactNode;
}

// `quiet` existe para desfazer o par de botões gêmeos do herói — dois retângulos
// do mesmo tamanho lado a lado é a assinatura de página gerada. A ação
// secundária vira um link com filete: continua sendo alvo de clique e de
// tabulação, mas pesa o que uma ação secundária deve pesar.
const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-lumi-500 hover:bg-lumi-600 text-white shadow-[0_10px_24px_-12px_rgba(94,25,93,0.75)] hover:shadow-[0_14px_28px_-12px_rgba(94,25,93,0.85)] active:translate-y-px',
  secondary:
    'bg-paper-50/85 dark:bg-white/5 backdrop-blur text-paper-900 dark:text-ink-100 border border-paper-300 dark:border-white/15 hover:border-lumi-400 hover:text-lumi-600 dark:hover:text-lumi-200',
  quiet:
    'text-paper-800 dark:text-ink-200 underline decoration-paper-400 decoration-1 underline-offset-[7px] hover:text-lumi-600 hover:decoration-lumi-500 dark:decoration-white/25 dark:hover:text-lumi-200 dark:hover:decoration-lumi-label',
};

const SIZES: Record<Size, string> = {
  sm: 'px-3.5 py-2 text-[13px]',
  md: 'px-5 py-3 text-sm',
};

// Anel de foco explícito: o `outline-none` dos resets deixaria a navegação por
// teclado sem pista nenhuma nos botões sobre fundo escuro do hero.
const FOCUS =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-lumi-400 focus-visible:ring-offset-2 focus-visible:ring-offset-paper-100 dark:focus-visible:ring-offset-ink-950';

export function Btn({
  variant = 'primary',
  size = 'md',
  icon,
  trailingIcon,
  children,
  className = '',
  ...rest
}: BtnProps) {
  const quiet = variant === 'quiet';
  // Degrau "controle" da escala de raio (ver :root). O link não tem raio nenhum
  // — não é uma caixa.
  const base = `group inline-flex items-center justify-center gap-2 font-semibold transition-[background-color,border-color,color,box-shadow,transform,text-decoration-color] duration-150 ${
    quiet ? '' : 'rounded-control'
  }`;
  return (
    <a
      className={`${base} ${quiet ? '' : SIZES[size]} ${VARIANTS[variant]} ${FOCUS} ${className}`}
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
