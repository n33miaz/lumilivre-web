import { useState, useMemo } from 'react';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';

import { useCursos, useModulos, useTurnos } from '../../hooks/queries/useReaderQueries';
import { contentSchema, type ContentFormData } from '../../schemas/contentSchema';
import { useToast } from '../../contexts/ToastContext';

import { Label } from '../../components/ui/Label';
import { Input } from '../../components/ui/Input';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { ImageUploader } from '../../components/ui/ImageUploader';

import UploadIcon from '../../assets/icons/upload.svg?react';
import type {
  ContentPayload,
  ContentResponse,
} from '../../services/contentService';

interface ContentFormProps {
  formId: string;
  initialData?: ContentResponse;
  readOnly?: boolean;
  onSubmit: (
    payload: ContentPayload,
    coverFile: File | null,
    docFile: File | null,
  ) => void;
}

/** Converte um ISO (UTC) para o formato aceito por <input type="datetime-local"> em hora local. */
function isoToLocalInput(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localInputToIso(local?: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Toggle acessível reutilizado no bloco de visibilidade. */
function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
        checked ? 'bg-lumi-primary' : 'bg-gray-300 dark:bg-white/15'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

export function ContentForm({
  formId,
  initialData,
  readOnly = false,
  onSubmit,
}: ContentFormProps) {
  const { t } = useTranslation('contents');
  const { addToast } = useToast();
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);

  const { data: cursosList } = useCursos();
  const { data: modulosList } = useModulos();
  const { data: turnosList } = useTurnos();

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<ContentFormData>({
    resolver: zodResolver(contentSchema) as unknown as Resolver<ContentFormData>,
    defaultValues: {
      contentType: (initialData?.contentType?.code as ContentFormData['contentType']) || 'ANNOUNCEMENT',
      title: initialData?.title || '',
      body: initialData?.body || '',
      authors: initialData?.authors || '',
      advisors: initialData?.advisors || '',
      completionYear: initialData?.completionYear || '',
      completionSemester: initialData?.completionSemester || '1',
      externalUrl: initialData?.externalUrl || '',
      published: initialData?.published ?? true,
      pinned: initialData?.pinned ?? false,
      displayOrder: initialData?.displayOrder ?? 0,
      audienceScope: (initialData?.audienceScope?.code as ContentFormData['audienceScope']) || 'ALL',
      courseId: initialData?.courseId ?? undefined,
      academicModuleId: initialData?.academicModuleId ?? undefined,
      studyShiftId: initialData?.studyShiftId ?? undefined,
      publishStartAt: isoToLocalInput(initialData?.publishStartAt),
      publishEndAt: isoToLocalInput(initialData?.publishEndAt),
    },
  });

  const contentType = watch('contentType');
  const audienceScope = watch('audienceScope');

  const typeOptions = useMemo(
    () => [
      { label: t('type.ANNOUNCEMENT'), value: 'ANNOUNCEMENT' },
      { label: t('type.ATTACHMENT'), value: 'ATTACHMENT' },
      { label: t('type.WORK'), value: 'WORK' },
    ],
    [t],
  );

  const audienceOptions = useMemo(
    () => [
      { label: t('audience.ALL'), value: 'ALL' },
      { label: t('audience.COURSE'), value: 'COURSE' },
      { label: t('audience.MODULE'), value: 'MODULE' },
      { label: t('audience.SHIFT'), value: 'SHIFT' },
    ],
    [t],
  );

  const semesterOptions = useMemo(
    () => [
      { label: t('form.semester.1'), value: '1' },
      { label: t('form.semester.2'), value: '2' },
    ],
    [t],
  );

  const cursosOptions = useMemo(
    () => (cursosList || []).map((c) => ({ label: c.nome, value: c.id })),
    [cursosList],
  );
  const modulosOptions = useMemo(
    () => (modulosList || []).map((m) => ({ label: m.nome, value: m.id })),
    [modulosList],
  );
  const turnosOptions = useMemo(
    () => (turnosList || []).map((s) => ({ label: s.nome, value: s.id })),
    [turnosList],
  );

  // Foca a aba/campo do PDF apenas para os tipos que o utilizam.
  const showWorkFields = contentType === 'WORK';
  const showDocField = contentType === 'ATTACHMENT' || contentType === 'WORK';
  const showBody = contentType === 'ANNOUNCEMENT' || contentType === 'ATTACHMENT';

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      addToast({
        type: 'warning',
        title: 'Formato inválido',
        description: 'Selecione um arquivo PDF.',
      });
      return;
    }
    setDocFile(file);
  };

  const submit = (data: ContentFormData) => {
    const payload: ContentPayload = {
      contentType: data.contentType,
      title: data.title,
      body: data.body || null,
      authors: data.authors || null,
      advisors: data.advisors || null,
      completionYear: data.completionYear || null,
      completionSemester: data.completionSemester || null,
      externalUrl: data.externalUrl || null,
      published: data.published,
      pinned: data.pinned,
      displayOrder: data.displayOrder ?? 0,
      audienceScope: data.audienceScope,
      courseId: data.audienceScope === 'COURSE' ? data.courseId ?? null : null,
      academicModuleId: data.audienceScope === 'MODULE' ? data.academicModuleId ?? null : null,
      studyShiftId: data.audienceScope === 'SHIFT' ? data.studyShiftId ?? null : null,
      publishStartAt: localInputToIso(data.publishStartAt),
      publishEndAt: localInputToIso(data.publishEndAt),
    };
    onSubmit(payload, coverFile, docFile);
  };

  const fieldBox =
    'w-full rounded-lg border bg-white dark:bg-dark-card px-3 py-2 text-sm outline-none transition-colors border-gray-300 dark:border-white/10 focus:border-lumi-primary focus:ring-2 focus:ring-lumi-primary/30 disabled:opacity-60';

  return (
    <form
      id={formId}
      onSubmit={handleSubmit(submit)}
      className="flex flex-col md:flex-row gap-6"
    >
      {/* Coluna lateral: capa */}
      <div className="w-full md:w-[28%] flex flex-col items-center space-y-4 pt-1">
        <ImageUploader
          currentImage={initialData?.coverUrl || null}
          onImageChange={setCoverFile}
          readOnly={readOnly}
          placeholderText={t('form.field.cover')}
        />
      </div>

      <div className="w-full md:w-[72%] space-y-5">
        {/* Tipo + título */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label requiredIndicator={!readOnly}>{t('form.field.type')}</Label>
            <Controller
              name="contentType"
              control={control}
              render={({ field }) => (
                <CustomSelect
                  value={field.value}
                  onChange={field.onChange}
                  options={typeOptions}
                  placeholder={t('form.field.type')}
                  disabled={readOnly}
                />
              )}
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="title" requiredIndicator={!readOnly}>
              {t('form.field.title')}
            </Label>
            <Input
              id="title"
              {...register('title')}
              error={errors.title?.message}
              disabled={readOnly}
            />
          </div>
        </div>

        {/* Campos específicos de WORK */}
        {showWorkFields && (
          <div className="space-y-4 rounded-xl border border-gray-200/70 dark:border-white/5 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="authors">{t('form.field.authors')}</Label>
                <Input id="authors" {...register('authors')} disabled={readOnly} />
              </div>
              <div>
                <Label htmlFor="advisors">{t('form.field.advisors')}</Label>
                <Input id="advisors" {...register('advisors')} disabled={readOnly} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="completionYear">{t('form.field.year')}</Label>
                <Input
                  id="completionYear"
                  type="number"
                  {...register('completionYear')}
                  disabled={readOnly}
                />
              </div>
              <div>
                <Label>{t('form.field.semester')}</Label>
                <Controller
                  name="completionSemester"
                  control={control}
                  render={({ field }) => (
                    <CustomSelect
                      value={field.value || ''}
                      onChange={field.onChange}
                      options={semesterOptions}
                      placeholder={t('form.field.semester')}
                      disabled={readOnly}
                    />
                  )}
                />
              </div>
            </div>
          </div>
        )}

        {/* Corpo / descrição (comunicado, anexo) */}
        {showBody && (
          <div>
            <Label htmlFor="body">{t('form.field.body')}</Label>
            <textarea
              id="body"
              rows={4}
              {...register('body')}
              disabled={readOnly}
              className={fieldBox}
            />
          </div>
        )}

        {/* Link externo */}
        <div>
          <Label htmlFor="externalUrl">{t('form.field.externalUrl')}</Label>
          <Input id="externalUrl" {...register('externalUrl')} disabled={readOnly} />
        </div>

        {/* Documento PDF (anexo, trabalho) */}
        {showDocField &&
          (readOnly ? (
            initialData?.fileUrl ? (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center justify-between">
                <span className="text-green-800 dark:text-green-200 font-medium text-sm">
                  {t('form.document.available')}
                </span>
                <a
                  href={initialData.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-bold text-green-600 hover:underline"
                >
                  {t('form.document.download')}
                </a>
              </div>
            ) : (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-center text-gray-500 text-sm">
                {t('form.document.none')}
              </div>
            )
          ) : (
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-3 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/50">
              <UploadIcon className="w-6 h-6 mb-1 opacity-50 dark:invert" />
              <label
                htmlFor="docFile"
                className="cursor-pointer text-lumi-primary font-bold hover:underline text-sm text-center"
              >
                {docFile
                  ? docFile.name
                  : initialData?.fileUrl
                    ? t('form.document.replace')
                    : t('form.document.select')}
              </label>
              <input
                id="docFile"
                type="file"
                accept="application/pdf"
                onChange={handlePdfChange}
                className="hidden"
              />
              {docFile && (
                <button
                  type="button"
                  onClick={() => setDocFile(null)}
                  className="text-xs text-red-500 mt-1 hover:underline"
                >
                  {t('form.document.remove')}
                </button>
              )}
            </div>
          ))}

        {/* Bloco de visibilidade — "Como os alunos verão" */}
        <fieldset className="space-y-4 rounded-xl border border-lumi-primary/20 dark:border-lumi-label/20 p-4">
          <legend className="px-2 text-sm font-bold text-lumi-primary dark:text-lumi-label">
            {t('form.section.visibility')}
          </legend>

          <div className="flex flex-wrap items-center gap-6">
            <Controller
              name="published"
              control={control}
              render={({ field }) => (
                <div className="flex items-center gap-2">
                  <Toggle
                    checked={field.value}
                    onChange={field.onChange}
                    disabled={readOnly}
                    label={t('form.field.published')}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-200">
                    {t('form.field.published')}
                  </span>
                </div>
              )}
            />
            <Controller
              name="pinned"
              control={control}
              render={({ field }) => (
                <div className="flex items-center gap-2">
                  <Toggle
                    checked={field.value}
                    onChange={field.onChange}
                    disabled={readOnly}
                    label={t('form.field.pinned')}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-200">
                    {t('form.field.pinned')}
                  </span>
                </div>
              )}
            />
            <div className="w-28">
              <Label htmlFor="displayOrder">{t('form.field.displayOrder')}</Label>
              <Input
                id="displayOrder"
                type="number"
                {...register('displayOrder')}
                disabled={readOnly}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>{t('form.field.audience')}</Label>
              <Controller
                name="audienceScope"
                control={control}
                render={({ field }) => (
                  <CustomSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={audienceOptions}
                    placeholder={t('form.field.audience')}
                    disabled={readOnly}
                  />
                )}
              />
            </div>
            {audienceScope === 'COURSE' && (
              <div>
                <Label>{t('form.field.course')}</Label>
                <Controller
                  name="courseId"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      options={cursosOptions}
                      placeholder={t('form.field.course')}
                      disabled={readOnly}
                    />
                  )}
                />
              </div>
            )}
            {audienceScope === 'MODULE' && (
              <div>
                <Label>{t('form.field.module')}</Label>
                <Controller
                  name="academicModuleId"
                  control={control}
                  render={({ field }) => (
                    <CustomSelect
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      options={modulosOptions}
                      placeholder={t('form.field.module')}
                      disabled={readOnly}
                    />
                  )}
                />
              </div>
            )}
            {audienceScope === 'SHIFT' && (
              <div>
                <Label>{t('form.field.shift')}</Label>
                <Controller
                  name="studyShiftId"
                  control={control}
                  render={({ field }) => (
                    <CustomSelect
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      options={turnosOptions}
                      placeholder={t('form.field.shift')}
                      disabled={readOnly}
                    />
                  )}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="publishStartAt">{t('form.field.publishStart')}</Label>
              <input
                id="publishStartAt"
                type="datetime-local"
                {...register('publishStartAt')}
                disabled={readOnly}
                className={fieldBox}
              />
            </div>
            <div>
              <Label htmlFor="publishEndAt">{t('form.field.publishEnd')}</Label>
              <input
                id="publishEndAt"
                type="datetime-local"
                {...register('publishEndAt')}
                disabled={readOnly}
                className={fieldBox}
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('form.hint.window')}
          </p>
        </fieldset>
      </div>
    </form>
  );
}
