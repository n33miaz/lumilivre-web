import { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';

import { Label } from '../../components/ui/Label';
import { Input } from '../../components/ui/Input';
import { CustomSelect } from '../../components/ui/CustomSelect';
import {
  buildUserSchema,
  MANAGEABLE_ROLES,
  type UserFormData,
} from '../../schemas/userSchema';

interface UserFormProps {
  formId: string;
  isEdit: boolean;
  initialData?: Partial<UserFormData>;
  onSubmit: (data: UserFormData) => void;
}

export function UserForm({
  formId,
  isEdit,
  initialData,
  onSubmit,
}: UserFormProps) {
  const { t } = useTranslation('admin');
  const schema = useMemo(() => buildUserSchema(isEdit), [isEdit]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: initialData?.email ?? '',
      password: '',
      role: initialData?.role ?? 'LIBRARIAN',
    },
  });

  useEffect(() => {
    reset({
      email: initialData?.email ?? '',
      password: '',
      role: initialData?.role ?? 'LIBRARIAN',
    });
  }, [initialData, reset]);

  const roleOptions = MANAGEABLE_ROLES.map((role) => ({
    label: t(`users.role.${role.toLowerCase()}`),
    value: role,
  }));

  return (
    <form
      id={formId}
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
      noValidate
    >
      <div>
        <Label htmlFor="user-email" requiredIndicator>
          {t('users.field.email')}
        </Label>
        <Input
          id="user-email"
          type="email"
          autoComplete="off"
          {...register('email')}
          error={errors.email ? t('users.error.email') : undefined}
        />
      </div>

      <div>
        <Label htmlFor="user-password" requiredIndicator={!isEdit}>
          {t('users.field.password')}
        </Label>
        <Input
          id="user-password"
          type="password"
          autoComplete="new-password"
          placeholder={isEdit ? t('users.field.password_edit_hint') : undefined}
          {...register('password')}
          error={errors.password ? t('users.error.password') : undefined}
        />
        <p className="text-xs text-gray-400 mt-1">
          {t('users.field.must_change_hint')}
        </p>
      </div>

      <div>
        <Label requiredIndicator>{t('users.field.role')}</Label>
        <Controller
          name="role"
          control={control}
          render={({ field }) => (
            <CustomSelect
              value={field.value}
              onChange={field.onChange}
              options={roleOptions}
              placeholder={t('users.field.role')}
              disabled={isEdit}
            />
          )}
        />
      </div>
    </form>
  );
}
