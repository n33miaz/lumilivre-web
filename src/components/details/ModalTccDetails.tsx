import { useState, useEffect, useMemo } from 'react';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Modal } from '../Modal';
import { ConfirmModal } from '../ConfirmModal';
import { Label } from '../ui/Label';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { CustomSelect } from '../CustomSelect';

import { type TccResponse, type TccPayload } from '../../services/tccService';
import { useCursos } from '../../hooks/useCommonQueries';
import {
  useUpdateTcc,
  useDeleteTcc,
} from '../../hooks/mutations/useTccMutations';
import { tccSchema, type TccFormData } from '../../schemas/tccSchema';
import { useToast } from '../../contexts/ToastContext';

import DownloadIcon from '../../assets/icons/upload.svg?react';
import UploadIcon from '../../assets/icons/upload.svg';

interface ModalTccDetailsProps {
  tcc: TccResponse | null;
  isOpen: boolean;
  onClose: (foiAlterado?: boolean) => void;
}

export function ModalTccDetails({
  tcc,
  isOpen,
  onClose,
}: ModalTccDetailsProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<'excluir' | null>(null);

  const { addToast } = useToast();
  const { data: cursosList } = useCursos();
  const { mutateAsync: updateTcc, isPending: isUpdating } = useUpdateTcc();
  const { mutateAsync: deleteTcc, isPending: isDeleting } = useDeleteTcc();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<TccFormData>({
    resolver: zodResolver(tccSchema) as unknown as Resolver<TccFormData>,
    defaultValues: {
      titulo: '',
      alunos: '',
      orientadores: '',
      curso_id: 0,
      anoConclusao: new Date().getFullYear().toString(),
      semestreConclusao: '1',
      linkExterno: '',
      ativo: true,
    },
  });

  const cursosOptions = useMemo(() => {
    return (cursosList || []).map((c) => ({ label: c.nome, value: c.id }));
  }, [cursosList]);

  const semestreOptions = [
    { label: '1º Semestre', value: '1' },
    { label: '2º Semestre', value: '2' },
  ];

  useEffect(() => {
    if (tcc && isOpen) {
      setIsEditMode(false);
      setPdfFile(null);
      setFotoFile(null);
      setFotoPreview(tcc.foto || null);

      const cursoEncontrado = cursosList?.find((c) => c.nome === tcc.curso);

      reset({
        titulo: tcc.titulo,
        alunos: tcc.alunos,
        orientadores: tcc.orientadores || '',
        curso_id: cursoEncontrado ? cursoEncontrado.id : 0,
        anoConclusao: tcc.anoConclusao,
        semestreConclusao: tcc.semestreConclusao,
        linkExterno: tcc.linkExterno || '',
        ativo: tcc.ativo,
      });
    }
  }, [tcc, isOpen, cursosList, reset]);

  if (!isOpen || !tcc) return null;

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        addToast({
          type: 'warning',
          title: 'Formato inválido',
          description: 'Selecione um PDF.',
        });
        return;
      }
      setPdfFile(file);
    }
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFotoFile(file);
      setFotoPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: TccFormData) => {
    try {
      await updateTcc({
        id: tcc.id,
        payload: data as TccPayload,
        filePdf: pdfFile,
        fileFoto: fotoFile,
      });
      setIsEditMode(false);
      onClose(true);
    } catch (error) {
      console.error(error);
    }
  };

  const executarExclusao = async () => {
    try {
      await deleteTcc(tcc.id);
      setConfirmAction(null);
      onClose(true);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDownload = () => {
    if (tcc.arquivoPdf) window.open(tcc.arquivoPdf, '_blank');
  };

  return (
    <Modal isOpen={isOpen} onClose={() => onClose(false)}>
      <Modal.Header title={isEditMode ? 'Editar TCC' : 'Detalhes do TCC'} />

      <Modal.Body>
        <form
          id="form-edit-tcc"
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col md:flex-row gap-6"
        >
          {/* Coluna Esquerda */}
          <div className="w-full md:w-[28%] flex flex-col items-center space-y-4 pt-1">
            <div className="w-[9.5rem] h-[14rem] bg-gray-200 dark:bg-gray-700 rounded-lg shadow-lg flex items-center justify-center overflow-hidden border border-gray-300 dark:border-gray-600 relative group shrink-0">
              {fotoPreview ? (
                <img
                  src={fotoPreview}
                  alt="Capa TCC"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm text-gray-500 text-center p-2">
                  Capa do TCC
                </span>
              )}
              {isEditMode && (
                <>
                  <label
                    htmlFor="fotoFileEdit"
                    className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer"
                  >
                    <img
                      src={UploadIcon}
                      alt="Upload"
                      className="h-8 w-8 invert mb-1"
                    />
                    <span className="text-white text-xs font-bold">
                      Trocar Imagem
                    </span>
                  </label>
                  <input
                    id="fotoFileEdit"
                    type="file"
                    accept="image/*"
                    onChange={handleFotoChange}
                    className="hidden"
                  />
                </>
              )}
            </div>
          </div>

          {/* Coluna Direita */}
          <div className="w-full md:w-[72%] space-y-4">
            <div>
              <Label htmlFor="titulo" requiredIndicator={isEditMode}>
                Título
              </Label>
              <Input
                id="titulo"
                disabled={!isEditMode}
                {...register('titulo')}
                error={errors.titulo?.message}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="alunos" requiredIndicator={isEditMode}>
                  Alunos
                </Label>
                <Input
                  id="alunos"
                  disabled={!isEditMode}
                  {...register('alunos')}
                  error={errors.alunos?.message}
                />
              </div>
              <div>
                <Label htmlFor="orientadores">Orientadores</Label>
                <Input
                  id="orientadores"
                  disabled={!isEditMode}
                  {...register('orientadores')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label requiredIndicator={isEditMode}>Curso</Label>
                {isEditMode ? (
                  <Controller
                    name="curso_id"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <CustomSelect
                          value={field.value || ''}
                          onChange={field.onChange}
                          options={cursosOptions}
                          placeholder="Selecione"
                        />
                        {errors.curso_id && (
                          <span className="text-xs text-red-500 mt-1">
                            {errors.curso_id.message}
                          </span>
                        )}
                      </div>
                    )}
                  />
                ) : (
                  <Input disabled value={tcc.curso} />
                )}
              </div>
              <div>
                <Label htmlFor="anoConclusao">Ano</Label>
                <Input
                  id="anoConclusao"
                  type="number"
                  disabled={!isEditMode}
                  {...register('anoConclusao')}
                  error={errors.anoConclusao?.message}
                />
              </div>
              <div>
                <Label>Semestre</Label>
                {isEditMode ? (
                  <Controller
                    name="semestreConclusao"
                    control={control}
                    render={({ field }) => (
                      <CustomSelect
                        value={field.value}
                        onChange={field.onChange}
                        options={semestreOptions}
                        placeholder="Selecione"
                      />
                    )}
                  />
                ) : (
                  <Input disabled value={`${tcc.semestreConclusao}º`} />
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="linkExterno">Link Externo</Label>
              {isEditMode ? (
                <Input id="linkExterno" {...register('linkExterno')} />
              ) : tcc.linkExterno ? (
                <a
                  href={tcc.linkExterno}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-lumi-primary hover:underline break-all block p-2"
                >
                  {tcc.linkExterno}
                </a>
              ) : (
                <Input disabled value="-" />
              )}
            </div>

            {isEditMode ? (
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/50">
                <img
                  src={UploadIcon}
                  alt="Upload"
                  className="w-8 h-8 mb-2 opacity-50 dark:invert"
                />
                <label
                  htmlFor="pdfFileEdit"
                  className="cursor-pointer text-lumi-primary font-bold hover:underline text-sm"
                >
                  {pdfFile
                    ? pdfFile.name
                    : 'Clique para substituir o PDF (Opcional)'}
                </label>
                <input
                  id="pdfFileEdit"
                  type="file"
                  accept="application/pdf"
                  onChange={handlePdfChange}
                  className="hidden"
                />
              </div>
            ) : tcc.arquivoPdf ? (
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center justify-between">
                <span className="text-green-800 dark:text-green-200 font-medium text-sm">
                  Arquivo PDF disponível
                </span>
                <Button
                  type="button"
                  variant="success"
                  onClick={handleDownload}
                  className="py-1.5 px-3 text-sm"
                >
                  <DownloadIcon className="w-4 h-4 text-white mr-2" /> Baixar
                </Button>
              </div>
            ) : (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-center text-gray-500 text-sm">
                Nenhum arquivo PDF anexado.
              </div>
            )}
          </div>
        </form>
      </Modal.Body>

      <Modal.Footer className="justify-between w-full">
        <Button
          variant="danger"
          onClick={() => setConfirmAction('excluir')}
          disabled={isUpdating || isEditMode}
          isLoading={isDeleting}
        >
          Excluir
        </Button>

        {isEditMode ? (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => setIsEditMode(false)}
              disabled={isUpdating}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="form-edit-tcc"
              variant="success"
              isLoading={isUpdating}
            >
              Salvar Alterações
            </Button>
          </div>
        ) : (
          <Button onClick={() => setIsEditMode(true)}>Editar Cadastro</Button>
        )}
      </Modal.Footer>

      <ConfirmModal
        isOpen={confirmAction === 'excluir'}
        title="Excluir TCC"
        message={`Tem certeza que deseja excluir o TCC "${tcc.titulo}"?`}
        isDestructive={true}
        onConfirm={executarExclusao}
        onCancel={() => setConfirmAction(null)}
      />
    </Modal>
  );
}
