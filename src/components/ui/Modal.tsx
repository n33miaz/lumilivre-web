import {
  useEffect,
  useState,
  type ReactNode,
  createContext,
  useContext,
} from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import CloseIcon from '../../assets/icons/close.svg?react';

const ModalContext = createContext<{
  onClose: () => void;
  preventClose: boolean;
} | null>(null);

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  preventClose?: boolean;
  maxWidth?: string;
}

export function Modal({
  isOpen,
  onClose,
  children,
  preventClose = false,
  maxWidth = 'max-w-3xl',
}: ModalProps) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsAnimatingOut(false);
      document.body.style.overflow = 'hidden';
    } else {
      setIsAnimatingOut(true);
      document.body.style.overflow = 'auto';
      const timer = setTimeout(() => setShouldRender(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  return createPortal(
    <ModalContext.Provider value={{ onClose, preventClose }}>
      <div
        className={`fixed inset-0 z-[999] flex items-center justify-center select-none ${isAnimatingOut ? 'animate-fade-out' : 'animate-fade-in'}`}
      >
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => !preventClose && onClose()}
        />
        <div
          className={`relative bg-white dark:bg-dark-card rounded-lg shadow-2xl w-[95%] md:w-full ${maxWidth} m-2 md:m-4 max-h-[95vh] flex flex-col ${isAnimatingOut ? 'animate-shrink-out' : 'animate-grow-in'}`}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </ModalContext.Provider>,
    document.body,
  );
}

// Subcomponentes
Modal.Header = function ModalHeader({ title }: { title: string }) {
  const { t } = useTranslation('common');
  const context = useContext(ModalContext);
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
      <h2 className="ml-2 text-xl font-bold text-gray-800 dark:text-white">
        {title}
      </h2>
      {!context?.preventClose && (
        <button
          onClick={context?.onClose}
          className="rounded-md hover:opacity-75 transition-opacity"
          aria-label={t('action.close_modal')}
        >
          <CloseIcon className="w-8 h-8 mr-0.5 text-lumi-primary" />
        </button>
      )}
    </div>
  );
};

Modal.Body = function ModalBody({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`p-6 overflow-y-auto custom-scrollbar ${className}`}>
      {children}
    </div>
  );
};

Modal.Footer = function ModalFooter({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`p-4 border-t border-gray-200 dark:border-gray-700 shrink-0 flex justify-end gap-3 ${className}`}
    >
      {children}
    </div>
  );
};
