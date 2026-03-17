import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../../services/api';
import { baixarRelatorioPDF } from '../../services/relatorioService';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

// Mock para URL.createObjectURL e URL.revokeObjectURL
const mockUrl = 'blob:http://localhost/fake-url';
global.URL.createObjectURL = vi.fn(() => mockUrl);
global.URL.revokeObjectURL = vi.fn();

describe('relatorioService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock do DOM para link de download
    vi.spyOn(document.body, 'appendChild').mockImplementation(() =>
      document.createElement('a'),
    );
    vi.spyOn(document.body, 'removeChild').mockImplementation(() =>
      document.createElement('a'),
    );
  });

  describe('baixarRelatorioPDF', () => {
    it('deve baixar relatório com tipo e filtros corretos', async () => {
      const mockBlob = new Blob(['pdf-data'], { type: 'application/pdf' });
      mockedApi.get.mockResolvedValue({
        data: mockBlob,
        headers: {
          'content-disposition':
            'attachment; filename="relatorio-emprestimos.pdf"',
        },
      });

      const mockClick = vi.fn();
      const mockSetAttribute = vi.fn();
      const mockRemove = vi.fn();
      vi.spyOn(document, 'createElement').mockReturnValue({
        href: '',
        click: mockClick,
        setAttribute: mockSetAttribute,
        remove: mockRemove,
      } as unknown as HTMLElement);

      await baixarRelatorioPDF('emprestimos', {
        dataInicio: '2026-01-01',
        dataFim: '2026-03-31',
      });

      expect(mockedApi.get).toHaveBeenCalledWith(
        '/relatorios/emprestimos',
        expect.objectContaining({
          responseType: 'blob',
        }),
      );
      expect(mockClick).toHaveBeenCalled();
    });

    it('deve usar nome padrão quando content-disposition não está presente', async () => {
      const mockBlob = new Blob(['pdf-data']);
      mockedApi.get.mockResolvedValue({
        data: mockBlob,
        headers: {},
      });

      const mockSetAttribute = vi.fn();
      vi.spyOn(document, 'createElement').mockReturnValue({
        href: '',
        click: vi.fn(),
        setAttribute: mockSetAttribute,
        remove: vi.fn(),
      } as unknown as HTMLElement);

      await baixarRelatorioPDF('alunos', {});

      expect(mockSetAttribute).toHaveBeenCalledWith(
        'download',
        'relatorio-alunos.pdf',
      );
    });

    it('deve ignorar filtros vazios, null ou undefined', async () => {
      mockedApi.get.mockResolvedValue({
        data: new Blob(),
        headers: {},
      });

      vi.spyOn(document, 'createElement').mockReturnValue({
        href: '',
        click: vi.fn(),
        setAttribute: vi.fn(),
        remove: vi.fn(),
      } as unknown as HTMLElement);

      await baixarRelatorioPDF('livros', {
        dataInicio: '2026-01-01',
        dataFim: '',
        genero: undefined,
        autor: undefined,
      });

      const callParams = mockedApi.get.mock.calls[0][1]
        ?.params as URLSearchParams;
      expect(callParams.get('dataInicio')).toBe('2026-01-01');
      expect(callParams.has('dataFim')).toBe(false);
      expect(callParams.has('genero')).toBe(false);
    });

    it('deve mapear statusLivro e statusEmprestimo para "status"', async () => {
      mockedApi.get.mockResolvedValue({
        data: new Blob(),
        headers: {},
      });

      vi.spyOn(document, 'createElement').mockReturnValue({
        href: '',
        click: vi.fn(),
        setAttribute: vi.fn(),
        remove: vi.fn(),
      } as unknown as HTMLElement);

      await baixarRelatorioPDF('emprestimos', { statusEmprestimo: 'ATIVO' });

      const callParams = mockedApi.get.mock.calls[0][1]
        ?.params as URLSearchParams;
      expect(callParams.get('status')).toBe('ATIVO');
      expect(callParams.has('statusEmprestimo')).toBe(false);
    });

    it('deve propagar erro quando download falha', async () => {
      mockedApi.get.mockRejectedValue(new Error('Falha no download'));

      await expect(baixarRelatorioPDF('emprestimos', {})).rejects.toThrow(
        'Falha no download',
      );
    });

    it('deve propagar CanceledError quando abort é acionado', async () => {
      const cancelError = new Error('Aborted');
      cancelError.name = 'CanceledError';
      mockedApi.get.mockRejectedValue(cancelError);

      await expect(baixarRelatorioPDF('emprestimos', {})).rejects.toThrow();
    });
  });
});
