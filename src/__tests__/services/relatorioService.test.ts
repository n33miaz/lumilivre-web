import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../../services/api';
import { baixarRelatorioPDF } from '../../services/reportService';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

const mockUrl = 'blob:http://localhost/fake-url';
globalThis.URL.createObjectURL = vi.fn(() => mockUrl);
globalThis.URL.revokeObjectURL = vi.fn();

const mockDownloadDom = () => {
  vi.spyOn(document.body, 'appendChild').mockImplementation(() =>
    document.createElement('a'),
  );
  vi.spyOn(document.body, 'removeChild').mockImplementation(() =>
    document.createElement('a'),
  );
  vi.spyOn(document, 'createElement').mockReturnValue({
    href: '',
    click: vi.fn(),
    setAttribute: vi.fn(),
    remove: vi.fn(),
  } as unknown as HTMLElement);
};

describe('reportService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDownloadDom();
  });

  it('downloads a v2 loans report with translated date params', async () => {
    mockedApi.get.mockResolvedValue({
      data: new Blob(['pdf-data'], { type: 'application/pdf' }),
      headers: {
        'content-disposition': 'attachment; filename="loans-report.pdf"',
      },
    });

    await baixarRelatorioPDF('emprestimos', {
      dataInicio: '2026-01-01',
      dataFim: '2026-03-31',
    });

    expect(mockedApi.get).toHaveBeenCalledWith(
      '/api/reports/loans',
      expect.objectContaining({
        responseType: 'blob',
      }),
    );
    const callParams = mockedApi.get.mock.calls[0][1]?.params as URLSearchParams;
    expect(callParams.get('startDate')).toBe('2026-01-01');
    expect(callParams.get('endDate')).toBe('2026-03-31');
  });

  it('uses the default file name when content-disposition is missing', async () => {
    const setAttribute = vi.fn();
    vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      click: vi.fn(),
      setAttribute,
      remove: vi.fn(),
    } as unknown as HTMLElement);
    mockedApi.get.mockResolvedValue({ data: new Blob(), headers: {} });

    await baixarRelatorioPDF('leitores', {});

    expect(setAttribute).toHaveBeenCalledWith(
      'download',
      'relatorio-leitores.pdf',
    );
  });

  it('ignores empty params and maps book filters to v2 names', async () => {
    mockedApi.get.mockResolvedValue({ data: new Blob(), headers: {} });

    await baixarRelatorioPDF('livros', {
      dataInicio: '2026-01-01',
      dataFim: '',
      genero: undefined,
      editora: 'Editora A',
      cdd: '000',
    });

    const callParams = mockedApi.get.mock.calls[0][1]?.params as URLSearchParams;
    expect(callParams.get('startDate')).toBe('2026-01-01');
    expect(callParams.get('publisher')).toBe('Editora A');
    expect(callParams.get('deweyCode')).toBe('000');
    expect(callParams.has('endDate')).toBe(false);
    expect(callParams.has('genre')).toBe(false);
  });

  it('maps PT statuses to v2 enum codes', async () => {
    mockedApi.get.mockResolvedValue({ data: new Blob(), headers: {} });

    await baixarRelatorioPDF('emprestimos', { statusEmprestimo: 'ATIVO' });

    const callParams = mockedApi.get.mock.calls[0][1]?.params as URLSearchParams;
    expect(callParams.get('status')).toBe('ACTIVE');
    expect(callParams.has('statusEmprestimo')).toBe(false);
  });

  it('propagates download errors', async () => {
    mockedApi.get.mockRejectedValue(new Error('Falha no download'));

    await expect(baixarRelatorioPDF('emprestimos', {})).rejects.toThrow(
      'Falha no download',
    );
  });
});
