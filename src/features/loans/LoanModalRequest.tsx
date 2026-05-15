import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useToast } from '../../contexts/ToastContext';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { useProcessLoanRequest } from '../../hooks/mutations/useLoanMutations';

import { type SolicitacaoPendente } from '../../services/loanRequestService';
import { buscarLivrosAgrupados } from '../../services/bookService';
import { buscarExemplaresPorLivroId } from '../../services/bookCopyService';

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

  // Mantém o último dado válido durante a animação de saída
  const solicitacaoRef = useRef(solicitacao);
  useEffect(() => {
    if (solicitacao) solicitacaoRef.current = solicitacao;
  }, [solicitacao]);
  const solicitacaoAtual = solicitacao ?? solicitacaoRef.current;

  // Busca o ID do livro e depois os exemplares disponíveis
  const { data: exemplaresData, isLoading: isLoadingExemplares } = useQuery({
    queryKey: ['exemplares-para-solicitacao', solicitacaoAtual?.livroNome],
    queryFn: async () => {
      if (!solicitacaoAtual?.livroNome) return [];

      const livrosRes = await buscarLivrosAgrupados(
        solicitacaoAtual.livroNome,
        0,
        1,
      );
      const livroEncontrado = livrosRes.content.find(
        (l) => l.nome === solicitacaoAtual.livroNome,
      );

      if (livroEncontrado) {
        return await buscarExemplaresPorLivroId(livroEncontrado.id);
      }
      return [];
    },
    enabled: !!solicitacaoAtual && isOpen,
  });

  const exemplarOptions = useMemo(() => {
    if (!exemplaresData) return [];
    return exemplaresData
      .filter(
        (ex) =>
          ex.status === 'DISPONIVEL' ||
          ex.tomboExemplar === solicitacaoAtual?.exemplarTombo,
      )
      .map((ex) => ({
        label: `${ex.tomboExemplar} - ${ex.localizacao_fisica} ${ex.tomboExemplar === solicitacaoAtual?.exemplarTombo ? '(Reservado)' : ''}`,
        value: ex.tomboExemplar,
      }));
  }, [exemplaresData, solicitacaoAtual?.exemplarTombo]);

  useEffect(() => {
    if (solicitacao && isOpen) {
      setSelectedTombo(solicitacao.exemplarTombo || '');
    }
  }, [solicitacao, isOpen]);

  const executarProcessamento = async () => {
    if (confirmAction === null) return;

    await processRequest({ id: solicitacaoAtual?.id ?? '', aceitar: confirmAction });
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

  const dataFormatada = solicitacaoAtual
    ? new Date(solicitacaoAtual.dataSolicitacao).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

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
                value={`${solicitacaoAtual?.alunoNome} (Mat: ${solicitacaoAtual?.alunoMatricula})`}
                disabled
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Livro</Label>
              <Input value={solicitacaoAtual?.livroNome ?? ''} disabled />
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
        <div className="flex gap-3 w-full">
          <Button
            variant="danger"
            onClick={() => handleProcessarClick(false)}
            disabled={isProcessing}
            isLoading={isProcessing && confirmAction === false}
            className="flex-1"
          >
            Recusar
          </Button>
          <Button
            variant="success"
            onClick={() => handleProcessarClick(true)}
            disabled={isProcessing}
            isLoading={isProcessing && confirmAction === true}
            className="flex-1"
          >
            Aceitar
          </Button>
        </div>
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
