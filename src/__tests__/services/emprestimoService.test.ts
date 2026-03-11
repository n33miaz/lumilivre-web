import { describe, it, expect, vi } from 'vitest';
import api from '../../services/api';
import {
  cadastrarEmprestimo,
  concluirEmprestimo,
} from '../../services/emprestimoService';

// Mock
vi.mock('../../services/api', () => ({
  default: {
    post: vi.fn(),
    put: vi.fn(),
    get: vi.fn(),
  },
}));

describe('Serviço: Empréstimos', () => {
  it('deve enviar o payload correto ao cadastrar um empréstimo', async () => {
    // Arrange
    const mockPayload = {
      aluno_matricula: '12345',
      exemplar_tombo: '001',
      data_emprestimo: '11/03/2026 15:00:00',
      data_devolucao: '18/03/2026 15:00:00',
    };

    vi.mocked(api.post).mockResolvedValueOnce({
      data: { id: 1, ...mockPayload },
    });

    // Act
    const result = await cadastrarEmprestimo(mockPayload);

    // Assert
    expect(api.post).toHaveBeenCalledWith(
      '/emprestimos/cadastrar',
      mockPayload,
    );
    expect(result).toHaveProperty('id', 1);
  });

  it('deve chamar a rota correta ao concluir um empréstimo', async () => {
    // Arrange
    vi.mocked(api.put).mockResolvedValueOnce({ data: { sucesso: true } });

    // Act
    await concluirEmprestimo(99);

    // Assert
    expect(api.put).toHaveBeenCalledWith('/emprestimos/concluir/99');
  });
});
