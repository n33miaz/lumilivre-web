import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Modal } from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { Button } from '../../components/ui/Button';
import { ToggleSwitch } from '../../components/ui/ToggleSwitch';
import { UserForm } from './UserForm';
import { useAuth } from '../../contexts/AuthContext';
import {
  useUpdateUser,
  useDeleteUser,
  useSetUserStatus,
} from '../../hooks/mutations/useUserMutations';
import type { UserFormData } from '../../schemas/userSchema';
import type {
  ManageableRole,
  UsuarioResumo,
  UsuarioPayload,
} from '../../services/userService';

interface UserModalDetailsProps {
  usuario: UsuarioResumo | null;
  isOpen: boolean;
  onClose: (updated?: boolean) => void;
}

export function UserModalDetails({
  usuario,
  isOpen,
  onClose,
}: UserModalDetailsProps) {
  const { t } = useTranslation('admin');
  const { user: currentUser } = useAuth();
  const [isEditMode, setIsEditMode] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { mutateAsync: updateUser, isPending: isUpdating } = useUpdateUser();
  const { mutateAsync: deleteUser, isPending: isDeleting } = useDeleteUser();
  const { mutate: setUserStatus, isPending: isChangingStatus } =
    useSetUserStatus();

  useEffect(() => {
    if (isOpen) setIsEditMode(false);
  }, [isOpen, usuario]);

  if (!usuario) return null;

  const isSelf = currentUser?.email === usuario.email;
  const roleValue: ManageableRole =
    usuario.perfilCode === 'ADMIN' ? 'ADMIN' : 'LIBRARIAN';

  const initialData: Partial<UserFormData> = {
    email: usuario.email,
    role: roleValue,
  };

  const handleSubmit = async (data: UserFormData) => {
    try {
      await updateUser({
        id: usuario.id,
        payload: {
          email: data.email,
          password: data.password || undefined,
          role: data.role,
        } as UsuarioPayload,
      });
      setIsEditMode(false);
      onClose(true);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteUser(usuario.id);
      setConfirmDelete(false);
      onClose(true);
    } catch (error) {
      console.error(error);
    }
  };

  // Cada linha manda **só** o seu campo: o omitido fica intocado no servidor,
  // então ligar o bloqueio nunca reativa uma conta desligada por engano.
  const statusRows = [
    {
      id: 'active',
      title: t('users.status.active.title'),
      description: t('users.status.active.description'),
      checked: usuario.ativo,
      onChange: () =>
        setUserStatus({ id: usuario.id, payload: { ativo: !usuario.ativo } }),
    },
    {
      id: 'locked',
      title: t('users.status.locked.title'),
      description: t('users.status.locked.description'),
      checked: usuario.bloqueado,
      onChange: () =>
        setUserStatus({
          id: usuario.id,
          payload: { bloqueado: !usuario.bloqueado },
        }),
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={() => onClose(false)} maxWidth="max-w-xl">
      <Modal.Header
        title={isEditMode ? t('users.modal.edit_title') : t('users.modal.details_title')}
      />
      <Modal.Body>
        {isEditMode ? (
          <UserForm
            formId="form-edit-usuario"
            isEdit
            initialData={initialData}
            onSubmit={handleSubmit}
          />
        ) : (
          <div className="space-y-4">
            <div className="kv">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                {t('users.field.email')}
              </span>
              <span className="text-gray-800 dark:text-white font-medium">
                {usuario.email}
              </span>
            </div>
            <div className="kv">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                {t('users.field.role')}
              </span>
              <span>
                <span className="pill pill-purple">{usuario.perfilLabel}</span>
              </span>
            </div>

            {/* Dois interruptores, não um seletor de três posições: desligamento
                e bloqueio são estados independentes e podem coexistir. */}
            <div className="space-y-2 pt-2">
              <span className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                {t('users.status.section')}
              </span>
              {statusRows.map((row) => (
                <div
                  key={row.id}
                  className="flex items-center gap-4 rounded-xl border border-gray-200/70 dark:border-white/5 bg-gray-50 dark:bg-white/5 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm text-gray-800 dark:text-white">
                      {row.title}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {row.description}
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={row.checked}
                    onChange={row.onChange}
                    ariaLabel={row.title}
                    disabled={isChangingStatus}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer className="justify-between w-full">
        <Button
          variant="danger"
          onClick={() => setConfirmDelete(true)}
          disabled={isEditMode || isSelf}
          isLoading={isDeleting}
          title={isSelf ? t('users.delete.self_blocked') : undefined}
        >
          {t('users.action.delete')}
        </Button>
        {isEditMode ? (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => setIsEditMode(false)}
              disabled={isUpdating}
            >
              {t('users.action.cancel')}
            </Button>
            <Button
              type="submit"
              form="form-edit-usuario"
              variant="success"
              isLoading={isUpdating}
            >
              {t('users.action.save')}
            </Button>
          </div>
        ) : (
          <Button onClick={() => setIsEditMode(true)}>
            {t('users.action.edit')}
          </Button>
        )}
      </Modal.Footer>

      <ConfirmModal
        isOpen={confirmDelete}
        title={t('users.delete.title')}
        message={t('users.delete.message', { email: usuario.email })}
        isDestructive
        confirmText={t('users.action.delete')}
        cancelText={t('users.action.cancel')}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </Modal>
  );
}
