import { useTranslation } from 'react-i18next';

import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText,
  cancelText,
  isDestructive = false,
}: ConfirmModalProps) {
  const { t } = useTranslation('common');

  return (
    <Modal isOpen={isOpen} onClose={onCancel} maxWidth="max-w-md">
      <Modal.Header title={title} />

      <Modal.Body>
        <p className="text-gray-700 dark:text-gray-300 text-lg whitespace-pre-line">
          {message}
        </p>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="ghost" onClick={onCancel}>
          {cancelText ?? t('cancel')}
        </Button>
        <Button
          variant={isDestructive ? 'danger' : 'primary'}
          onClick={() => {
            onConfirm();
            onCancel();
          }}
        >
          {confirmText ?? t('confirm')}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
