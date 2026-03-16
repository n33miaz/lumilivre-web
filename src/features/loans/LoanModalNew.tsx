import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { LoanForm } from './LoanForm';
import { useCreateLoan } from '../../hooks/mutations/useLoanMutations';
import { type EmprestimoPayload } from '../../services/emprestimoService';
import { type LoanFormData } from '../../schemas/loanSchema';

interface LoanModalNewProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function LoanModalNew({ onClose, onSuccess }: LoanModalNewProps) {
  const { mutateAsync: createLoan, isPending } = useCreateLoan();

  const formatarDataParaBackend = (dataIso: string): string => {
    if (!dataIso) return '';
    const [ano, mes, dia] = dataIso.split('-');
    const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour12: false });
    return `${dia}/${mes}/${ano} ${horaAtual}`;
  };

  const handleSubmit = async (data: LoanFormData) => {
    try {
      const payload: EmprestimoPayload = {
        aluno_matricula: data.aluno_matricula,
        exemplar_tombo: data.exemplar_tombo,
        data_emprestimo: formatarDataParaBackend(data.data_emprestimo),
        data_devolucao: formatarDataParaBackend(data.data_devolucao),
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
