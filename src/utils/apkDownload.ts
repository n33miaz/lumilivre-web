/**
 * O APK do app do leitor não é versionado nem servido por este repositório —
 * eram 56 MB dentro do git, inflando todo clone e todo build. O binário mora
 * numa GitHub Release do lumilivre-app e o endereço chega por `VITE_APK_URL`
 * (resolvida em build, ver README § App Android).
 */

/** Página de releases: caminho manual quando o build não trouxe a variável. */
export const APP_RELEASES_URL =
  'https://github.com/n33miaz/lumilivre-app/releases';

/**
 * Endereço do APK, ou `null` quando não configurado.
 *
 * O esquema é validado porque a variável é digitada à mão no deploy: um valor
 * torto (`javascript:` e afins) viraria um link ativo no meio da página.
 */
export function resolveApkUrl(): string | null {
  const raw = import.meta.env.VITE_APK_URL?.trim();
  if (!raw) return null;
  try {
    const { protocol } = new URL(raw);
    return protocol === 'https:' || protocol === 'http:' ? raw : null;
  } catch {
    return null;
  }
}

/**
 * Props de âncora para "baixar o app": aponta para o APK quando há endereço e
 * cai nas releases quando não há, sem nunca deixar um link quebrado na tela.
 */
export function apkLinkProps(): {
  href: string;
  target?: '_blank';
  rel?: string;
} {
  const apkUrl = resolveApkUrl();
  return apkUrl
    ? { href: apkUrl }
    : { href: APP_RELEASES_URL, target: '_blank', rel: 'noopener noreferrer' };
}
