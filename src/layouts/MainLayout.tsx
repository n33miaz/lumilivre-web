import { type ReactNode, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { motion, AnimatePresence, type Variants } from 'framer-motion';

import { useAuth } from '../contexts/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { getRouteIndex } from '../utils/navigationOrder';
import { MandatoryPasswordChangeModal } from '../pages/Auth/components/MandatoryPasswordChangeModal';
import { GuidedTour } from '../components/GuidedTour';

export function MainLayout({ children }: { children: ReactNode }) {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isSidebarPinned, setIsSidebarPinned] = useState(false);
  const { isLoggingOut } = useAuth();
  const { t } = useTranslation('common');

  const location = useLocation();
  const prevIdxRef = useRef(getRouteIndex(location.pathname));
  const directionRef = useRef(0);
  const currentIdx = getRouteIndex(location.pathname);

  if (currentIdx !== prevIdxRef.current) {
    if (currentIdx > prevIdxRef.current) directionRef.current = 1;
    else if (currentIdx < prevIdxRef.current) directionRef.current = -1;
    prevIdxRef.current = currentIdx;
  }

  // Transição de rota enxuta: sem delay de entrada (era 80ms e dava sensação de
  // travamento), curso menor (3%) e durações mais curtas. Menos transform a
  // animar = menos trabalho de composição em telas pesadas (tabelas longas),
  // o que tira a "lag" relatada sem perder a leitura de direção do slide.
  const variants: Variants = {
    enter: (direction: number) => ({
      y: direction > 0 ? '3%' : '-3%',
      opacity: 0,
      zIndex: 1,
      willChange: 'transform, opacity',
    }),
    center: {
      y: '0%',
      opacity: 1,
      zIndex: 1,
      transition: {
        duration: 0.24,
        ease: [0.16, 1, 0.3, 1],
      },
    },
    exit: (direction: number) => ({
      y: direction > 0 ? '-3%' : '3%',
      opacity: 0,
      zIndex: 0,
      willChange: 'transform, opacity',
      transition: {
        duration: 0.15,
        ease: [0.16, 1, 0.3, 1],
      },
    }),
  };

  return (
    <div
      className={`relative h-screen flex flex-col bg-gray-50 dark:bg-dark-background overflow-hidden ${
        isLoggingOut
          ? 'opacity-0 scale-95 pointer-events-none'
          : 'opacity-100 scale-100'
      }`}
    >
      <MandatoryPasswordChangeModal />
      <GuidedTour />

      <Header
        isSidebarExpanded={isSidebarExpanded}
        setSidebarExpanded={setIsSidebarExpanded}
        isSidebarPinned={isSidebarPinned}
      />

      <div className="relative z-10 flex min-h-0 flex-1 overflow-hidden">
        {/* Mobile backdrop */}
        {isSidebarExpanded && (
          <button
            type="button"
            aria-label="Close sidebar"
            className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
            onClick={() => setIsSidebarExpanded(false)}
          />
        )}

        <div
          className={`${
            isSidebarExpanded
              ? 'fixed z-40 inset-y-16 left-0 md:inset-auto'
              : 'hidden md:flex'
          } md:relative md:shrink-0 md:transition-[width] md:duration-300 ${
            isSidebarPinned ? 'md:w-56' : 'md:w-20'
          }`}
        >
          <Sidebar
            isExpanded={isSidebarExpanded}
            setExpanded={setIsSidebarExpanded}
            isPinned={isSidebarPinned}
            setPinned={setIsSidebarPinned}
          />
        </div>

        <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          <AnimatePresence
            mode="popLayout"
            custom={directionRef.current}
            initial={false}
          >
            <motion.div
              key={location.pathname}
              custom={directionRef.current}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              className="min-h-0 flex-1 will-change-transform"
              style={{ backfaceVisibility: 'hidden' }}
            >
              {/* O scroll vive aqui: altura herdada do motion.div (flex-1 min-h-0),
                  separado da animação para que o transform não gere scrollbar. */}
              <div className="h-full overflow-y-auto custom-scrollbar">
                <div className="relative flex min-h-full flex-col p-5 sm:p-7 lg:p-8 pb-6 max-w-[1600px] mx-auto">
                  {children}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Rodapé fixo discreto: sempre visível, fora do fluxo de scroll das telas. */}
          <footer className="shrink-0 border-t border-gray-200/60 bg-gray-50/80 px-4 py-1.5 text-center text-[11px] text-gray-400 backdrop-blur-sm select-none dark:border-white/5 dark:bg-dark-background/80 dark:text-gray-500">
            <Trans
              t={t}
              i18nKey="footer.signature"
              values={{ version: __APP_VERSION__ }}
              components={{
                author: (
                  <a
                    href="https://github.com/n33miaz"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold transition-colors hover:text-lumi-primary dark:hover:text-lumi-label"
                  />
                ),
              }}
            />
          </footer>
        </main>
      </div>
    </div>
  );
}
