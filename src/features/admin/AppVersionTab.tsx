import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';

import { Label } from '../../components/ui/Label';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { LoadingIcon } from '../../components/ui/LoadingIcon';
import { useAppVersion } from '../../hooks/queries/useAppVersionQueries';
import { useUpdateAppVersion } from '../../hooks/mutations/useAppVersionMutations';
import {
  appVersionSchema,
  type AppVersionFormData,
} from '../../schemas/appVersionSchema';
import type { AppPlatform } from '../../services/appVersionService';

const PLATFORMS: AppPlatform[] = ['ANDROID', 'IOS'];

export function AppVersionTab() {
  const { t, i18n } = useTranslation('admin');
  const [platform, setPlatform] = useState<AppPlatform>('ANDROID');

  const { data, isLoading, isError, error } = useAppVersion(platform);
  const { mutateAsync: updateVersion, isPending } = useUpdateAppVersion();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<AppVersionFormData>({
    resolver: zodResolver(appVersionSchema),
    defaultValues: {
      versaoMaisRecente: '',
      buildMaisRecente: '0',
      versaoMinima: '',
      buildMinimo: '0',
      forcarAtualizacao: false,
      mensagemAtualizacao: '',
      urlLoja: '',
    },
  });

  // Ao trocar de plataforma, limpa o formulário antes de recarregar (evita
  // mostrar valores da plataforma anterior quando a nova não tem registro).
  useEffect(() => {
    reset({
      versaoMaisRecente: '',
      buildMaisRecente: '0',
      versaoMinima: '',
      buildMinimo: '0',
      forcarAtualizacao: false,
      mensagemAtualizacao: '',
      urlLoja: '',
    });
  }, [platform, reset]);

  useEffect(() => {
    if (data) {
      reset({
        versaoMaisRecente: data.versaoMaisRecente,
        buildMaisRecente: String(data.buildMaisRecente),
        versaoMinima: data.versaoMinima,
        buildMinimo: String(data.buildMinimo),
        forcarAtualizacao: data.forcarAtualizacao,
        mensagemAtualizacao: data.mensagemAtualizacao,
        urlLoja: data.urlLoja,
      });
    }
  }, [data, reset]);

  // 404 = ainda não existe registro para a plataforma: mostra o formulário
  // vazio para o admin criar. Outros erros são propagados como erro real.
  const isNotFound =
    isError &&
    (error as { response?: { status?: number } })?.response?.status === 404;
  const isRealError = isError && !isNotFound;

  const onSubmit = async (values: AppVersionFormData) => {
    await updateVersion({
      plataforma: platform,
      versaoMaisRecente: values.versaoMaisRecente,
      buildMaisRecente: Number(values.buildMaisRecente),
      versaoMinima: values.versaoMinima,
      buildMinimo: Number(values.buildMinimo),
      forcarAtualizacao: values.forcarAtualizacao,
      mensagemAtualizacao: values.mensagemAtualizacao,
      urlLoja: values.urlLoja,
    });
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString(i18n.language);
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white">
          {t('version.title')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t('version.subtitle')}
        </p>
      </div>

      {/* Seletor de plataforma */}
      <div
        className="inline-flex p-1 rounded-xl bg-gray-100 dark:bg-white/5"
        role="tablist"
        aria-label={t('version.platform')}
      >
        {PLATFORMS.map((p) => (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={platform === p}
            onClick={() => setPlatform(p)}
            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition ${
              platform === p
                ? 'bg-white dark:bg-lumi-primary text-lumi-primary dark:text-white shadow-md'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t(`version.platform.${p.toLowerCase()}`)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-12 flex justify-center">
          <LoadingIcon />
        </div>
      ) : isRealError ? (
        <div className="py-12 text-center text-red-500">
          {t('version.error.load')}
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="rounded-2xl bg-white dark:bg-dark-card border border-gray-200/70 dark:border-white/5 p-5 space-y-4"
        >
          {isNotFound && (
            <p className="text-sm rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 px-3 py-2">
              {t('version.empty')}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="versaoMaisRecente" requiredIndicator>
                {t('version.field.latest_version')}
              </Label>
              <Input
                id="versaoMaisRecente"
                placeholder="1.2.0"
                {...register('versaoMaisRecente')}
                error={
                  errors.versaoMaisRecente
                    ? t('version.error.required')
                    : undefined
                }
              />
            </div>
            <div>
              <Label htmlFor="buildMaisRecente" requiredIndicator>
                {t('version.field.latest_build')}
              </Label>
              <Input
                id="buildMaisRecente"
                type="number"
                min={0}
                {...register('buildMaisRecente')}
                error={
                  errors.buildMaisRecente
                    ? t('version.error.build')
                    : undefined
                }
              />
            </div>
            <div>
              <Label htmlFor="versaoMinima" requiredIndicator>
                {t('version.field.min_version')}
              </Label>
              <Input
                id="versaoMinima"
                placeholder="1.0.0"
                {...register('versaoMinima')}
                error={
                  errors.versaoMinima ? t('version.error.required') : undefined
                }
              />
            </div>
            <div>
              <Label htmlFor="buildMinimo" requiredIndicator>
                {t('version.field.min_build')}
              </Label>
              <Input
                id="buildMinimo"
                type="number"
                min={0}
                {...register('buildMinimo')}
                error={errors.buildMinimo ? t('version.error.build') : undefined}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-gray-50 dark:bg-white/5 px-4 py-3">
            <div>
              <div className="font-semibold text-sm text-gray-800 dark:text-white">
                {t('version.field.force_update')}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('version.field.force_update_hint')}
              </p>
            </div>
            <Controller
              name="forcarAtualizacao"
              control={control}
              render={({ field }) => (
                <button
                  type="button"
                  role="switch"
                  aria-checked={field.value}
                  aria-label={t('version.field.force_update')}
                  onClick={() => field.onChange(!field.value)}
                  className={`switch ${field.value ? 'on' : ''}`}
                />
              )}
            />
          </div>

          <div>
            <Label htmlFor="urlLoja">
              {platform === 'ANDROID'
                ? t('version.field.store_url_android')
                : t('version.field.store_url_ios')}
            </Label>
            <Input
              id="urlLoja"
              placeholder="https://"
              {...register('urlLoja')}
            />
          </div>

          <div>
            <Label htmlFor="mensagemAtualizacao">
              {t('version.field.update_message')}
            </Label>
            <textarea
              id="mensagemAtualizacao"
              rows={3}
              {...register('mensagemAtualizacao')}
              className="w-full px-3 py-2 border rounded-md outline-none text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-lumi-primary focus:border-lumi-primary resize-y"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('version.meta', {
                date: formatDate(data?.atualizadoEm ?? null),
                by: data?.atualizadoPor ?? '—',
              })}
            </p>
            <Button type="submit" isLoading={isPending}>
              {t('version.save')}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
