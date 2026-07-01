import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { LoanForm } from './LoanForm';
import { useCreateLoan } from '../../hooks/mutations/useLoanMutations';
import { type EmprestimoPayload } from '../../services/loanService';
import { type LoanFormData } from '../../schemas/loanSchema';

interface LoanModalNewProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function LoanModalNew({ onClose, onSuccess }: LoanModalNewProps) {
  const { mutateAsync: createLoan, isPending } = useCreateLoan();

  const handleSubmit = async (data: LoanFormData) => {
    try {
      const payload: EmprestimoPayload = {
        leitor_matricula: data.leitor_matricula,
        exemplar_tombo: data.exemplar_tombo,
        data_emprestimo: data.data_emprestimo,
        data_devolucao: data.data_devolucao,
      };

      await createLoan(payload);
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <Modal.Body>
        <LoanForm formId="form-novo-emprestimo" onSubmit={handleSubmit} />
      </Modal.Body>
      <Modal.Footer>
        <Button
          type="submit"
          form="form-novo-emprestimo"
          isLoading={isPending}
          className="w-full"
        >
          CONFIRMAR EMPRÉSTIMO
        </Button>
      </Modal.Footer>
    </>
  );
}
