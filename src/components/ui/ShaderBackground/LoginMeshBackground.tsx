import { useEffect, useRef } from 'react';
import { Renderer, Triangle, Program, Mesh } from 'ogl';

import { VERTEX } from './shaderSources';

interface LoginMeshBackgroundProps {
  isDark: boolean;
  quality?: number;
  className?: string;
  /**
   * When true (default) the canvas is split — brand purple on the left half,
   * theme background on the right (the login two-column layout). When false the
   * whole canvas uses the theme background palette, for centered single-column
   * auth pages (forgot/reset).
   */
  split?: boolean;
}

const LOGIN_STAGE_FRAGMENT = /* glsl */ `
precision mediump float;

uniform float uTime;
uniform vec2  uResolution;
uniform vec2  uMouse;
uniform float uReact;
uniform float uWarp;

uniform vec2 uBA0; uniform vec3 uBC0;
uniform vec2 uBA1; uniform vec3 uBC1;
uniform vec2 uBA2; uniform vec3 uBC2;
uniform vec2 uBA3; uniform vec3 uBC3;
uniform vec2 uBA4; uniform vec3 uBC4;

uniform vec2 uDA0; uniform vec3 uDC0;
uniform vec2 uDA1; uniform vec3 uDC1;
uniform vec2 uDA2; uniform vec3 uDC2;
uniform vec2 uDA3; uniform vec3 uDC3;
uniform vec2 uDA4; uniform vec3 uDC4;

uniform vec3  uBrandCursor;
uniform vec3  uBackCursor;
uniform float uCursorWeight;
uniform float uSplit;      // 1 = brand|back split, 0 = back palette everywhere

varying vec2 vUv;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm2(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  v += a * vnoise(p);
  p *= 2.0;
  a *= 0.5;
  v += a * vnoise(p);
  p *= 2.0;
  a *= 0.5;
  v += a * vnoise(p);
  return v;
}

float gauss(vec2 a, vec2 b, float k) {
  vec2 d = a - b;
  return exp(-k * dot(d, d));
}

vec2 displaced(vec2 a, vec2 m, float react) {
  vec2 toM = m - a;
  float w = 1.0 / (1.0 + dot(toM, toM) * 3.0);
  // 0.20 — the mesh blobs barely lean toward the cursor, so the wider palette
  // drifts gently on its own (via the anchor orbits) instead of lurching at the
  // pointer. The crisp, localized reaction comes from the cursor light below.
  return a + toM * react * 0.20 * w;
}

void main() {
  float aspect = uResolution.x / max(uResolution.y, 1.0);

  vec2 toM = uMouse - vUv;
  vec2 warpInput = vUv * 1.5 + uTime * 0.04;
  vec2 w2 = vec2(
    fbm2(warpInput + toM * 0.5),
    fbm2(warpInput + vec2(3.7, -2.1) + toM * 0.5)
  ) - 0.5;
  float prox = exp(-dot(toM, toM) * 2.4);
  float warpAmp = uWarp * (0.07 + 0.22 * prox);
  vec2 uv = vUv + w2 * warpAmp;

  vec2 P = vec2((uv.x - 0.5) * aspect, uv.y - 0.5);

  vec3 brandColor;
  {
    float K = 7.0;
    vec2 a0 = displaced(uBA0, uMouse, uReact);
    vec2 a1 = displaced(uBA1, uMouse, uReact);
    vec2 a2 = displaced(uBA2, uMouse, uReact);
    vec2 a3 = displaced(uBA3, uMouse, uReact);
    vec2 a4 = displaced(uBA4, uMouse, uReact);
    vec2 p0 = vec2((a0.x - 0.5) * aspect, a0.y - 0.5);
    vec2 p1 = vec2((a1.x - 0.5) * aspect, a1.y - 0.5);
    vec2 p2 = vec2((a2.x - 0.5) * aspect, a2.y - 0.5);
    vec2 p3 = vec2((a3.x - 0.5) * aspect, a3.y - 0.5);
    vec2 p4 = vec2((a4.x - 0.5) * aspect, a4.y - 0.5);
    float w0 = gauss(P, p0, K);
    float w1 = gauss(P, p1, K);
    float w2_ = gauss(P, p2, K);
    float w3 = gauss(P, p3, K);
    float w4 = gauss(P, p4, K);
    vec2 mp = vec2((uMouse.x - 0.5) * aspect, uMouse.y - 0.5);
    // Hot core (tight) + soft halo → a clearly localizable spotlight that still
    // falls off gently. Not a flat wash, not a hard pinpoint.
    float wm = (gauss(P, mp, K * 1.7) * 0.8 + gauss(P, mp, K * 0.6) * 0.5) * uCursorWeight;
    float total = w0 + w1 + w2_ + w3 + w4 + wm + 0.0001;
    brandColor = (uBC0*w0 + uBC1*w1 + uBC2*w2_ + uBC3*w3 + uBC4*w4 + uBrandCursor*wm) / total;
  }

  vec3 backColor;
  {
    float K = 6.0;
    vec2 a0 = displaced(uDA0, uMouse, uReact * 0.95);
    vec2 a1 = displaced(uDA1, uMouse, uReact * 0.95);
    vec2 a2 = displaced(uDA2, uMouse, uReact * 0.95);
    vec2 a3 = displaced(uDA3, uMouse, uReact * 0.95);
    vec2 a4 = displaced(uDA4, uMouse, uReact * 0.95);
    vec2 p0 = vec2((a0.x - 0.5) * aspect, a0.y - 0.5);
    vec2 p1 = vec2((a1.x - 0.5) * aspect, a1.y - 0.5);
    vec2 p2 = vec2((a2.x - 0.5) * aspect, a2.y - 0.5);
    vec2 p3 = vec2((a3.x - 0.5) * aspect, a3.y - 0.5);
    vec2 p4 = vec2((a4.x - 0.5) * aspect, a4.y - 0.5);
    float w0 = gauss(P, p0, K);
    float w1 = gauss(P, p1, K);
    float w2_ = gauss(P, p2, K);
    float w3 = gauss(P, p3, K);
    float w4 = gauss(P, p4, K);
    vec2 mp = vec2((uMouse.x - 0.5) * aspect, uMouse.y - 0.5);
    float wm = (gauss(P, mp, K * 1.7) * 0.8 + gauss(P, mp, K * 0.6) * 0.5) * uCursorWeight * 0.9;
    float total = w0 + w1 + w2_ + w3 + w4 + wm + 0.0001;
    backColor = (uDC0*w0 + uDC1*w1 + uDC2*w2_ + uDC3*w3 + uDC4*w4 + uBackCursor*wm) / total;
  }

  // uSplit=1 → brand|back split at mid-screen; uSplit=0 → back palette only.
  float sel = mix(1.0, smoothstep(0.495, 0.505, vUv.x), uSplit);
  vec3 col = mix(brandColor, backColor, sel);
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 0.96);
}
`;

