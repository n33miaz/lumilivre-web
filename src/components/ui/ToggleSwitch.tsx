interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  /** Nome acessível: o interruptor não tem rótulo visível próprio. */
  ariaLabel: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Interruptor liga/desliga (`.switch` do `index.css`).
 *
 * Existe como primitivo porque cada tela que precisava de um vinha
 * redeclarando o mesmo botão `role="switch"` — e a que esquecia o
 * `aria-checked` virava um botão mudo para o leitor de tela.
 */
export function ToggleSwitch({
  checked,
  onChange,
  ariaLabel,
  disabled = false,
  className = '',
}: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onChange}
      className={`switch ${checked ? 'on' : ''} ${
        disabled ? 'opacity-60 cursor-not-allowed' : ''
      } ${className}`}
    />
  );
}
