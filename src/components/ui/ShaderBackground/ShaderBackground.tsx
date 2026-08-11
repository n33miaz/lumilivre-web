import { useEffect, useRef, useState } from 'react';
import { Renderer, Triangle, Program, Mesh } from 'ogl';

import { attachGlRecovery, type GlRecoveryHandle } from './glRecovery';
import { VERTEX, buildFragment, type ShaderVariant } from './shaderSources';

interface ShaderBackgroundProps {
  /** Which of the 5 wallpapers to render. */
  variant?: ShaderVariant;
  /** Gradient stops [A, B, C]; C falls back to B when omitted. Hex strings. */
  colors?: [string, string, string?];
  /** Tint of the pointer-driven light (defaults to white). Hex string. */
  highlight?: string;
  /** 0..1 overall light strength. */
  intensity?: number;
  /** 0..1 how much the mesh deforms and follows the pointer. */
  reactivity?: number;
  /** Animation speed multiplier. */
  speed?: number;
  /** Pointer/click reactivity (disable to drop window listeners entirely). */
  interactive?: boolean;
  /** Render the pointer light only while the pointer/focus is over the host. */
  hoverOnly?: boolean;
  /** Enable the click ripple uniform. Disable for controls that should not pulse. */
  enableRipple?: boolean;
  /**
   * Mouse smoothing factor per frame (0..1). Higher = snappier follow.
   * Defaults to 0.18 — visibly responsive without jitter.
   */
  smoothing?: number;
  /** Internal render scale (perf). 1 = full device resolution. */
  quality?: number;
  className?: string;
}

const FALLBACK: [number, number, number] = [0.46, 0.13, 0.46];

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '').trim();
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  const int = Number.parseInt(full, 16);
  if (Number.isNaN(int) || full.length !== 6) return FALLBACK;
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255].map(
    (v) => v / 255,
  ) as [number, number, number];
}

function writeRgb(dest: Float32Array, hex: string) {
  const [r, g, b] = hexToRgb(hex);
  dest[0] = r;
  dest[1] = g;
  dest[2] = b;
}

