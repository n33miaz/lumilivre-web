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
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDestructive = false,
}: ConfirmModalProps) {
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
          {cancelText}
        </Button>
        <Button
          variant={isDestructive ? 'danger' : 'primary'}
          onClick={() => {
            onConfirm();
            onCancel();
          }}
        >
          {confirmText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
