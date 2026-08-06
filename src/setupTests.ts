import '@testing-library/jest-dom';
import { beforeAll, vi } from 'vitest';

import i18n, { DEFAULT_LOCALE } from './i18n';

// Node >= 22 define localStorage/sessionStorage como getters globais
// experimentais (undefined sem --localstorage-file), sombreando os do jsdom
// no ambiente do vitest. Polyfill em memória com a API completa de Storage.
class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }
  clear(): void {
    this.store.clear();
  }
  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  key(index: number): string | null {
    return [...this.store.keys()][index] ?? null;
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

if (typeof globalThis.localStorage?.clear !== 'function') {
  // Expõe a classe como `Storage` para que vi.spyOn(Storage.prototype, ...)
  // continue interceptando as chamadas dos testes.
  Object.defineProperty(globalThis, 'Storage', {
    value: MemoryStorage,
    writable: true,
    configurable: true,
  });
  for (const name of ['localStorage', 'sessionStorage'] as const) {
    Object.defineProperty(globalThis, name, {
      value: new MemoryStorage(),
      writable: true,
      configurable: true,
    });
  }
}

// Idioma fixo em pt-BR para toda a suíte. Sem isto o detector cai no
// `navigator.language` do jsdom (en-US) e as asserções de texto passariam a
// depender do ambiente em vez do bundle.
beforeAll(async () => {
  await i18n.changeLanguage(DEFAULT_LOCALE);
});

// Mock do window.matchMedia para o jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock do lottie-react para evitar erro de Canvas no JSDOM
vi.mock('lottie-react', () => ({
  __esModule: true,
  default: () => null,
}));

// jsdom não implementa getContext (WebGL/2D); ShaderBackground degrada
// graciosamente quando ausente. Stub silencia o warning ruidoso.
HTMLCanvasElement.prototype.getContext = vi.fn(
  () => null,
) as unknown as typeof HTMLCanvasElement.prototype.getContext;
