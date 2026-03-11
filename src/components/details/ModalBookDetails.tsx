import { useState, useEffect, useMemo } from 'react';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';

import { Modal } from '../Modal';
import { Label } from '../ui/Label';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { CustomSelect } from '../CustomSelect';
import { SearchableSelect } from '../SearchableSelect';
import { CustomDatePicker } from '../CustomDatePicker';
import { ConfirmModal } from '../ConfirmModal';
import { LoadingIcon } from '../LoadingIcon';

import {
  buscarLivroPorId,
  buscarLivrosParaAdmin,
  type LivroAgrupado,
  type LivroPayload,
} from '../../services/livroService';
import { useCdds, useEnum, useGeneros } from '../../hooks/useCommonQueries';
import {
  useUpdateBook,
  useDeleteBook,
} from '../../hooks/mutations/useBookMutations';
import { bookSchema, type BookFormData } from '../../schemas/bookSchema';

import uploadIconUrl from '../../assets/icons/download.svg';
import closeIcon from '../../assets/icons/close.svg';

interface DetalhesLivroModalProps {
  livro: LivroAgrupado | null;
  isOpen: boolean;
  onClose: (foiAtualizado?: boolean) => void;
}

export function DetalhesLivroModal({
  livro,
  isOpen,
  onClose,
}: DetalhesLivroModalProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [capaFile, setCapaFile] = useState<File | null>(null);
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);
  const [isNovoAutor, setIsNovoAutor] = useState(false);
  const [isNovaEditora, setIsNovaEditora] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'excluir' | null>(null);

  const { mutateAsync: updateBook, isPending: isUpdating } = useUpdateBook();
  const { mutateAsync: deleteBook } = useDeleteBook();

  const { data: cddData } = useCdds();
  const { data: classificacaoData } = useEnum('CLASSIFICACAO_ETARIA');
  const { data: tipoCapaData } = useEnum('TIPO_CAPA');
  const { data: generosData } = useGeneros();

  const { data: livroDetalhes, isLoading: isLoadingDetalhes } = useQuery({
    queryKey: ['livro', livro?.id],
    queryFn: () => buscarLivroPorId(livro!.id).then((res) => res.data),
    enabled: !!livro?.id && isOpen,
  });

  const { data: livrosData } = useQuery({
    queryKey: ['livros-auxiliares'],
    queryFn: () => buscarLivrosParaAdmin('', 0, 1000),
    staleTime: 1000 * 60 * 10,
    enabled: isOpen && isEditMode,
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BookFormData>({
    resolver: zodResolver(bookSchema) as unknown as Resolver<BookFormData>,
    defaultValues: {
      isbn: '',
      nome: '',
      data_lancamento: '',
      numero_paginas: 0,
      cdd: '',
      editora: '',
      classificacao_etaria: '',
      tipo_capa: '',
      autor: '',
      generos: [],
      sinopse: '',
      edicao: '',
      volume: 0,
    },
  });

  const generosSelecionados = watch('generos') || [];

  // Preenche o formulário quando os dados chegam
  useEffect(() => {
    if (livroDetalhes && isOpen) {
      reset({
        isbn: livroDetalhes.isbn,
        nome: livroDetalhes.nome,
        data_lancamento: livroDetalhes.data_lancamento
          ? livroDetalhes.data_lancamento.split('T')[0]
          : '',
        numero_paginas: livroDetalhes.numero_paginas,
        cdd: livroDetalhes.cddCodigo ? String(livroDetalhes.cddCodigo) : '',
        editora: livroDetalhes.editora,
        classificacao_etaria: livroDetalhes.classificacaoEtariaRaw
          ? String(livroDetalhes.classificacaoEtariaRaw)
          : '',
        tipo_capa: livroDetalhes.tipoCapaRaw
          ? String(livroDetalhes.tipoCapaRaw)
          : '',
        autor: livroDetalhes.autor || '',
        generos: livroDetalhes.generos || [],
        sinopse: livroDetalhes.sinopse || '',
        edicao: livroDetalhes.edicao || '',
        volume: livroDetalhes.volume || 0,
      });
      setImagemPreview(livroDetalhes.imagem || null);
      setCapaFile(null);
      setIsEditMode(false);
    }
  }, [livroDetalhes, isOpen, reset]);

  const cddOptions = useMemo(
    () =>
      cddData?.map((c) => ({
        label: `${c.id} - ${c.nome}`,
        value: String(c.id),
      })) || [],
    [cddData],
  );
  const classificacaoOptions = useMemo(
    () =>
      classificacaoData?.map((c) => ({ label: c.status, value: c.nome })) || [],
    [classificacaoData],
  );
  const tipoCapaOptions = useMemo(
    () => tipoCapaData?.map((c) => ({ label: c.status, value: c.nome })) || [],
    [tipoCapaData],
  );
  const generosOptions = useMemo(
    () => generosData?.map((g) => ({ label: g.nome, value: g.nome })) || [],
    [generosData],
  );

  const autoresOptions = useMemo(() => {
    const autoresSet = new Set(
      livrosData?.content?.map((l) => l.autor).filter(Boolean) || [],
    );
    return Array.from(autoresSet)
      .sort()
      .map((a) => ({ label: a, value: a }));
  }, [livrosData]);

  const editorasOptions = useMemo(() => {
    const editorasSet = new Set(
      livrosData?.content?.map((l) => l.editora).filter(Boolean) || [],
    );
    return Array.from(editorasSet)
      .sort()
      .map((e) => ({ label: e, value: e }));
  }, [livrosData]);

  if (!livro || !isOpen) return null;

  const handleClose = () => {
    setIsEditMode(false);
    onClose();
  };

  const onSubmit = async (data: BookFormData) => {
    try {
      const payload: LivroPayload = {
        ...data,
        cdd: data.cdd || '',
        tipo_capa: data.tipo_capa || '',
      } as LivroPayload;

      await updateBook({ id: livro.id, payload, file: capaFile });
      setIsEditMode(false);
      onClose(true);
    } catch (error) {
      console.error(error);
    }
  };

  const executarExclusao = async () => {
    try {
      await deleteBook(livro.isbn);
      setConfirmAction(null);
      onClose(true);
    } catch (error) {
      console.error(error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCapaFile(file);
      setImagemPreview(URL.createObjectURL(file));
    }
  };

  const handleAddGenero = (val: string) => {
    if (!generosSelecionados.includes(val)) {
      setValue('generos', [...generosSelecionados, val], {
        shouldValidate: true,
      });
    }
  };

  const removeGenero = (g: string) => {
    if (!isEditMode) return;
    setValue(
      'generos',
      generosSelecionados.filter((item) => item !== g),
      { shouldValidate: true },
    );
  };

  const linkActionStyles =
    'text-xs text-lumi-primary dark:text-lumi-label cursor-pointer hover:underline font-bold ml-2';

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <Modal.Header
        title={isEditMode ? 'Editando Livro' : 'Detalhes do Livro'}
      />

      <Modal.Body>
        {isLoadingDetalhes ? (
          <LoadingIcon />
        ) : (
          <form
            id="form-edit-livro"
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col md:flex-row gap-6"
          >
            {/* Coluna Esquerda */}
            <div className="w-full md:w-[28%] flex flex-col items-center space-y-4 pt-1">
              <div className="w-[9.5rem] h-[14rem] bg-gray-200 dark:bg-gray-700 rounded-lg shadow-lg flex items-center justify-center overflow-hidden border border-gray-300 dark:border-gray-600 relative group shrink-0">
                {imagemPreview ? (
                  <img
                    src={imagemPreview}
                    alt="Capa"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm text-gray-500 p-2 text-center">
                    Sem capa
                  </span>
                )}
                {isEditMode && (
                  <>
                    <label
                      htmlFor="capaFileModal"
                      className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer"
                    >
                      <img
                        src={uploadIconUrl}
                        alt="Upload"
                        className="h-8 w-8 invert mb-1"
                      />
                      <span className="text-white text-xs font-bold">
                        Trocar Imagem
                      </span>
                    </label>
                    <input
                      id="capaFileModal"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </>
                )}
              </div>

              <div className="w-full space-y-3">
                <div>
                  <Label htmlFor="edicao">Edição</Label>
                  <Input
                    id="edicao"
                    disabled={!isEditMode}
                    {...register('edicao')}
                  />
                </div>
                <div>
                  <Label htmlFor="volume">Volume</Label>
                  <Input
                    id="volume"
                    type="number"
                    disabled={!isEditMode}
                    {...register('volume')}
                  />
                </div>
                <div>
                  <Controller
                    name="data_lancamento"
                    control={control}
                    render={({ field }) => (
                      <CustomDatePicker
                        label="Lançamento"
                        value={field.value}
                        onChange={field.onChange}
                        disabled={!isEditMode}
                      />
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Coluna Direita */}
            <div className="w-full md:w-[72%] space-y-4">
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-4">
                  <Label htmlFor="isbn">ISBN</Label>
                  <Input id="isbn" disabled {...register('isbn')} />
                </div>
                <div className="col-span-8">
                  <Label htmlFor="nome" requiredIndicator={isEditMode}>
                    Título do Livro
                  </Label>
                  <Input
                    id="nome"
                    disabled={!isEditMode}
                    {...register('nome')}
                    error={errors.nome?.message}
                  />
                </div>
              </div>

              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-6">
                  <div className="flex justify-between items-center mb-1">
                    <Label className="mb-0" requiredIndicator={isEditMode}>
                      Autor
                    </Label>
                    {isEditMode && (
                      <span
                        onClick={() => setIsNovoAutor(!isNovoAutor)}
                        className={linkActionStyles}
                      >
                        {isNovoAutor ? 'Selecionar existente' : 'Novo?'}
                      </span>
                    )}
                  </div>
                  {isEditMode ? (
                    isNovoAutor ? (
                      <Input
                        placeholder="Digite o nome do autor"
                        {...register('autor')}
                        error={errors.autor?.message}
                      />
                    ) : (
                      <Controller
                        name="autor"
                        control={control}
                        render={({ field }) => (
                          <SearchableSelect
                            value={field.value}
                            onChange={field.onChange}
                            options={autoresOptions}
                            placeholder="Selecione o autor"
                          />
                        )}
                      />
                    )
                  ) : (
                    <Input disabled {...register('autor')} />
                  )}
                </div>

                <div className="col-span-6">
                  <div className="flex justify-between items-center mb-1">
                    <Label className="mb-0" requiredIndicator={isEditMode}>
                      Editora
                    </Label>
                    {isEditMode && (
                      <span
                        onClick={() => setIsNovaEditora(!isNovaEditora)}
                        className={linkActionStyles}
                      >
                        {isNovaEditora ? 'Selecionar existente' : 'Novo?'}
                      </span>
                    )}
                  </div>
                  {isEditMode ? (
                    isNovaEditora ? (
                      <Input
                        placeholder="Digite a editora"
                        {...register('editora')}
                        error={errors.editora?.message}
                      />
                    ) : (
                      <Controller
                        name="editora"
                        control={control}
                        render={({ field }) => (
                          <SearchableSelect
                            value={field.value}
                            onChange={field.onChange}
                            options={editorasOptions}
                            placeholder="Selecione a editora"
                          />
                        )}
                      />
                    )
                  ) : (
                    <Input disabled {...register('editora')} />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12">
                  <Label requiredIndicator={isEditMode}>Gêneros</Label>
                  {isEditMode && (
                    <div className="mb-2">
                      <SearchableSelect
                        value=""
                        onChange={handleAddGenero}
                        options={generosOptions}
                        placeholder="Selecione para adicionar..."
                      />
                    </div>
                  )}
                  <div
                    className={`flex flex-wrap gap-2 min-h-[38px] p-1 ${!isEditMode ? 'bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-700' : ''}`}
                  >
                    {generosSelecionados.map((g) => (
                      <span
                        key={g}
                        className="flex items-center bg-lumi-primary/10 text-lumi-primary dark:text-lumi-label dark:bg-gray-800 px-2 py-1 rounded-md text-xs font-bold border border-lumi-primary/20"
                      >
                        {g}
                        {isEditMode && (
                          <button
                            type="button"
                            onClick={() => removeGenero(g)}
                            className="ml-1 hover:bg-red-200 rounded-full p-0.5"
                          >
                            <img
                              src={closeIcon}
                              className="w-3 h-3 dark:invert"
                              alt="Remover"
                            />
                          </button>
                        )}
                      </span>
                    ))}
                    {generosSelecionados.length === 0 && (
                      <span className="text-xs text-gray-400 italic mt-1 ml-2">
                        Nenhum gênero selecionado
                      </span>
                    )}
                  </div>
                  {errors.generos && (
                    <span className="text-xs text-red-500 mt-1">
                      {errors.generos.message}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-4">
                  <Label>CDD</Label>
                  {isEditMode ? (
                    <Controller
                      name="cdd"
                      control={control}
                      render={({ field }) => (
                        <SearchableSelect
                          value={field.value || ''}
                          onChange={field.onChange}
                          options={cddOptions}
                          placeholder="Buscar..."
                        />
                      )}
                    />
                  ) : (
                    <Input disabled {...register('cdd')} />
                  )}
                </div>
                <div className="col-span-4">
                  <Label requiredIndicator={isEditMode}>Classificação</Label>
                  {isEditMode ? (
                    <Controller
                      name="classificacao_etaria"
                      control={control}
                      render={({ field }) => (
                        <CustomSelect
                          value={field.value}
                          onChange={field.onChange}
                          options={classificacaoOptions}
                          placeholder="Selecione"
                        />
                      )}
                    />
                  ) : (
                    <Input disabled {...register('classificacao_etaria')} />
                  )}
                </div>
                <div className="col-span-4">
                  <Label>Capa</Label>
                  {isEditMode ? (
                    <Controller
                      name="tipo_capa"
                      control={control}
                      render={({ field }) => (
                        <CustomSelect
                          value={field.value || ''}
                          onChange={field.onChange}
                          options={tipoCapaOptions}
                          placeholder="Selecione"
                        />
                      )}
                    />
                  ) : (
                    <Input disabled {...register('tipo_capa')} />
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="sinopse">Sinopse</Label>
                <textarea
                  id="sinopse"
                  disabled={!isEditMode}
                  {...register('sinopse')}
                  className={`w-full px-3 border rounded-md outline-none text-sm h-auto min-h-[80px] py-2 resize-none ${
                    isEditMode
                      ? 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-lumi-primary'
                      : 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  }`}
                  rows={3}
                />
              </div>
            </div>
          </form>
        )}
      </Modal.Body>

      <Modal.Footer className="justify-between w-full">
        <Button
          variant="danger"
          onClick={() => setConfirmAction('excluir')}
          disabled={isUpdating || isEditMode || isLoadingDetalhes}
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
              form="form-edit-livro"
              variant="success"
              isLoading={isUpdating}
            >
              Salvar Alterações
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => setIsEditMode(true)}
            disabled={isLoadingDetalhes}
          >
            Editar Cadastro
          </Button>
        )}
      </Modal.Footer>

      <ConfirmModal
        isOpen={confirmAction === 'excluir'}
        title="Excluir Livro"
        message={`Tem certeza que deseja excluir o livro "${livro.nome}" e TODOS os seus exemplares junto?\nEsta ação não pode ser desfeita.`}
        isDestructive={true}
        onConfirm={executarExclusao}
        onCancel={() => setConfirmAction(null)}
      />
    </Modal>
  );
}
