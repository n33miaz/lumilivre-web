import { useState, useMemo } from 'react';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useToast } from '../../contexts/ToastContext';
import { useCursos } from '../../hooks/useCommonQueries';
import { useCreateTcc } from '../../hooks/mutations/useTccMutations';
import { tccSchema, type TccFormData } from '../../schemas/tccSchema';

import { Label } from '../ui/Label';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { CustomSelect } from '../CustomSelect';

import uploadIconUrl from '../../assets/icons/upload.svg';
import type { TccPayload } from '../../services/tccService';

interface NewTccProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function NovoTcc({ onClose, onSuccess }: NewTccProps) {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);

  const { addToast } = useToast();
  const { data: cursosList } = useCursos();
  const { mutateAsync: createTcc, isPending } = useCreateTcc();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<TccFormData>({
    resolver: zodResolver(tccSchema) as unknown as Resolver<TccFormData>,
    defaultValues: {
      anoConclusao: new Date().getFullYear().toString(),
      semestreConclusao: '1',
      ativo: true,
      curso_id: 0,
      titulo: '',
      alunos: '',
    },
  });

  const cursosOptions = useMemo(() => {
    return (cursosList || []).map((c) => ({ label: c.nome, value: c.id }));
  }, [cursosList]);

  const semestreOptions = [
    { label: '1º Semestre', value: '1' },
    { label: '2º Semestre', value: '2' },
  ];

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        addToast({
          type: 'warning',
          title: 'Formato inválido',
          description: 'Por favor, selecione um arquivo PDF.',
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
      await createTcc({
        payload: data as unknown as TccPayload,
        filePdf: pdfFile,
        fileFoto: fotoFile,
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[600px] overflow-hidden">
      <form
        id="form-novo-tcc"
        onSubmit={handleSubmit(onSubmit)}
        className="overflow-y-auto p-1 flex-grow custom-scrollbar pr-2 space-y-4"
      >
        <div className="flex flex-col md:flex-row gap-6">
          {/* Coluna Esquerda (Capa) */}
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
                  Capa do TCC (Opcional)
                </span>
              )}
              <label
                htmlFor="fotoFile"
                className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
              >
                <img
                  src={uploadIconUrl}
                  alt="Upload"
                  className="h-8 w-8 invert mb-1"
                />
                <span className="text-white text-xs font-bold">
                  Alterar Capa
                </span>
              </label>
              <input
                id="fotoFile"
                type="file"
                onChange={handleFotoChange}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>

          {/* Coluna Direita (Dados) */}
          <div className="w-full md:w-[72%] space-y-4">
            <div>
              <Label htmlFor="titulo" requiredIndicator>
                Título do Trabalho
              </Label>
              <Input
                id="titulo"
                placeholder="Ex: Sistema de Gerenciamento..."
                {...register('titulo')}
                error={errors.titulo?.message}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="alunos" requiredIndicator>
                  Alunos
                </Label>
                <Input
                  id="alunos"
                  placeholder="João, Maria, José"
                  {...register('alunos')}
                  error={errors.alunos?.message}
                />
              </div>
              <div>
                <Label htmlFor="orientadores">Orientadores</Label>
                <Input
                  id="orientadores"
                  placeholder="Prof. Adriano, Jacques"
                  {...register('orientadores')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label requiredIndicator>Curso</Label>
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
              </div>
              <div>
                <Label htmlFor="anoConclusao">Ano de Conclusão</Label>
                <Input
                  id="anoConclusao"
                  type="number"
                  {...register('anoConclusao')}
                  error={errors.anoConclusao?.message}
                />
              </div>
              <div>
                <Label>Semestre</Label>
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
              </div>
            </div>

            <div>
              <Label htmlFor="linkExterno">
                Link Externo (Repositório/Drive)
              </Label>
              <Input
                id="linkExterno"
                placeholder="https://..."
                {...register('linkExterno')}
              />
            </div>

            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/50">
              <img
                src={uploadIconUrl}
                alt="Upload"
                className="w-8 h-8 mb-2 opacity-50 dark:invert"
              />
              <label
                htmlFor="pdfFile"
                className="cursor-pointer text-lumi-primary font-bold hover:underline text-sm"
              >
                {pdfFile ? pdfFile.name : 'Clique para selecionar o PDF do TCC'}
              </label>
              <input
                id="pdfFile"
                type="file"
                accept="application/pdf"
                onChange={handlePdfChange}
                className="hidden"
              />
              {pdfFile && (
                <button
                  type="button"
                  onClick={() => setPdfFile(null)}
                  className="text-xs text-red-500 mt-2 hover:underline"
                >
                  Remover
                </button>
              )}
            </div>
          </div>
        </div>
      </form>

      <div className="pt-3 mt-4 border-t border-gray-200 dark:border-gray-700 shrink-0">
        <Button
          type="submit"
          form="form-novo-tcc"
          isLoading={isPending}
          className="w-full py-3.5 text-[17px]"
        >
          CADASTRAR TCC
        </Button>
      </div>
    </div>
  );
}
