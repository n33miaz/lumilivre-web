import { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';

import { Modal } from '../Modal';
import { ConfirmModal } from '../ConfirmModal';
import { Label } from '../ui/Label';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { CustomSelect } from '../CustomSelect';
import { CustomDatePicker } from '../CustomDatePicker';
import { LoadingIcon } from '../LoadingIcon';

import LockIcon from '../../assets/icons/lock.svg?react';

import {
  buscarAlunoPorMatricula,
  type AlunoPayload,
  type ListaAluno,
} from '../../services/alunoService';
import { buscarEnderecoPorCep } from '../../services/cepService';
import {
  useCursos,
  useModulos,
  useTurnos,
  useEnum,
} from '../../hooks/useCommonQueries';
import {
  useUpdateStudent,
  useDeleteStudent,
  useResetStudentPassword,
} from '../../hooks/mutations/useStudentMutations';
import {
  studentSchema,
  type StudentFormData,
} from '../../schemas/studentSchema';

interface ModalStudentDetailsProps {
  aluno: ListaAluno | null;
  isOpen: boolean;
  onClose: (foiAtualizado?: boolean) => void;
}

export function ModalStudentDetails({
  aluno,
  isOpen,
  onClose,
}: ModalStudentDetailsProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isCepLoading, setIsCepLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    'excluir' | 'resetSenha' | null
  >(null);

  const { data: cursosData } = useCursos();
  const { data: modulosData } = useModulos();
  const { data: turnosData } = useTurnos();
  const { data: penalidadesData } = useEnum('PENALIDADE');

  const { mutateAsync: updateStudent, isPending: isUpdating } =
    useUpdateStudent();
  const { mutateAsync: deleteStudent, isPending: isDeleting } =
    useDeleteStudent();
  const { mutateAsync: resetPassword, isPending: isResetting } =
    useResetStudentPassword();

  const { data: alunoDetalhes, isLoading: isLoadingDetalhes } = useQuery({
    queryKey: ['aluno', aluno?.matricula],
    queryFn: () =>
      buscarAlunoPorMatricula(aluno!.matricula).then((res) => res.data),
    enabled: !!aluno?.matricula && isOpen,
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
  });

  const penalidadeAtual = watch('penalidade');

  const cursosOptions = useMemo(
    () => cursosData?.map((c) => ({ label: c.nome, value: c.id })) || [],
    [cursosData],
  );
  const modulosOptions = useMemo(
    () => modulosData?.map((m) => ({ label: m.nome, value: m.id })) || [],
    [modulosData],
  );
  const turnoOptions = useMemo(
    () => turnosData?.map((t) => ({ label: t.nome, value: t.id })) || [],
    [turnosData],
  );
  const penalidadeOptions = useMemo(
    () => [
      { label: 'Sem Penalidade', value: '' },
      ...(penalidadesData?.map((p) => ({ label: p.status, value: p.nome })) ||
        []),
    ],
    [penalidadesData],
  );

  useEffect(() => {
    if (alunoDetalhes && isOpen) {
      let cursoIdFinal = alunoDetalhes.cursoId;
      if (!cursoIdFinal && alunoDetalhes.cursoNome) {
        const found = cursosOptions.find(
          (c) => c.label === alunoDetalhes.cursoNome,
        );
        if (found) cursoIdFinal = Number(found.value);
      }

      let turnoIdFinal = alunoDetalhes.turnoId;
      if (!turnoIdFinal && alunoDetalhes.turnoNome) {
        const found = turnoOptions.find(
          (t) =>
            t.label.toUpperCase() === alunoDetalhes.turnoNome?.toUpperCase(),
        );
        if (found) turnoIdFinal = Number(found.value);
      }

      let moduloIdFinal = alunoDetalhes.moduloId;
      if (!moduloIdFinal && alunoDetalhes.moduloNome) {
        const found = modulosOptions.find(
          (m) => m.label === alunoDetalhes.moduloNome,
        );
        if (found) moduloIdFinal = Number(found.value);
      }

      reset({
        ...alunoDetalhes,
        cursoId: cursoIdFinal ? String(cursoIdFinal) : '',
        turnoId: turnoIdFinal ? String(turnoIdFinal) : '',
        moduloId: moduloIdFinal ? String(moduloIdFinal) : '',
        numero_casa: alunoDetalhes.numero_casa || '',
      });
      setIsEditMode(false);
    }
  }, [
    alunoDetalhes,
    isOpen,
    reset,
    cursosOptions,
    turnoOptions,
    modulosOptions,
  ]);

  if (!isOpen || !aluno) return null;

  const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, '');
    if (cep.length === 8) {
      setIsCepLoading(true);
      try {
        const endereco = await buscarEnderecoPorCep(cep);
        setValue('logradouro', endereco.logradouro || '');
        setValue('bairro', endereco.bairro || '');
        setValue('localidade', endereco.localidade || '');
        setValue('uf', endereco.uf || '');
      } catch (error) {
        console.error(error);
      } finally {
        setIsCepLoading(false);
      }
    }
  };

  const onSubmit = async (data: StudentFormData) => {
    try {
      const payload = {
        ...data,
        cpf: data.cpf ? data.cpf.replace(/\D/g, '') : undefined,
        celular: data.celular ? data.celular.replace(/\D/g, '') : undefined,
        cep: data.cep ? data.cep.replace(/\D/g, '') : undefined,
        curso_id: Number(data.cursoId),
        turno_id: Number(data.turnoId),
        modulo_id: Number(data.moduloId),
        numero_casa: Number(data.numero_casa) || 0,
        penalidade: data.penalidade,
      };

      await updateStudent({
        matricula: aluno.matricula,
        payload: payload as unknown as AlunoPayload,
      });
      setIsEditMode(false);
      onClose(true);
    } catch (error) {
      console.error(error);
    }
  };

  const executarResetSenha = async () => {
    try {
      await resetPassword(aluno.matricula);
      setConfirmAction(null);
    } catch (error) {
      console.error(error);
    }
  };

  const executarExclusao = async () => {
    try {
      await deleteStudent(aluno.matricula);
      setConfirmAction(null);
      onClose(true);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => onClose(false)}>
      <Modal.Header title={isEditMode ? 'Editar Aluno' : 'Detalhes do Aluno'} />

      <Modal.Body>
        {isLoadingDetalhes ? (
          <LoadingIcon />
        ) : (
          <form
            id="form-edit-aluno"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >
            {penalidadeAtual && penalidadeAtual !== 'REGISTRO' && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-md mb-2">
                <p className="text-red-700 dark:text-red-400 text-sm font-bold">
                  Status: {penalidadeAtual}
                </p>
              </div>
            )}

            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-8 md:col-span-9">
                <Label htmlFor="nomeCompleto" requiredIndicator={isEditMode}>
                  Nome Completo
                </Label>
                <Input
                  id="nomeCompleto"
                  disabled={!isEditMode}
                  {...register('nomeCompleto')}
                  error={errors.nomeCompleto?.message}
                />
              </div>
              <div className="col-span-4 md:col-span-3">
                <Label>Status de Penalidade</Label>
                {isEditMode ? (
                  <Controller
                    name="penalidade"
                    control={control}
                    render={({ field }) => (
                      <CustomSelect
                        value={field.value || ''}
                        onChange={field.onChange}
                        options={penalidadeOptions}
                        placeholder="Selecione"
                      />
                    )}
                  />
                ) : (
                  <div
                    className={`w-full h-[38px] px-3 border rounded-md text-sm flex items-center ${penalidadeAtual ? 'text-red-600 font-bold bg-red-50 border-red-200' : 'text-green-600 font-bold bg-green-50 border-green-200'}`}
                  >
                    {penalidadeOptions.find((p) => p.value === penalidadeAtual)
                      ?.label || 'Sem Penalidade'}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="matricula">Matrícula</Label>
                <Input id="matricula" disabled {...register('matricula')} />
              </div>
              <div>
                <Label htmlFor="cpf">CPF</Label>
                <Input id="cpf" disabled={!isEditMode} {...register('cpf')} />
              </div>
              <div>
                <Label htmlFor="celular">Celular</Label>
                <Input
                  id="celular"
                  disabled={!isEditMode}
                  {...register('celular')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Controller
                  name="dataNascimento"
                  control={control}
                  render={({ field }) => (
                    <CustomDatePicker
                      label="Data de Nascimento"
                      value={field.value}
                      onChange={field.onChange}
                      disabled={!isEditMode}
                    />
                  )}
                />
              </div>
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  disabled={!isEditMode}
                  {...register('email')}
                  error={errors.email?.message}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label requiredIndicator={isEditMode}>Curso</Label>
                {isEditMode ? (
                  <Controller
                    name="cursoId"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <CustomSelect
                          value={field.value}
                          onChange={field.onChange}
                          options={cursosOptions}
                          placeholder="Selecione"
                        />
                        {errors.cursoId && (
                          <span className="text-xs text-red-500 mt-1">
                            {errors.cursoId.message}
                          </span>
                        )}
                      </div>
                    )}
                  />
                ) : (
                  <Input
                    disabled
                    value={
                      cursosOptions.find(
                        (c) =>
                          String(c.value) === String(alunoDetalhes?.cursoId),
                      )?.label ||
                      alunoDetalhes?.cursoNome ||
                      ''
                    }
                  />
                )}
              </div>
              <div>
                <Label requiredIndicator={isEditMode}>Turno</Label>
                {isEditMode ? (
                  <Controller
                    name="turnoId"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <CustomSelect
                          value={field.value}
                          onChange={field.onChange}
                          options={turnoOptions}
                          placeholder="Selecione"
                        />
                        {errors.turnoId && (
                          <span className="text-xs text-red-500 mt-1">
                            {errors.turnoId.message}
                          </span>
                        )}
                      </div>
                    )}
                  />
                ) : (
                  <Input
                    disabled
                    value={
                      turnoOptions.find(
                        (t) =>
                          String(t.value) === String(alunoDetalhes?.turnoId),
                      )?.label ||
                      alunoDetalhes?.turnoNome ||
                      ''
                    }
                  />
                )}
              </div>
              <div>
                <Label requiredIndicator={isEditMode}>Módulo</Label>
                {isEditMode ? (
                  <Controller
                    name="moduloId"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <CustomSelect
                          value={field.value}
                          onChange={field.onChange}
                          options={modulosOptions}
                          placeholder="Selecione"
                        />
                        {errors.moduloId && (
                          <span className="text-xs text-red-500 mt-1">
                            {errors.moduloId.message}
                          </span>
                        )}
                      </div>
                    )}
                  />
                ) : (
                  <Input
                    disabled
                    value={
                      modulosOptions.find(
                        (m) =>
                          String(m.value) === String(alunoDetalhes?.moduloId),
                      )?.label ||
                      alunoDetalhes?.moduloNome ||
                      ''
                    }
                  />
                )}
              </div>
            </div>

            <hr className="border-gray-200 dark:border-gray-700 my-2" />

            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-4 md:col-span-3">
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  maxLength={9}
                  disabled={!isEditMode}
                  {...register('cep')}
                  onBlur={handleCepBlur}
                />
              </div>
              <div className="col-span-8 md:col-span-9">
                <Label htmlFor="logradouro">Logradouro</Label>
                <Input
                  id="logradouro"
                  disabled={!isEditMode || isCepLoading}
                  {...register('logradouro')}
                />
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-5">
                <Label htmlFor="bairro">Bairro</Label>
                <Input
                  id="bairro"
                  disabled={!isEditMode || isCepLoading}
                  {...register('bairro')}
                />
              </div>
              <div className="col-span-5">
                <Label htmlFor="localidade">Cidade</Label>
                <Input
                  id="localidade"
                  disabled={!isEditMode || isCepLoading}
                  {...register('localidade')}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="uf">UF</Label>
                <Input
                  id="uf"
                  disabled={!isEditMode || isCepLoading}
                  {...register('uf')}
                />
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-4">
                <Label htmlFor="numero_casa">Número</Label>
                <Input
                  id="numero_casa"
                  type="number"
                  disabled={!isEditMode}
                  {...register('numero_casa')}
                />
              </div>
              <div className="col-span-8">
                <Label htmlFor="complemento">Complemento</Label>
                <Input
                  id="complemento"
                  disabled={!isEditMode}
                  {...register('complemento')}
                />
              </div>
            </div>
          </form>
        )}
      </Modal.Body>

      <Modal.Footer className="justify-between w-full">
        <Button
          variant="danger"
          onClick={() => setConfirmAction('excluir')}
          disabled={isUpdating || isEditMode || isLoadingDetalhes}
          isLoading={isDeleting}
        >
          Excluir
        </Button>

        {isEditMode ? (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => setIsEditMode(false)}
              disabled={isUpdating}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="form-edit-aluno"
              variant="success"
              isLoading={isUpdating}
            >
              Salvar Alterações
            </Button>
          </div>
        ) : (
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setConfirmAction('resetSenha')}
              disabled={isLoadingDetalhes}
              isLoading={isResetting}
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              <LockIcon className="w-5 h-5 mr-2" />
              <span className="hidden sm:inline">Resetar Senha</span>
            </Button>
            <Button
              onClick={() => setIsEditMode(true)}
              disabled={isLoadingDetalhes}
            >
              Editar Cadastro
            </Button>
          </div>
        )}
      </Modal.Footer>

      <ConfirmModal
        isOpen={confirmAction !== null}
        title={confirmAction === 'excluir' ? 'Excluir Aluno' : 'Resetar Senha'}
        message={
          confirmAction === 'excluir'
            ? `Tem certeza que deseja excluir o aluno ${aluno.nomeCompleto}?`
            : `Tem certeza que deseja resetar a senha do aluno ${aluno.nomeCompleto}?\n\nA senha voltará a ser a matrícula: ${aluno.matricula}`
        }
        isDestructive={confirmAction === 'excluir'}
        onConfirm={
          confirmAction === 'excluir' ? executarExclusao : executarResetSenha
        }
        onCancel={() => setConfirmAction(null)}
      />
    </Modal>
  );
}
