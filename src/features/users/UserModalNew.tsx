import { useTranslation } from 'react-i18next';

import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { UserForm } from './UserForm';
import { useCreateUser } from '../../hooks/mutations/useUserMutations';
import type { UserFormData } from '../../schemas/userSchema';
import type { UsuarioPayload } from '../../services/userService';

interface UserModalNewProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function UserModalNew({ onClose, onSuccess }: UserModalNewProps) {
  const { t } = useTranslation('admin');
  const { mutateAsync: createUser, isPending } = useCreateUser();

  const handleSubmit = async (data: UserFormData) => {
    try {
      await createUser({
        email: data.email,
        password: data.password || undefined,
        role: data.role,
      } as UsuarioPayload);
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <Modal.Body>
        <UserForm formId="form-novo-usuario" isEdit={false} onSubmit={handleSubmit} />
      </Modal.Body>
      <Modal.Footer>
        <Button
          type="submit"
          form="form-novo-usuario"
          isLoading={isPending}
          className="w-full"
        >
          {t('users.action.create')}
        </Button>
      </Modal.Footer>
    </>
  );
}
