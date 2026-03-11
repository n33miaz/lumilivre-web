import { describe, it, expect } from 'vitest';
import { routeOrder, getRouteIndex } from '../../utils/navigationOrder';

describe('navigationOrder', () => {
  describe('routeOrder', () => {
    it('deve conter todas as rotas principais na ordem esperada', () => {
      expect(routeOrder).toEqual([
        '/dashboard',
        '/livros',
        '/alunos',
        '/emprestimos',
        '/tcc',
        '/classificacao',
        '/relatorios',
        '/configuracoes',
      ]);
    });

    it('deve ter /dashboard como primeira rota', () => {
      expect(routeOrder[0]).toBe('/dashboard');
    });
  });

  describe('getRouteIndex', () => {
    it('deve retornar 0 para a rota raiz "/"', () => {
      expect(getRouteIndex('/')).toBe(0);
    });

    it('deve retornar o índice correto para rotas conhecidas', () => {
      expect(getRouteIndex('/dashboard')).toBe(0);
      expect(getRouteIndex('/livros')).toBe(1);
      expect(getRouteIndex('/alunos')).toBe(2);
      expect(getRouteIndex('/emprestimos')).toBe(3);
      expect(getRouteIndex('/configuracoes')).toBe(7);
    });

    it('deve retornar 0 para rotas desconhecidas', () => {
      expect(getRouteIndex('/rota-inexistente')).toBe(0);
      expect(getRouteIndex('/admin')).toBe(0);
    });

    it('deve ignorar query strings ao determinar o índice', () => {
      expect(getRouteIndex('/livros?page=1')).toBe(1);
      expect(getRouteIndex('/alunos?search=teste&page=2')).toBe(2);
    });
  });
});
