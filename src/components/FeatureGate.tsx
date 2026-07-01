import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';

import {
  useLibraryConfig,
  type LibraryFeatures,
} from '../contexts/LibraryConfigContext';

interface FeatureGateProps {
  feature: keyof LibraryFeatures;
  children: ReactNode;
  fallbackPath?: string;
}

export function FeatureGate({
  feature,
  children,
  fallbackPath = '/admin/settings',
}: FeatureGateProps) {
  const { features } = useLibraryConfig();
  if (!features[feature]) {
    return <Navigate to={fallbackPath} replace />;
  }
  return <>{children}</>;
}
