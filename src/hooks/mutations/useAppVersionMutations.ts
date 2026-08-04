import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { updateAppVersion } from '../../services/appVersionService';
import { useToast } from '../../contexts/ToastContext';
import { getErrorMessage } from '../../utils/errorHandler';

export function useUpdateAppVersion() {
  const { t } = useTranslation('admin');
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAppVersion,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['app-version', data.plataforma],
      });
      addToast({
        type: 'success',
        title: t('version.toast.success.title'),
        description: t('version.toast.success.description'),
      });
    },
    onError: (error) => {
      addToast({
        type: 'error',
        title: t('version.toast.error.title'),
        description: getErrorMessage(error, t('version.toast.error.description')),
      });
    },
  });
}
