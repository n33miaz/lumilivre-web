import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useToast } from '../../contexts/ToastContext';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { useProcessLoanRequest } from '../../hooks/mutations/useLoanMutations';

import { type SolicitacaoPendente } from '../../services/solicitacaoEmprestimoService';
import { buscarLivrosAgrupados } from '../../services/livroService';
import { buscarExemplaresPorLivroId } from '../../services/exemplarService';

interface LoanModalRequestProps {
  solicitacao: SolicitacaoPendente | null;
  isOpen: boolean;
  onClose: (foiProcessado?: boolean) => void;
}

export function LoanModalRequest({
  solicitacao,
  isOpen,
  onClose,
}: LoanModalRequestProps) {
  const { addToast } = useToast();
  const [selectedTombo, setSelectedTombo] = useState('');
  const [confirmAction, setConfirmAction] = useState<boolean | null>(null);

  const { mutateAsync: processRequest, isPending: isProcessing } =
    useProcessLoanRequest();

  // Busca o ID do livro e depois os exemplares disponíveis
  const { data: exemplaresData, isLoading: isLoadingExemplares } = useQuery({
    queryKey: ['exemplares-para-solicitacao', solicitacao?.livroNome],
    queryFn: async () => {
      if (!solicitacao?.livroNome) return [];

      const livrosRes = await buscarLivrosAgrupados(
        solicitacao.livroNome,
        0,
        1,
      );
      const livroEncontrado = livrosRes.content.find(
        (l) => l.nome === solicitacao.livroNome,
      );

      if (livroEncontrado) {
        return await buscarExemplaresPorLivroId(livroEncontrado.id);
      }
      return [];
    },
    enabled: !!solicitacao && isOpen,
  });

  const exemplarOptions = useMemo(() => {
    if (!exemplaresData) return [];
    return exemplaresData
      .filter(
        (ex) =>
          ex.status === 'DISPONIVEL' ||
          ex.tomboExemplar === solicitacao?.exemplarTombo,
      )
      .map((ex) => ({
        label: `${ex.tomboExemplar} - ${ex.localizacao_fisica} ${ex.tomboExemplar === solicitacao?.exemplarTombo ? '(Reservado)' : ''}`,
        value: ex.tomboExemplar,
      }));
  }, [exemplaresData, solicitacao?.exemplarTombo]);

  useEffect(() => {
    if (solicitacao && isOpen) {
      setSelectedTombo(solicitacao.exemplarTombo || '');
    }
  }, [solicitacao, isOpen]);

  if (!solicitacao || !isOpen) return null;

  const executarProcessamento = async () => {
    if (confirmAction === null) return;

    await processRequest({ id: solicitacao.id, aceitar: confirmAction });
    setConfirmAction(null);
    onClose(true);
  };

  const handleProcessarClick = (aceitar: boolean) => {
    if (aceitar && !selectedTombo) {
      addToast({
        type: 'warning',
        title: 'Atenção',
        description: 'Selecione um exemplar para aceitar a solicitação.',
      });
      return;
    }
    setConfirmAction(aceitar);
  };

  const dataFormatada = new Date(solicitacao.dataSolicitacao).toLocaleString(
    'pt-BR',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  );

  return (
    <Modal isOpen={isOpen} onClose={() => onClose(false)}>
      <Modal.Header title="Solicitação de Empréstimo" />
      <Modal.Body>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Data da Solicitação</Label>
              <Input value={dataFormatada} disabled />
            </div>
            <div>
              <Label>Aluno</Label>
              <Input
                value={`${solicitacao.alunoNome} (Mat: ${solicitacao.alunoMatricula})`}
                disabled
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Livro</Label>
              <Input value={solicitacao.livroNome} disabled />
            </div>
            <div>
              <Label>Exemplar</Label>
              <SearchableSelect
                value={selectedTombo}
                onChange={setSelectedTombo}
                options={exemplarOptions}
                placeholder="Selecione o exemplar..."
                isLoading={isLoadingExemplares}
                disabled={isProcessing}
              />
            </div>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="danger"
          onClick={() => handleProcessarClick(false)}
          disabled={isProcessing}
          isLoading={isProcessing && confirmAction === false}
        >
          Recusar
        </Button>
        <Button
          variant="success"
          onClick={() => handleProcessarClick(true)}
          disabled={isProcessing}
          isLoading={isProcessing && confirmAction === true}
        >
          Aceitar
        </Button>
      </Modal.Footer>

      <ConfirmModal
        isOpen={confirmAction !== null}
        title={confirmAction ? 'Aceitar Solicitação' : 'Recusar Solicitação'}
        message={`Tem certeza que deseja ${confirmAction ? 'aceitar' : 'recusar'} esta solicitação?`}
        isDestructive={!confirmAction}
        onConfirm={executarProcessamento}
        onCancel={() => setConfirmAction(null)}
      />
    </Modal>
  );
}
