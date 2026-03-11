import { useState, useEffect, useMemo } from 'react';

import { Modal } from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { DetailsModalActionFooter } from '../../components/shared/DetailsModalActionFooter';
import { LoadingIcon } from '../../components/ui/LoadingIcon';
import { Button } from '../../components/ui/Button';
import { StudentForm } from './StudentForm';
import { Label } from '../../components/ui/Label';
import { CustomSelect } from '../../components/ui/CustomSelect';

import LockIcon from '../../assets/icons/lock.svg?react';

import {
  type AlunoPayload,
  type ListaAluno,
} from '../../services/alunoService';
import { useEnum } from '../../hooks/queries/useBookQueries';
import { useAlunoDetalhes } from '../../hooks/queries/useStudentQueries';
import {
  useUpdateStudent,
  useDeleteStudent,
  useResetStudentPassword,
} from '../../hooks/mutations/useStudentMutations';
import { type StudentFormData } from '../../schemas/studentSchema';

interface ModalStudentDetailsProps {
  aluno: ListaAluno | null;
  isOpen: boolean;
  onClose: (foiAtualizado?: boolean) => void;
}

export function ModalStudentDetails({
  aluno,
  isOpen,
  onClose,
}: ModalStudentDetailsProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    'excluir' | 'resetSenha' | null
  >(null);
  const [penalidade, setPenalidade] = useState('');

  const { data: penalidadesData } = useEnum('PENALIDADE');
  const { mutateAsync: updateStudent, isPending: isUpdating } =
    useUpdateStudent();
  const { mutateAsync: deleteStudent, isPending: isDeleting } =
    useDeleteStudent();
  const { mutateAsync: resetPassword, isPending: isResetting } =
    useResetStudentPassword();

  const { data: alunoDetalhes, isLoading: isLoadingDetalhes } =
    useAlunoDetalhes(isOpen ? aluno?.matricula : undefined);

  useEffect(() => {
    if (alunoDetalhes) {
      setPenalidade(alunoDetalhes.penalidade || '');
    }
  }, [alunoDetalhes]);

  const penalidadeOptions = useMemo(
    () => [
      { label: 'Sem Penalidade', value: '' },
      ...(penalidadesData?.map((p) => ({ label: p.status, value: p.nome })) ||
        []),
    ],
    [penalidadesData],
  );

  useEffect(() => {
    if (isOpen) {
      setIsEditMode(false);
      setPenalidade(aluno?.penalidade || '');
    }
  }, [isOpen, aluno]);

  if (!isOpen || !aluno) return null;

  const handleSubmit = async (data: StudentFormData) => {
    try {
      const payload = {
        ...data,
        cpf: data.cpf?.replace(/\D/g, ''),
        celular: data.celular?.replace(/\D/g, ''),
        cep: data.cep?.replace(/\D/g, ''),
        cursoId: Number(data.cursoId),
        turnoId: Number(data.turnoId),
        moduloId: Number(data.moduloId),
        numero_casa: Number(data.numero_casa) || 0,
        penalidade,
      };

      await updateStudent({
        matricula: aluno.matricula,
        payload: payload as unknown as AlunoPayload,
      });
      setIsEditMode(false);
      onClose(true);
    } catch (error) {
      console.error(error);
    }
  };

  const executarResetSenha = async () => {
    try {
      await resetPassword(aluno.matricula);
      setConfirmAction(null);
    } catch (error) {
      console.error(error);
    }
  };

  const executarExclusao = async () => {
    try {
      await deleteStudent(aluno.matricula);
      setConfirmAction(null);
      onClose(true);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => onClose(false)}>
      <Modal.Header title={isEditMode ? 'Editar Aluno' : 'Detalhes do Aluno'} />
      <Modal.Body>
        {isLoadingDetalhes ? (
          <LoadingIcon />
        ) : (
          <div className="space-y-4">
            <StudentForm
              formId="form-edit-aluno"
              initialData={alunoDetalhes}
              readOnly={!isEditMode}
              onSubmit={handleSubmit}
            />
            {isEditMode && (
              <div className="pt-2">
                <Label>Status de Penalidade</Label>
                <CustomSelect
                  value={penalidade}
                  onChange={setPenalidade}
                  options={penalidadeOptions}
                  placeholder="Selecione"
                />
              </div>
            )}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer className="justify-between w-full">
        {isEditMode ? (
          <DetailsModalActionFooter
            isEditMode={isEditMode}
            isUpdating={isUpdating}
            isDeleting={isDeleting}
            formId="form-edit-aluno"
            onEdit={() => setIsEditMode(true)}
            onCancel={() => setIsEditMode(false)}
            onDelete={() => setConfirmAction('excluir')}
          />
        ) : (
          <>
            <Button
              variant="danger"
              onClick={() => setConfirmAction('excluir')}
              disabled={isLoadingDetalhes}
              isLoading={isDeleting}
            >
              Excluir
            </Button>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setConfirmAction('resetSenha')}
                disabled={isLoadingDetalhes}
                isLoading={isResetting}
                className="bg-yellow-500 hover:bg-yellow-600 text-white"
              >
                <LockIcon className="w-5 h-5 mr-2" />
                <span className="hidden sm:inline">Resetar Senha</span>
              </Button>
              <Button
                onClick={() => setIsEditMode(true)}
                disabled={isLoadingDetalhes}
              >
                Editar Cadastro
              </Button>
            </div>
          </>
        )}
      </Modal.Footer>
      <ConfirmModal
        isOpen={confirmAction !== null}
        title={confirmAction === 'excluir' ? 'Excluir Aluno' : 'Resetar Senha'}
        message={
          confirmAction === 'excluir'
            ? `Tem certeza que deseja excluir o aluno ${aluno.nomeCompleto}?`
            : `A senha será redefinida para a matrícula: ${aluno.matricula}. Deseja continuar?`
        }
        isDestructive={confirmAction === 'excluir'}
        onConfirm={
          confirmAction === 'excluir' ? executarExclusao : executarResetSenha
        }
        onCancel={() => setConfirmAction(null)}
      />
    </Modal>
  );
}
