import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useTheme } from '../../contexts/ThemeContext';
import { NavBar } from '../../features/landing/NavBar';
import { Hero } from '../../features/landing/Hero';
import { Ecosystem } from '../../features/landing/Ecosystem';
import { Features } from '../../features/landing/Features';
import { StackMarquee } from '../../features/landing/StackMarquee';
import { CommunityCTA } from '../../features/landing/CommunityCTA';
import { Footer } from '../../features/landing/Footer';

export function LandingPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const dark = theme === 'dark';

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'LumiLivre — Software livre para bibliotecas escolares';
    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <div className="landing-root min-h-screen bg-white dark:bg-ink-950 text-gray-900 dark:text-gray-100 font-inter">
      <NavBar
        dark={dark}
        setDark={(value) => setTheme(value ? 'dark' : 'light')}
        onAdminClick={() => navigate('/login')}
      />
      <main>
        <Hero />
        <Ecosystem />
        <Features />
        <StackMarquee />
        <CommunityCTA />
      </main>
      <Footer />
    </div>
  );
}
