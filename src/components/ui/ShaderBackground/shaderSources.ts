/**
 * GLSL sources for the interactive shader wallpapers.
 *
 * Idea: a soft mesh gradient assembled from a base palette + 3 floating color
 * blobs whose center is biased toward the pointer. The pointer acts as a light
 * source (warm core + wide halo), and a subtle domain warp ripples around the
 * cursor — the background feels "fidgety" without being noisy.
 *
 * Written in GLSL ES 1.00 (no `#version`) so it runs under WebGL1.
 */

export type ShaderVariant = 1 | 2 | 3 | 4 | 5;

export const VERTEX = /* glsl */ `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const COMMON = /* glsl */ `
precision highp float;

uniform float uTime;
uniform vec2  uResolution;
uniform vec2  uMouse;      // normalized 0..1, y up (pointer)
uniform vec3  uColorA;     // gradient start (top-left)
uniform vec3  uColorB;     // gradient middle
uniform vec3  uColorC;     // gradient end (bottom-right) + accent
uniform vec3  uHighlight;  // pointer light tint (caller-controlled)
uniform float uIntensity;  // 0..1 light strength
uniform float uReact;      // 0..1 mouse reactivity (warp + blob follow)
uniform float uSpeed;
uniform vec4  uRipple;     // xy = click pos (0..1), z = age (s), w = active
uniform float uHover;      // 0..1 host hover/focus gate

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

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * vnoise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

// Diagonal palette base (matches the original 135deg bg-lumi-gradient).
vec3 baseGradient(vec2 uv) {
  float t = clamp((uv.x + (1.0 - uv.y)) * 0.5, 0.0, 1.0);
  vec3 g = mix(uColorA, uColorB, smoothstep(0.0, 0.62, t));
  g = mix(g, uColorC, smoothstep(0.55, 1.0, t));
  return g;
}

