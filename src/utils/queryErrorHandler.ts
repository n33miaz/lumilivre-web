import { getErrorMessage, getErrorTitle } from './errorHandler';

type QueryErrorNotifier = (message: {
  title: string;
  description: string;
}) => void;

let notifier: QueryErrorNotifier | null = null;

export function setQueryErrorNotifier(nextNotifier: QueryErrorNotifier | null) {
  notifier = nextNotifier;
}

export function queryErrorHandler(error: unknown) {
  notifier?.({
    title: getErrorTitle(error),
    description: getErrorMessage(error),
  });
}
