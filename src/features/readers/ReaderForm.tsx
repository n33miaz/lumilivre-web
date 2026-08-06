import { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';

import { buscarEnderecoPorCep } from '../../services/cepService';
import {
  useCursos,
  useModulos,
  useTurnos,
} from '../../hooks/queries/useReaderQueries';
import {
  buildReaderSchema,
  MIN_READER_NAME_LENGTH,
  type ReaderFormData,
} from '../../schemas/readerSchema';
import { useToast } from '../../contexts/ToastContext';
import { useLibraryConfig } from '../../contexts/LibraryConfigContext';

import { Label } from '../../components/ui/Label';
import { Input } from '../../components/ui/Input';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { CustomDatePicker } from '../../components/ui/CustomDatePicker';
import { ImageUploader } from '../../components/ui/ImageUploader';

type ReaderTab = 'principal' | 'endereco';

const ADDRESS_FIELDS: (keyof ReaderFormData)[] = [
  'cep',
  'logradouro',
  'bairro',
  'localidade',
  'uf',
  'numero_casa',
  'complemento',
];

/**
 * O detalhe do leitor (`GET /api/readers/{matricula}`) devolve **só os nomes**
 * de curso/turno/módulo — os ids não estão no contrato. Por isso o formulário
 * também aceita os nomes: é a partir deles que os selects reencontram o id.
 */
type ReaderFormInitialData = Partial<ReaderFormData> & {
  cursoNome?: string;
  turnoNome?: string;
  moduloNome?: string;
};

interface ReaderFormProps {
  formId: string;
  initialData?: ReaderFormInitialData;
  readOnly?: boolean;
  onSubmit: (data: ReaderFormData, avatarFile: File | null) => void;
  isSubmitting?: boolean;
}

export function ReaderForm({
  formId,
  initialData,
  readOnly = false,
  onSubmit,
}: ReaderFormProps) {
  const { t } = useTranslation('reader');
  const { addToast } = useToast();
  const { features } = useLibraryConfig();
  const [isCepLoading, setIsCepLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<ReaderTab>('principal');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const schema = useMemo(
    () => buildReaderSchema(features.academicFields),
    [features.academicFields],
  );

  const { data: cursosList } = useCursos();
  const { data: modulosList } = useModulos();
  const { data: turnosList } = useTurnos();

  // Memorizadas porque alimentam o efeito que casa nome→id abaixo: recriar os
  // arrays a cada render faria o efeito rodar em laço.
  const cursosOptions = useMemo(
    () => (cursosList || []).map((c) => ({ label: c.nome, value: c.id })),
    [cursosList],
  );
  const modulosOptions = useMemo(
    () => (modulosList || []).map((m) => ({ label: m.nome, value: m.id })),
    [modulosList],
  );
  const turnoOptions = useMemo(
    () => (turnosList || []).map((s) => ({ label: s.nome, value: s.id })),
    [turnosList],
  );

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    reset,
    formState: { errors },
  } = useForm<ReaderFormData>({
    resolver: zodResolver(schema),
    defaultValues: initialData || { cursoId: '', turnoId: '', moduloId: '' },
  });

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  // Reencontra o id de curso/turno/módulo pelo nome que veio no detalhe.
  //
  // Sem isto o `initialData` chega com id 0 (o mapper não tem de onde tirar),
  // nenhuma opção casa e os três selects mostram "Selecione" no modo leitura —
  // como se o leitor não tivesse turma. Na edição era pior: salvar sem tocar
  // nos campos reenviaria 0.
  useEffect(() => {
    const semValor = (value: unknown) =>
      value === undefined ||
      value === null ||
      value === '' ||
      value === 0 ||
      value === '0';

    const casarPorNome = (
      options: Array<{ label: string; value: number }>,
      nome?: string,
    ) => (nome ? options.find((option) => option.label === nome)?.value : undefined);

    const pares = [
      ['cursoId', casarPorNome(cursosOptions, initialData?.cursoNome)],
      ['turnoId', casarPorNome(turnoOptions, initialData?.turnoNome)],
      ['moduloId', casarPorNome(modulosOptions, initialData?.moduloNome)],
    ] as const;

    for (const [campo, id] of pares) {
      if (id !== undefined && semValor(getValues(campo))) {
        setValue(campo, id);
      }
    }
  }, [
    initialData,
    cursosOptions,
    turnoOptions,
    modulosOptions,
    getValues,
    setValue,
  ]);

  // Reseta a aba/preview ao (re)abrir para um leitor diferente.
  useEffect(() => {
    setActiveTab('principal');
    setAvatarFile(null);
  }, [initialData]);

  const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    if (readOnly) return;
    const cep = e.target.value.replace(/\D/g, '');
    if (cep.length === 8) {
      setIsCepLoading(true);
      try {
        const endereco = await buscarEnderecoPorCep(cep);
        setValue('logradouro', endereco.logradouro || '');
        setValue('bairro', endereco.bairro || '');
        setValue('localidade', endereco.localidade || '');
        setValue('uf', endereco.uf || '');
      } catch {
        addToast({
          type: 'warning',
          title: t('toast.postal_code_not_found'),
        });
      } finally {
        setIsCepLoading(false);
      }
    }
  };

  // Ao submeter com erro, abre a aba do primeiro campo inválido.
  const handleInvalid = (formErrors: typeof errors) => {
    const errored = Object.keys(formErrors) as (keyof ReaderFormData)[];
    const onlyAddress =
      errored.length > 0 &&
      errored.every((f) => ADDRESS_FIELDS.includes(f));
    setActiveTab(onlyAddress ? 'endereco' : 'principal');
  };

  // O zod devolve **chave** de i18n (ver `readerSchema`); a tradução acontece
  // aqui, já com o valor que saiu da frase (tamanho mínimo do nome).
  const fieldError = (message?: string) =>
    message ? t(message, { min: MIN_READER_NAME_LENGTH }) : undefined;

  const tabButton = (tab: ReaderTab, label: string) => (
    <button
      type="button"
      onClick={() => setActiveTab(tab)}
      className={`px-4 h-9 rounded-lg text-sm font-semibold transition-colors ${
        activeTab === tab
          ? 'bg-lumi-primary text-white shadow-sm'
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
      }`}
    >
      {label}
    </button>
  );

  return (
    <form
      id={formId}
      onSubmit={handleSubmit((data) => onSubmit(data, avatarFile), handleInvalid)}
      className="space-y-4"
    >
      <div className="flex items-center gap-1 rounded-xl bg-gray-100 dark:bg-white/5 p-1 w-fit">
        {tabButton('principal', t('form.tab.main'))}
        {tabButton('endereco', t('form.tab.address'))}
      </div>

      {/* Aba Principal */}
      <div className={activeTab === 'principal' ? 'space-y-4' : 'hidden'}>
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          <div className="shrink-0 mx-auto sm:mx-0">
            <ImageUploader
              currentImage={initialData?.foto || null}
              onImageChange={setAvatarFile}
              readOnly={readOnly}
              placeholderText={t('form.photo.placeholder')}
            />
          </div>
          <div className="flex-1 w-full space-y-4">
            <div>
              <Label htmlFor="nomeCompleto" requiredIndicator={!readOnly}>
                {t('form.field.full_name')}
              </Label>
              <Input
                id="nomeCompleto"
                {...register('nomeCompleto')}
                error={fieldError(errors.nomeCompleto?.message)}
                disabled={readOnly}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="matricula" requiredIndicator={!readOnly}>
                  {t('form.field.registration')}
                </Label>
                <Input
                  id="matricula"
                  {...register('matricula')}
                  error={fieldError(errors.matricula?.message)}
                  disabled={readOnly || !!initialData?.matricula}
                />
              </div>
              <div>
                <Label htmlFor="cpf">{t('form.field.cpf')}</Label>
                <Input id="cpf" {...register('cpf')} disabled={readOnly} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="celular">{t('form.field.phone')}</Label>
            <Input id="celular" {...register('celular')} disabled={readOnly} />
          </div>
          <Controller
            name="dataNascimento"
            control={control}
            render={({ field }) => (
              <CustomDatePicker
                label={t('form.field.birth_date')}
                value={field.value}
                onChange={field.onChange}
                disabled={readOnly}
              />
            )}
          />
        </div>
        <div>
          <Label htmlFor="email">{t('form.field.email')}</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            error={fieldError(errors.email?.message)}
            disabled={readOnly}
          />
        </div>
        {features.academicFields ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label requiredIndicator={!readOnly}>
                {t('form.field.course')}
              </Label>
              <Controller
                name="cursoId"
                control={control}
                render={({ field }) => (
                  <div>
                    <SearchableSelect
                      value={String(field.value ?? '')}
                      onChange={field.onChange}
                      options={cursosOptions}
                      placeholder={t('common:placeholder.select')}
                      disabled={readOnly}
                    />
                    {errors.cursoId && (
                      <span className="text-xs text-red-500 mt-1">
                        {fieldError(errors.cursoId.message)}
                      </span>
                    )}
                  </div>
                )}
              />
            </div>
            <div>
              <Label requiredIndicator={!readOnly}>
                {t('form.field.study_shift')}
              </Label>
              <Controller
                name="turnoId"
                control={control}
                render={({ field }) => (
                  <div>
                    <CustomSelect
                      value={String(field.value ?? '')}
                      onChange={field.onChange}
                      options={turnoOptions}
                      placeholder={t('common:placeholder.select')}
                      disabled={readOnly}
                    />
                    {errors.turnoId && (
                      <span className="text-xs text-red-500 mt-1">
                        {fieldError(errors.turnoId.message)}
                      </span>
                    )}
                  </div>
                )}
              />
            </div>
            <div>
              <Label requiredIndicator={!readOnly}>
                {t('form.field.academic_module')}
              </Label>
              <Controller
                name="moduloId"
                control={control}
                render={({ field }) => (
                  <div>
                    <CustomSelect
                      value={String(field.value ?? '')}
                      onChange={field.onChange}
                      options={modulosOptions}
                      placeholder={t('common:placeholder.select')}
                      disabled={readOnly}
                    />
                    {errors.moduloId && (
                      <span className="text-xs text-red-500 mt-1">
                        {fieldError(errors.moduloId.message)}
                      </span>
                    )}
                  </div>
                )}
              />
            </div>
          </div>
        ) : (
          <div>
            <Label htmlFor="readerCategory">
              {t('form.field.category')}
            </Label>
            <Input
              id="readerCategory"
              {...register('readerCategory')}
              error={fieldError(errors.readerCategory?.message)}
              disabled={readOnly}
            />
          </div>
        )}
      </div>

      {/* Aba Endereço */}
      <div className={activeTab === 'endereco' ? 'space-y-4' : 'hidden'}>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-4 md:col-span-3">
            <Label htmlFor="cep">{t('form.field.postal_code')}</Label>
            <Input
              id="cep"
              maxLength={9}
              {...register('cep')}
              onBlur={handleCepBlur}
              disabled={readOnly}
            />
          </div>
          <div className="col-span-8 md:col-span-9">
            <Label htmlFor="logradouro">{t('form.field.street')}</Label>
            <Input
              id="logradouro"
              {...register('logradouro')}
              disabled={readOnly || isCepLoading}
            />
          </div>
        </div>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-5">
            <Label htmlFor="bairro">{t('form.field.district')}</Label>
            <Input
              id="bairro"
              {...register('bairro')}
              disabled={readOnly || isCepLoading}
            />
          </div>
          <div className="col-span-5">
            <Label htmlFor="localidade">{t('form.field.city')}</Label>
            <Input
              id="localidade"
              {...register('localidade')}
              disabled={readOnly || isCepLoading}
            />
          </div>
          <div className="col-span-2">
            <Label htmlFor="uf">{t('form.field.state')}</Label>
            <Input
              id="uf"
              {...register('uf')}
              disabled={readOnly || isCepLoading}
            />
          </div>
        </div>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-4">
            <Label htmlFor="numero_casa">
              {t('form.field.street_number')}
            </Label>
            <Input
              id="numero_casa"
              type="number"
              {...register('numero_casa')}
              disabled={readOnly}
            />
          </div>
          <div className="col-span-8">
            <Label htmlFor="complemento">
              {t('form.field.complement')}
            </Label>
            <Input
              id="complemento"
              {...register('complemento')}
              disabled={readOnly}
            />
          </div>
        </div>
      </div>
    </form>
  );
}
