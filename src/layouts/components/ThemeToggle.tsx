import { useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeContext } from '../../contexts/ThemeContext';

import SunIcon from '../../assets/icons/sun.svg?react';
import MoonIcon from '../../assets/icons/moon.svg?react';

export function ThemeToggle() {
  const { t } = useTranslation('nav');
  const { theme, setTheme } = useContext(ThemeContext);

  const [effectiveTheme, setEffectiveTheme] = useState(theme);

  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setEffectiveTheme(mediaQuery.matches ? 'dark' : 'light');

      const handler = (e: MediaQueryListEvent) =>
        setEffectiveTheme(e.matches ? 'dark' : 'light');
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      setEffectiveTheme(theme);
    }
  }, [theme]);

  const handleToggle = () => {
    const newTheme = effectiveTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const isLight = effectiveTheme === 'light';

  return (
    <button
      onClick={handleToggle}
      className="row-hover group h-9 w-9 rounded-lg flex items-center justify-center select-none text-gray-600 hover:text-lumi-primary dark:text-gray-300 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-lumi-primary"
      title={isLight ? t('theme.switch_to_dark') : t('theme.switch_to_light')}
      aria-label={t('aria.toggle_theme')}
    >
      {/* Both icons share one grid cell and cross-fade + rotate on theme change,
          so the swap glides instead of hard-cutting. Wrapper tilts on hover. */}
      <span className="relative grid h-5 w-5 place-items-center transition-transform duration-200 ease-out group-hover:rotate-12">
        <MoonIcon
          className={`col-start-1 row-start-1 h-5 w-5 text-lumi-primary transition-[opacity,transform] duration-200 ease-out ${
            isLight
              ? 'rotate-0 scale-100 opacity-100'
              : '-rotate-90 scale-0 opacity-0'
          }`}
        />
        <SunIcon
          className={`col-start-1 row-start-1 h-5 w-5 text-amber-400 transition-[opacity,transform] duration-200 ease-out ${
            isLight
              ? 'rotate-90 scale-0 opacity-0'
              : 'rotate-0 scale-100 opacity-100'
          }`}
        />
      </span>
    </button>
  );
}
