// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  triggerDownload,
  exportDashboardXlsx,
  exportDashboardPdf,
  type DashboardReport,
} from '../../utils/dashboardExport';

// --- Mock the heavy, lazily-imported libraries -----------------------------
// Implementations are classes (not arrows) so `new` works on the mocks.

const excelMocks = vi.hoisted(() => {
  const addRow = vi.fn();
  const writeBuffer = vi.fn(async () => new ArrayBuffer(8));
  const addWorksheet = vi.fn(() => ({
    columns: [] as unknown[],
    getRow: vi.fn(() => ({ eachCell: vi.fn() })),
    addRow,
    eachRow: vi.fn(),
  }));
  class WorkbookImpl {
    creator = '';
    created = new Date(0);
    addWorksheet = addWorksheet;
    xlsx = { writeBuffer };
  }
  return { Workbook: vi.fn(WorkbookImpl), addWorksheet, addRow, writeBuffer };
});

vi.mock('exceljs', () => ({
  default: { Workbook: excelMocks.Workbook },
  Workbook: excelMocks.Workbook,
}));

const pdfMocks = vi.hoisted(() => {
  const save = vi.fn();
  const text = vi.fn();
  class JsPdfImpl {
    setFont = vi.fn();
    setFontSize = vi.fn();
    setTextColor = vi.fn();
    text = text;
    save = save;
    addPage = vi.fn();
    internal = { pageSize: { getHeight: () => 841.89 } };
    lastAutoTable = { finalY: 120 };
  }
  return { jsPDF: vi.fn(JsPdfImpl), save, text };
});

vi.mock('jspdf', () => ({ jsPDF: pdfMocks.jsPDF }));

const autoTableMock = vi.hoisted(() => vi.fn());
vi.mock('jspdf-autotable', () => ({ default: autoTableMock }));

// ---------------------------------------------------------------------------

const sampleReport: DashboardReport = {
  title: 'Relatório do Dashboard',
  generatedAtLabel: 'Gerado em 29/05/2026 14:30',
  tables: [
    {
      name: 'Indicadores',
      columns: ['Indicador', 'Valor'],
      rows: [
        ['Empréstimos ativos', 12],
        ['Atrasados', 3],
      ],
    },
    {
      name: 'Top Livros',
      columns: ['Livro', 'Autor', 'Empréstimos'],
      rows: [['Dom Casmurro', 'Machado de Assis', 9]],
    },
  ],
};

const mockUrl = 'blob:http://localhost/dashboard-export';

const stubAnchor = () => {
  const click = vi.fn();
  vi.spyOn(document, 'createElement').mockReturnValue({
    href: '',
    click,
    remove: vi.fn(),
    setAttribute: vi.fn(),
  } as unknown as HTMLElement);
  vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
  return click;
};

describe('dashboardExport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.URL.createObjectURL = vi.fn(() => mockUrl);
    globalThis.URL.revokeObjectURL = vi.fn();
  });

  it('triggerDownload cria link temporário e revoga a URL (deferida)', () => {
    vi.useFakeTimers();
    const click = vi.fn();
    const remove = vi.fn();
    const setAttribute = vi.fn();
    vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      click,
      remove,
      setAttribute,
    } as unknown as HTMLElement);
    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);

    triggerDownload(new Blob(['x']), 'dashboard.xlsx');

    expect(setAttribute).toHaveBeenCalledWith('download', 'dashboard.xlsx');
    expect(click).toHaveBeenCalled();
    expect(remove).toHaveBeenCalled();
    // Revocation is deferred off the click tick.
    expect(globalThis.URL.revokeObjectURL).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(globalThis.URL.revokeObjectURL).toHaveBeenCalledWith(mockUrl);
    vi.useRealTimers();
  });

  it('exportDashboardXlsx gera uma planilha por tabela e dispara o download', async () => {
    const click = stubAnchor();

    await exportDashboardXlsx(sampleReport, 'dashboard.xlsx');

    expect(excelMocks.Workbook).toHaveBeenCalledTimes(1);
    expect(excelMocks.addWorksheet).toHaveBeenCalledTimes(2);
    expect(excelMocks.writeBuffer).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
  });

  it('exportDashboardPdf monta o documento e salva com o nome correto', async () => {
    await exportDashboardPdf(sampleReport, 'dashboard.pdf');

    expect(pdfMocks.jsPDF).toHaveBeenCalledTimes(1);
    expect(autoTableMock).toHaveBeenCalledTimes(2);
    expect(pdfMocks.text).toHaveBeenCalledWith(
      'Relatório do Dashboard',
      expect.any(Number),
      expect.any(Number),
    );
    expect(pdfMocks.save).toHaveBeenCalledWith('dashboard.pdf');
  });
});
