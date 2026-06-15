import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { StatCard } from '../../../components/ui/StatCard';

function FakeIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg data-testid="fake-icon" {...props} />;
}

const renderInRouter = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

describe('StatCard — sparkline e badge', () => {
  it('renderiza sparkline SVG quando sparkline tem 2+ valores', () => {
    const { container } = renderInRouter(
      <StatCard
        Icon={FakeIcon}
        title="Livros"
        value={120}
        to="/books"
        sparkline={[3, 5, 4, 8, 6, 9]}
      />,
    );

    const polyline = container.querySelector('polyline');
    expect(polyline).toBeInTheDocument();
    expect(polyline?.getAttribute('points')?.split(' ').length).toBe(6);
  });

  it('não renderiza sparkline quando há menos de 2 pontos', () => {
    const { container } = renderInRouter(
      <StatCard
        Icon={FakeIcon}
        title="Livros"
        value={120}
        to="/books"
        sparkline={[3]}
      />,
    );

    expect(container.querySelector('polyline')).toBeNull();
  });

  it('exibe badge custom quando fornecido', () => {
    renderInRouter(
      <StatCard
        Icon={FakeIcon}
        title="Loans"
        value={42}
        to="/loans"
        badge={<span data-testid="custom-badge">+12%</span>}
      />,
    );

    expect(screen.getByTestId('custom-badge')).toBeInTheDocument();
  });

  it('aplica tone=danger no eyebrow e valor', () => {
    renderInRouter(
      <StatCard
        Icon={FakeIcon}
        title="Atrasados"
        value={4}
        to="/loans?filtro=atrasados"
        tone="danger"
      />,
    );

    expect(screen.getByText('Atrasados')).toHaveClass('text-red-500');
  });

  it('mostra ellipsis em loading e "-" em error', () => {
    const { rerender } = renderInRouter(
      <StatCard Icon={FakeIcon} title="X" value={0} to="/x" isLoading />,
    );
    expect(screen.getByText('…')).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <StatCard Icon={FakeIcon} title="X" value={0} to="/x" hasError />
      </MemoryRouter>,
    );
    expect(screen.getByText('-')).toBeInTheDocument();
  });
});
