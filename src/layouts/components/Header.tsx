import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LifeBuoy, LogOut, Settings2 } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { NotificationsBell } from './NotificationsBell';

import LogoIcon from '../../assets/icons/logo.svg?react';
import MenuIcon from '../../assets/icons/menu.svg?react';
import SearchIcon from '../../assets/icons/search.svg?react';
import { LocaleSwitcher } from '../../components/ui/LocaleSwitcher';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { usePresence } from '../../hooks/usePresence';
import {
  getDefaultRouteForRole,
  hasCapability,
  type Capability,
} from '../../utils/roleCapabilities';

interface HeaderProps {
  isSidebarExpanded: boolean;
  setSidebarExpanded: (isExpanded: boolean) => void;
  isSidebarPinned: boolean;
}

function ChevronDownIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 4.5L6 7.5L9 4.5" />
    </svg>
  );
}

export function Header({ isSidebarExpanded, setSidebarExpanded }: HeaderProps) {
  const { t } = useTranslation(['nav', 'common']);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { shouldRender: userMenuRender, isClosing: userMenuClosing } =
    usePresence(isUserMenuOpen);
  const homePath = getDefaultRouteForRole(user?.role);
  const isHomePage = [homePath, '/'].includes(location.pathname);

  const userInitials = useMemo(() => {
    if (!user?.email) return 'LU';
    const parts = user.email.split('@')[0].split('.');
    const first = parts[0]?.[0] ?? user.email[0];
    const second = parts[1]?.[0] ?? user.email[1] ?? '';
    return `${first}${second}`.toUpperCase();
  }, [user?.email]);

  const searchOptions = useMemo(
    () =>
      [
        {
          path: '/admin/dashboard',
          label: t('nav:dashboard'),
          capability: 'canViewDashboard',
        },
        {
          path: '/admin/books',
          label: t('nav:books'),
          capability: 'canManageBooks',
        },
        {
          path: '/admin/readers',
          label: t('nav:readers'),
          capability: 'canManageReaders',
        },
        {
          path: '/admin/loans',
          label: t('nav:loans'),
          capability: 'canManageLoans',
        },
        {
          path: '/admin/contents',
          label: t('nav:contents'),
          capability: 'canManageContents',
        },
        {
          path: '/admin/ranking',
          label: t('nav:ranking'),
          capability: 'canViewRanking',
        },
        {
          path: '/admin/reports',
          label: t('nav:reports'),
          capability: 'canViewReports',
        },
        {
          path: '/admin/settings',
          label: t('nav:settings'),
          capability: 'canViewSettings',
        },
      ].filter((item) =>
        hasCapability(user?.role, item.capability as Capability),
      ),
    [t, user?.role],
  );

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    if (!query) return [];
    return searchOptions
      .filter((item) => item.label.toLocaleLowerCase().includes(query))
      .slice(0, 5);
  }, [searchOptions, searchQuery]);

  const goToSearchResult = (path: string) => {
    navigate(path);
    setSearchQuery('');
    setIsSearchOpen(false);
    searchInputRef.current?.blur();
  };

  const handleHelpTour = () => {
    setIsUserMenuOpen(false);
    addToast({
      type: 'info',
      title: t('nav:help.label'),
      description: t('common:feature_coming_soon'),
    });
  };

  const userMenuItemClass =
    'row-hover w-full inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-200';

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  useEffect(() => {
    if (!isUserMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen]);

  const logoTile = (
    <div className="flex items-center gap-2.5 group">
      <div className="-ml-0.5 w-10 h-10 rounded-xl bg-lumi-gradient flex items-center justify-center text-white shadow-glowSoft group-hover:scale-105 transition-transform">
        <LogoIcon className="w-5 h-5 text-white" />
      </div>
      <div className="hidden sm:block">
        <div className="ml-2.5 font-display font-extrabold text-lg leading-none text-gray-900 dark:text-white">
          LumiLivre
        </div>
      </div>
    </div>
  );

  const userDisplayName =
    user?.email?.split('@')[0] ?? t('nav:settings', { defaultValue: 'Conta' });

  return (
    <header className="sticky top-0 z-50 h-16 px-4 sm:px-6 flex items-center justify-between bg-white/85 dark:bg-dark-card/85 backdrop-blur-xl border-b border-gray-200/70 dark:border-white/5">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          aria-label={t('nav:aria.toggle_sidebar')}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5"
          onClick={() => setSidebarExpanded(!isSidebarExpanded)}
        >
          <MenuIcon className="w-5 h-5 fill-current text-gray-600 dark:text-gray-300" />
        </button>

        {isHomePage ? (
          <div className="cursor-default">{logoTile}</div>
        ) : (
          <Link to={homePath}>{logoTile}</Link>
        )}
      </div>

      {/* Global search */}
      <div data-tour="global-search" className="hidden md:flex flex-1 max-w-xl mx-6">
        <div className="relative w-full">
          <SearchIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            ref={searchInputRef}
            type="search"
            aria-label={t('common:search')}
            placeholder={t('common:search')}
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            onBlur={() => window.setTimeout(() => setIsSearchOpen(false), 120)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && searchResults[0]) {
                event.preventDefault();
                goToSearchResult(searchResults[0].path);
              }
            }}
            className="w-full h-10 pl-10 pr-14 rounded-xl bg-gray-100 dark:bg-white/5 border border-transparent focus:border-lumi-primary focus:bg-white dark:focus:bg-dark-elev focus:outline-none text-sm transition placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-700 dark:text-gray-200"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-gray-400 border border-gray-200 dark:border-white/10 rounded-md px-1.5 py-0.5">
            <span>⌘</span>K
          </kbd>

          {isSearchOpen && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card dark:border-white/10 dark:bg-dark-card">
              {searchResults.map((item) => (
                <button
                  key={item.path}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => goToSearchResult(item.path)}
                  className="row-hover flex w-full items-center px-4 py-2.5 text-left text-sm font-semibold text-gray-700 dark:text-gray-200"
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <div className="hidden md:block">
          <LocaleSwitcher />
        </div>
        <NotificationsBell />
        <ThemeToggle />
        {user?.email && (
          <div ref={userMenuRef} className="relative ml-1">
            <button
              type="button"
              onClick={() => setIsUserMenuOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={isUserMenuOpen}
              aria-label={t('nav:user.menu_aria', { defaultValue: 'Menu' })}
              className="h-9 pl-1 pr-3 rounded-full bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 flex items-center gap-2 text-sm font-semibold"
            >
              <span className="w-7 h-7 rounded-full bg-lumi-gradient text-white text-xs font-bold flex items-center justify-center">
                {userInitials}
              </span>
              <span className="hidden sm:inline truncate max-w-[120px] text-gray-700 dark:text-gray-200">
                {userDisplayName}
              </span>
              <ChevronDownIcon className="text-gray-500" />
            </button>

            {userMenuRender && (
              <div
                role="menu"
                className={`absolute right-0 top-full mt-2 w-64 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark-card shadow-card overflow-hidden z-[60] ${
                  userMenuClosing ? 'animate-slide-down-out' : 'animate-slide-down'
                }`}
              >
                <div className="p-4 bg-lumi-gradient text-white">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                      {userInitials}
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold truncate capitalize">
                        {userDisplayName}
                      </div>
                      <div className="text-xs text-white/70 truncate">
                        {user.email}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-2">
                  {/* <Link
                    to="/admin/settings"
                    role="menuitem"
                    onClick={() => setIsUserMenuOpen(false)}
                    className={userMenuItemClass}
                  >
                    <User className="w-4 h-4" />
                    {t('nav:user.profile', { defaultValue: 'Meu perfil' })}
                  </Link> */}
                  <Link
                    to="/admin/settings"
                    role="menuitem"
                    onClick={() => setIsUserMenuOpen(false)}
                    className={userMenuItemClass}
                  >
                    <Settings2 className="w-4 h-4" />
                    {t('nav:settings')}
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleHelpTour}
                    className={userMenuItemClass}
                  >
                    <LifeBuoy className="w-4 h-4" />
                    {t('nav:help.label', { defaultValue: 'Ajuda' })}
                  </button>
                  <hr className="my-2 border-gray-100 dark:border-white/5" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout?.();
                    }}
                    className="w-full inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                  >
                    <LogOut className="w-4 h-4" />
                    {t('common:logout', { defaultValue: 'Sair' })}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
