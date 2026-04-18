import { describe, it, expect, vi, beforeEach } from 'vitest';

import { downloadCsv, printDashboardPdf, toCsv } from '../../utils/dashboardExport';

const mockUrl = 'blob:http://localhost/dashboard-csv';

describe('dashboardExport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.URL.createObjectURL = vi.fn(() => mockUrl);
    globalThis.URL.revokeObjectURL = vi.fn();
  });

  it('toCsv deve serializar linhas e escapar valores especiais', () => {
    const csv = toCsv([
      { indicador: 'Livro, especial', valor: 3 },
      { indicador: 'Nome "cotado"', valor: 'ok' },
    ]);

    expect(csv).toBe(
      'indicador,valor\n"Livro, especial",3\n"Nome ""cotado""",ok',
    );
  });

  it('toCsv deve retornar string vazia para lista vazia', () => {
    expect(toCsv([])).toBe('');
  });

  it('downloadCsv deve criar link temporario e iniciar download', () => {
    const click = vi.fn();
    const remove = vi.fn();
    const setAttribute = vi.fn();
    vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      click,
      remove,
      setAttribute,
    } as unknown as HTMLElement);
    vi.spyOn(document.body, 'appendChild').mockImplementation(
      (node) => node,
    );

    downloadCsv('dashboard.csv', [{ indicador: 'Ativos', valor: 1 }]);

    expect(setAttribute).toHaveBeenCalledWith('download', 'dashboard.csv');
    expect(click).toHaveBeenCalled();
    expect(remove).toHaveBeenCalled();
    expect(globalThis.URL.revokeObjectURL).toHaveBeenCalledWith(mockUrl);
  });

  it('printDashboardPdf deve acionar print do navegador', () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => undefined);

    printDashboardPdf();

    expect(print).toHaveBeenCalled();
  });
});
