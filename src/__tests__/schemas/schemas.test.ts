import { describe, it, expect } from 'vitest';
import { loanSchema } from '../../schemas/loanSchema';
import { bookSchema } from '../../schemas/bookSchema';
import { readerSchema } from '../../schemas/readerSchema';
import { contentSchema } from '../../schemas/contentSchema';

describe('Schema: loanSchema', () => {
  it('deve validar um empréstimo válido', () => {
    const validData = {
      leitor_matricula: '2024001',
      livro_id: '1',
      exemplar_tombo: 'T001',
      data_emprestimo: '11/03/2026',
      data_devolucao: '18/03/2026',
    };
    const result = loanSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('deve rejeitar quando campos obrigatórios estão vazios', () => {
    const invalidData = {
      leitor_matricula: '',
      livro_id: '',
      exemplar_tombo: '',
      data_emprestimo: '',
      data_devolucao: '',
    };
    const result = loanSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0]);
      expect(paths).toContain('leitor_matricula');
      expect(paths).toContain('livro_id');
      expect(paths).toContain('exemplar_tombo');
    }
  });

  it('deve rejeitar datas com menos de 10 caracteres', () => {
    const invalidData = {
      leitor_matricula: '2024001',
      livro_id: '1',
      exemplar_tombo: 'T001',
      data_emprestimo: '11/03',
      data_devolucao: '18',
    };
    const result = loanSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

describe('Schema: bookSchema', () => {
  it('deve validar um livro com dados completos', () => {
    const validBook = {
      isbn: '9788535914849',
      nome: 'Dom Casmurro',
      numero_paginas: 256,
      editora: 'Companhia das Letras',
      classificacao_etaria: 'LIVRE',
      autor: 'Machado de Assis',
      generos: ['Romance'],
    };
    const result = bookSchema.safeParse(validBook);
    expect(result.success).toBe(true);
  });

  it('deve rejeitar ISBN com menos de 10 caracteres', () => {
    const invalidBook = {
      isbn: '123',
      nome: 'Teste',
      numero_paginas: 100,
      editora: 'Editora',
      classificacao_etaria: 'LIVRE',
      autor: 'Autor',
      generos: ['Ficção'],
    };
    const result = bookSchema.safeParse(invalidBook);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path[0]).toBe('isbn');
    }
  });

  it('deve rejeitar livro sem gêneros', () => {
    const invalidBook = {
      isbn: '9788535914849',
      nome: 'Teste',
      numero_paginas: 100,
      editora: 'Editora',
      classificacao_etaria: 'LIVRE',
      autor: 'Autor',
      generos: [],
    };
    const result = bookSchema.safeParse(invalidBook);
    expect(result.success).toBe(false);
  });

  it('deve rejeitar número de páginas zero ou negativo', () => {
    const invalidBook = {
      isbn: '9788535914849',
      nome: 'Teste',
      numero_paginas: 0,
      editora: 'Editora',
      classificacao_etaria: 'LIVRE',
      autor: 'Autor',
      generos: ['Ficção'],
    };
    const result = bookSchema.safeParse(invalidBook);
    expect(result.success).toBe(false);
  });
});

describe('Schema: readerSchema', () => {
  it('deve validar um leitor com dados obrigatórios', () => {
    const validReader = {
      nomeCompleto: 'João da Silva',
      matricula: '2024001',
      cursoId: 1,
      turnoId: 1,
      moduloId: 1,
    };
    const result = readerSchema.safeParse(validReader);
    expect(result.success).toBe(true);
  });

  it('deve rejeitar nome com menos de 3 caracteres', () => {
    const invalidReader = {
      nomeCompleto: 'Jo',
      matricula: '2024001',
      cursoId: 1,
      turnoId: 1,
      moduloId: 1,
    };
    const result = readerSchema.safeParse(invalidReader);
    expect(result.success).toBe(false);
  });

  it('deve rejeitar e-mail inválido', () => {
    const invalidReader = {
      nomeCompleto: 'João da Silva',
      matricula: '2024001',
      email: 'email-invalido',
      cursoId: 1,
      turnoId: 1,
      moduloId: 1,
    };
    const result = readerSchema.safeParse(invalidReader);
    expect(result.success).toBe(false);
  });

  it('deve aceitar e-mail vazio como opcional', () => {
    const validReader = {
      nomeCompleto: 'João da Silva',
      matricula: '2024001',
      email: '',
      cursoId: 1,
      turnoId: 1,
      moduloId: 1,
    };
    const result = readerSchema.safeParse(validReader);
    expect(result.success).toBe(true);
  });

  it('deve rejeitar matrícula vazia', () => {
    const invalidReader = {
      nomeCompleto: 'João da Silva',
      matricula: '',
      cursoId: 1,
      turnoId: 1,
      moduloId: 1,
    };
    const result = readerSchema.safeParse(invalidReader);
    expect(result.success).toBe(false);
  });
});

describe('Schema: contentSchema', () => {
  it('deve validar um conteúdo com dados mínimos', () => {
    const valid = { contentType: 'ANNOUNCEMENT', title: 'Comunicado importante' };
    const result = contentSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('deve rejeitar conteúdo sem título', () => {
    const invalid = { contentType: 'ANNOUNCEMENT', title: '' };
    const result = contentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('deve rejeitar tipo de conteúdo inválido', () => {
    const invalid = { contentType: 'FOO', title: 'Título' };
    const result = contentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('deve aplicar defaults de visibilidade', () => {
    const result = contentSchema.safeParse({ contentType: 'WORK', title: 'Trabalho' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.published).toBe(true);
      expect(result.data.pinned).toBe(false);
      expect(result.data.audienceScope).toBe('ALL');
      expect(result.data.displayOrder).toBe(0);
    }
  });
});
