import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Modal } from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { Button } from '../../components/ui/Button';
import { DetailsModalActionFooter } from '../../components/shared/DetailsModalActionFooter';
import { LoanForm } from './LoanForm';

import { buscarLivrosAgrupados } from '../../services/livroService';
import { type EmprestimoPayload } from '../../services/emprestimoService';
import {
  useUpdateLoan,
  useCompleteLoan,
  useDeleteLoan,
} from '../../hooks/mutations/useLoanMutations';
import { type LoanFormData } from '../../schemas/loanSchema';

interface EmprestimoDados {
  id: string | number;
  alunoMatricula: string;
  alunoNome?: string;
  livroIsbn: string;
  livroNome?: string;
  exemplarTombo: string;
  dataEmprestimo: string;
  dataDevolucao: string;
}

interface ModalLoanDetailsProps {
  emprestimo: EmprestimoDados | null;
  isOpen: boolean;
  onClose: (foiAtualizado?: boolean) => void;
}

export function ModalLoanDetails({
  emprestimo,
  isOpen,
  onClose,
}: ModalLoanDetailsProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    'devolucao' | 'excluir' | null
  >(null);
  const [livroIdEncontrado, setLivroIdEncontrado] = useState<string>('');

  const { mutateAsync: updateLoan, isPending: isUpdating } = useUpdateLoan();
  const { mutateAsync: completeLoan, isPending: isCompleting } =
    useCompleteLoan();
  const { mutateAsync: deleteLoan, isPending: isDeleting } = useDeleteLoan();

  const { data: livrosData } = useQuery({
    queryKey: ['livros-options'],
    queryFn: () =>
      buscarLivrosAgrupados('', 0, 1000).then((res) => res.content),
    staleTime: 1000 * 60 * 5,
    enabled: isOpen,
  });

  useEffect(() => {
    if (isOpen) setIsEditMode(false);
  }, [isOpen]);

  useEffect(() => {
    if (emprestimo && livrosData) {
      let id = '';
      if (emprestimo.livroIsbn && emprestimo.livroIsbn !== '-') {
        const found = livrosData.find((l) => l.isbn === emprestimo.livroIsbn);
        if (found) id = String(found.id);
      }
      if (!id && emprestimo.livroNome) {
        const found = livrosData.find(
          (l) => l.nome.toLowerCase() === emprestimo.livroNome?.toLowerCase(),
        );
        if (found) id = String(found.id);
      }
      setLivroIdEncontrado(id);
    }
  }, [emprestimo, livrosData]);

  if (!emprestimo) return null;

  const formatarDataParaBackend = (dataIso: string): string => {
    if (!dataIso) return '';
    const [ano, mes, dia] = dataIso.split('-');
    const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour12: false });
    return `${dia}/${mes}/${ano} ${horaAtual}`;
  };

  const handleSubmit = async (data: LoanFormData) => {
    try {
      const payload: EmprestimoPayload = {
        id: Number(emprestimo.id),
        aluno_matricula: data.aluno_matricula,
        exemplar_tombo: data.exemplar_tombo,
        data_emprestimo: formatarDataParaBackend(data.data_emprestimo),
        data_devolucao: formatarDataParaBackend(data.data_devolucao),
      };

      await updateLoan({ id: Number(emprestimo.id), payload });
      setIsEditMode(false);
      onClose(true);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDevolucao = async () => {
    await completeLoan(Number(emprestimo.id));
    setConfirmAction(null);
    onClose(true);
  };

  const handleExcluir = async () => {
    await deleteLoan(Number(emprestimo.id));
    setConfirmAction(null);
    onClose(true);
  };

  const initialData = {
    aluno_matricula: emprestimo.alunoMatricula,
    alunoNome: emprestimo.alunoNome,
    livro_id: livroIdEncontrado,
    livroNome: emprestimo.livroNome,
    exemplar_tombo: emprestimo.exemplarTombo,
    data_emprestimo: emprestimo.dataEmprestimo
      ? new Date(emprestimo.dataEmprestimo).toISOString().split('T')[0]
      : '',
    data_devolucao: emprestimo.dataDevolucao
      ? new Date(emprestimo.dataDevolucao).toISOString().split('T')[0]
      : '',
  };

  return (
    <Modal isOpen={isOpen} onClose={() => onClose(false)}>
      <Modal.Header
        title={isEditMode ? 'Editar Empréstimo' : 'Detalhes do Empréstimo'}
      />

      <Modal.Body>
        <LoanForm
          formId="form-edit-emprestimo"
          initialData={initialData}
          readOnly={!isEditMode}
          onSubmit={handleSubmit}
        />
      </Modal.Body>

      {isEditMode ? (
        <DetailsModalActionFooter
          isEditMode={isEditMode}
          isUpdating={isUpdating}
          isDeleting={isDeleting}
          formId="form-edit-emprestimo"
          onEdit={() => setIsEditMode(true)}
          onCancel={() => setIsEditMode(false)}
          onDelete={() => setConfirmAction('excluir')}
        />
      ) : (
        <Modal.Footer className="justify-between w-full">
          <Button
            variant="danger"
            onClick={() => setConfirmAction('excluir')}
            isLoading={isDeleting}
          >
            Excluir
          </Button>
          <div className="flex gap-3">
            <Button onClick={() => setIsEditMode(true)}>Editar</Button>
            <Button
              variant="primary"
              onClick={() => setConfirmAction('devolucao')}
              isLoading={isCompleting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Registrar Devolução
            </Button>
          </div>
        </Modal.Footer>
      )}

      <ConfirmModal
        isOpen={confirmAction !== null}
        title={
          confirmAction === 'devolucao'
            ? 'Registro de Devolução'
            : 'Excluir Empréstimo'
        }
        message={
          confirmAction === 'devolucao'
            ? 'Deseja confirmar a devolução deste livro?'
            : 'Tem certeza que deseja excluir este empréstimo?\nEssa ação não pode ser desfeita.'
        }
        isDestructive={confirmAction === 'excluir'}
        onConfirm={
          confirmAction === 'devolucao' ? handleDevolucao : handleExcluir
        }
        onCancel={() => setConfirmAction(null)}
      />
    </Modal>
  );
}
