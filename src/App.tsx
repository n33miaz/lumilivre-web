import { lazy, Suspense } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';

import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleProtectedRoute } from './components/RoleProtectedRoute';
import { MainLayout } from './layouts/MainLayout';
import { LoadingIcon } from './components/ui/LoadingIcon';

// Rotas Publicas
import { LandingPage } from './pages/Landing';
import { LoginPage } from './pages/Auth/Login';
import { EsqueciSenhaPage } from './pages/Auth/ForgotPassword';
import { MudarSenhaPage } from './pages/Auth/ChangePassword';
import { DownloadAppPage } from './pages/Download';

// Rotas Protegidas (Lazy Loaded)
const DashboardPage = lazy(() => import('./pages/Start').then((m) => ({ default: m.DashboardPage })));
const LivrosPage = lazy(() => import('./pages/Books').then((m) => ({ default: m.LivrosPage })));
const AlunosPage = lazy(() => import('./pages/Students').then((m) => ({ default: m.AlunosPage })));
const EmprestimosPage = lazy(() => import('./pages/Loans').then((m) => ({ default: m.EmprestimosPage })));
const TccPage = lazy(() => import('./pages/TCC').then((m) => ({ default: m.TccPage })));
const ClassificacaoPage = lazy(() => import('./pages/Ranking').then((m) => ({ default: m.ClassificacaoPage })));
const RelatoriosPage = lazy(() => import('./pages/Reports').then((m) => ({ default: m.RelatoriosPage })));
const ConfiguracoesPage = lazy(() => import('./pages/Settings').then((m) => ({ default: m.ConfiguracoesPage })));

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
      <Route path="/esqueci-a-senha" element={<EsqueciSenhaPage />} />
      <Route path="/mudar-senha" element={<MudarSenhaPage />} />
      <Route path="/download" element={<DownloadAppPage />} />

      {/* Redirecionamentos legados das rotas antigas para /admin/* */}
      <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/livros" element={<Navigate to="/admin/livros" replace />} />
      <Route path="/alunos" element={<Navigate to="/admin/alunos" replace />} />
      <Route path="/emprestimos" element={<Navigate to="/admin/emprestimos" replace />} />
      <Route path="/tcc" element={<Navigate to="/admin/tcc" replace />} />
      <Route path="/classificacao" element={<Navigate to="/admin/classificacao" replace />} />
      <Route path="/relatorios" element={<Navigate to="/admin/relatorios" replace />} />
      <Route path="/configuracoes" element={<Navigate to="/admin/configuracoes" replace />} />

      {/* Painel (todas as rotas protegidas vivem sob /admin) */}
      <Route path="/admin" element={<ProtectedLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route
          path="dashboard"
          element={
            <RoleProtectedRoute allowedRoles={['ADMIN', 'BIBLIOTECARIO']} fallback="/admin/classificacao">
              <DashboardPage />
            </RoleProtectedRoute>
          }
        />
        <Route path="classificacao" element={<ClassificacaoPage />} />
        <Route path="configuracoes" element={<ConfiguracoesPage />} />

        <Route
          path="livros"
          element={
            <RoleProtectedRoute allowedRoles={['ADMIN', 'BIBLIOTECARIO']}>
              <LivrosPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="alunos"
          element={
            <RoleProtectedRoute allowedRoles={['ADMIN', 'BIBLIOTECARIO']}>
              <AlunosPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="emprestimos"
          element={
            <RoleProtectedRoute allowedRoles={['ADMIN', 'BIBLIOTECARIO']}>
              <EmprestimosPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="tcc"
          element={
            <RoleProtectedRoute allowedRoles={['ADMIN', 'BIBLIOTECARIO']}>
              <TccPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="relatorios"
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
