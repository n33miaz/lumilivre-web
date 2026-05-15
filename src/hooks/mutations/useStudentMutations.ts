import { createMutationHook } from '../useGenericMutation';
import {
  cadastrarAluno,
  atualizarAluno,
  excluirAluno,
  resetarSenhaAluno,
  type AlunoPayload,
} from '../../services/studentService';

const STUDENT_QUERY_KEY = ['alunos'];

// --- Criação ---
export const useCreateStudent = createMutationHook<unknown, AlunoPayload>({
  mutationFn: (payload) => cadastrarAluno(payload),
  queryKey: STUDENT_QUERY_KEY,
  successMessage: 'Aluno cadastrado com sucesso!',
  errorMessage: 'Erro ao cadastrar aluno.',
});

// --- Atualização ---
interface UpdateStudentVariables {
  matricula: string;
  payload: AlunoPayload;
}
export const useUpdateStudent = createMutationHook<
  unknown,
  UpdateStudentVariables
>({
  mutationFn: ({ matricula, payload }) => atualizarAluno(matricula, payload),
  queryKey: STUDENT_QUERY_KEY,
  successMessage: 'Aluno atualizado com sucesso!',
  errorMessage: 'Erro ao atualizar aluno.',
});

// --- Exclusão ---
export const useDeleteStudent = createMutationHook<unknown, string>({
  mutationFn: (matricula) => excluirAluno(matricula),
  queryKey: STUDENT_QUERY_KEY,
  successMessage: 'Aluno excluído com sucesso!',
  errorMessage: 'Erro ao excluir aluno.',
});

// --- Reset de Senha ---
import { useMutation } from '@tanstack/react-query';
import { useToast } from '../../contexts/ToastContext';
import { getErrorMessage } from '../../utils/errorHandler';

export function useResetStudentPassword() {
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (matricula: string) => resetarSenhaAluno(matricula),
    onSuccess: (_, matricula) => {
      addToast({
        type: 'success',
        title: 'Senha Resetada',
        description: `A senha foi redefinida para: ${matricula}`,
      });
    },
    onError: (error) => {
      addToast({
        type: 'error',
        title: 'Erro',
        description: getErrorMessage(error, 'Erro ao resetar senha.'),
      });
    },
  });
}
