import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDynamicPageSize } from '../../hooks/useDynamicPageSize';
import { type RefObject } from 'react';

function createMockContainerRef(height: number): RefObject<HTMLElement> {
  const element = { clientHeight: height } as HTMLElement;
  return { current: element };
}

describe('useDynamicPageSize', () => {
  let mockObserve: ReturnType<typeof vi.fn>;
  let mockDisconnect: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockObserve = vi.fn();
    mockDisconnect = vi.fn();

    // ResizeObserver deve ser mockado como classe (constructor function)
    globalThis.ResizeObserver = vi.fn(function (this: unknown) {
      (this as Record<string, unknown>).observe = mockObserve;
      (this as Record<string, unknown>).disconnect = mockDisconnect;
      (this as Record<string, unknown>).unobserve = vi.fn();
    }) as unknown as typeof ResizeObserver;
  });

  it('deve calcular o número de itens por página com base na altura do container', () => {
    const containerRef = createMockContainerRef(600);
    const { result } = renderHook(() => useDynamicPageSize(containerRef));
    // (600 - 48 - 56) / 53 = ~9.35 → 9
    expect(result.current).toBe(9);
  });

  it('deve respeitar o minRows quando a altura é muito pequena', () => {
    const containerRef = createMockContainerRef(200);
    const { result } = renderHook(() => useDynamicPageSize(containerRef));
    expect(result.current).toBe(5);
  });

  it('deve aceitar opções personalizadas', () => {
    const containerRef = createMockContainerRef(800);
    const { result } = renderHook(() =>
      useDynamicPageSize(containerRef, {
        rowHeight: 40,
        headerHeight: 60,
        footerHeight: 50,
        minRows: 3,
      }),
    );
    // (800 - 60 - 50) / 40 = 17.25 → 17
    expect(result.current).toBe(17);
  });

  it('deve retornar 0 quando o container não existe', () => {
    const containerRef: RefObject<HTMLElement | null> = { current: null };
    const { result } = renderHook(() => useDynamicPageSize(containerRef));
    expect(result.current).toBe(0);
  });

  it('deve registrar um ResizeObserver no container', () => {
    const containerRef = createMockContainerRef(600);
    renderHook(() => useDynamicPageSize(containerRef));
    expect(mockObserve).toHaveBeenCalledWith(containerRef.current);
  });

  it('deve desconectar o ResizeObserver ao desmontar', () => {
    const containerRef = createMockContainerRef(600);
    const { unmount } = renderHook(() => useDynamicPageSize(containerRef));
    unmount();
    expect(mockDisconnect).toHaveBeenCalled();
  });
});
