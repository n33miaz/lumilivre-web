import { type ButtonHTMLAttributes, type ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  isLoading?: boolean;
  loadingText?: string;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  isLoading = false,
  loadingText = 'Carregando...',
  className = '',
  disabled,
  children,
  ...props
}: ButtonProps) {
  const baseStyles =
    'flex items-center justify-center font-bold rounded-lg shadow-md transform active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none';

  const variants = {
    primary: 'bg-lumi-primary hover:bg-lumi-primary-hover text-white',
    secondary:
      'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    success: 'bg-green-500 hover:bg-green-600 text-white',
    ghost:
      'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 shadow-none',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant]} px-4 py-2 ${className}`}
      {...props}
    >
      {isLoading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2 shrink-0" />
      )}
      {isLoading ? loadingText : children}
    </button>
  );
}
