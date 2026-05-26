import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DashboardViewToggle } from '../../../components/ui/DashboardViewToggle';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const dict: Record<string, string> = {
        'view_toggle.analytics': 'Análise gerencial',
        'view_toggle.tables': 'Solicitações e atrasos',
        'view_toggle.news_indicator': 'novidade',
        'view_toggle.aria_label': 'Alternar visualização',
      };
      return dict[key] ?? key;
    },
  }),
}));

describe('DashboardViewToggle', () => {
  const renderToggle = (overrides: Partial<Parameters<typeof DashboardViewToggle>[0]> = {}) => {
    const props = {
      value: 'analytics' as const,
      onChange: vi.fn(),
      analyticsHasNews: false,
      tablesHasNews: false,
      ...overrides,
    };
    render(<DashboardViewToggle {...props} />);
    return props;
  };

  it('marca apenas o botão da view ativa com aria-pressed=true', () => {
    renderToggle({ value: 'analytics' });

    const analytics = screen.getByRole('button', { name: /análise gerencial/i });
    const tables = screen.getByRole('button', { name: /solicitações e atrasos/i });

    expect(analytics).toHaveAttribute('aria-pressed', 'true');
    expect(tables).toHaveAttribute('aria-pressed', 'false');
  });

  it('clique dispara onChange com a view alvo', () => {
    const onChange = vi.fn();
    renderToggle({ value: 'analytics', onChange });

    fireEvent.click(screen.getByRole('button', { name: /solicitações e atrasos/i }));

    expect(onChange).toHaveBeenCalledWith('tables');
  });

  it('inclui sufixo "novidade" no aria-label quando hasNews', () => {
    renderToggle({
      value: 'analytics',
      tablesHasNews: true,
    });

    const tables = screen.getByRole('button', { name: /solicitações e atrasos — novidade/i });
    expect(tables).toBeInTheDocument();
  });

  it('não exibe dot quando hasNews=false', () => {
    const { container } = render(
      <DashboardViewToggle
        value="analytics"
        onChange={vi.fn()}
        analyticsHasNews={false}
        tablesHasNews={false}
      />,
    );

    expect(container.querySelectorAll('.animate-ping')).toHaveLength(0);
  });

  it('exibe dot quando hasNews=true', () => {
    const { container } = render(
      <DashboardViewToggle
        value="analytics"
        onChange={vi.fn()}
        analyticsHasNews={false}
        tablesHasNews={true}
      />,
    );

    expect(container.querySelectorAll('.animate-ping')).toHaveLength(1);
  });

  it('aplica role=group com aria-label localizado', () => {
    renderToggle();
    const group = screen.getByRole('group', { name: /alternar visualização/i });
    expect(group).toBeInTheDocument();
  });
});
