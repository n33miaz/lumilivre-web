/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

/** App version injected at build time from package.json (see vite.config.ts). */
declare const __APP_VERSION__: string;

interface ImportMetaEnv {
  /** Origem da API — o Vite embute em build (ver README § Configuração). */
  readonly VITE_API_BASE_URL: string;
  /**
   * Endereço do APK do app do leitor (asset de GitHub Release do lumilivre-app).
   * Opcional: sem ela a tela /download avisa e oferece o link das releases.
   */
  readonly VITE_APK_URL?: string;
}
