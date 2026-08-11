import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { useTheme } from '../../contexts/ThemeContext';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { NavBar } from '../../features/landing/NavBar';
import { Hero } from '../../features/landing/Hero';
import { Problem } from '../../features/landing/Problem';
import { Ecosystem } from '../../features/landing/Ecosystem';
import { Features } from '../../features/landing/Features';
import { ScreensShowcase } from '../../features/landing/ScreensShowcase';
import { Engineering } from '../../features/landing/Engineering';
import { ContactCTA } from '../../features/landing/ContactCTA';
import { Footer } from '../../features/landing/Footer';

const ADMIN_LEAVE_MS = 260;

export function LandingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation('landing');
  const { theme, setTheme } = useTheme();
  const dark = theme === 'dark';

  const [isLeaving, setIsLeaving] = useState(false);
  const leaveTimer = useRef<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Um observador só para todos os `data-reveal` da página (ver o hook).
  useScrollReveal(rootRef);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = t('meta.title');
    return () => {
      document.title = previousTitle;
    };
  }, [t]);

  useEffect(() => {
    return () => {
      if (leaveTimer.current !== null) window.clearTimeout(leaveTimer.current);
    };
  }, []);

  const handleAdminClick = () => {
    if (isLeaving) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      navigate('/login');
      return;
    }
    setIsLeaving(true);
    leaveTimer.current = window.setTimeout(() => navigate('/login'), ADMIN_LEAVE_MS);
  };

  return (
    <div
      ref={rootRef}
      // Papel (#F8F5EE) no lugar do branco puro, tinta quente (#1A1814) no lugar
      // do cinza-900 azulado. A marca roxa não mudou uma vírgula — o que mudou é
      // o neutro em volta dela, e é ele que fazia o conjunto parecer template.
      className={`landing-root paper-surface min-h-screen bg-paper-100 font-inter text-paper-900 transition-[opacity,transform] duration-[260ms] ease-out dark:bg-ink-950 dark:text-ink-100 ${
        isLeaving ? 'pointer-events-none scale-[0.985] opacity-0' : 'opacity-100'
      }`}
    >
      {/* Primeiro alvo de tabulação: pular a barra de navegação inteira. Só
          aparece quando recebe foco. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-lumi-500 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        {t('a11y.skipToContent')}
      </a>

      <NavBar
        dark={dark}
        setDark={(value) => setTheme(value ? 'dark' : 'light')}
        onAdminClick={handleAdminClick}
      />
      {/* Ordem em camadas: valor em cinco segundos (Hero), o problema de quem usa
          (Problem), as três peças (Ecosystem), o que o sistema faz (Features), as
          telas reais (Screens), as decisões de engenharia (Engineering) e o
          contato. Cada público para onde faz sentido para ele. */}
      <main id="main">
        <Hero />
        <Problem />
        <Ecosystem />
        <Features />
        <ScreensShowcase />
        <Engineering />
        <ContactCTA />
      </main>
      <Footer />
    </div>
  );
}
