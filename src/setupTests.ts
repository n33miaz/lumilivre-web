import '@testing-library/jest-dom';
import { vi } from 'vitest';

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
