import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { StudentForm } from './StudentForm';
import { useCreateStudent } from '../../hooks/mutations/useStudentMutations';
import type { AlunoPayload } from '../../services/studentService';
import { type StudentFormData } from '../../schemas/studentSchema';

interface StudentModalNewProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function StudentModalNew({ onClose, onSuccess }: StudentModalNewProps) {
  const { mutateAsync: createStudent, isPending } = useCreateStudent();

  const handleSubmit = async (data: StudentFormData) => {
    try {
      const payload = {
        ...data,
        cpf: data.cpf ? data.cpf.replace(/\D/g, '') : undefined,
        celular: data.celular ? data.celular.replace(/\D/g, '') : undefined,
        cep: data.cep ? data.cep.replace(/\D/g, '') : undefined,
        cursoId: Number(data.cursoId),
        turnoId: Number(data.turnoId),
        moduloId: Number(data.moduloId),
        numero_casa: Number(data.numero_casa) || 0,
      };

      await createStudent(payload as unknown as AlunoPayload);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao processar formulário:', error);
    }
  };

  return (
    <>
      <Modal.Body>
        <StudentForm formId="form-novo-aluno" onSubmit={handleSubmit} />
      </Modal.Body>
      <Modal.Footer>
        <Button
          type="submit"
          form="form-novo-aluno"
          isLoading={isPending}
          className="w-full"
        >
          CADASTRAR ALUNO
        </Button>
      </Modal.Footer>
    </>
  );
}
