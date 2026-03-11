import { type LabelHTMLAttributes } from 'react';

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  requiredIndicator?: boolean;
}

export function Label({
  children,
  className = '',
  requiredIndicator,
  ...props
}: LabelProps) {
  return (
    <label
      className={`block text-sm font-medium text-gray-700 dark:text-white mb-1 ${className}`}
      {...props}
    >
      {children}
      {requiredIndicator && (
        <span className="text-red-500 ml-1" title="Campo obrigatório">
          *
        </span>
      )}
    </label>
  );
}
