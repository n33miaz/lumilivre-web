import { describe, it, expect } from 'vitest';
import { formatarNome } from '../../utils/formatters';

describe('formatarNome', () => {
  it('deve formatar um nome simples corretamente', () => {
    const nome = 'joão da silva';
    const resultado = formatarNome(nome);
    expect(resultado).toBe('João da Silva');
  });

  it('deve lidar com nomes completamente em maiúsculas', () => {
    const nome = 'MARIA OLIVEIRA';
    const resultado = formatarNome(nome);
    expect(resultado).toBe('Maria Oliveira');
  });

  it('deve manter preposições comuns em minúsculas', () => {
    const nome = 'carlos de souza e santos';
    const resultado = formatarNome(nome);
    expect(resultado).toBe('Carlos de Souza e Santos');
  });

  it('deve retornar "-" para entradas nulas ou indefinidas', () => {
    expect(formatarNome(null)).toBe('-');
    expect(formatarNome(undefined)).toBe('-');
  });

  it('deve lidar com strings vazias retornando "-"', () => {
    expect(formatarNome('')).toBe('-');
  });

  it('deve lidar com espaços extras entre os nomes', () => {
    const nome = '  pedro   dos   reis  ';
    const resultado = formatarNome(nome);
    expect(resultado).toBe('Pedro dos Reis');
  });
});
