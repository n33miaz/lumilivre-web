import { lazy, Suspense } from 'react';
import { Route, Routes, Outlet } from 'react-router-dom';

import { ProtectedRoute } from './components/ProtectedRoute';
import { MainLayout } from './layouts/MainLayout';
import { LoadingIcon } from './components/ui/LoadingIcon';

// Rotas Públicas
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

// Componente de Layout para Rotas Protegidas
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
      {/* Rotas Públicas */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/esqueci-a-senha" element={<EsqueciSenhaPage />} />
      <Route path="/mudar-senha" element={<MudarSenhaPage />} />
      <Route path="/download" element={<DownloadAppPage />} />

      {/* Rotas Protegidas */}
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/livros" element={<LivrosPage />} />
        <Route path="/alunos" element={<AlunosPage />} />
        <Route path="/emprestimos" element={<EmprestimosPage />} />
        <Route path="/tcc" element={<TccPage />} />
        <Route path="/classificacao" element={<ClassificacaoPage />} />
        <Route path="/relatorios" element={<RelatoriosPage />} />
        <Route path="/configuracoes" element={<ConfiguracoesPage />} />
      </Route>
    </Routes>
  );
}

export default App;