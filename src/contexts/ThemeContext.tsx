import {
  createContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
  useContext,
} from 'react';

type Theme = 'light' | 'dark' | 'system';

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

/**
 * Classe que liga a esmaecida entre os dois temas. Ela vive no `<html>` e SÓ
 * durante a troca — a regra dela está no fim do `index.css`.
 *
 * O caminho óbvio seria deixar `transition-colors` ligado no seletor universal o
 * tempo todo (era o que este projeto fazia). O preço disso não aparece na troca
 * de tema, e sim no resto do dia: todo hover, todo foco e todo realce do sistema
 * passam a arrastar 200ms, e uma tabela de centenas de células fica com uma
 * transição declarada em cada uma delas a cada recálculo de estilo. Ligar a
 * transição só na janela em que ela serve custa dois recálculos por troca — e
 * nada nos outros 99,9% do tempo.
 */
const THEME_FADE_CLASS = 'tema-em-troca';

/**
 * Duração da esmaecida, em milissegundos. Precisa acompanhar o valor escrito na
 * regra `.tema-em-troca` do `index.css`.
 */
const THEME_FADE_MS = 200;

/**
 * Folga antes de tirar a classe. Não é enfeite: quem tira a transição no meio
 * CANCELA todas as que estiverem correndo, e o que era uma esmaecida vira um
 * salto na metade do caminho. Foi o que apareceu na medição da tela de
 * empréstimos, onde o primeiro quadro depois da troca chega tarde por causa do
 * recálculo de uma tabela de centenas de células — e o relógio de 200ms da
 * transição só começa a contar NESSE quadro. Por isso a contagem é disparada de
 * dentro de um `requestAnimationFrame` (abaixo) e ainda leva 100ms de sobra.
 */
const THEME_FADE_CLEANUP_MS = THEME_FADE_MS + 100;

// eslint-disable-next-line react-refresh/only-export-components
export const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    return storedTheme || 'light';
  });

  // A primeira passada do efeito só APLICA o tema guardado: não existe troca
  // para esmaecer, e ligar a transição ali faria a página nascer mudando de cor.
  const firstRun = useRef(true);
  const fadeTimer = useRef<number | null>(null);
  const fadeFrame = useRef<number | null>(null);

  const cancelFadeCleanup = () => {
    if (fadeFrame.current !== null) window.cancelAnimationFrame(fadeFrame.current);
    if (fadeTimer.current !== null) window.clearTimeout(fadeTimer.current);
    fadeFrame.current = null;
    fadeTimer.current = null;
  };

  useEffect(() => {
    const root = window.document.documentElement;

    let effectiveTheme = theme;
    if (theme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }

    // Só há o que esmaecer se o tema EFETIVO mudou: ir de 'light' para 'system'
    // num sistema claro não muda um pixel, e piscar a classe ali seria trabalho
    // de recálculo sem nada na tela.
    const changing = !firstRun.current && !root.classList.contains(effectiveTheme);
    firstRun.current = false;

    if (
      changing &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      // A classe entra ANTES de `dark`/`light` sair. As duas mudanças caem no
      // mesmo recálculo, e quem decide se existe transição é o estilo DEPOIS da
      // mudança — então a esmaecida já pega nesta troca, sem quadro extra.
      root.classList.add(THEME_FADE_CLASS);
      cancelFadeCleanup();
      // O relógio começa no primeiro quadro DESENHADO depois da troca, que é
      // onde a transição também começa a contar. Cronometrar a partir daqui
      // encurtaria a esmaecida por todo o tempo que a tela levou para recalcular.
      fadeFrame.current = window.requestAnimationFrame(() => {
        fadeFrame.current = null;
        fadeTimer.current = window.setTimeout(() => {
          root.classList.remove(THEME_FADE_CLASS);
          fadeTimer.current = null;
        }, THEME_FADE_CLEANUP_MS);
      });
    }

    root.classList.remove('dark', 'light');
    root.classList.add(effectiveTheme);

    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => cancelFadeCleanup, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => useContext(ThemeContext);
