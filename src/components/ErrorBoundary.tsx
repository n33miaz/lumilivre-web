import { Component, type ErrorInfo, type ReactNode } from 'react';

import i18n from '../i18n';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Erro inesperado na interface:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Traduz pela instância global e não por `useTranslation`: o boundary
      // precisa ser classe (só ela tem `componentDidCatch`) e a tela de falha
      // não sobrevive a uma troca de idioma — o usuário vai recarregar.
      const t = i18n.t;

      return (
        <main className="min-h-screen bg-lumi-background dark:bg-lumi-dark-background text-lumi-text dark:text-lumi-dark-text flex items-center justify-center px-4">
          <section className="w-full max-w-md text-center">
            <h1 className="text-2xl font-bold mb-3">
              {t('common:error.boundary.title')}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              {t('common:error.boundary.message')}
            </p>
            <button
              type="button"
              className="rounded-lg bg-lumi-primary px-4 py-2 text-sm font-semibold text-white"
              onClick={() => window.location.reload()}
            >
              {t('common:error.boundary.reload')}
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
