import { useState, useEffect, useMemo } from 'react';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  buscarLivrosParaAdmin,
  type LivroPayload,
} from '../../services/livroService';
import { buscarLivroPorIsbn } from '../../services/googleBooksService';
import { useCdds, useEnum, useGeneros } from '../../hooks/useCommonQueries';
import { useCreateBook } from '../../hooks/mutations/useBookMutations';
import { bookSchema, type BookFormData } from '../../schemas/bookSchema';

import { Label } from '../ui/Label';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { CustomSelect } from '../CustomSelect';
import { SearchableSelect } from '../SearchableSelect';
import { CustomDatePicker } from '../CustomDatePicker';

import uploadIconUrl from '../../assets/icons/download.svg';
import closeIcon from '../../assets/icons/close.svg';

interface Option {
  label: string;
  value: string | number;
}

interface NewBookProps {
  onClose: () => void;
  onSuccess: (livroCriado?: unknown) => void;
}

export function NovoLivro({ onClose, onSuccess }: NewBookProps) {
  const [capaFile, setCapaFile] = useState<File | null>(null);
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);
  const [isBuscandoIsbn, setIsBuscandoIsbn] = useState(false);

  const [isNovoAutor, setIsNovoAutor] = useState(false);
  const [isNovaEditora, setIsNovaEditora] = useState(false);

  const [autoresOptions, setAutoresOptions] = useState<Option[]>([]);
  const [editorasOptions, setEditorasOptions] = useState<Option[]>([]);

  const { data: cddData } = useCdds();
  const { data: generosData } = useGeneros();
  const { data: classificacaoData } = useEnum('CLASSIFICACAO_ETARIA');
  const { data: tipoCapaData } = useEnum('TIPO_CAPA');

  const { mutateAsync: createBook, isPending: isCreating } = useCreateBook();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
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

  const generosSelecionados = watch('generos');

  const cddOptions = useMemo(
    () =>
      cddData?.map((c) => ({
        label: `${c.id} - ${c.nome}`,
        value: String(c.id),
      })) || [],
    [cddData],
  );
  const generosOptions = useMemo(
    () => generosData?.map((g) => ({ label: g.nome, value: g.nome })) || [],
    [generosData],
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

  useEffect(() => {
    const carregarAutoresEEditoras = async () => {
      try {
        const livrosData = await buscarLivrosParaAdmin('', 0, 1000);
        const autoresUnicos = Array.from(
          new Set(livrosData.content.map((l) => l.autor).filter(Boolean)),
        ).sort();
        setAutoresOptions(autoresUnicos.map((a) => ({ label: a, value: a })));

        const editorasUnicas = Array.from(
          new Set(livrosData.content.map((l) => l.editora).filter(Boolean)),
        ).sort();
        setEditorasOptions(editorasUnicas.map((e) => ({ label: e, value: e })));
      } catch (error) {
        console.error('Erro ao carregar autores e editoras', error);
      }
    };
    carregarAutoresEEditoras();
  }, []);

  const handleIsbnBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const isbn = e.target.value.replace(/-/g, '');
    if (isbn.length === 10 || isbn.length === 13) {
      setIsBuscandoIsbn(true);
      try {
        const dados = await buscarLivroPorIsbn(isbn);
        if (dados) {
          setValue('nome', dados.nome || '');
          setValue('data_lancamento', dados.data_lancamento || '');
          setValue('numero_paginas', dados.numero_paginas || 0);
          setValue('sinopse', dados.sinopse || '');

          if (dados.autor) {
            setValue('autor', dados.autor);
            setIsNovoAutor(true);
          }
          if (dados.editora) {
            setValue('editora', dados.editora);
            setIsNovaEditora(true);
          }
          if (dados.generos) {
            setValue('generos', dados.generos);
          }
          if (dados.imagem) setImagemPreview(dados.imagem);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsBuscandoIsbn(false);
      }
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
    setValue(
      'generos',
      generosSelecionados.filter((item) => item !== g),
      { shouldValidate: true },
    );
  };

  const onSubmit = async (data: BookFormData) => {
    try {
      const payload: LivroPayload = {
        ...data,
        cdd: data.cdd || '',
        tipo_capa: data.tipo_capa || '',
      } as LivroPayload;

      const response = await createBook({ payload, file: capaFile });
      onSuccess(response);
      onClose();
    } catch (error) {
      console.error('Erro no submit:', error);
    }
  };

  const linkActionStyles =
    'text-xs text-lumi-primary dark:text-lumi-label cursor-pointer hover:underline font-bold ml-2';

  return (
    <div className="flex flex-col h-full max-h-[600px] overflow-hidden">
      <form
        id="form-novo-livro"
        onSubmit={handleSubmit(onSubmit)}
        className="overflow-y-auto overflow-x-hidden p-1 flex-grow pr-2 custom-scrollbar"
      >
        <div className="flex flex-col md:flex-row gap-6">
          {/* Coluna da Esquerda (Capa e Infos Menores) */}
          <div className="w-full md:w-[28%] flex flex-col items-center space-y-4 pt-1">
            <div className="w-[9.5rem] h-[14rem] bg-gray-200 dark:bg-gray-700 rounded-lg shadow-lg flex items-center justify-center overflow-hidden border border-gray-300 dark:border-gray-600 relative group shrink-0">
              {isBuscandoIsbn ? (
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 border-4 border-lumi-primary border-t-transparent rounded-full animate-spin mb-2"></div>
                  <span className="text-xs text-gray-500">Buscando...</span>
                </div>
              ) : imagemPreview ? (
                <img
                  src={imagemPreview}
                  alt="Capa"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm text-gray-500 text-center p-2">
                  Capa do Livro
                </span>
              )}
              <label
                htmlFor="capaFile"
                className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer"
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
                id="capaFile"
                type="file"
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            <div className="w-full space-y-3">
              <div>
                <Label htmlFor="edicao">Edição</Label>
                <Input
                  id="edicao"
                  placeholder="Ex: 1ª"
                  {...register('edicao')}
                />
              </div>
              <div>
                <Label htmlFor="volume">Volume</Label>
                <Input
                  id="volume"
                  type="number"
                  placeholder="Ex: 1"
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
                    />
                  )}
                />
              </div>
            </div>
          </div>

          {/* Coluna da Direita (Infos Principais) */}
          <div className="w-full md:w-[72%] space-y-4">
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-4">
                <Label htmlFor="isbn" requiredIndicator>
                  ISBN
                </Label>
                <Input
                  id="isbn"
                  placeholder="Buscar..."
                  {...register('isbn')}
                  onBlur={handleIsbnBlur}
                  error={errors.isbn?.message}
                />
              </div>
              <div className="col-span-8">
                <Label htmlFor="nome" requiredIndicator>
                  Título do Livro
                </Label>
                <Input
                  id="nome"
                  {...register('nome')}
                  error={errors.nome?.message}
                />
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-6">
                <div className="flex justify-between items-center mb-1">
                  <Label className="mb-0" requiredIndicator>
                    Autor
                  </Label>
                  <span
                    onClick={() => setIsNovoAutor(!isNovoAutor)}
                    className={linkActionStyles}
                  >
                    {isNovoAutor ? 'Selecionar existente' : 'Novo?'}
                  </span>
                </div>
                {isNovoAutor ? (
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
                      <div>
                        <SearchableSelect
                          value={field.value}
                          onChange={field.onChange}
                          options={autoresOptions}
                          placeholder="Selecione o autor"
                        />
                        {errors.autor && (
                          <span className="text-xs text-red-500 mt-1">
                            {errors.autor.message}
                          </span>
                        )}
                      </div>
                    )}
                  />
                )}
              </div>
              <div className="col-span-6">
                <div className="flex justify-between items-center mb-1">
                  <Label className="mb-0" requiredIndicator>
                    Editora
                  </Label>
                  <span
                    onClick={() => setIsNovaEditora(!isNovaEditora)}
                    className={linkActionStyles}
                  >
                    {isNovaEditora ? 'Selecionar existente' : 'Novo?'}
                  </span>
                </div>
                {isNovaEditora ? (
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
                      <div>
                        <SearchableSelect
                          value={field.value}
                          onChange={field.onChange}
                          options={editorasOptions}
                          placeholder="Selecione a editora"
                        />
                        {errors.editora && (
                          <span className="text-xs text-red-500 mt-1">
                            {errors.editora.message}
                          </span>
                        )}
                      </div>
                    )}
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12">
                <Label requiredIndicator>Gêneros</Label>
                <div className="flex gap-2 mb-2">
                  <div className="w-full">
                    <SearchableSelect
                      value=""
                      onChange={handleAddGenero}
                      options={generosOptions}
                      placeholder="Selecione para adicionar..."
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 min-h-[32px]">
                  {generosSelecionados?.map((g) => (
                    <span
                      key={g}
                      className="flex items-center bg-lumi-primary/10 text-lumi-primary dark:text-lumi-label dark:bg-gray-700 px-2 py-1 rounded-md text-xs font-bold border border-lumi-primary/20"
                    >
                      {g}
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
                    </span>
                  ))}
                  {(!generosSelecionados ||
                    generosSelecionados.length === 0) && (
                    <span className="text-xs text-gray-400 italic mt-1">
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
              </div>
              <div className="col-span-4">
                <Label requiredIndicator>Classificação</Label>
                <Controller
                  name="classificacao_etaria"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <CustomSelect
                        value={field.value}
                        onChange={field.onChange}
                        options={classificacaoOptions}
                        placeholder="Selecione"
                      />
                      {errors.classificacao_etaria && (
                        <span className="text-xs text-red-500 mt-1">
                          {errors.classificacao_etaria.message}
                        </span>
                      )}
                    </div>
                  )}
                />
              </div>
              <div className="col-span-4">
                <Label>Capa</Label>
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
              </div>
            </div>

            <div>
              <Label htmlFor="sinopse">Sinopse</Label>
              <textarea
                id="sinopse"
                {...register('sinopse')}
                className="w-full px-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-lumi-primary outline-none text-sm h-auto min-h-[80px] py-2 resize-none"
                rows={3}
              />
            </div>
          </div>
        </div>
      </form>

      <div className="pt-3 mt-2 border-t border-gray-200 dark:border-gray-700 shrink-0">
        <Button
          type="submit"
          form="form-novo-livro"
          isLoading={isCreating || isBuscandoIsbn}
          loadingText={isBuscandoIsbn ? 'BUSCANDO DADOS...' : 'SALVANDO...'}
          className="w-full py-3.5 text-[17px]"
        >
          CADASTRAR LIVRO
        </Button>
      </div>
    </div>
  );
}
