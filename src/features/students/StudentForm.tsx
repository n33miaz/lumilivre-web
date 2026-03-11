import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { buscarEnderecoPorCep } from '../../services/cepService';
import {
  useCursos,
  useModulos,
  useTurnos,
} from '../../hooks/queries/useStudentQueries';
import {
  studentSchema,
  type StudentFormData,
} from '../../schemas/studentSchema';
import { useToast } from '../../contexts/ToastContext';

import { Label } from '../../components/ui/Label';
import { Input } from '../../components/ui/Input';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { CustomDatePicker } from '../../components/ui/CustomDatePicker';

interface StudentFormProps {
  formId: string;
  initialData?: Partial<StudentFormData>;
  readOnly?: boolean;
  onSubmit: (data: StudentFormData) => void;
  isSubmitting?: boolean;
}

export function StudentForm({
  formId,
  initialData,
  readOnly = false,
  onSubmit,
}: StudentFormProps) {
  const { addToast } = useToast();
  const [isCepLoading, setIsCepLoading] = useState(false);

  const { data: cursosList } = useCursos();
  const { data: modulosList } = useModulos();
  const { data: turnosList } = useTurnos();

  const cursosOptions = (cursosList || []).map((c) => ({
    label: c.nome,
    value: c.id,
  }));
  const modulosOptions = (modulosList || []).map((m) => ({
    label: m.nome,
    value: m.id,
  }));
  const turnoOptions = (turnosList || []).map((t) => ({
    label: t.nome,
    value: t.id,
  }));

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: initialData || { cursoId: '', turnoId: '', moduloId: '' },
  });

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    if (readOnly) return;
    const cep = e.target.value.replace(/\D/g, '');
    if (cep.length === 8) {
      setIsCepLoading(true);
      try {
        const endereco = await buscarEnderecoPorCep(cep);
        setValue('logradouro', endereco.logradouro || '');
        setValue('bairro', endereco.bairro || '');
        setValue('localidade', endereco.localidade || '');
        setValue('uf', endereco.uf || '');
      } catch {
        addToast({ type: 'warning', title: 'CEP não encontrado' });
      } finally {
        setIsCepLoading(false);
      }
    }
  };

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="nomeCompleto" requiredIndicator={!readOnly}>
          Nome Completo
        </Label>
        <Input
          id="nomeCompleto"
          {...register('nomeCompleto')}
          error={errors.nomeCompleto?.message}
          disabled={readOnly}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="matricula" requiredIndicator={!readOnly}>
            Matrícula
          </Label>
          <Input
            id="matricula"
            {...register('matricula')}
            error={errors.matricula?.message}
            disabled={readOnly || !!initialData?.matricula}
          />
        </div>
        <div>
          <Label htmlFor="cpf">CPF</Label>
          <Input id="cpf" {...register('cpf')} disabled={readOnly} />
        </div>
        <div>
          <Label htmlFor="celular">Celular</Label>
          <Input id="celular" {...register('celular')} disabled={readOnly} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Controller
          name="dataNascimento"
          control={control}
          render={({ field }) => (
            <CustomDatePicker
              label="Data de Nascimento"
              value={field.value}
              onChange={field.onChange}
              disabled={readOnly}
            />
          )}
        />
        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            error={errors.email?.message}
            disabled={readOnly}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label requiredIndicator={!readOnly}>Curso</Label>
          <Controller
            name="cursoId"
            control={control}
            render={({ field }) => (
              <div>
                <CustomSelect
                  value={String(field.value)}
                  onChange={field.onChange}
                  options={cursosOptions}
                  placeholder="Selecione"
                  disabled={readOnly}
                />
                {errors.cursoId && (
                  <span className="text-xs text-red-500 mt-1">
                    {errors.cursoId.message}
                  </span>
                )}
              </div>
            )}
          />
        </div>
        <div>
          <Label requiredIndicator={!readOnly}>Turno</Label>
          <Controller
            name="turnoId"
            control={control}
            render={({ field }) => (
              <div>
                <CustomSelect
                  value={String(field.value)}
                  onChange={field.onChange}
                  options={turnoOptions}
                  placeholder="Selecione"
                  disabled={readOnly}
                />
                {errors.turnoId && (
                  <span className="text-xs text-red-500 mt-1">
                    {errors.turnoId.message}
                  </span>
                )}
              </div>
            )}
          />
        </div>
        <div>
          <Label requiredIndicator={!readOnly}>Módulo</Label>
          <Controller
            name="moduloId"
            control={control}
            render={({ field }) => (
              <div>
                <CustomSelect
                  value={String(field.value)}
                  onChange={field.onChange}
                  options={modulosOptions}
                  placeholder="Selecione"
                  disabled={readOnly}
                />
                {errors.moduloId && (
                  <span className="text-xs text-red-500 mt-1">
                    {errors.moduloId.message}
                  </span>
                )}
              </div>
            )}
          />
        </div>
      </div>
      <hr className="border-gray-200 dark:border-gray-700 my-2" />
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-4 md:col-span-3">
          <Label htmlFor="cep">CEP</Label>
          <Input
            id="cep"
            maxLength={9}
            {...register('cep')}
            onBlur={handleCepBlur}
            disabled={readOnly}
          />
        </div>
        <div className="col-span-8 md:col-span-9">
          <Label htmlFor="logradouro">Logradouro</Label>
          <Input
            id="logradouro"
            {...register('logradouro')}
            disabled={readOnly || isCepLoading}
          />
        </div>
      </div>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-5">
          <Label htmlFor="bairro">Bairro</Label>
          <Input
            id="bairro"
            {...register('bairro')}
            disabled={readOnly || isCepLoading}
          />
        </div>
        <div className="col-span-5">
          <Label htmlFor="localidade">Cidade</Label>
          <Input
            id="localidade"
            {...register('localidade')}
            disabled={readOnly || isCepLoading}
          />
        </div>
        <div className="col-span-2">
          <Label htmlFor="uf">UF</Label>
          <Input
            id="uf"
            {...register('uf')}
            disabled={readOnly || isCepLoading}
          />
        </div>
      </div>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-4">
          <Label htmlFor="numero_casa">Número</Label>
          <Input
            id="numero_casa"
            type="number"
            {...register('numero_casa')}
            disabled={readOnly}
          />
        </div>
        <div className="col-span-8">
          <Label htmlFor="complemento">Complemento</Label>
          <Input
            id="complemento"
            {...register('complemento')}
            disabled={readOnly}
          />
        </div>
      </div>
    </form>
  );
}
