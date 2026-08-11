import {
  type FocusEvent as ReactFocusEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';

import { ShaderBackground } from './ShaderBackground';
import { setButtonLight, setButtonLightPosition } from './buttonLight';

// All-purple base with a soft, wide light on hover/focus — the shared primary
// action button across every auth screen (login, forgot, reset).
const SUBMIT_SHADER: [string, string, string] = ['#70206F', '#8B2B87', '#9D4D9C'];
const SUBMIT_HIGHLIGHT = '#EBA8E4';

interface AuthSubmitButtonProps {
  children: ReactNode;
  /** Shows a spinner + `loadingLabel` and disables the button. */
  loading?: boolean;
  loadingLabel?: ReactNode;
  disabled?: boolean;
}

export function AuthSubmitButton({
  children,
  loading = false,
  loadingLabel,
  disabled = false,
}: AuthSubmitButtonProps) {
  const onMove = (e: ReactPointerEvent<HTMLButtonElement>) =>
    setButtonLightPosition(e.currentTarget, e.clientX, e.clientY);
  const onEnter = (e: ReactPointerEvent<HTMLButtonElement>) => {
    setButtonLight(e.currentTarget, true);
    setButtonLightPosition(e.currentTarget, e.clientX, e.clientY);
  };
  const onLeave = (e: ReactPointerEvent<HTMLButtonElement>) =>
    setButtonLight(e.currentTarget, false);
  const onFocus = (e: ReactFocusEvent<HTMLButtonElement>) =>
    setButtonLight(e.currentTarget, true);
  const onBlur = (e: ReactFocusEvent<HTMLButtonElement>) =>
    setButtonLight(e.currentTarget, false);

  return (
    <button
      type="submit"
      disabled={disabled || loading}
      onPointerMove={onMove}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      onFocus={onFocus}
      onBlur={onBlur}
      className="btn-shader group relative w-full overflow-hidden rounded-control px-4 py-4 text-base font-extrabold tracking-wide text-white shadow-md transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:shadow-2xl hover:brightness-110 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-lumi-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:brightness-100"
    >
      <ShaderBackground
        className="absolute inset-0 z-[1] rounded-control"
        variant={3}
        colors={SUBMIT_SHADER}
        highlight={SUBMIT_HIGHLIGHT}
        intensity={1}
        reactivity={0.65}
        speed={1}
        smoothing={0.2}
        quality={0.85}
        hoverOnly
        enableRipple={false}
      />
      <span className="relative z-10 flex items-center justify-center gap-2">
        {loading ? (
          <>
            <span className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            {loadingLabel}
          </>
        ) : (
          children
        )}
      </span>
    </button>
  );
}
