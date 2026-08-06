import { useTranslation } from 'react-i18next';

import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface DetailsModalActionFooterProps {
  isEditMode: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onDelete: () => void;
  formId: string;
}

export function DetailsModalActionFooter({
  ...props
}: DetailsModalActionFooterProps) {
  const { t } = useTranslation('common');

  return (
    <Modal.Footer className="justify-between w-full">
      <Button
        variant="danger"
        onClick={props.onDelete}
        disabled={props.isUpdating || props.isEditMode}
        isLoading={props.isDeleting}
      >
        {t('delete')}
      </Button>

      {props.isEditMode ? (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={props.onCancel}
            disabled={props.isUpdating}
          >
            {t('cancel')}
          </Button>
          <Button
            type="submit"
            form={props.formId}
            variant="success"
            isLoading={props.isUpdating}
          >
            {t('action.save_changes')}
          </Button>
        </div>
      ) : (
        <Button onClick={props.onEdit}>{t('action.edit_record')}</Button>
      )}
    </Modal.Footer>
  );
}
