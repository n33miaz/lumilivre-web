import { describe, it, expect } from 'vitest';
import { loanSchema } from '../../schemas/loanSchema';
import { bookSchema } from '../../schemas/bookSchema';
import { studentSchema } from '../../schemas/studentSchema';
import { tccSchema } from '../../schemas/tccSchema';

describe('Schema: loanSchema', () => {
  it('deve validar um empréstimo válido', () => {
    const validData = {
      aluno_matricula: '2024001',
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
      aluno_matricula: '',
      livro_id: '',
      exemplar_tombo: '',
      data_emprestimo: '',
      data_devolucao: '',
    };
    const result = loanSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0]);
      expect(paths).toContain('aluno_matricula');
      expect(paths).toContain('livro_id');
      expect(paths).toContain('exemplar_tombo');
    }
  });

  it('deve rejeitar datas com menos de 10 caracteres', () => {
    const invalidData = {
      aluno_matricula: '2024001',
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

describe('Schema: studentSchema', () => {
  it('deve validar um aluno com dados obrigatórios', () => {
    const validStudent = {
      nomeCompleto: 'João da Silva',
      matricula: '2024001',
      cursoId: 1,
      turnoId: 1,
      moduloId: 1,
    };
    const result = studentSchema.safeParse(validStudent);
    expect(result.success).toBe(true);
  });

  it('deve rejeitar nome com menos de 3 caracteres', () => {
    const invalidStudent = {
      nomeCompleto: 'Jo',
      matricula: '2024001',
      cursoId: 1,
      turnoId: 1,
      moduloId: 1,
    };
    const result = studentSchema.safeParse(invalidStudent);
    expect(result.success).toBe(false);
  });

  it('deve rejeitar e-mail inválido', () => {
    const invalidStudent = {
      nomeCompleto: 'João da Silva',
      matricula: '2024001',
      email: 'email-invalido',
      cursoId: 1,
      turnoId: 1,
      moduloId: 1,
    };
    const result = studentSchema.safeParse(invalidStudent);
    expect(result.success).toBe(false);
  });

  it('deve aceitar e-mail vazio como opcional', () => {
    const validStudent = {
      nomeCompleto: 'João da Silva',
      matricula: '2024001',
      email: '',
      cursoId: 1,
      turnoId: 1,
      moduloId: 1,
    };
    const result = studentSchema.safeParse(validStudent);
    expect(result.success).toBe(true);
  });

  it('deve rejeitar matrícula vazia', () => {
    const invalidStudent = {
      nomeCompleto: 'João da Silva',
      matricula: '',
      cursoId: 1,
      turnoId: 1,
      moduloId: 1,
    };
    const result = studentSchema.safeParse(invalidStudent);
    expect(result.success).toBe(false);
  });
});

describe('Schema: tccSchema', () => {
  it('deve validar um TCC com dados completos', () => {
    const validTcc = {
      titulo: 'Título do TCC',
      alunos: 'João, Maria',
      curso_id: 1,
      anoConclusao: '2025',
      semestreConclusao: '1',
    };
    const result = tccSchema.safeParse(validTcc);
    expect(result.success).toBe(true);
  });

  it('deve rejeitar TCC sem título', () => {
    const invalidTcc = {
      titulo: '',
      alunos: 'João',
      curso_id: 1,
      anoConclusao: '2025',
      semestreConclusao: '1',
    };
    const result = tccSchema.safeParse(invalidTcc);
    expect(result.success).toBe(false);
  });

  it('deve rejeitar ano de conclusão com menos de 4 caracteres', () => {
    const invalidTcc = {
      titulo: 'Título',
      alunos: 'João',
      curso_id: 1,
      anoConclusao: '25',
      semestreConclusao: '1',
    };
    const result = tccSchema.safeParse(invalidTcc);
    expect(result.success).toBe(false);
  });

  it('deve ter ativo como true por padrão', () => {
    const data = {
      titulo: 'Título',
      alunos: 'João',
      curso_id: 1,
      anoConclusao: '2025',
      semestreConclusao: '1',
    };
    const result = tccSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ativo).toBe(true);
    }
  });
});
