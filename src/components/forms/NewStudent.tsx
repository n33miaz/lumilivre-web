import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { buscarEnderecoPorCep } from '../../services/cepService';
import { cadastrarCurso } from '../../services/cursoService';
import { cadastrarModulo } from '../../services/moduloService';
import { cadastrarTurno } from '../../services/turnoService';
import { useCursos, useModulos, useTurnos } from '../../hooks/useCommonQueries';
import { useCreateStudent } from '../../hooks/mutations/useStudentMutations';
import {
  studentSchema,
  type StudentFormData,
} from '../../schemas/studentSchema';
import { useToast } from '../../contexts/ToastContext';

import { Label } from '../ui/Label';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { CustomSelect } from '../CustomSelect';
import { CustomDatePicker } from '../CustomDatePicker';
import type { AlunoPayload } from '../../services/alunoService';

export function NovoAluno({ onClose }: { onClose: () => void }) {
  const { addToast } = useToast();
  const { mutateAsync: createStudent, isPending: isCreating } =
    useCreateStudent();

  const [isCepLoading, setIsCepLoading] = useState(false);
  const [isNovoCurso, setIsNovoCurso] = useState(false);
  const [isNovoTurno, setIsNovoTurno] = useState(false);
  const [isNovoModulo, setIsNovoModulo] = useState(false);

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
    formState: { errors },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      cursoId: '',
      turnoId: '',
      moduloId: '',
    },
  });

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
      } catch {
        addToast({
          type: 'warning',
          title: 'CEP não encontrado',
          description: 'Verifique o número digitado.',
        });
      } finally {
        setIsCepLoading(false);
      }
    }
  };

  const onSubmit = async (data: StudentFormData) => {
    try {
      let finalCursoId = Number(data.cursoId);
      let finalTurnoId = Number(data.turnoId);
      let finalModuloId = Number(data.moduloId);

      // Lógica de criação
      if (isNovoTurno) {
        const novoTurno = await cadastrarTurno({ nome: String(data.turnoId) });
        finalTurnoId = novoTurno.id;
      }
      if (isNovoModulo) {
        const novoModulo = await cadastrarModulo({
          nome: String(data.moduloId),
        });
        finalModuloId = novoModulo.id;
      }
      if (isNovoCurso) {
        const novoCurso = await cadastrarCurso({
          nome: String(data.cursoId),
          turno: String(finalTurnoId),
          modulo: String(finalModuloId),
        });
        finalCursoId = novoCurso.id;
      }

      const payload = {
        ...data,
        cpf: data.cpf ? data.cpf.replace(/\D/g, '') : undefined,
        celular: data.celular ? data.celular.replace(/\D/g, '') : undefined,
        cep: data.cep ? data.cep.replace(/\D/g, '') : undefined,
        cursoId: finalCursoId,
        turnoId: finalTurnoId,
        moduloId: finalModuloId,
        numero_casa: Number(data.numero_casa) || 0,
      };

      await createStudent(payload as unknown as AlunoPayload);
      onClose();
    } catch (error) {
      console.error('Erro ao processar formulário:', error);
    }
  };

  const linkActionStyles =
    'text-xs text-lumi-primary dark:text-lumi-label cursor-pointer hover:underline font-bold ml-2';

  return (
    <div className="flex flex-col h-full max-h-[70vh]">
      <div className="overflow-y-auto p-1 flex-grow custom-scrollbar pr-2">
        <form
          id="form-novo-aluno"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="nomeCompleto" requiredIndicator>
                Nome Completo
              </Label>
              <Input
                id="nomeCompleto"
                {...register('nomeCompleto')}
                error={errors.nomeCompleto?.message}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="matricula" requiredIndicator>
                  Matrícula
                </Label>
                <Input
                  id="matricula"
                  placeholder="Ex: 24777"
                  {...register('matricula')}
                  error={errors.matricula?.message}
                />
              </div>
              <div>
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  placeholder="000.000.000-00"
                  {...register('cpf')}
                />
              </div>
              <div>
                <Label htmlFor="celular">Celular</Label>
                <Input
                  id="celular"
                  placeholder="(00) 00000-0000"
                  {...register('celular')}
                />
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
                  />
                )}
              />
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="exemplo@etec.sp.gov.br"
                  {...register('email')}
                  error={errors.email?.message}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <Label className="mb-0" requiredIndicator>
                  Curso
                </Label>
                <span
                  onClick={() => setIsNovoCurso(!isNovoCurso)}
                  className={linkActionStyles}
                >
                  {isNovoCurso ? 'Selecionar existente' : 'Novo?'}
                </span>
              </div>
              {isNovoCurso ? (
                <Input
                  placeholder="Nome do novo curso"
                  {...register('cursoId')}
                  error={errors.cursoId?.message}
                />
              ) : (
                <Controller
                  name="cursoId"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <CustomSelect
                        value={field.value}
                        onChange={field.onChange}
                        options={cursosOptions}
                        placeholder="Selecione o Curso"
                      />
                      {errors.cursoId && (
                        <span className="text-xs text-red-500 mt-1">
                          {errors.cursoId.message}
                        </span>
                      )}
                    </div>
                  )}
                />
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <Label className="mb-0" requiredIndicator>
                  Turno
                </Label>
                <span
                  onClick={() => setIsNovoTurno(!isNovoTurno)}
                  className={linkActionStyles}
                >
                  {isNovoTurno ? 'Selecionar existente' : 'Novo?'}
                </span>
              </div>
              {isNovoTurno ? (
                <Input
                  placeholder="Nome do novo turno"
                  {...register('turnoId')}
                  error={errors.turnoId?.message}
                />
              ) : (
                <Controller
                  name="turnoId"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <CustomSelect
                        value={field.value}
                        onChange={field.onChange}
                        options={turnoOptions}
                        placeholder="Selecione o Turno"
                      />
                      {errors.turnoId && (
                        <span className="text-xs text-red-500 mt-1">
                          {errors.turnoId.message}
                        </span>
                      )}
                    </div>
                  )}
                />
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <Label className="mb-0" requiredIndicator>
                  Módulo
                </Label>
                <span
                  onClick={() => setIsNovoModulo(!isNovoModulo)}
                  className={linkActionStyles}
                >
                  {isNovoModulo ? 'Selecionar existente' : 'Novo?'}
                </span>
              </div>
              {isNovoModulo ? (
                <Input
                  placeholder="Nome do novo módulo"
                  {...register('moduloId')}
                  error={errors.moduloId?.message}
                />
              ) : (
                <Controller
                  name="moduloId"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <CustomSelect
                        value={field.value}
                        onChange={field.onChange}
                        options={modulosOptions}
                        placeholder="Selecione o Módulo"
                      />
                      {errors.moduloId && (
                        <span className="text-xs text-red-500 mt-1">
                          {errors.moduloId.message}
                        </span>
                      )}
                    </div>
                  )}
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
                placeholder="00000-000"
                {...register('cep')}
                onBlur={handleCepBlur}
              />
            </div>
            <div className="col-span-8 md:col-span-9">
              <Label htmlFor="logradouro">Logradouro</Label>
              <Input
                id="logradouro"
                disabled={isCepLoading}
                {...register('logradouro')}
              />
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-5">
              <Label htmlFor="bairro">Bairro</Label>
              <Input
                id="bairro"
                disabled={isCepLoading}
                {...register('bairro')}
              />
            </div>
            <div className="col-span-5">
              <Label htmlFor="localidade">Cidade</Label>
              <Input
                id="localidade"
                disabled={isCepLoading}
                {...register('localidade')}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="uf">UF</Label>
              <Input id="uf" disabled={isCepLoading} {...register('uf')} />
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-4">
              <Label htmlFor="numero_casa">Número</Label>
              <Input
                id="numero_casa"
                type="number"
                {...register('numero_casa')}
              />
            </div>
            <div className="col-span-8">
              <Label htmlFor="complemento">Complemento</Label>
              <Input id="complemento" {...register('complemento')} />
            </div>
          </div>
        </form>
      </div>

      <div className="pt-3 mt-2 border-t border-gray-200 dark:border-gray-700 shrink-0">
        <Button
          type="submit"
          form="form-novo-aluno"
          isLoading={isCreating || isCepLoading}
          loadingText={isCepLoading ? 'BUSCANDO CEP...' : 'SALVANDO...'}
          className="w-full py-3.5 text-[17px]"
        >
          CADASTRAR ALUNO
        </Button>
      </div>
    </div>
  );
}
