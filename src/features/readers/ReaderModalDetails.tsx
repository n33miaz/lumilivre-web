import { useState, useEffect, useMemo, useRef } from 'react';

import { Modal } from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { DetailsModalActionFooter } from '../../components/shared/DetailsModalActionFooter';
import { LoadingIcon } from '../../components/ui/LoadingIcon';
import { Button } from '../../components/ui/Button';
import { ReaderForm } from './ReaderForm';
import { Label } from '../../components/ui/Label';
import { CustomSelect } from '../../components/ui/CustomSelect';

import LockIcon from '../../assets/icons/lock.svg?react';

import {
  type LeitorPayload,
  type ListaLeitor,
} from '../../services/readerService';
import { useEnum } from '../../hooks/queries/useBookQueries';
import { useLeitorDetalhes } from '../../hooks/queries/useReaderQueries';
import {
  useUpdateReader,
  useDeleteReader,
  useResetReaderPassword,
} from '../../hooks/mutations/useReaderMutations';
import { type ReaderFormData } from '../../schemas/readerSchema';
import { useLibraryConfig } from '../../contexts/LibraryConfigContext';

interface ModalReaderDetailsProps {
  leitor: ListaLeitor | null;
  isOpen: boolean;
  onClose: (foiAtualizado?: boolean) => void;
}

export function ModalReaderDetails({
  leitor,
  isOpen,
  onClose,
}: ModalReaderDetailsProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    'excluir' | 'resetSenha' | null
  >(null);
  const [penalidade, setPenalidade] = useState('');

  const { data: penalidadesData } = useEnum('PENALIDADE');
  const { mutateAsync: updateReader, isPending: isUpdating } =
    useUpdateReader();
  const { mutateAsync: deleteReader, isPending: isDeleting } =
    useDeleteReader();
  const { mutateAsync: resetPassword, isPending: isResetting } =
    useResetReaderPassword();
  const { features } = useLibraryConfig();

  // Mantém o último dado válido durante a animação de saída
  const leitorRef = useRef(leitor);
  useEffect(() => {
    if (leitor) leitorRef.current = leitor;
  }, [leitor]);
  const leitorAtual = leitor ?? leitorRef.current;

  const { data: leitorDetalhes, isLoading: isLoadingDetalhes } =
    useLeitorDetalhes(isOpen ? leitorAtual?.matricula : undefined);

  useEffect(() => {
    if (leitorDetalhes) {
      setPenalidade(leitorDetalhes.penalidade || '');
    }
  }, [leitorDetalhes]);

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
      setPenalidade(leitorAtual?.penalidade || '');
    }
  }, [isOpen, leitorAtual]);

  const handleSubmit = async (data: ReaderFormData) => {
    try {
      const payload = {
        ...data,
        cpf: data.cpf?.replace(/\D/g, ''),
        celular: data.celular?.replace(/\D/g, ''),
        cep: data.cep?.replace(/\D/g, ''),
        cursoId: features.academicFields ? Number(data.cursoId) : undefined,
        turnoId: features.academicFields ? Number(data.turnoId) : undefined,
        moduloId: features.academicFields ? Number(data.moduloId) : undefined,
        readerCategory: features.academicFields ? undefined : data.readerCategory,
        numero_casa: Number(data.numero_casa) || 0,
        penalidade,
      };

      await updateReader({
        matricula: leitorAtual?.matricula ?? '',
        payload: payload as unknown as LeitorPayload,
      });
      setIsEditMode(false);
      onClose(true);
    } catch (error) {
      console.error(error);
    }
  };

  const executarResetSenha = async () => {
    try {
      await resetPassword(leitorAtual?.matricula ?? '');
      setConfirmAction(null);
    } catch (error) {
      console.error(error);
    }
  };

  const executarExclusao = async () => {
    try {
      await deleteReader(leitorAtual?.matricula ?? '');
      setConfirmAction(null);
      onClose(true);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => onClose(false)}>
      <Modal.Header title={isEditMode ? 'Editar Leitor' : 'Detalhes do Leitor'} />
      <Modal.Body>
        {isLoadingDetalhes ? (
          <LoadingIcon />
        ) : (
          leitorAtual && (
            <div className="space-y-4">
              <ReaderForm
                formId="form-edit-leitor"
                initialData={
                  leitorDetalhes
                    ? { ...leitorDetalhes, penalidade: leitorDetalhes.penalidade ?? undefined }
                    : undefined
                }
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
          )
        )}
      </Modal.Body>
      <Modal.Footer className="justify-between w-full">
        {isEditMode ? (
          <DetailsModalActionFooter
            isEditMode={isEditMode}
            isUpdating={isUpdating}
            isDeleting={isDeleting}
            formId="form-edit-leitor"
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
        title={confirmAction === 'excluir' ? 'Excluir Leitor' : 'Resetar Senha'}
        message={
          confirmAction === 'excluir'
            ? `Tem certeza que deseja excluir o leitor ${leitorAtual?.nomeCompleto}?`
            : `A senha será redefinida para a matrícula: ${leitorAtual?.matricula}. Deseja continuar?`
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
