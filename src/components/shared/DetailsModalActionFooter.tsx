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
  return (
    <Modal.Footer className="justify-between w-full">
      <Button
        variant="danger"
        onClick={props.onDelete}
        disabled={props.isUpdating || props.isEditMode}
        isLoading={props.isDeleting}
      >
        Excluir
      </Button>

      {props.isEditMode ? (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={props.onCancel}
            disabled={props.isUpdating}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form={props.formId}
            variant="success"
            isLoading={props.isUpdating}
          >
            Salvar Alterações
          </Button>
        </div>
      ) : (
        <Button onClick={props.onEdit}>Editar Cadastro</Button>
      )}
    </Modal.Footer>
  );
}