// Soft circular falloff used to build the mesh blobs.
float blob(vec2 p, vec2 c, float r) {
  float d = length(p - c);
  return exp(-d * d / (r * r));
}
`;

/** Each effect returns the mesh BEFORE the shared pointer light is added. */
const EFFECTS: Record<ShaderVariant, string> = {
  // 1 — Brand panel (login left): vivid mesh gradient, blobs orbit + follow mouse.
  1: /* glsl */ `
  vec3 effect(vec2 uv, vec2 p, vec2 mouse, float aspect) {
    vec3 col = baseGradient(uv);
    float t = uTime * uSpeed * 0.18;
    // Three floating blobs; centers drift on a smooth orbit and bias toward the
    // pointer so the gradient "leans" where the user looks.
    vec2 m = mouse;
    vec2 c1 = vec2(-0.45 + 0.18 * sin(t * 0.8),       0.20 + 0.14 * cos(t * 0.7));
    vec2 c2 = vec2( 0.40 + 0.22 * cos(t * 0.55 + 1.7), -0.10 + 0.16 * sin(t * 0.9));
    vec2 c3 = vec2(-0.05 + 0.30 * sin(t * 0.45 + 3.0),  0.35 + 0.10 * cos(t * 0.65));
    c1 = mix(c1, m, uReact * 0.45);
    c2 = mix(c2, m, uReact * 0.25);
    c3 = mix(c3, m, uReact * 0.55);
    float b1 = blob(p, c1, 0.65);
    float b2 = blob(p, c2, 0.55);
    float b3 = blob(p, c3, 0.45);
    col = mix(col, uColorA,     b1 * 0.55);
    col = mix(col, uColorC,     b2 * 0.55);
    col = mix(col, uHighlight,  b3 * 0.40);
    // Subtle drift to break banding.
    float drift = fbm(p * 1.7 + vec2(t * 0.3, -t * 0.2)) - 0.5;
    col += drift * 0.04;
    return col;
  }
  `,
  // 2 — Aurora ribbons (sidebar): gentle flowing bands biased toward mouse Y.
  2: /* glsl */ `
  vec3 effect(vec2 uv, vec2 p, vec2 mouse, float aspect) {
    vec3 col = baseGradient(uv);
    float t = uTime * uSpeed * 0.12;
    // Bands wave along the panel; mouse pulls the wave up/down.
    float wave = fbm(vec2(p.y * 1.8 + t, p.x * 0.9 + mouse.y * uReact * 1.2));
    col = mix(col, uColorC, smoothstep(0.45, 0.95, wave) * 0.40);
    // A wandering blob biased toward mouse — sidebar "breathes" with hover.
    vec2 c = vec2(0.0, -0.15) + mouse * uReact * 0.6;
    float b = blob(p, c, 0.7);
    col = mix(col, uHighlight, b * 0.22);
    return col;
  }
  `,
  // 3 — Submit button: purple mesh, soft elongated hover light.
  3: /* glsl */ `
  vec3 effect(vec2 uv, vec2 p, vec2 mouse, float aspect) {
    vec3 col = baseGradient(uv);
    float t = uTime * uSpeed * 0.16;
    vec2 c1 = vec2(-0.40 + sin(t) * 0.18, 0.12 + cos(t * 0.9) * 0.10);
    vec2 c2 = vec2( 0.42 + cos(t * 0.7) * 0.16, -0.14 + sin(t * 1.1) * 0.12);
    vec2 c3 = vec2( 0.02 + sin(t * 0.5 + 2.4) * 0.18, 0.24 + cos(t * 0.8) * 0.08);
    c1 = mix(c1, mouse, uReact * 0.18);
    c2 = mix(c2, mouse, uReact * 0.14);
    c3 = mix(c3, mouse, uReact * 0.22);
    float b1 = blob(p, c1, 0.70);
    float b2 = blob(p, c2, 0.62);
    float b3 = blob(p, c3, 0.55);
    col = mix(col, uColorA, b1 * 0.18);
    col = mix(col, uColorB, b2 * 0.16);
    col = mix(col, uColorC, b3 * 0.18);
    return col;
  }
  `,
  // 4 — Dot grid shimmer with mouse-warped offsets.
  4: /* glsl */ `
  vec3 effect(vec2 uv, vec2 p, vec2 mouse, float aspect) {
    vec3 col = baseGradient(uv);
    vec2 warp = (mouse - p) * uReact * 0.05;
    vec2 f = fract((p + warp) * 22.0) - 0.5;
    float dots = smoothstep(0.18, 0.06, length(f));
    col += uHighlight * dots * 0.08;
    return col;
  }
  `,
  // 5 — Liquid mesh: domain-warped gradient pulled toward the cursor.
  5: /* glsl */ `
  vec3 effect(vec2 uv, vec2 p, vec2 mouse, float aspect) {
    float t = uTime * uSpeed * 0.10;
    // Domain warp; the cursor adds a directional pull so the warp leans where
    // the user is hovering.
    vec2 pull = (mouse - p) * uReact * 0.18;
    vec2 warp = vec2(
      fbm(p * 1.4 + vec2(0.0, t)  + pull),
      fbm(p * 1.4 + vec2(4.0, -t) - pull)
    );
    vec3 col = baseGradient(uv + (warp - 0.5) * 0.18);
    // A wide soft blob anchored at the cursor adds a tint without harsh edges.
    float b = blob(p, mouse, 0.85);
    col = mix(col, uHighlight, b * 0.18 * uReact);
    return col;
  }
  `,
};

const MAIN = /* glsl */ `
void main() {
  vec2 uv = vUv;
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 p = uv - 0.5;
  p.x *= aspect;
  vec2 mp = uMouse - 0.5;
  mp.x *= aspect;

  vec3 col = effect(uv, p, mp, aspect);

  // Pointer-controlled light: a soft wide halo with a brighter hot core that
  // tracks the cursor — "move the light around the background".
  vec2 d = p - mp;
  float d2 = dot(d, d);
  float halo = exp(-d2 * 2.6);
  float core = exp(-d2 * 11.0);
  float strength = 0.22 + 0.95 * uIntensity;
  col += uHighlight * (halo * 0.55 + core * 0.85) * strength * uHover;

  // Click ripple: an outward ring emanating from the last click position.
  if (uRipple.w > 0.5) {
    vec2 rp = uRipple.xy - 0.5;
    rp.x *= aspect;
    float dr = length(p - rp);
    float age = uRipple.z;
    float ring = sin(dr * 36.0 - age * 7.5) * exp(-dr * 4.2) * exp(-age * 2.0);
    col += uHighlight * ring * 0.38 * uIntensity;
  }

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

const BUTTON_MAIN = /* glsl */ `
void main() {
  vec2 uv = vUv;
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 p = uv - 0.5;
  p.x *= aspect;
  vec2 mp = uMouse - 0.5;
  mp.x *= aspect;

  vec3 col = effect(uv, p, mp, aspect);

  // Wide elliptical light. It follows the pointer but avoids the circular
  // "ball" look on a short, horizontal button.
  vec2 m = clamp(uMouse, vec2(-0.2), vec2(1.2));
  vec2 q = vec2((uv.x - m.x) * 1.72, (uv.y - m.y) * 3.18);
  float softAura = exp(-dot(q, q) * 0.82);
  vec2 wide = vec2(q.x * 0.74, q.y * 0.82);
  float wideBloom = exp(-dot(wide, wide) * 0.64);
  float hoverLight = uHover * uIntensity;
  float lightMix = clamp((softAura * 0.25 + wideBloom * 0.13) * hoverLight, 0.0, 0.36);
  col = mix(col, uHighlight, lightMix);

  float upperGlass = smoothstep(0.54, 1.0, uv.y) * 0.10;
  col += uHighlight * upperGlass * (0.26 + 0.18 * hoverLight);

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

export function buildFragment(variant: ShaderVariant): string {
  return `${COMMON}\n${EFFECTS[variant]}\n${variant === 3 ? BUTTON_MAIN : MAIN}`;
}