export function ShaderBackground({
  variant = 1,
  colors = ['#5E195D', '#762075', '#9D4D9C'],
  highlight = '#FFFFFF',
  intensity = 0.7,
  reactivity = 0.7,
  speed = 1,
  interactive = true,
  hoverOnly = false,
  enableRipple = true,
  smoothing = 0.18,
  quality = 0.6,
  className = '',
}: ShaderBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Geração do contexto WebGL: incrementá-la remonta o shader do zero. É o que
  // repara a perda de contexto — ver `glRecovery.ts`.
  const [glGeneration, setGlGeneration] = useState(0);
  const glBudget = useRef(0);

  // Stable buffers consumed by OGL uniforms — references never change, only
  // their contents do. This avoids OGL's redundant-uniform cache holding onto a
  // stale array reference and skipping GPU updates on theme switch.
  const buffersRef = useRef({
    colorA: new Float32Array(3),
    colorB: new Float32Array(3),
    colorC: new Float32Array(3),
    highlight: new Float32Array(3),
    mouse: new Float32Array([0.5, 0.5]),
    ripple: new Float32Array([0.5, 0.5, 0, 0]),
    resolution: new Float32Array([1, 1]),
    scalars: { intensity, reactivity, speed, smoothing },
  });

  // Sync colors and scalars on every render BEFORE the next frame; the render
  // loop reads from these buffers each frame so no separate effect is needed.
  const b = buffersRef.current;
  writeRgb(b.colorA, colors[0]);
  writeRgb(b.colorB, colors[1]);
  writeRgb(b.colorC, colors[2] ?? colors[1]);
  writeRgb(b.highlight, highlight);
  b.scalars.intensity = intensity;
  b.scalars.reactivity = reactivity;
  b.scalars.speed = speed;
  b.scalars.smoothing = smoothing;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    let renderer: Renderer;
    try {
      renderer = new Renderer({
        dpr: Math.min(window.devicePixelRatio || 1, 2) * quality,
        alpha: true,
        antialias: false,
        powerPreference: 'low-power',
      });
    } catch {
      return; // WebGL unavailable — caller's CSS background remains visible.
    }

    const gl = renderer.gl;
    if (!gl || typeof gl.getExtension !== 'function') return; // jsdom / SSR
    gl.clearColor(0, 0, 0, 0);
    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    // Fade in on first paint so the canvas doesn't pop over the caller's CSS
    // gradient fallback while WebGL spins up.
    canvas.style.opacity = '0';
    canvas.style.transition = 'opacity 400ms ease';
    container.appendChild(canvas);

    const buf = buffersRef.current;
    const program = new Program(gl, {
      vertex: VERTEX,
      fragment: buildFragment(variant),
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: buf.resolution },
        uMouse: { value: buf.mouse },
        uColorA: { value: buf.colorA },
        uColorB: { value: buf.colorB },
        uColorC: { value: buf.colorC },
        uHighlight: { value: buf.highlight },
        uIntensity: { value: buf.scalars.intensity },
        uReact: { value: buf.scalars.reactivity },
        uSpeed: { value: buf.scalars.speed },
        uRipple: { value: buf.ripple },
        uHover: { value: hoverOnly ? 0 : 1 },
      },
    });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    // "Tamanho válido" = container com dimensão real. Enquanto não houver, nada é
    // pintado nem revelado: um buffer de 1px esticado a 100% é justamente o
    // quadro feio a evitar. O degradê/CSS do próprio controle cobre a espera.
    let hasValidSize = false;
    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        renderer.setSize(w, h);
        buf.resolution[0] = canvas.width;
        buf.resolution[1] = canvas.height;
        hasValidSize = true;
      }
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    const target = { x: 0.5, y: 0.5 };
    const current = { x: 0.5, y: 0.5 };
    const hover = { target: hoverOnly ? 0 : 1, current: hoverOnly ? 0 : 1 };
    const ripple = { x: 0.5, y: 0.5, start: -10 };

    const toLocal = (clientX: number, clientY: number) => {
      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return null;
      const rawX = (clientX - rect.left) / rect.width;
      const rawY = 1 - (clientY - rect.top) / rect.height;
      // Allow a small overshoot (-0.1..1.1) so the spotlight can drift just off
      // the edge instead of slamming flat against the container border.
      return {
        x: Math.min(Math.max(rawX, -0.1), 1.1),
        y: Math.min(Math.max(rawY, -0.1), 1.1),
        inside: rawX >= 0 && rawX <= 1 && rawY >= 0 && rawY <= 1,
      };
    };

    const onMove = (e: PointerEvent) => {
      const local = toLocal(e.clientX, e.clientY);
      if (local) {
        target.x = local.x;
        target.y = local.y;
        if (hoverOnly) hover.target = local.inside ? 1 : 0;
      }
    };
    const onDown = (e: PointerEvent) => {
      if (!enableRipple) return;
      const local = toLocal(e.clientX, e.clientY);
      if (local) {
        ripple.x = local.x;
        ripple.y = local.y;
        ripple.start = performance.now();
      }
    };
    const onHostEnter = () => {
      if (hoverOnly) hover.target = 1;
    };
    const onHostLeave = () => {
      if (hoverOnly) hover.target = 0;
    };
    const host = container.parentElement;

    if (interactive && !reduceMotion) {
      window.addEventListener('pointermove', onMove, { passive: true });
      if (enableRipple) {
        window.addEventListener('pointerdown', onDown, { passive: true });
      }
      if (hoverOnly) {
        host?.addEventListener('pointerenter', onHostEnter);
        host?.addEventListener('pointerleave', onHostLeave);
        host?.addEventListener('focusin', onHostEnter);
        host?.addEventListener('focusout', onHostLeave);
      }
    }

    let raf = 0;
    let running = true;
    let revealed = false;
    const start = performance.now();
    // Preenchido logo abaixo; `reveal` precisa alcançá-lo e roda antes.
    let recovery: GlRecoveryHandle | null = null;

    const reveal = () => {
      if (revealed) return;
      revealed = true;
      canvas.style.opacity = '1';
      recovery?.markPainted();
    };

    const frame = () => {
      if (!running) return;
      const now = performance.now();
      const t = (now - start) / 1000;

      const k = buf.scalars.smoothing;
      current.x += (target.x - current.x) * k;
      current.y += (target.y - current.y) * k;
      hover.current += (hover.target - hover.current) * k;

      buf.mouse[0] = current.x;
      buf.mouse[1] = current.y;

      program.uniforms.uTime.value = t;
      program.uniforms.uIntensity.value = buf.scalars.intensity;
      program.uniforms.uReact.value = buf.scalars.reactivity;
      program.uniforms.uSpeed.value = buf.scalars.speed;
      program.uniforms.uHover.value = hover.current;

      const age = (now - ripple.start) / 1000;
      const active = age < 2.0 ? 1 : 0;
      buf.ripple[0] = ripple.x;
      buf.ripple[1] = ripple.y;
      buf.ripple[2] = age;
      buf.ripple[3] = active;

      // Só pinta e revela com tamanho válido (ver `resize`).
      if (hasValidSize) {
        renderer.render({ scene: mesh });
        reveal();
      }
      raf = requestAnimationFrame(frame);
    };

    // Antes do primeiro frame: em `prefers-reduced-motion` o `reveal()` é
    // síncrono e já precisa encontrar a recuperação de pé.
    recovery = attachGlRecovery({
      canvas,
      budget: glBudget,
      onLost: () => {
        running = false;
        cancelAnimationFrame(raf);
        canvas.style.opacity = '0';
      },
      requestRebuild: () => setGlGeneration((generation) => generation + 1),
    });

    if (reduceMotion) {
      // Single static frame — no animation loop. Espera o tamanho válido antes
      // de pintar; se nunca chegar, desiste e deixa o fundo do controle.
      let tries = 0;
      const renderOnce = () => {
        if (hasValidSize) {
          program.uniforms.uTime.value = 12.0;
          program.uniforms.uHover.value = hover.current;
          renderer.render({ scene: mesh });
          reveal();
          return;
        }
        if (tries++ < 300) raf = requestAnimationFrame(renderOnce);
      };
      raf = requestAnimationFrame(renderOnce);
    } else {
      raf = requestAnimationFrame(frame);
    }

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!reduceMotion && !running) {
        running = true;
        raf = requestAnimationFrame(frame);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      host?.removeEventListener('pointerenter', onHostEnter);
      host?.removeEventListener('pointerleave', onHostLeave);
      host?.removeEventListener('focusin', onHostEnter);
      host?.removeEventListener('focusout', onHostLeave);
      recovery?.dispose();
      const ext = gl.getExtension('WEBGL_lose_context');
      ext?.loseContext();
      if (canvas.parentNode === container) container.removeChild(canvas);
    };
    // GL is fully torn down only when these structural props change (ou quando a
    // geração muda, por perda de contexto). Colors, intensity, reactivity and
    // speed flow through buffersRef each frame.
  }, [variant, interactive, hoverOnly, enableRipple, quality, glGeneration]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`pointer-events-none overflow-hidden ${className}`}
    />
  );
}
