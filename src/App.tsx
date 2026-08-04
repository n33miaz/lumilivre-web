import { lazy, Suspense } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';

import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleProtectedRoute } from './components/RoleProtectedRoute';
import { FeatureGate } from './components/FeatureGate';
import { MainLayout } from './layouts/MainLayout';
import { LoadingIcon } from './components/ui/LoadingIcon';

// Rotas Publicas
import { LandingPage } from './pages/Landing';
import { LoginPage } from './pages/Auth/Login';
import { EsqueciSenhaPage } from './pages/Auth/ForgotPassword';
import { MudarSenhaPage } from './pages/Auth/ChangePassword';
import { DownloadAppPage } from './pages/Download';

// Rotas Protegidas (Lazy Loaded)
const DashboardPage = lazy(() =>
  import('./pages/Dashboard').then((m) => ({ default: m.DashboardPage })),
);
const LivrosPage = lazy(() =>
  import('./pages/Books').then((m) => ({ default: m.LivrosPage })),
);
const LeitoresPage = lazy(() =>
  import('./pages/Readers').then((m) => ({ default: m.LeitoresPage })),
);
const EmprestimosPage = lazy(() =>
  import('./pages/Loans').then((m) => ({ default: m.EmprestimosPage })),
);
const ConteudosPage = lazy(() =>
  import('./pages/Conteudos').then((m) => ({ default: m.ConteudosPage })),
);
const ClassificacaoPage = lazy(() =>
  import('./pages/Ranking').then((m) => ({ default: m.ClassificacaoPage })),
);
const RelatoriosPage = lazy(() =>
  import('./pages/Reports').then((m) => ({ default: m.RelatoriosPage })),
);
const ConfiguracoesPage = lazy(() =>
  import('./pages/Settings').then((m) => ({ default: m.ConfiguracoesPage })),
);

const PageLoader = () => (
  <div className="flex items-center justify-center h-full min-h-[400px]">
    <LoadingIcon />
  </div>
);

const ProtectedLayout = () => (
  <ProtectedRoute>
    <MainLayout>
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </MainLayout>
  </ProtectedRoute>
);

function App() {
  return (
    <Routes>
      {/* Rotas Publicas */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<EsqueciSenhaPage />} />
      <Route path="/change-password" element={<MudarSenhaPage />} />
      <Route path="/download" element={<DownloadAppPage />} />

      {/* Painel (todas as rotas protegidas vivem sob /admin) */}
      <Route path="/admin" element={<ProtectedLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route
          path="dashboard"
          element={
            <RoleProtectedRoute allowedRoles={['ADMIN', 'BIBLIOTECARIO']}>
              <DashboardPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="ranking"
          element={
            <FeatureGate feature="ranking">
              <ClassificacaoPage />
            </FeatureGate>
          }
        />
        <Route path="settings" element={<ConfiguracoesPage />} />

        <Route
          path="books"
          element={
            <RoleProtectedRoute allowedRoles={['ADMIN', 'BIBLIOTECARIO']}>
              <LivrosPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="readers"
          element={
            <RoleProtectedRoute allowedRoles={['ADMIN', 'BIBLIOTECARIO']}>
              <LeitoresPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="loans"
          element={
            <RoleProtectedRoute allowedRoles={['ADMIN', 'BIBLIOTECARIO']}>
              <EmprestimosPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="contents"
          element={
            <RoleProtectedRoute allowedRoles={['ADMIN', 'BIBLIOTECARIO']}>
              <FeatureGate feature="contents">
                <ConteudosPage />
              </FeatureGate>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="reports"
          element={
            <RoleProtectedRoute allowedRoles={['ADMIN', 'BIBLIOTECARIO']}>
              <RelatoriosPage />
            </RoleProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
