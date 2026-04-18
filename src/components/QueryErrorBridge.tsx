import { useEffect } from 'react';

import { useToast } from '../contexts/ToastContext';
import { setQueryErrorNotifier } from '../utils/queryErrorHandler';

export function QueryErrorBridge() {
  const { addToast } = useToast();

  useEffect(() => {
    setQueryErrorNotifier(({ title, description }) => {
      addToast({
        type: 'error',
        title,
        description,
      });
    });

    return () => setQueryErrorNotifier(null);
  }, [addToast]);

  return null;
}
