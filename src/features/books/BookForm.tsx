import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';

import { buscarLivrosParaAdmin } from '../../services/bookService';
import { buscarLivroPorIsbn } from '../../services/googleBooksService';
import {
  useGeneros,
  useCdds,
  useEnum,
} from '../../hooks/queries/useBookQueries';
import {
  bookSchema,
  MIN_ISBN_LENGTH,
  type BookFormData,
} from '../../schemas/bookSchema';

import { Label } from '../../components/ui/Label';
import { Input } from '../../components/ui/Input';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { CustomDatePicker } from '../../components/ui/CustomDatePicker';
import { ImageUploader } from '../../components/ui/ImageUploader';

import closeIcon from '../../assets/icons/close.svg';

interface Option {
  label: string;
  value: string | number;
}

/** Cabeçalho de seção com divisória, para agrupar os campos por afinidade. */
function FormSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-lumi-primary dark:text-lumi-label whitespace-nowrap">
          {title}
        </h3>
        <span className="h-px flex-1 bg-gray-200 dark:bg-white/10" />
      </div>
      {children}
    </section>
  );
}

/** Spinner inline para indicar carregamento (autofill de ISBN). */
function InlineSpinner({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"
      />
    </svg>
  );
}

interface BookFormProps {
  formId: string;
  initialData?: Partial<BookFormData> & { imagem?: string | null };
  readOnly?: boolean;
  onSubmit: (data: BookFormData, file: File | null) => void;
}

