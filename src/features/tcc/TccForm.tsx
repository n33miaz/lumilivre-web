import { useState, useMemo, useEffect } from 'react';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useCursos } from '../../hooks/queries/useStudentQueries';
import { tccSchema, type TccFormData } from '../../schemas/tccSchema';
import { useToast } from '../../contexts/ToastContext';

import { Label } from '../../components/ui/Label';
import { Input } from '../../components/ui/Input';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { ImageUploader } from '../../components/ui/ImageUploader';

import UploadIcon from '../../assets/icons/upload.svg?react';
import type { TccResponse } from '../../services/thesisService';

interface TccFormProps {
  formId: string;
  initialData?: TccResponse | Partial<TccFormData>;
  readOnly?: boolean;
  onSubmit: (
    data: TccFormData,
    filePdf: File | null,
    fileFoto: File | null,
  ) => void;
}

export function TccForm({
  formId,
  initialData,
  readOnly = false,
  onSubmit,
}: TccFormProps) {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);

  const { addToast } = useToast();
  const { data: cursosList } = useCursos();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<TccFormData>({
    resolver: zodResolver(tccSchema) as unknown as Resolver<TccFormData>,
    defaultValues: {
      titulo: initialData?.titulo || '',
      alunos: initialData?.alunos || '',
      orientadores: initialData?.orientadores || '',
      // @ts-expect-error - O tipo pode ser misto
      curso_id: initialData?.curso_id || initialData?.curso || 0,
      anoConclusao:
        initialData?.anoConclusao || new Date().getFullYear().toString(),
      semestreConclusao: initialData?.semestreConclusao || '1',
      linkExterno: initialData?.linkExterno || '',
      ativo: initialData?.ativo ?? true,
    },
  });

  const cursosOptions = useMemo(() => {
    return (cursosList || []).map((c) => ({ label: c.nome, value: c.id }));
  }, [cursosList]);

  useEffect(() => {
    if (initialData && 'curso' in initialData && cursosList) {
      const cursoEncontrado = cursosList.find(
        (c) => c.nome === initialData.curso,
      );
      if (cursoEncontrado) {
        reset({
          ...initialData,
          curso_id: cursoEncontrado.id,
          linkExterno: initialData.linkExterno ?? undefined,
        } as unknown as TccFormData);
      }
    } else if (initialData) {
      reset({
        ...initialData,
        linkExterno: initialData.linkExterno ?? undefined,
      } as unknown as TccFormData);
    }
  }, [initialData, cursosList, reset]);

  const semestreOptions = [
    { label: '1º Semestre', value: '1' },
    { label: '2º Semestre', value: '2' },
  ];

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        addToast({
          type: 'warning',
          title: 'Formato inválido',
          description: 'Selecione um arquivo PDF.',
        });
        return;
      }
      setPdfFile(file);
    }
  };

  return (
    <form
      id={formId}
      onSubmit={handleSubmit((data) => onSubmit(data, pdfFile, fotoFile))}
      className="flex flex-col md:flex-row gap-6"
    >
      <div className="w-full md:w-[28%] flex flex-col items-center space-y-4 pt-1">
        <ImageUploader
          // @ts-expect-error - O tipo pode ser misto
          currentImage={initialData?.foto || null}
          onImageChange={setFotoFile}
          readOnly={readOnly}
          placeholderText="Capa do TCC"
        />
      </div>

      <div className="w-full md:w-[72%] space-y-4">
        <div>
          <Label htmlFor="titulo" requiredIndicator={!readOnly}>
            Título do Trabalho
          </Label>
          <Input
            id="titulo"
            {...register('titulo')}
            error={errors.titulo?.message}
            disabled={readOnly}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="alunos" requiredIndicator={!readOnly}>
              Alunos
            </Label>
            <Input
              id="alunos"
              {...register('alunos')}
              error={errors.alunos?.message}
              disabled={readOnly}
            />
          </div>
          <div>
            <Label htmlFor="orientadores">Orientadores</Label>
            <Input
              id="orientadores"
              {...register('orientadores')}
              disabled={readOnly}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label requiredIndicator={!readOnly}>Curso</Label>
            <Controller
              name="curso_id"
              control={control}
              render={({ field }) => (
                <div>
                  <SearchableSelect
                    value={field.value || ''}
                    onChange={field.onChange}
                    options={cursosOptions}
                    placeholder="Selecione"
                    disabled={readOnly}
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
              disabled={readOnly}
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
                  disabled={readOnly}
                />
              )}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="linkExterno">Link Externo (Repositório/Drive)</Label>
          <Input
            id="linkExterno"
            {...register('linkExterno')}
            disabled={readOnly}
          />
        </div>

        {readOnly ? (
          // @ts-expect-error - O tipo pode ser misto
          initialData?.arquivoPdf ? (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center justify-between">
              <span className="text-green-800 dark:text-green-200 font-medium text-sm">
                Arquivo PDF disponível
              </span>
              <a
                // @ts-expect-error - O tipo pode ser misto
                href={initialData.arquivoPdf}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-bold text-green-600 hover:underline"
              >
                Baixar
              </a>
            </div>
          ) : (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-center text-gray-500 text-sm">
              Nenhum arquivo PDF.
            </div>
          )
        ) : (
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-3 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/50">
            <UploadIcon className="w-6 h-6 mb-1 opacity-50 dark:invert" />
            <label
              htmlFor="pdfFile"
              className="cursor-pointer text-lumi-primary font-bold hover:underline text-sm text-center"
            >
              {pdfFile
                ? pdfFile.name
                : `Clique para ${initialData ? 'substituir o' : 'selecionar o'} PDF`}
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
                className="text-xs text-red-500 mt-1 hover:underline"
              >
                Remover
              </button>
            )}
          </div>
        )}
      </div>
    </form>
  );
}
