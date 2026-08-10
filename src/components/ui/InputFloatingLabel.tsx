import { type InputHTMLAttributes, type ElementType, useState } from 'react';

import EyeIcon from '../../assets/icons/eye.svg?react';
import EyeCloseIcon from '../../assets/icons/eye-close.svg?react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: ElementType;
  error?: string | null;
}

export function InputFloatingLabel({
  label,
  icon: Icon,
  id,
  error,
  className = '',
  onFocus,
  onBlur,
  type,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const hasContent =
    props.value !== undefined && String(props.value).length > 0;
  const shouldFloatLabel = isFocused || hasContent;

  const isPasswordType = type === 'password';

  const currentType = isPasswordType
    ? showPassword
      ? 'text'
      : 'password'
    : type;

  return (
    <div className={`relative group ${className}`}>
      <input
        id={id}
        type={currentType}
        className={`w-full pl-10 ${isPasswordType ? 'pr-10' : 'pr-4'} py-3.5 bg-transparent border-2 rounded-lg outline-none text-gray-800 dark:text-gray-100 transition-[border-color,box-shadow,color,background-color] duration-200 ease-out motion-reduce:transition-none
          ${
            error
              ? 'border-red-500'
              : isFocused
                ? 'border-lumi-primary dark:border-lumi-primary shadow-[0_0_0_4px_rgba(118,32,117,0.12)] dark:shadow-[0_0_0_4px_rgba(201,100,197,0.15)]'
                : 'border-gray-300 dark:border-gray-600'
          }
        `}
        onFocus={(e) => {
          setIsFocused(true);
          if (onFocus) onFocus(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          if (onBlur) onBlur(e);
        }}
        {...props}
      />

      {/* Float driven purely by `transform` (top/left stay constant) so the
          200ms transition interpolates a single matrix — switching `top`
          between % and rem made Chromium snap instead of animate.
          Lista explícita no lugar de `transition-all`: `all` também alcança
          propriedades que não deveriam animar (o `padding`, a `border` que o
          navegador injeta no preenchimento automático) e, quando uma delas
          entra no meio, a curva do rótulo engasga. Aqui estão as quatro que de
          fato mudam — posição, corpo, peso e cor — mais a cor de fundo, que é o
          retalho que fura a borda do campo e precisa acompanhar a troca de
          tema. */}
      <label
        htmlFor={id}
        className={`absolute left-3 top-1/2 origin-left cursor-text px-1 pointer-events-none bg-white dark:bg-dark-card text-base transition-[transform,font-size,font-weight,color,background-color] duration-200 ease-out motion-reduce:transition-none
          ${
            shouldFloatLabel
              ? 'translate-x-0 translate-y-[calc(-50%_-_1.75rem)] scale-75 font-bold'
              : 'translate-x-7 -translate-y-1/2 scale-100'
          }

          ${/* No claro, #C964C5 sobre branco dá 3,4:1 — abaixo do mínimo AA
                para texto de 16px. O roxo primário sobe para 9,4:1 e o rosa
                fica só no escuro, onde rende 5,1:1 sobre o cartão. */ ''}
          ${error ? 'text-red-500' : 'text-lumi-primary dark:text-lumi-label'}
        `}
      >
        {label}
      </label>

      {Icon && (
        <Icon
          className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors duration-200 ease-out motion-reduce:transition-none
            ${
              error
                ? 'text-red-500'
                : isFocused
                  ? 'text-lumi-primary dark:text-lumi-label'
                  : 'text-gray-400'
            }
          `}
        />
      )}

      {isPasswordType && hasContent && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 focus:outline-none hover:opacity-80 transition-opacity duration-200 ease-out motion-reduce:transition-none"
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeCloseIcon className="w-5 h-5 text-lumi-label" />
          ) : (
            <EyeIcon className="w-5 h-5 text-lumi-label" />
          )}
        </button>
      )}
    </div>
  );
}
