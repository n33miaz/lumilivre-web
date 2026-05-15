import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  type SupportedLocale,
} from '../i18n';

interface LocaleContextValue {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();

  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  const initial: SupportedLocale =
    stored && SUPPORTED_LOCALES.includes(stored as SupportedLocale)
      ? (stored as SupportedLocale)
      : DEFAULT_LOCALE;

  const [locale, setLocaleState] = useState<SupportedLocale>(initial);

  const setLocale = useCallback(
    (next: SupportedLocale) => {
      localStorage.setItem(LOCALE_STORAGE_KEY, next);
      setLocaleState(next);
      void i18n.changeLanguage(next);
    },
    [i18n],
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
