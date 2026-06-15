import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { useTheme } from '../../contexts/ThemeContext';
import { NavBar } from '../../features/landing/NavBar';
import { Hero } from '../../features/landing/Hero';
import { Ecosystem } from '../../features/landing/Ecosystem';
import { Features } from '../../features/landing/Features';
import { ScreensShowcase } from '../../features/landing/ScreensShowcase';
import { StackMarquee } from '../../features/landing/StackMarquee';
import { CommunityCTA } from '../../features/landing/CommunityCTA';
import { Footer } from '../../features/landing/Footer';

const ADMIN_LEAVE_MS = 260;

export function LandingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation('landing');
  const { theme, setTheme } = useTheme();
  const dark = theme === 'dark';

  const [isLeaving, setIsLeaving] = useState(false);
  const leaveTimer = useRef<number | null>(null);

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
      className={`landing-root min-h-screen bg-white dark:bg-ink-950 text-gray-900 dark:text-gray-100 font-inter transition-[opacity,transform] duration-[260ms] ease-out ${
        isLeaving ? 'opacity-0 scale-[0.985] pointer-events-none' : 'opacity-100'
      }`}
    >
      <NavBar
        dark={dark}
        setDark={(value) => setTheme(value ? 'dark' : 'light')}
        onAdminClick={handleAdminClick}
      />
      <main>
        <Hero />
        <Ecosystem />
        <Features />
        <ScreensShowcase />
        <StackMarquee />
        <CommunityCTA />
      </main>
      <Footer />
    </div>
  );
}
