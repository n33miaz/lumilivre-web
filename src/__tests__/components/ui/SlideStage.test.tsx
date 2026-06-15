import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeAll } from 'vitest';

import { SlideStage } from '../../../components/ui/SlideStage';

beforeAll(() => {
  if (!window.matchMedia) {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        media: '',
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  }
});

describe('SlideStage', () => {
  it('renderiza todos os filhos do array views', () => {
    render(
      <SlideStage
        currentIndex={0}
        views={[
          <span key="a">View A</span>,
          <span key="b">View B</span>,
          <span key="c">View C</span>,
        ]}
      />,
    );

    expect(screen.getByText('View A')).toBeInTheDocument();
    expect(screen.getByText('View B')).toBeInTheDocument();
    expect(screen.getByText('View C')).toBeInTheDocument();
  });

  it('aplica translateX correspondente ao currentIndex', () => {
    const { container, rerender } = render(
      <SlideStage
        currentIndex={0}
        views={[<span key="a">A</span>, <span key="b">B</span>]}
      />,
    );

    const track = container.querySelector('[data-slide-track]') as HTMLElement;
    expect(track.style.transform).toBe('translateX(-0%)');

    rerender(
      <SlideStage
        currentIndex={1}
        views={[<span key="a">A</span>, <span key="b">B</span>]}
      />,
    );
    expect(track.style.transform).toBe('translateX(-100%)');
  });

  it('marca aria-hidden=true em views inativas', () => {
    render(
      <SlideStage
        currentIndex={1}
        views={[
          <span key="a" data-testid="view-a">
            A
          </span>,
          <span key="b" data-testid="view-b">
            B
          </span>,
        ]}
      />,
    );

    const wrapperA = screen.getByTestId('view-a').parentElement as HTMLElement;
    const wrapperB = screen.getByTestId('view-b').parentElement as HTMLElement;

    expect(wrapperA).toHaveAttribute('aria-hidden', 'true');
    expect(wrapperB).toHaveAttribute('aria-hidden', 'false');
  });

  it('aplica viewDataAttribute em cada wrapper quando informado', () => {
    const { container } = render(
      <SlideStage
        currentIndex={0}
        viewDataAttribute="dashboard-block"
        viewDataValues={['analytics', 'tables']}
        views={[<span key="a">A</span>, <span key="b">B</span>]}
      />,
    );

    expect(
      container.querySelector('[data-dashboard-block="analytics"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-dashboard-block="tables"]'),
    ).toBeInTheDocument();
  });

  it('respeita instant=true desligando a transição no primeiro render', () => {
    const { container } = render(
      <SlideStage
        currentIndex={1}
        instant
        views={[<span key="a">A</span>, <span key="b">B</span>]}
      />,
    );

    const track = container.querySelector('[data-slide-track]') as HTMLElement;
    expect(track.style.transition).toBe('none');
  });

  it('clampa currentIndex fora dos limites', () => {
    const { container } = render(
      <SlideStage
        currentIndex={99}
        views={[<span key="a">A</span>, <span key="b">B</span>]}
      />,
    );

    const track = container.querySelector('[data-slide-track]') as HTMLElement;
    expect(track.style.transform).toBe('translateX(-100%)');
  });
});
