/** Mapa de capacidades por role. Usado para ocultar menus e rotas não autorizadas. */
export const ROLE_CAPABILITIES = {
  ADMIN: {
    canManageUsers: true,
    canManageStudents: true,
    canManageBooks: true,
    canManageLoans: true,
    canManageTcc: true,
    canViewReports: true,
    canViewDashboard: true,
    canViewRanking: true,
    canViewSettings: true,
  },
  BIBLIOTECARIO: {
    canManageUsers: false,
    canManageStudents: true,
    canManageBooks: true,
    canManageLoans: true,
    canManageTcc: true,
    canViewReports: true,
    canViewDashboard: true,
    canViewRanking: true,
    canViewSettings: true,
  },
  ALUNO: {
    canManageUsers: false,
    canManageStudents: false,
    canManageBooks: false,
    canManageLoans: false,
    canManageTcc: false,
    canViewReports: false,
    canViewDashboard: false,
    canViewRanking: true,
    canViewSettings: true,
  },
} as const;

export type UserRole = keyof typeof ROLE_CAPABILITIES;
export type Capability = keyof (typeof ROLE_CAPABILITIES)[UserRole];

export function hasCapability(role: string | undefined, capability: Capability): boolean {
  if (!role || !(role in ROLE_CAPABILITIES)) return false;
  return ROLE_CAPABILITIES[role as UserRole][capability];
}

export function getDefaultRouteForRole(role: string | undefined): string {
  return hasCapability(role, 'canViewDashboard')
    ? '/admin/dashboard'
    : '/admin/ranking';
}
