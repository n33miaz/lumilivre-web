import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import './index.css';
import './i18n';
import App from './App.tsx';

import { ErrorBoundary } from './components/ErrorBoundary';
import { QueryErrorBridge } from './components/QueryErrorBridge';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { LocaleProvider } from './contexts/LocaleContext';
import { LibraryConfigProvider } from './contexts/LibraryConfigContext';
import { ApiHealthProvider } from './contexts/ApiHealthContext';
import { ApiWakingModal } from './components/ApiWakingModal';
import { ApiWakingNotice } from './components/ApiWakingNotice';
import { queryClient } from './services/queryClient';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <LocaleProvider>
            <QueryErrorBridge />
            <ApiHealthProvider>
              <ApiWakingModal />
              <ApiWakingNotice />
              <BrowserRouter>
                <AuthProvider>
                  <LibraryConfigProvider>
                    <ErrorBoundary>
                      <App />
                    </ErrorBoundary>
                  </LibraryConfigProvider>
                </AuthProvider>
              </BrowserRouter>
            </ApiHealthProvider>
          </LocaleProvider>
        </ToastProvider>
      </ThemeProvider>
      {import.meta.env.DEV && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
      )}
    </QueryClientProvider>
  </React.StrictMode>,
);