const BRAND = {
  anchors: [
    [0.18, 0.82],
    [0.82, 0.18],
    [0.22, 0.2],
    [0.78, 0.85],
    [0.5, 0.5],
  ],
  colors: ['#4A1448', '#9D4D9C', '#5E195D', '#762075', '#3A0E3A'],
  cursor: '#E27BD6',
};

const BACK_DARK = {
  anchors: [
    [0.2, 0.8],
    [0.8, 0.2],
    [0.1, 0.1],
    [0.9, 0.9],
    [0.5, 0.5],
  ],
  // Aligned with tailwind dark-* tokens (0F1116 / 181B23 / 1F232C) so the
  // shader and the card share the same dark palette family.
  colors: ['#1F232C', '#22122E', '#0F1116', '#1A0B26', '#181B23'],
  cursor: '#A341A0',
};

const BACK_LIGHT = {
  anchors: BACK_DARK.anchors,
  colors: ['#E5C9EB', '#D8B3DD', '#FBF6FD', '#C99FD0', '#EBD7F0'],
  cursor: '#5E195D',
};

const FALLBACK_RGB: [number, number, number] = [0.46, 0.13, 0.46];

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
  if (Number.isNaN(int) || full.length !== 6) return FALLBACK_RGB;
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255].map(
    (v) => v / 255,
  ) as [number, number, number];
}

