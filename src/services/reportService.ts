import api from './api';

export interface FiltrosRelatorio {
  dataInicio?: string;
  dataFim?: string;
  idModulo?: number;
  idCurso?: number;
  idTurno?: number;
  penalidade?: string;
  genero?: string;
  autor?: string;
  editora?: string;
  cdd?: string;
  classificacaoEtaria?: string;
  tipoCapa?: string;
  statusLivro?: string;
  isbnOuTombo?: string;
  statusEmprestimo?: string;
  matriculaAluno?: string;
}

const endpointByType = {
  emprestimos: 'loans',
  alunos: 'students',
  livros: 'books',
  exemplares: 'copies',
} as const;

const statusLoanMap: Record<string, string> = {
  ATIVO: 'ACTIVE',
  ATRASADO: 'OVERDUE',
  CONCLUIDO: 'COMPLETED',
};

const statusCopyMap: Record<string, string> = {
  DISPONIVEL: 'AVAILABLE',
  EMPRESTADO: 'BORROWED',
  INDISPONIVEL: 'UNAVAILABLE',
  MANUTENCAO: 'MAINTENANCE',
};

const appendParam = (
  params: URLSearchParams,
  key: string,
  value: unknown,
) => {
  if (value === null || value === undefined || value === '') return;
  params.append(key, String(value));
};

const toReportParams = (
  tipo: keyof typeof endpointByType,
  filtros: FiltrosRelatorio,
) => {
  const params = new URLSearchParams();

  appendParam(params, 'startDate', filtros.dataInicio);
  appendParam(params, 'endDate', filtros.dataFim);

  if (tipo === 'alunos') {
    appendParam(params, 'academicModuleId', filtros.idModulo);
    appendParam(params, 'courseId', filtros.idCurso);
    appendParam(params, 'studyShiftId', filtros.idTurno);
    appendParam(params, 'penaltyCode', filtros.penalidade);
  }

  if (tipo === 'livros') {
    appendParam(params, 'genre', filtros.genero);
    appendParam(params, 'author', filtros.autor);
    appendParam(params, 'publisher', filtros.editora);
    appendParam(params, 'deweyCode', filtros.cdd);
    appendParam(params, 'ageRating', filtros.classificacaoEtaria);
    appendParam(params, 'coverType', filtros.tipoCapa);
  }

  if (tipo === 'exemplares') {
    appendParam(
      params,
      'status',
      statusCopyMap[filtros.statusLivro || ''] ?? filtros.statusLivro,
    );
    appendParam(params, 'isbnOrCopyCode', filtros.isbnOuTombo);
  }

  if (tipo === 'emprestimos') {
    appendParam(
      params,
      'status',
      statusLoanMap[filtros.statusEmprestimo || ''] ??
        filtros.statusEmprestimo,
    );
    appendParam(params, 'studentRegistrationNumber', filtros.matriculaAluno);
    appendParam(params, 'courseId', filtros.idCurso);
    appendParam(params, 'isbnOrCopyCode', filtros.isbnOuTombo);
    appendParam(params, 'academicModuleId', filtros.idModulo);
  }

  return params;
};

export const baixarRelatorioPDF = async (
  tipo: 'emprestimos' | 'alunos' | 'livros' | 'exemplares',
  filtros: FiltrosRelatorio,
  signal?: AbortSignal,
) => {
  const params = toReportParams(tipo, filtros);

  try {
    const response = await api.get(`/api/v2/reports/${endpointByType[tipo]}`, {
      params,
      responseType: 'blob',
      signal,
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;

    const contentDisposition = response.headers['content-disposition'];
    let fileName = `relatorio-${tipo}.pdf`;
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      if (fileNameMatch && fileNameMatch.length === 2)
        fileName = fileNameMatch[1];
    }

    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();

    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    if (error instanceof Error && error.name === 'CanceledError') {
      throw error;
    }
    console.error('Erro ao baixar relatorio:', error);
    throw error;
  }
};
