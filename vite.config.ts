/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

const pkg = JSON.parse(
  readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf-8'),
) as { version: string };

export default defineConfig({
  plugins: [react(), svgr()],
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
