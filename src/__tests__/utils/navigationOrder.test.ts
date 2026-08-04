import { describe, it, expect } from 'vitest';
import { routeOrder, getRouteIndex } from '../../utils/navigationOrder';

describe('navigationOrder', () => {
  describe('routeOrder', () => {
    it('deve conter todas as rotas /admin/* principais na ordem esperada', () => {
      expect(routeOrder).toEqual([
        '/admin/dashboard',
        '/admin/books',
        '/admin/readers',
        '/admin/loans',
        '/admin/contents',
        '/admin/ranking',
        '/admin/reports',
        '/admin/settings',
      ]);
    });

    it('deve ter /admin/dashboard como primeira rota', () => {
      expect(routeOrder[0]).toBe('/admin/dashboard');
    });
  });

  describe('getRouteIndex', () => {
    it('deve retornar 0 para a rota raiz "/"', () => {
      expect(getRouteIndex('/')).toBe(0);
    });

    it('deve retornar 0 para /admin (landing do painel)', () => {
      expect(getRouteIndex('/admin')).toBe(0);
    });

    it('deve retornar o indice correto para rotas conhecidas', () => {
      expect(getRouteIndex('/admin/dashboard')).toBe(0);
      expect(getRouteIndex('/admin/books')).toBe(1);
      expect(getRouteIndex('/admin/readers')).toBe(2);
      expect(getRouteIndex('/admin/loans')).toBe(3);
      expect(getRouteIndex('/admin/settings')).toBe(7);
    });

    it('deve retornar 0 para rotas desconhecidas', () => {
      expect(getRouteIndex('/rota-inexistente')).toBe(0);
    });

    it('deve ignorar query strings ao determinar o indice', () => {
      expect(getRouteIndex('/admin/books?page=1')).toBe(1);
      expect(getRouteIndex('/admin/readers?search=teste&page=2')).toBe(2);
    });
  });
});
