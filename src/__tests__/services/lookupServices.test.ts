import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../../services/api';

import {
  buscarCursos,
  cadastrarCurso,
  buscarEstatisticasCursos,
  buscarEstatisticasGrafico,
} from '../../services/cursoService';
import { buscarTurnos, cadastrarTurno } from '../../services/turnoService';
import { buscarModulos, cadastrarModulo } from '../../services/moduloService';
import { getContagemAutores } from '../../services/autorService';
import { buscarGeneros } from '../../services/generoService';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

describe('Serviços de Lookup (Curso, Turno, Módulo, Autor, Gênero)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Curso ---

  describe('cursoService', () => {
    it('buscarCursos: deve retornar lista de cursos', async () => {
      const mockData = { content: [{ id: 1, nome: 'Informática' }] };
      mockedApi.get.mockResolvedValue({ data: mockData });

      const result = await buscarCursos();

      expect(mockedApi.get).toHaveBeenCalledWith('/cursos/buscar');
      expect(result.content[0].nome).toBe('Informática');
    });

    it('buscarCursos: deve propagar erro', async () => {
      mockedApi.get.mockRejectedValue(new Error('Erro'));

      await expect(buscarCursos()).rejects.toThrow('Erro');
    });

    it('cadastrarCurso: deve cadastrar curso com payload correto', async () => {
      mockedApi.post.mockResolvedValue({ data: { id: 2, nome: 'Enfermagem' } });

      const result = await cadastrarCurso({
        nome: 'Enfermagem',
        turno: 'Manhã',
        modulo: '1',
      });

      expect(mockedApi.post).toHaveBeenCalledWith('/cursos/cadastrar', {
        nome: 'Enfermagem',
        turno: 'Manhã',
        modulo: '1',
      });
      expect(result.nome).toBe('Enfermagem');
    });

    it('buscarEstatisticasCursos: deve retornar estatísticas', async () => {
      const mockStats = [
        {
          nomeCurso: 'Info',
          quantidadeAlunos: 30,
          totalEmprestimos: 100,
          mediaEmprestimosPorAluno: 3.3,
        },
      ];
      mockedApi.get.mockResolvedValue({ data: mockStats });

      const result = await buscarEstatisticasCursos();

      expect(mockedApi.get).toHaveBeenCalledWith('/cursos/estatisticas');
      expect(result[0].quantidadeAlunos).toBe(30);
    });

    it('buscarEstatisticasGrafico: deve mapear endpoints por tipo', async () => {
      mockedApi.get.mockResolvedValue({ data: [{ nome: 'Info', total: 50 }] });

      await buscarEstatisticasGrafico('curso');
      expect(mockedApi.get).toHaveBeenCalledWith(
        '/cursos/estatisticas-grafico',
      );

      await buscarEstatisticasGrafico('modulo');
      expect(mockedApi.get).toHaveBeenCalledWith(
        '/modulos/estatisticas-grafico',
      );

      await buscarEstatisticasGrafico('turno');
      expect(mockedApi.get).toHaveBeenCalledWith(
        '/turnos/estatisticas-grafico',
      );
    });
  });

  // --- Turno ---

  describe('turnoService', () => {
    it('buscarTurnos: deve retornar lista de turnos', async () => {
      mockedApi.get.mockResolvedValue({
        data: [
          { id: 1, nome: 'Manhã' },
          { id: 2, nome: 'Tarde' },
        ],
      });

      const result = await buscarTurnos();

      expect(mockedApi.get).toHaveBeenCalledWith('/turnos');
      expect(result).toHaveLength(2);
    });

    it('cadastrarTurno: deve cadastrar turno', async () => {
      mockedApi.post.mockResolvedValue({ data: { id: 3, nome: 'Noite' } });

      const result = await cadastrarTurno({ nome: 'Noite' });

      expect(mockedApi.post).toHaveBeenCalledWith('/turnos/cadastrar', {
        nome: 'Noite',
      });
      expect(result.nome).toBe('Noite');
    });
  });

  // --- Módulo ---

  describe('moduloService', () => {
    it('buscarModulos: deve retornar lista de módulos', async () => {
      mockedApi.get.mockResolvedValue({ data: [{ id: 1, nome: 'Módulo 1' }] });

      const result = await buscarModulos();

      expect(mockedApi.get).toHaveBeenCalledWith('/modulos');
      expect(result[0].nome).toBe('Módulo 1');
    });

    it('buscarModulos: deve retornar array vazio em caso de erro', async () => {
      mockedApi.get.mockRejectedValue(new Error('Erro'));

      const result = await buscarModulos();

      expect(result).toEqual([]);
    });

    it('buscarModulos: deve retornar array vazio quando data é null', async () => {
      mockedApi.get.mockResolvedValue({ data: null });

      const result = await buscarModulos();

      expect(result).toEqual([]);
    });

    it('cadastrarModulo: deve cadastrar módulo', async () => {
      mockedApi.post.mockResolvedValue({ data: { id: 4, nome: 'Módulo 4' } });

      const result = await cadastrarModulo({ nome: 'Módulo 4' });

      expect(mockedApi.post).toHaveBeenCalledWith('/modulos/cadastrar', {
        nome: 'Módulo 4',
      });
      expect(result.id).toBe(4);
    });
  });

  // --- Autor ---

  describe('autorService', () => {
    it('getContagemAutores: deve retornar contagem de autores', async () => {
      mockedApi.get.mockResolvedValue({ data: { totalElements: 42 } });

      const result = await getContagemAutores();

      expect(mockedApi.get).toHaveBeenCalledWith('/autores/buscar', {
        params: { page: 0, size: 1 },
      });
      expect(result).toBe(42);
    });

    it('getContagemAutores: deve retornar 0 quando totalElements é falsy', async () => {
      mockedApi.get.mockResolvedValue({ data: { totalElements: 0 } });

      const result = await getContagemAutores();

      expect(result).toBe(0);
    });
  });

  // --- Gênero ---

  describe('generoService', () => {
    it('buscarGeneros: deve retornar lista de gêneros', async () => {
      const mockGeneros = [
        { id: 1, nome: 'ROMANCE', nomePtBr: 'Romance' },
        { id: 2, nome: 'FICCAO', nomePtBr: 'Ficção' },
      ];
      mockedApi.get.mockResolvedValue({ data: mockGeneros });

      const result = await buscarGeneros();

      expect(mockedApi.get).toHaveBeenCalledWith('/generos');
      expect(result).toHaveLength(2);
      expect(result[0].nomePtBr).toBe('Romance');
    });
  });
});
