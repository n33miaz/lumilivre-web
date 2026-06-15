/**
 * Shared pointer-spotlight helper for the lit gradient buttons (`.btn-shader`).
 * Updates the `--btn-x` / `--btn-y` CSS variables so the radial light tracks
 * the pointer. Works on any element (the submit <button> and the download <a>).
 */

function clampPercent(value: number) {
  return `${Math.min(Math.max(value, 0), 100)}%`;
}

export function setButtonLightPosition(
  el: HTMLElement,
  clientX: number,
  clientY: number,
) {
  const rect = el.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  el.style.setProperty(
    '--btn-x',
    clampPercent(((clientX - rect.left) / rect.width) * 100),
  );
  el.style.setProperty(
    '--btn-y',
    clampPercent(((clientY - rect.top) / rect.height) * 100),
  );
}

export function setButtonLight(el: HTMLElement, on: boolean) {
  el.style.setProperty('--btn-light', on ? '1' : '0');
}
