import { Component, type ErrorInfo, type ReactNode } from 'react';

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
      return (
        <main className="min-h-screen bg-lumi-background dark:bg-lumi-dark-background text-lumi-text dark:text-lumi-dark-text flex items-center justify-center px-4">
          <section className="w-full max-w-md text-center">
            <h1 className="text-2xl font-bold mb-3">Erro inesperado</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              Não foi possível continuar nesta tela.
            </p>
            <button
              type="button"
              className="rounded-lg bg-lumi-primary px-4 py-2 text-sm font-semibold text-white"
              onClick={() => window.location.reload()}
            >
              Recarregar
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
