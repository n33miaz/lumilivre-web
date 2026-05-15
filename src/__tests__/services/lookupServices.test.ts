import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../../services/api';

import {
  buscarCursos,
  cadastrarCurso,
  buscarEstatisticasCursos,
  buscarEstatisticasGrafico,
} from '../../services/courseService';
import { buscarTurnos, cadastrarTurno } from '../../services/studyShiftService';
import { buscarModulos, cadastrarModulo } from '../../services/academicModuleService';
import { getContagemAutores } from '../../services/authorService';
import { buscarGeneros } from '../../services/genreService';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

describe('Servicos de lookup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('courseService', () => {
    it('buscarCursos: retorna lista de cursos da v2', async () => {
      mockedApi.get.mockResolvedValue({
        data: { content: [{ id: 1, name: 'Informatica' }] },
      });

      const result = await buscarCursos();

      expect(mockedApi.get).toHaveBeenCalledWith('/api/v2/courses', {
        params: { size: 100 },
      });
      expect(result.content[0].nome).toBe('Informatica');
    });

    it('buscarCursos: propaga erro', async () => {
      mockedApi.get.mockRejectedValue(new Error('Erro'));

      await expect(buscarCursos()).rejects.toThrow('Erro');
    });

    it('cadastrarCurso: cadastra curso com payload v2', async () => {
      mockedApi.post.mockResolvedValue({ data: { id: 2, name: 'Enfermagem' } });

      const result = await cadastrarCurso({
        nome: 'Enfermagem',
        turno: 'Manha',
        modulo: '1',
      });

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v2/courses', {
        name: 'Enfermagem',
      });
      expect(result.nome).toBe('Enfermagem');
    });

    it('buscarEstatisticasCursos: mapeia estatisticas v2', async () => {
      mockedApi.get.mockResolvedValue({
        data: [
          {
            courseName: 'Info',
            studentCount: 30,
            totalLoans: 100,
            avgLoansPerStudent: 3.3,
          },
        ],
      });

      const result = await buscarEstatisticasCursos();

      expect(mockedApi.get).toHaveBeenCalledWith('/api/v2/courses/statistics');
      expect(result[0].quantidadeAlunos).toBe(30);
    });

    it('buscarEstatisticasGrafico: usa endpoints v2', async () => {
      mockedApi.get.mockResolvedValue({ data: [{ name: 'Info', total: 50 }] });

      await buscarEstatisticasGrafico('curso');
      expect(mockedApi.get).toHaveBeenCalledWith('/api/v2/courses/loan-statistics');

      await buscarEstatisticasGrafico('modulo');
      expect(mockedApi.get).toHaveBeenCalledWith('/api/v2/academic-modules/loan-statistics');

      await buscarEstatisticasGrafico('turno');
      expect(mockedApi.get).toHaveBeenCalledWith('/api/v2/study-shifts/loan-statistics');
    });
  });

  describe('studyShiftService', () => {
    it('buscarTurnos: retorna lista de turnos da v2', async () => {
      mockedApi.get.mockResolvedValue({
        data: {
          content: [
            { id: 1, name: 'Manha' },
            { id: 2, name: 'Tarde' },
          ],
        },
      });

      const result = await buscarTurnos();

      expect(mockedApi.get).toHaveBeenCalledWith('/api/v2/study-shifts', {
        params: { size: 100 },
      });
      expect(result).toHaveLength(2);
    });

    it('cadastrarTurno: cadastra turno com payload v2', async () => {
      mockedApi.post.mockResolvedValue({ data: { id: 3, name: 'Noite' } });

      const result = await cadastrarTurno({ nome: 'Noite' });

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v2/study-shifts', {
        name: 'Noite',
      });
      expect(result.nome).toBe('Noite');
    });
  });

  describe('academicModuleService', () => {
    it('buscarModulos: retorna lista de modulos da v2', async () => {
      mockedApi.get.mockResolvedValue({
        data: { content: [{ id: 1, name: 'Modulo 1' }] },
      });

      const result = await buscarModulos();

      expect(mockedApi.get).toHaveBeenCalledWith('/api/v2/academic-modules', {
        params: { size: 100 },
      });
      expect(result[0].nome).toBe('Modulo 1');
    });

    it('buscarModulos: retorna array vazio em caso de erro', async () => {
      mockedApi.get.mockRejectedValue(new Error('Erro'));

      const result = await buscarModulos();

      expect(result).toEqual([]);
    });

    it('buscarModulos: retorna array vazio quando data e null', async () => {
      mockedApi.get.mockResolvedValue({ data: null });

      const result = await buscarModulos();

      expect(result).toEqual([]);
    });

    it('cadastrarModulo: cadastra modulo com payload v2', async () => {
      mockedApi.post.mockResolvedValue({ data: { id: 4, name: 'Modulo 4' } });

      const result = await cadastrarModulo({ nome: 'Modulo 4' });

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v2/academic-modules', {
        name: 'Modulo 4',
      });
      expect(result.id).toBe(4);
    });
  });

  describe('authorService', () => {
    it('getContagemAutores: retorna contagem de autores da v2', async () => {
      mockedApi.get.mockResolvedValue({ data: { totalElements: 42 } });

      const result = await getContagemAutores();

      expect(mockedApi.get).toHaveBeenCalledWith('/api/v2/metadata/authors', {
        params: { page: 0, size: 1 },
      });
      expect(result).toBe(42);
    });

    it('getContagemAutores: retorna 0 quando totalElements e falsy', async () => {
      mockedApi.get.mockResolvedValue({ data: { totalElements: 0 } });

      const result = await getContagemAutores();

      expect(result).toBe(0);
    });
  });

  describe('genreService', () => {
    it('buscarGeneros: retorna lista de generos da v2', async () => {
      mockedApi.get.mockResolvedValue({
        data: [
          { id: 1, name: 'ROMANCE' },
          { id: 2, name: 'FICCAO' },
        ],
      });

      const result = await buscarGeneros();

      expect(mockedApi.get).toHaveBeenCalledWith('/api/v2/genres');
      expect(result).toHaveLength(2);
      expect(result[0].nome).toBe('ROMANCE');
    });
  });
});