function writeVec2(dest: Float32Array, x: number, y: number) {
  dest[0] = x;
  dest[1] = y;
}

function paletteToRgb(colors: string[]): Array<[number, number, number]> {
  return colors.map(hexToRgb);
}

// 200ms theme transition expressed as a per-second lerp rate: each frame moves
// `1 - exp(-rate * dt)` of the remaining distance, giving a smooth ~63%/τ curve
// where τ = 1/rate. rate = 12 → τ ≈ 83 ms → ~95% complete by 250 ms (≈200ms
// perceived).
const THEME_LERP_RATE = 12;

export function LoginMeshBackground({
  isDark,
  quality = 0.55,
  className = '',
  split = true,
}: LoginMeshBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Refs let isDark changes flow into the running RAF loop without tearing down
  // the WebGL context. The cursor color animates the same way.
  const targetIsDark = useRef(isDark);

  useEffect(() => {
    targetIsDark.current = isDark;
  }, [isDark]);

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
        premultipliedAlpha: false,
        powerPreference: 'low-power',
      });
    } catch {
      return;
    }

    const gl = renderer.gl;
    if (!gl || typeof gl.getExtension !== 'function') return;

    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    // Fade in once the first frame is painted, so the canvas doesn't pop over
    // the CSS gradient fallback if WebGL takes a moment to come up.
    canvas.style.opacity = '0';
    canvas.style.transition = 'opacity 450ms ease';
    container.appendChild(canvas);

    const uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new Float32Array([1, 1]) },
      uMouse: { value: new Float32Array([0.5, 0.5]) },
      uReact: { value: 0.8 },
      uWarp: { value: 0.5 },
      uBA0: { value: new Float32Array(2) },
      uBC0: { value: new Float32Array(3) },
      uBA1: { value: new Float32Array(2) },
      uBC1: { value: new Float32Array(3) },
      uBA2: { value: new Float32Array(2) },
      uBC2: { value: new Float32Array(3) },
      uBA3: { value: new Float32Array(2) },
      uBC3: { value: new Float32Array(3) },
      uBA4: { value: new Float32Array(2) },
      uBC4: { value: new Float32Array(3) },
      uDA0: { value: new Float32Array(2) },
      uDC0: { value: new Float32Array(3) },
      uDA1: { value: new Float32Array(2) },
      uDC1: { value: new Float32Array(3) },
      uDA2: { value: new Float32Array(2) },
      uDC2: { value: new Float32Array(3) },
      uDA3: { value: new Float32Array(2) },
      uDC3: { value: new Float32Array(3) },
      uDA4: { value: new Float32Array(2) },
      uDC4: { value: new Float32Array(3) },
      uBrandCursor: { value: new Float32Array(3) },
      uBackCursor: { value: new Float32Array(3) },
      uCursorWeight: { value: 1.5 },
      uSplit: { value: split ? 1 : 0 },
    };

    const program = new Program(gl, {
      vertex: VERTEX,
      fragment: LOGIN_STAGE_FRAGMENT,
      uniforms,
    });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    const brandAnchorUniforms = [
      uniforms.uBA0,
      uniforms.uBA1,
      uniforms.uBA2,
      uniforms.uBA3,
      uniforms.uBA4,
    ];
    const brandColorUniforms = [
      uniforms.uBC0,
      uniforms.uBC1,
      uniforms.uBC2,
      uniforms.uBC3,
      uniforms.uBC4,
    ];
    const backAnchorUniforms = [
      uniforms.uDA0,
      uniforms.uDA1,
      uniforms.uDA2,
      uniforms.uDA3,
      uniforms.uDA4,
    ];
    const backColorUniforms = [
      uniforms.uDC0,
      uniforms.uDC1,
      uniforms.uDC2,
      uniforms.uDC3,
      uniforms.uDC4,
    ];

    // Pre-resolved palettes — we lerp between them instead of switching
    // outright, so theme toggle is a continuous 200ms transition.
    const backDarkRgb = paletteToRgb(BACK_DARK.colors);
    const backLightRgb = paletteToRgb(BACK_LIGHT.colors);
    const backDarkCursor = hexToRgb(BACK_DARK.cursor);
    const backLightCursor = hexToRgb(BACK_LIGHT.cursor);

    // Brand side is identical in both themes.
    for (let i = 0; i < 5; i++) {
      const [r, g, b] = hexToRgb(BRAND.colors[i]);
      brandColorUniforms[i].value[0] = r;
      brandColorUniforms[i].value[1] = g;
      brandColorUniforms[i].value[2] = b;
    }
    const brandCursorRgb = hexToRgb(BRAND.cursor);
    uniforms.uBrandCursor.value[0] = brandCursorRgb[0];
    uniforms.uBrandCursor.value[1] = brandCursorRgb[1];
    uniforms.uBrandCursor.value[2] = brandCursorRgb[2];

    // 0 = light, 1 = dark. Animates toward `targetIsDark.current`.
    let themeMix = isDark ? 1 : 0;

    const applyBackPalette = () => {
      for (let i = 0; i < 5; i++) {
        const dark = backDarkRgb[i];
        const light = backLightRgb[i];
        const c = backColorUniforms[i].value;
        c[0] = light[0] + (dark[0] - light[0]) * themeMix;
        c[1] = light[1] + (dark[1] - light[1]) * themeMix;
        c[2] = light[2] + (dark[2] - light[2]) * themeMix;
      }
      const bc = uniforms.uBackCursor.value;
      bc[0] = backLightCursor[0] + (backDarkCursor[0] - backLightCursor[0]) * themeMix;
      bc[1] = backLightCursor[1] + (backDarkCursor[1] - backLightCursor[1]) * themeMix;
      bc[2] = backLightCursor[2] + (backDarkCursor[2] - backLightCursor[2]) * themeMix;
    };
    applyBackPalette();

    const resize = () => {
      renderer.setSize(container.clientWidth || 1, container.clientHeight || 1);
      uniforms.uResolution.value[0] = canvas.width;
      uniforms.uResolution.value[1] = canvas.height;
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    const target = { x: 0.5, y: 0.5 };
    const current = { x: 0.5, y: 0.5 };
    // Timestamp of the last real pointer move. Seeded in the past so the mesh
    // starts in "idle flow" mode immediately on load (no mouse needed).
    let lastMove = performance.now() - 4000;

    const onPointerMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      target.x = (event.clientX - rect.left) / rect.width;
      target.y = 1 - (event.clientY - rect.top) / rect.height;
      lastMove = performance.now();
    };
    // Listen even with reduced motion — we just skip the orbital animation and
    // anchor jitter. Mouse-driven mesh deformation stays.
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    let raf = 0;
    let running = true;
    const start = performance.now();
    let lastNow = start;

    const writeAnchors = (t: number) => {
      // Always-on orbits with per-anchor speed/phase variety so the palette is
      // perpetually, gently in motion (not a static gradient) — independent of
      // the pointer. Larger amplitude = clearly visible "living" flow.
      for (let i = 0; i < 5; i++) {
        const sp = 0.13 + i * 0.018; // slightly different speed per blob
        const phaseBrand = i * 1.31;
        const brandDx = reduceMotion ? 0 : Math.sin(t * sp + phaseBrand) * 0.05;
        const brandDy =
          reduceMotion ? 0 : Math.cos(t * (sp + 0.05) + phaseBrand * 1.4) * 0.05;
        writeVec2(
          brandAnchorUniforms[i].value,
          BRAND.anchors[i][0] + brandDx,
          BRAND.anchors[i][1] + brandDy,
        );

        const phaseBack = (i + 5) * 1.31;
        const backDx = reduceMotion ? 0 : Math.sin(t * sp + phaseBack) * 0.05;
        const backDy =
          reduceMotion ? 0 : Math.cos(t * (sp + 0.05) + phaseBack * 1.4) * 0.05;
        writeVec2(
          backAnchorUniforms[i].value,
          BACK_DARK.anchors[i][0] + backDx,
          BACK_DARK.anchors[i][1] + backDy,
        );
      }
    };

    const renderFrame = (t: number) => {
      uniforms.uTime.value = t;
      uniforms.uMouse.value[0] = current.x;
      uniforms.uMouse.value[1] = current.y;
      writeAnchors(t);
      renderer.render({ scene: mesh });
    };

    let revealed = false;
    const reveal = () => {
      if (revealed) return;
      revealed = true;
      canvas.style.opacity = '1';
    };

    const frame = () => {
      if (!running) return;
      const now = performance.now();
      const dt = Math.min((now - lastNow) / 1000, 0.1);
      lastNow = now;
      const t = (now - start) / 1000;

      // Idle autonomous flow: once the pointer has been still (or absent) for a
      // beat, ease the light toward a slow wandering orbit so the colors keep
      // moving on their own. Moving the mouse snaps idleness back to follow it.
      const idleFor = (now - lastMove) / 1000;
      const ramp = Math.min(Math.max((idleFor - 0.6) / 1.2, 0), 1);
      const idleness = ramp * ramp * (3 - ramp - ramp); // smoothstep
      const idleX = 0.5 + 0.32 * Math.sin(t * 0.1);
      const idleY = 0.5 + 0.26 * Math.sin(t * 0.13 + 1.7);
      const tx = target.x + (idleX - target.x) * idleness;
      const ty = target.y + (idleY - target.y) * idleness;

      // Gentle, languid follow (k=0.16) — the light drifts toward its target
      // instead of snapping, for a softer feel.
      const k = 0.16;
      current.x += (tx - current.x) * k;
      current.y += (ty - current.y) * k;

      // Theme palette lerp: ~200ms via exponential decay toward target.
      const wanted = targetIsDark.current ? 1 : 0;
      if (themeMix !== wanted) {
        const blend = 1 - Math.exp(-THEME_LERP_RATE * dt);
        themeMix += (wanted - themeMix) * blend;
        // Snap once we're imperceptibly close, to avoid GPU uploads on a
        // value that has effectively settled.
        if (Math.abs(themeMix - wanted) < 0.002) themeMix = wanted;
        applyBackPalette();
      }

      renderFrame(t);
      reveal();
      raf = requestAnimationFrame(frame);
    };

    if (reduceMotion) {
      renderFrame(12);
      reveal();
    } else {
      raf = requestAnimationFrame(frame);
    }

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!reduceMotion && !running) {
        running = true;
        lastNow = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    // If the GPU drops the context (HW accel toggled, driver reset, too many
    // contexts), stop and fade the canvas out so the animated CSS gradient
    // fallback shows through instead of a frozen/blank frame.
    const onContextLost = (event: Event) => {
      event.preventDefault();
      running = false;
      cancelAnimationFrame(raf);
      canvas.style.opacity = '0';
    };
    canvas.addEventListener('webglcontextlost', onContextLost as EventListener);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener(
        'webglcontextlost',
        onContextLost as EventListener,
      );
      const ext = gl.getExtension('WEBGL_lose_context');
      ext?.loseContext();
      if (canvas.parentNode === container) container.removeChild(canvas);
    };
    // Deliberately excluding `isDark` — palette lerp is driven by targetIsDark
    // ref, so theme switches don't tear down the GL context.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quality, split]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`pointer-events-none overflow-hidden ${className}`}
    />
  );
}
