import { createMutationHook } from '../useGenericMutation';
import {
  cadastrarEmprestimo,
  atualizarEmprestimo,
  concluirEmprestimo,
  excluirEmprestimo,
  type EmprestimoPayload,
} from '../../services/loanService';
import { processarSolicitacao } from '../../services/loanRequestService';

const LOAN_QUERY_KEY = ['emprestimos'];
const DASHBOARD_SOLICITACOES_KEY = ['dashboard-solicitacoes'];

interface UpdateLoanVariables {
  id: string;
  payload: EmprestimoPayload;
}
interface ProcessRequestVariables {
  id: number | string;
  aceitar: boolean;
}

export const useCreateLoan = createMutationHook<unknown, EmprestimoPayload>({
  mutationFn: (payload) => cadastrarEmprestimo(payload),
  queryKey: LOAN_QUERY_KEY,
  successMessage: 'loan:toast.created',
  errorMessage: 'loan:error.create',
});

export const useUpdateLoan = createMutationHook<unknown, UpdateLoanVariables>({
  mutationFn: ({ id, payload }) => atualizarEmprestimo(id, payload),
  queryKey: LOAN_QUERY_KEY,
  successMessage: 'loan:toast.updated',
  errorMessage: 'loan:error.update',
});

export const useCompleteLoan = createMutationHook<unknown, string>({
  mutationFn: (id) => concluirEmprestimo(id),
  queryKey: LOAN_QUERY_KEY,
  successMessage: 'loan:toast.returned',
  errorMessage: 'loan:error.return',
});

export const useDeleteLoan = createMutationHook<unknown, string>({
  mutationFn: (id) => excluirEmprestimo(id),
  queryKey: LOAN_QUERY_KEY,
  successMessage: 'loan:toast.deleted',
  errorMessage: 'loan:error.delete',
});

export const useProcessLoanRequest = createMutationHook<
  unknown,
  ProcessRequestVariables
>({
  mutationFn: ({ id, aceitar }) => processarSolicitacao(id, aceitar),
  queryKey: DASHBOARD_SOLICITACOES_KEY,
  successMessage: 'loan:toast.request_processed',
  errorMessage: 'loan:error.process_request',
});