export function BookForm({
  formId,
  initialData,
  readOnly = false,
  onSubmit,
}: BookFormProps) {
  const { t } = useTranslation('book');
  const [capaFile, setCapaFile] = useState<File | null>(null);
  const [isBuscandoIsbn, setIsBuscandoIsbn] = useState(false);

  const [isNovoAutor, setIsNovoAutor] = useState(false);
  const [isNovaEditora, setIsNovaEditora] = useState(false);

  const [autoresOptions, setAutoresOptions] = useState<Option[]>([]);
  const [editorasOptions, setEditorasOptions] = useState<Option[]>([]);

  const { data: cddData } = useCdds();
  const { data: generosData } = useGeneros();
  const { data: classificacaoData } = useEnum('CLASSIFICACAO_ETARIA');
  const { data: tipoCapaData } = useEnum('TIPO_CAPA');

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
      isbn: initialData?.isbn || '',
      nome: initialData?.nome || '',
      data_lancamento: initialData?.data_lancamento || '',
      numero_paginas: initialData?.numero_paginas || 0,
      cdd: initialData?.cdd || '',
      editora: initialData?.editora || '',
      classificacao_etaria: initialData?.classificacao_etaria || '',
      tipo_capa: initialData?.tipo_capa || '',
      autor: initialData?.autor || '',
      generos: initialData?.generos || [],
      sinopse: initialData?.sinopse || '',
      edicao: initialData?.edicao || '',
      volume: initialData?.volume || 0,
    },
  });

  const generosSelecionados = watch('generos');

  const cddOptions = useMemo(
    () =>
      cddData?.map((c) => ({
        label: t('cdd.option', { code: c.id, name: c.nome }),
        value: String(c.id),
      })) || [],
    [cddData, t],
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
    if (readOnly || initialData?.isbn) return;

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
          if (dados.generos) setValue('generos', dados.generos);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsBuscandoIsbn(false);
      }
    }
  };

  const handleAddGenero = (val: string) => {
    if (!readOnly && !generosSelecionados.includes(val)) {
      setValue('generos', [...generosSelecionados, val], {
        shouldValidate: true,
      });
    }
  };

  const removeGenero = (g: string) => {
    if (!readOnly) {
      setValue(
        'generos',
        generosSelecionados.filter((item) => item !== g),
        { shouldValidate: true },
      );
    }
  };

  // O zod devolve **chave** de i18n (ver `bookSchema`); a tradução acontece
  // aqui, junto com os valores que saíram das frases (ex.: tamanho do ISBN).
  const fieldError = (message?: string, values?: Record<string, unknown>) =>
    message ? t(message, values) : undefined;

  const toggleActionStyles =
    'text-xs text-lumi-primary dark:text-lumi-label cursor-pointer hover:underline font-bold rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-lumi-primary';

  return (
    <form
      id={formId}
      onSubmit={handleSubmit((data) => onSubmit(data, capaFile))}
      className="flex flex-col md:flex-row gap-6"
    >
      {/* Coluna lateral: apenas a capa. */}
      <div className="w-full md:w-[28%] flex flex-col items-center gap-3 pt-1">
        <ImageUploader
          currentImage={initialData?.imagem}
          onImageChange={setCapaFile}
          readOnly={readOnly}
          placeholderText={
            isBuscandoIsbn
              ? t('form.cover.searching')
              : t('form.cover.placeholder')
          }
        />
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
          {readOnly ? t('form.cover.readonly') : t('form.cover.hint')}
        </p>
      </div>

      {/* Coluna principal: campos agrupados por seção. */}
      <div className="w-full md:w-[72%] space-y-6">
        <FormSection title={t('form.section.identification')}>
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 sm:col-span-4">
              <Label htmlFor="isbn" requiredIndicator={!readOnly}>
                {t('form.field.isbn')}
              </Label>
              <div className="relative">
                <Input
                  id="isbn"
                  inputMode="numeric"
                  autoComplete="off"
                  disabled={readOnly || !!initialData?.isbn}
                  {...register('isbn')}
                  onBlur={handleIsbnBlur}
                  error={fieldError(errors.isbn?.message, {
                    min: MIN_ISBN_LENGTH,
                  })}
                />
                {isBuscandoIsbn && (
                  <span className="pointer-events-none absolute right-2.5 top-[11px] text-lumi-primary dark:text-lumi-label">
                    <InlineSpinner />
                  </span>
                )}
              </div>
              {isBuscandoIsbn && (
                <span className="mt-1 block text-xs text-lumi-primary dark:text-lumi-label animate-fade-in">
                  {t('form.isbn.lookup')}
                </span>
              )}
            </div>
            <div className="col-span-12 sm:col-span-8">
              <Label htmlFor="nome" requiredIndicator={!readOnly}>
                {t('form.field.book_title')}
              </Label>
              <Input
                id="nome"
                disabled={readOnly}
                {...register('nome')}
                error={fieldError(errors.nome?.message)}
              />
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 sm:col-span-6">
              <div className="flex justify-between items-center mb-1 gap-2">
                <Label className="mb-0" requiredIndicator={!readOnly}>
                  {t('form.field.author')}
                </Label>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => setIsNovoAutor(!isNovoAutor)}
                    className={toggleActionStyles}
                    aria-pressed={isNovoAutor}
                  >
                    {isNovoAutor
                      ? t('form.author.toggle_existing')
                      : t('form.author.toggle_new')}
                  </button>
                )}
              </div>
              {readOnly || isNovoAutor ? (
                <Input
                  disabled={readOnly}
                  placeholder={t('form.author.placeholder')}
                  {...register('autor')}
                  error={fieldError(errors.autor?.message)}
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
                        placeholder={t('form.author.select')}
                      />
                      {errors.autor && (
                        <span className="text-xs text-red-500 mt-1 block">
                          {fieldError(errors.autor.message)}
                        </span>
                      )}
                    </div>
                  )}
                />
              )}
            </div>

            <div className="col-span-12 sm:col-span-6">
              <div className="flex justify-between items-center mb-1 gap-2">
                <Label className="mb-0" requiredIndicator={!readOnly}>
                  {t('form.field.publisher')}
                </Label>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => setIsNovaEditora(!isNovaEditora)}
                    className={toggleActionStyles}
                    aria-pressed={isNovaEditora}
                  >
                    {isNovaEditora
                      ? t('form.publisher.toggle_existing')
                      : t('form.publisher.toggle_new')}
                  </button>
                )}
              </div>
              {readOnly || isNovaEditora ? (
                <Input
                  disabled={readOnly}
                  placeholder={t('form.publisher.placeholder')}
                  {...register('editora')}
                  error={fieldError(errors.editora?.message)}
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
                        placeholder={t('form.publisher.select')}
                      />
                      {errors.editora && (
                        <span className="text-xs text-red-500 mt-1 block">
                          {fieldError(errors.editora.message)}
                        </span>
                      )}
                    </div>
                  )}
                />
              )}
            </div>
          </div>
        </FormSection>

        <FormSection title={t('form.section.classification')}>
          <div>
            <Label requiredIndicator={!readOnly}>
              {t('form.field.genres')}
            </Label>
            {!readOnly && (
              <div className="mb-2">
                <SearchableSelect
                  value=""
                  onChange={handleAddGenero}
                  options={generosOptions}
                  placeholder={t('form.genres.add')}
                />
              </div>
            )}
            <div
              className={`flex flex-wrap gap-2 min-h-[38px] ${readOnly ? 'p-2 bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600' : ''}`}
            >
              {generosSelecionados?.map((g) => (
                <span
                  key={g}
                  className="flex items-center bg-lumi-primary/10 text-lumi-primary dark:text-lumi-label dark:bg-gray-800 px-2 py-1 rounded-md text-xs font-bold border border-lumi-primary/20"
                >
                  {g}
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => removeGenero(g)}
                      aria-label={t('form.genres.remove_aria', { genre: g })}
                      className="ml-1 hover:bg-red-200 rounded-full p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-lumi-primary"
                    >
                      <img
                        src={closeIcon}
                        className="w-3 h-3 dark:invert"
                        alt=""
                      />
                    </button>
                  )}
                </span>
              ))}
              {(!generosSelecionados || generosSelecionados.length === 0) && (
                <span className="text-xs text-gray-400 italic self-center">
                  {t('form.genres.empty')}
                </span>
              )}
            </div>
            {errors.generos && (
              <span className="text-xs text-red-500 mt-1 block">
                {fieldError(errors.generos.message)}
              </span>
            )}
          </div>

          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 sm:col-span-4">
              <Label>{t('form.field.cdd')}</Label>
              {readOnly ? (
                <Input disabled {...register('cdd')} />
              ) : (
                <Controller
                  name="cdd"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      value={field.value || ''}
                      onChange={field.onChange}
                      options={cddOptions}
                      placeholder={t('common:placeholder.search')}
                    />
                  )}
                />
              )}
            </div>
            <div className="col-span-12 sm:col-span-4">
              <Label requiredIndicator={!readOnly}>
                {t('form.field.age_classification')}
              </Label>
              {readOnly ? (
                <Input disabled {...register('classificacao_etaria')} />
              ) : (
                <Controller
                  name="classificacao_etaria"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <CustomSelect
                        value={field.value}
                        onChange={field.onChange}
                        options={classificacaoOptions}
                        placeholder={t('common:placeholder.select')}
                      />
                      {errors.classificacao_etaria && (
                        <span className="text-xs text-red-500 mt-1 block">
                          {fieldError(errors.classificacao_etaria.message)}
                        </span>
                      )}
                    </div>
                  )}
                />
              )}
            </div>
            <div className="col-span-12 sm:col-span-4">
              <Label>{t('form.field.cover_type')}</Label>
              {readOnly ? (
                <Input disabled {...register('tipo_capa')} />
              ) : (
                <Controller
                  name="tipo_capa"
                  control={control}
                  render={({ field }) => (
                    <CustomSelect
                      value={field.value || ''}
                      onChange={field.onChange}
                      options={tipoCapaOptions}
                      placeholder={t('common:placeholder.select')}
                    />
                  )}
                />
              )}
            </div>
          </div>
        </FormSection>

        <FormSection title={t('form.section.publication')}>
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-6 sm:col-span-4">
              <Label htmlFor="edicao">{t('form.field.edition')}</Label>
              <Input id="edicao" disabled={readOnly} {...register('edicao')} />
            </div>
            <div className="col-span-6 sm:col-span-4">
              <Label htmlFor="volume">{t('form.field.volume')}</Label>
              <Input
                id="volume"
                type="number"
                disabled={readOnly}
                {...register('volume')}
              />
            </div>
            <div className="col-span-12 sm:col-span-4">
              <Controller
                name="data_lancamento"
                control={control}
                render={({ field }) => (
                  <CustomDatePicker
                    label={t('form.field.release')}
                    value={field.value}
                    onChange={field.onChange}
                    disabled={readOnly}
                  />
                )}
              />
            </div>
          </div>
        </FormSection>

        <FormSection title={t('form.section.description')}>
          <div>
            <Label htmlFor="sinopse">{t('form.field.synopsis')}</Label>
            <textarea
              id="sinopse"
              disabled={readOnly}
              {...register('sinopse')}
              className={`w-full px-3 border rounded-md outline-none text-sm h-auto min-h-[80px] py-2 resize-none ${
                readOnly
                  ? 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-lumi-primary'
              }`}
              rows={3}
            />
          </div>
        </FormSection>
      </div>
    </form>
  );
}
