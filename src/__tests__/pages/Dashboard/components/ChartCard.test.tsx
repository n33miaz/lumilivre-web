import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChartCard } from '../../../../pages/Dashboard/components/ChartCard';

describe('ChartCard', () => {
  it('renderiza o title fornecido', () => {
    render(
      <ChartCard title="Status dos empréstimos">
        <div data-testid="chart">chart</div>
      </ChartCard>,
    );

    expect(screen.getByText('Status dos empréstimos')).toBeInTheDocument();
    expect(screen.getByTestId('chart')).toBeInTheDocument();
  });

  it('renderiza eyebrow quando fornecido', () => {
    render(
      <ChartCard eyebrow="Distribuição geral" title="Status">
        <div data-testid="chart">chart</div>
      </ChartCard>,
    );

    expect(screen.getByText('Distribuição geral')).toBeInTheDocument();
  });

  it('renderiza badge quando fornecido', () => {
    render(
      <ChartCard
        title="X"
        badge={<span data-testid="badge">+18%</span>}
      >
        <span>chart</span>
      </ChartCard>,
    );

    expect(screen.getByTestId('badge')).toBeInTheDocument();
  });

  it('mostra skeleton quando isLoading=true', () => {
    render(
      <ChartCard title="X" isLoading>
        <span data-testid="chart">chart</span>
      </ChartCard>,
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByTestId('chart')).not.toBeInTheDocument();
  });

  it('mostra empty state com mensagem quando isEmpty=true', () => {
    render(
      <ChartCard title="X" isEmpty emptyMessage="Sem dados">
        <span data-testid="chart">chart</span>
      </ChartCard>,
    );

    expect(screen.getByText('Sem dados')).toBeInTheDocument();
    expect(screen.queryByTestId('chart')).not.toBeInTheDocument();
  });

  it('renderiza children normalmente quando não loading nem empty', () => {
    render(
      <ChartCard title="X">
        <span data-testid="chart">chart content</span>
      </ChartCard>,
    );

    expect(screen.getByTestId('chart')).toHaveTextContent('chart content');
  });
});
