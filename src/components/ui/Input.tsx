import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

// 200ms em todos os campos do sistema, e não só nos de login: a mesma duração do
// rótulo flutuante. Com `transition-colors` sem duração o Tailwind entregava
// 150ms, e dois campos vizinhos de telas diferentes reagiam em ritmos diferentes.

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, disabled, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          disabled={disabled}
          className={`
            w-full h-[38px] px-3 border rounded-md outline-none text-sm
            transition-[color,background-color,border-color,box-shadow] duration-200 ease-out motion-reduce:transition-none
            ${
              disabled
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed border-gray-200 dark:border-gray-700'
                : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-lumi-primary focus:border-lumi-primary'
            }
            ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <span className="text-xs text-red-500 mt-1 block animate-fade-in">
            {error}
          </span>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
