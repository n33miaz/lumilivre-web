import { Navigate } from 'react-router-dom';
import { type ReactNode } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { LoadingIcon } from './ui/LoadingIcon';
import { getDefaultRouteForRole } from '../utils/roleCapabilities';

interface Props {
  children: ReactNode;
  /** Roles permitidas. Se vazio, qualquer usuário autenticado acessa. */
  allowedRoles?: string[];
  /** Rota de fallback se não autorizado. Se omitida, usa a home do papel. */
  fallback?: string;
}

export function RoleProtectedRoute({ children, allowedRoles = [], fallback }: Props) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingIcon />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={fallback ?? getDefaultRouteForRole(user.role)} replace />;
  }

  return children;
}
