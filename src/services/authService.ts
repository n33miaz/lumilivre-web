import api from './api';

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
  };
};

export const requestPasswordReset = async (
  email: string,
): Promise<{ mensagem: string }> => {
  try {
    await api.post('/api/auth/forgot-password', { email });
    return {
      mensagem:
        'Se um e-mail correspondente for encontrado, um link para redefinição será enviado.',
    };
  } catch (error) {
    console.error('Erro ao solicitar redefinição de senha:', error);
    return {
      mensagem:
        'Se um e-mail correspondente for encontrado, um link para redefinição será enviado.',
    };
  }
};

export const validarTokenReset = async (token: string): Promise<boolean> => {
  try {
    const response = await api.get(`/api/auth/validate-token/${token}`);
    return response.data.valid === true;
  } catch (error) {
    console.error('Erro ao validar token:', error);
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
    console.error('Erro ao mudar a senha:', error);
    throw error;
  }
};

export const changePassword = async (
  registrationNumber: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> => {
  await api.put('/api/auth/change-password', {
    registrationNumber,
    currentPassword,
    newPassword,
  });
};
