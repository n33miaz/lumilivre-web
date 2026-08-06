import api from './api';
import i18n from '../i18n';

interface LoginCredentials {
  user: string;
  senha: string;
}

interface LoginResponse {
  id: string;
  email: string;
  role: string;
  matriculaLeitor?: string;
  token: string;
  isInitialPassword: boolean;
  guidedTourCompleted: boolean;
}

export const login = async (
  credentials: LoginCredentials,
): Promise<LoginResponse> => {
  const response = await api.post('/api/auth/login', {
    username: credentials.user,
    password: credentials.senha,
  });
  return {
    id: response.data.id,
    email: response.data.email,
    role: response.data.role,
    matriculaLeitor: response.data.readerRegistrationNumber,
    token: response.data.token,
    isInitialPassword: response.data.initialPasswordChange,
    // Campo ausente (backend antigo) conta como tour já concluído para nunca
    // disparar o tour inesperadamente em sessões existentes.
    guidedTourCompleted: response.data.guidedTourCompleted ?? true,
  };
};

export const requestPasswordReset = async (
  email: string,
): Promise<{ mensagem: string }> => {
  // Mesma resposta no sucesso e no erro: é o que impede descobrir quais e-mails
  // existem. O texto vai traduzido pela instância global do i18next porque este
  // módulo não é componente e não tem hook à disposição.
  const mensagem = i18n.t('auth:forgot_password.toast.sent');

  try {
    await api.post('/api/auth/forgot-password', { email });
    return { mensagem };
  } catch {
    // Não logar o erro cru (carrega o e-mail no config.data).
    console.error('Falha ao solicitar redefinição de senha');
    return { mensagem };
  }
};

export const validarTokenReset = async (token: string): Promise<boolean> => {
  try {
    const response = await api.get(`/api/auth/validate-token/${token}`);
    return response.data.valid === true;
  } catch {
    // O AxiosError expõe a URL com o token de reset.
    console.error('Falha ao validar token de redefinição');
    return false;
  }
};

export const mudarSenhaComToken = async (
  token: string,
  novaSenha: string,
): Promise<unknown> => {
  try {
    const response = await api.post('/api/auth/reset-password', {
      token,
      newPassword: novaSenha,
    });
    return response.data;
  } catch (error) {
    // Config.data carrega {token, newPassword}; não logar o erro cru.
    console.error('Falha ao redefinir a senha com token');
    throw error;
  }
};

/**
 * Troca a senha do usuário autenticado e devolve o **token novo**.
 *
 * Trocar a senha revoga no servidor todos os tokens já emitidos — inclusive o
 * que fez esta requisição. Por isso a rota deixou de responder 204 e passou a
 * devolver `{ token }`: quem não adotar o token devolvido continua mandando um
 * JWT morto e cai no primeiro 401 seguinte, logo depois de trocar a senha com
 * sucesso. O `null` cobre um backend antigo (204 sem corpo).
 */
export const changePassword = async (
  registrationNumber: string,
  currentPassword: string,
  newPassword: string,
): Promise<string | null> => {
  const response = await api.put('/api/auth/change-password', {
    registrationNumber,
    currentPassword,
    newPassword,
  });
  return (response.data?.token as string | undefined) ?? null;
};

/**
 * Encerra a sessão no servidor. É esta chamada — e não a limpeza local — que
 * de fato revoga o token: sem ela o JWT continua válido até expirar, mesmo com
 * o painel já na tela de login.
 *
 * O token vai explícito no cabeçalho porque quem chama limpa o
 * `api.defaults` logo em seguida, e a corrida deixaria a requisição sair sem
 * credencial.
 */
export const encerrarSessao = async (token: string): Promise<void> => {
  await api.post('/api/auth/logout', null, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
