/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { imagetools } from 'vite-imagetools';
import { compression, defineAlgorithm } from 'vite-plugin-compression2';

const pkg = JSON.parse(
  readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf-8'),
) as { version: string };

export default defineConfig({
  plugins: [
    react(),
    svgr(),
    // Qualquer imagem importada com `?picture` sai em WebP + PNG de fallback,
    // redimensionada para o dobro da caixa em que aparece (~700px na vitrine).
    // É por convenção de propósito: T14 regera todos os prints e nenhum nome de
    // arquivo aparece aqui. Sem query, o import continua sendo asset comum do
    // Vite — o include padrão do plugin só pega URLs com parâmetro.
    imagetools({
      defaultDirectives: (url) =>
        url.searchParams.has('picture')
          ? new URLSearchParams({
              format: 'webp;png',
              w: '1440',
              quality: '80',
              as: 'picture',
            })
          : new URLSearchParams(),
    }),
    // Pré-compressão dos assets de texto: o nginx serve o .gz pronto
    // (`gzip_static on`) em vez de comprimir a cada request, e no nível 9 em vez
    // do 1 do runtime. Imagem e fonte ficam de fora — já são comprimidas, e
    // gzipar de novo só engorda o dist.
    compression({
      include: [/\.(js|mjs|css|html|json|svg|txt|xml|webmanifest)$/i],
      threshold: 1024,
      skipIfLargerOrEqual: true,
      algorithms: [defineAlgorithm('gzip', { level: 9 })],
    }),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  // Pre-bundle the WebGL lib so the first /login visit doesn't pay an on-demand
  // dep-optimize + reload stall (cold load dropped from ~3.5s to sub-second).
  optimizeDeps: {
    include: ['ogl'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    css: true,
    include: ['src/__tests__/**/*.test.{ts,tsx}'],
    env: {
      NODE_ENV: 'test',
    },
  },
});
