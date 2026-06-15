import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BookMarked,
  FileText,
  GraduationCap,
  HandHelping,
  LayoutDashboard,
  Pin,
  Settings2,
  Trophy,
  Users,
  type LucideIcon,
} from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';
import {
  hasCapability,
  type Capability,
} from '../../utils/roleCapabilities';
import { SidebarLocaleSwitcher } from './SidebarLocaleSwitcher';

const prefetchSettings = () => import('../../pages/Settings');

const navLinks: {
  path: string;
  labelKey: string;
  Icon: LucideIcon;
  capability: string;
}[] = [
  {
    path: '/admin/dashboard',
    labelKey: 'dashboard',
    Icon: LayoutDashboard,
    capability: 'canViewDashboard',
  },
  {
    path: '/admin/books',
    labelKey: 'books',
    Icon: BookMarked,
    capability: 'canManageBooks',
  },
  {
    path: '/admin/students',
    labelKey: 'students',
    Icon: Users,
    capability: 'canManageStudents',
  },
  {
    path: '/admin/loans',
    labelKey: 'loans',
    Icon: HandHelping,
    capability: 'canManageLoans',
  },
  {
    path: '/admin/theses',
    labelKey: 'tcc',
    Icon: GraduationCap,
    capability: 'canManageTcc',
  },
  {
    path: '/admin/ranking',
    labelKey: 'ranking',
    Icon: Trophy,
    capability: 'canViewRanking',
  },
  {
    path: '/admin/reports',
    labelKey: 'reports',
    Icon: FileText,
    capability: 'canViewReports',
  },
];

interface SidebarProps {
  isExpanded: boolean;
  setExpanded: (isExpanded: boolean) => void;
  isPinned: boolean;
  setPinned: (isPinned: boolean) => void;
}

interface SidebarNavItemProps {
  to: string;
  label: string;
  Icon: LucideIcon;
  isExpanded: boolean;
  onMouseEnter?: () => void;
}

function SidebarNavItem({
  to,
  label,
  Icon,
  isExpanded,
  onMouseEnter,
}: SidebarNavItemProps) {
  return (
    <NavLink
      to={to}
      onMouseEnter={onMouseEnter}
      className={({ isActive }) =>
        `nav-pill flex items-center py-2.5 rounded-xl overflow-hidden hover:bg-white/10 transition-colors ${
          isActive ? 'active bg-white/10' : ''
        }`
      }
    >
      {({ isActive }) => (
        <>
          {/* Coluna de ícone com largura fixa (= largura útil do rail recolhido):
              mantém o ícone imóvel entre recolhido/expandido, evitando o "salto". */}
          <span className="flex w-14 shrink-0 items-center justify-center">
            <Icon
              className={`w-5 h-5 pointer-events-none ${
                isActive ? 'text-white' : 'text-gray-200'
              }`}
              fill={isActive ? 'currentColor' : 'none'}
              fillOpacity={isActive ? 0.25 : 0}
              strokeWidth={isActive ? 2.25 : 2}
            />
          </span>
          <span
            className={`text-sm font-semibold whitespace-nowrap transition-opacity duration-200 ${
              isExpanded ? 'opacity-100' : 'opacity-0'
            } ${isActive ? 'text-white' : 'text-gray-200'}`}
          >
            {label}
          </span>
        </>
      )}
    </NavLink>
  );
}

export function Sidebar({
  isExpanded,
  setExpanded,
  isPinned,
  setPinned,
}: SidebarProps) {
  const { t } = useTranslation('nav');
  const { user } = useAuth();
  const visibleNavLinks = navLinks.filter((link) =>
    hasCapability(user?.role, link.capability as Capability),
  );
  const canViewSettings = hasCapability(user?.role, 'canViewSettings');

  const handleMouseEnter = () => {
    if (!isPinned) setExpanded(true);
  };
  const handleMouseLeave = () => {
    if (!isPinned) setExpanded(false);
  };

  const handlePinToggle = () => {
    const newPinState = !isPinned;
    setPinned(newPinState);
    setExpanded(newPinState);
  };

  const PinComponent = Pin;

  return (
    <aside
      className={`h-full bg-sidebar-gradient text-gray-200 flex flex-col shrink-0 transition-[width,transform] duration-300 shadow-[8px_0_24px_rgba(0,0,0,0.18)] select-none
      ${isExpanded ? 'w-56 translate-x-0' : 'w-20 -translate-x-full md:translate-x-0'}
      ${isPinned ? 'md:relative' : 'md:absolute md:inset-y-0 md:left-0 md:z-40'}
      `}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex justify-end p-2">
        <button
          type="button"
          onClick={handlePinToggle}
          className={`p-2 rounded-lg hover:bg-white/15 transition-opacity ${
            isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          title={isPinned ? t('unpin_menu') : t('pin_menu')}
          aria-label={isPinned ? t('unpin_menu') : t('pin_menu')}
        >
          <PinComponent className="w-4 h-4 text-white" />
        </button>
      </div>

      <nav className="flex-1 px-3 pb-3 space-y-1.5 overflow-y-auto overflow-x-hidden">
        {visibleNavLinks.map((link) => (
          <SidebarNavItem
            key={link.path}
            to={link.path}
            label={t(link.labelKey)}
            Icon={link.Icon}
            isExpanded={isExpanded}
          />
        ))}
      </nav>

      <div className="p-3 border-t border-white/10 space-y-1">
        {/* Idioma só aparece na sidebar em telas pequenas; no desktop fica no Header */}
        <div className="md:hidden">
          <SidebarLocaleSwitcher isExpanded={isExpanded} />
        </div>
        {canViewSettings && (
          <SidebarNavItem
            to="/admin/settings"
            label={t('settings')}
            Icon={Settings2}
            isExpanded={isExpanded}
            onMouseEnter={prefetchSettings}
          />
        )}
      </div>
    </aside>
  );
}
