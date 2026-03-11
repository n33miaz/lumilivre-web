import { createMutationHook } from '../useGenericMutation';
import {
  cadastrarEmprestimo,
  atualizarEmprestimo,
  concluirEmprestimo,
  excluirEmprestimo,
  type EmprestimoPayload,
} from '../../services/emprestimoService';
import { processarSolicitacao } from '../../services/solicitacaoEmprestimoService';

const LOAN_QUERY_KEY = ['emprestimos'];
const DASHBOARD_SOLICITACOES_KEY = ['dashboard-solicitacoes'];

interface UpdateLoanVariables {
  id: number;
  payload: EmprestimoPayload;
}
interface ProcessRequestVariables {
  id: number;
  aceitar: boolean;
}

export const useCreateLoan = createMutationHook<unknown, EmprestimoPayload>({
  mutationFn: (payload) => cadastrarEmprestimo(payload),
  queryKey: LOAN_QUERY_KEY,
  successMessage: 'Empréstimo realizado com sucesso!',
  errorMessage: 'Erro ao realizar empréstimo.',
});

export const useUpdateLoan = createMutationHook<unknown, UpdateLoanVariables>({
  mutationFn: ({ id, payload }) => atualizarEmprestimo(id, payload),
  queryKey: LOAN_QUERY_KEY,
  successMessage: 'Empréstimo atualizado com sucesso!',
  errorMessage: 'Erro ao atualizar empréstimo.',
});

export const useCompleteLoan = createMutationHook<unknown, number>({
  mutationFn: (id) => concluirEmprestimo(id),
  queryKey: LOAN_QUERY_KEY,
  successMessage: 'Devolução registrada com sucesso!',
  errorMessage: 'Erro ao registrar devolução.',
});

export const useDeleteLoan = createMutationHook<unknown, number>({
  mutationFn: (id) => excluirEmprestimo(id),
  queryKey: LOAN_QUERY_KEY,
  successMessage: 'Empréstimo excluído com sucesso!',
  errorMessage: 'Erro ao excluir empréstimo.',
});

export const useProcessLoanRequest = createMutationHook<
  unknown,
  ProcessRequestVariables
>({
  mutationFn: ({ id, aceitar }) => processarSolicitacao(id, aceitar),
  queryKey: DASHBOARD_SOLICITACOES_KEY,
  successMessage: 'Solicitação processada com sucesso!',
  errorMessage: 'Falha ao processar solicitação.',
});
