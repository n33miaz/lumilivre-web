import {
  createContext,
  useState,
  useEffect,
  useContext,
  type ReactNode,
  useCallback,
} from 'react';
import { useTranslation } from 'react-i18next';

import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useToast } from './ToastContext';
import { queryClient } from '../services/queryClient';
import { encerrarSessao } from '../services/authService';

interface User {
  id: string;
  email: string;
  role: string;
  token: string;
  isInitialPassword?: boolean;
  guidedTourCompleted?: boolean;
}

type StoredUser = Omit<User, 'token'> & { token?: string };

const USER_STORAGE_KEY = 'user';
const TOKEN_STORAGE_KEY = 'authToken';

const splitUserForStorage = (userData: User) => {
  const profile: StoredUser = { ...userData };
  delete profile.token;
  return profile;
};

const persistUser = (userData: User) => {
  localStorage.setItem(
    USER_STORAGE_KEY,
    JSON.stringify(splitUserForStorage(userData)),
  );
  sessionStorage.setItem(TOKEN_STORAGE_KEY, userData.token);
};

const clearPersistedUser = () => {
  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
};

const loadPersistedUser = (): User | null => {
  const storedUser = localStorage.getItem(USER_STORAGE_KEY);
  if (!storedUser) return null;

  const parsedUser = JSON.parse(storedUser) as StoredUser;
  const token = sessionStorage.getItem(TOKEN_STORAGE_KEY) ?? parsedUser.token;

  if (!token) {
    clearPersistedUser();
    return null;
  }

  const userData = { ...parsedUser, token };

  if (parsedUser.token) {
    persistUser(userData);
  }

  return userData;
};

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  isLoggingOut: boolean;
  login: (userData: User) => void;
  logout: () => void;
  logoutWithAnimation: () => void;
  completePasswordChange: (renewedToken?: string | null) => void;
  adoptRenewedToken: (renewedToken: string) => void;
  completeTour: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { t } = useTranslation('common');

  // Só o lado local da saída. Separado do `logout` porque a expulsão por 401
  // não deve chamar a rota de logout: o token que ela usaria já é o inválido.
  const clearSession = useCallback(() => {
    setUser(null);
    clearPersistedUser();
    delete api.defaults.headers.common['Authorization'];
    // Limpa o cache do TanStack para que dados/PII do usuário anterior não
    // vazem para o próximo login numa máquina compartilhada.
    queryClient.clear();
    navigate('/login');
  }, [navigate]);

  const logout = useCallback(() => {
    // Quem revoga de verdade é o servidor. A limpeza local só apaga o token
    // desta aba — sem esta chamada, um JWT copiado antes da saída continuaria
    // valendo até expirar.
    const token = user?.token;
    if (token) {
      encerrarSessao(token).catch(() => {
        // Falha de rede não pode prender ninguém dentro do painel: a sessão
        // local cai de qualquer jeito e o token morre no vencimento.
        console.warn('Falha ao revogar a sessão no servidor');
      });
    }
    clearSession();
  }, [clearSession, user]);

  // Adota o token devolvido pela troca de senha. A troca revoga os tokens
  // anteriores, então guardar o novo é o que evita o logout imediato.
  const adoptRenewedToken = useCallback((renewedToken: string) => {
    setUser((current) => {
      if (!current) return current;
      const updatedUser = { ...current, token: renewedToken };
      persistUser(updatedUser);
      return updatedUser;
    });
    api.defaults.headers.common['Authorization'] = `Bearer ${renewedToken}`;
  }, []);

  const completePasswordChange = useCallback(
    (renewedToken?: string | null) => {
      setUser((current) => {
        if (!current) return current;
        const updatedUser = {
          ...current,
          isInitialPassword: false,
          ...(renewedToken ? { token: renewedToken } : {}),
        };
        persistUser(updatedUser);
        return updatedUser;
      });
      if (renewedToken) {
        api.defaults.headers.common['Authorization'] = `Bearer ${renewedToken}`;
      }
    },
    [],
  );

  const completeTour = useCallback(() => {
    // Best-effort: registra a conclusão no backend (idempotente). Se falhar,
    // o flip local abaixo evita reabrir o tour nesta sessão e o backend volta
    // a informar guidedTourCompleted=false no próximo login.
    api.post('/api/users/me/complete-tour').catch((error) => {
      console.warn('Falha ao registrar a conclusão do tour guiado:', error);
    });
    if (user) {
      const updatedUser = { ...user, guidedTourCompleted: true };
      setUser(updatedUser);
      persistUser(updatedUser);
    }
  }, [user]);

  useEffect(() => {
    const carregarUsuarioStorage = () => {
      try {
        const parsedUser = loadPersistedUser();
        if (parsedUser) {
          setUser(parsedUser);
          api.defaults.headers.common['Authorization'] =
            `Bearer ${parsedUser.token}`;
        }
      } catch (error) {
        console.error('Falha ao carregar dados do usuário', error);
        clearPersistedUser();
      } finally {
        setIsLoading(false);
      }
    };

    carregarUsuarioStorage();
  }, []);

  useEffect(() => {
    const isAuthEndpoint = (url?: string) => {
      // As rotas reais são `/api/auth/**`; o prefixo curto continua aceito
      // porque o padrão antigo nunca casava com elas e um 400 de "senha atual
      // errada" na troca de senha derrubava a sessão inteira.
      const matches = (path: string) =>
        path.startsWith('/auth/') ||
        path === '/auth' ||
        path.startsWith('/api/auth/');

      if (!url) return false;
      try {
        return matches(
          new URL(url, api.defaults.baseURL ?? window.location.origin).pathname,
        );
      } catch {
        return matches(url) || url.includes('/auth/');
      }
    };

    const interceptorId = api.interceptors.response.use(
      (response) => response,
      (error) => {
        const requestUrl: string | undefined = error.config?.url;
        const onAuthRoute = isAuthEndpoint(requestUrl);
        const status = error.response?.status;
        // O gate de primeira senha responde 403 com este código enquanto a
        // senha inicial não for trocada. É "abra o modal de senha", não
        // "sessão inválida" — deslogar aqui trancaria o usuário para fora do
        // único lugar onde ele consegue resolver.
        const isPasswordGate =
          error.response?.data?.code === 'PASSWORD_CHANGE_REQUIRED';

        if (
          (status === 401 || status === 403) &&
          user &&
          !onAuthRoute &&
          !isPasswordGate
        ) {
          console.warn('Sessão expirada ou inválida. Realizando logout...');

          addToast({
            type: 'info',
            title: t('session.expired.title'),
            description: t('session.expired.description'),
          });

          clearSession();
        }
        // Erro de rede / 5xx NÃO desloga mais — é indisponibilidade
        // (cold start do Render). O ApiHealthContext detecta, exibe o modal
        // "reativando o servidor" e retoma as chamadas quando a API volta.
        return Promise.reject(error);
      },
    );

    return () => {
      api.interceptors.response.eject(interceptorId);
    };
  }, [user, clearSession, addToast, t]);

  const login = (userData: User) => {
    setUser(userData);
    persistUser(userData);
    api.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
  };

  const logoutWithAnimation = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      logout();
      setIsLoggingOut(false);
    }, 300);
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        isLoading,
        isLoggingOut,
        login,
        logout,
        logoutWithAnimation,
        completePasswordChange,
        adoptRenewedToken,
        completeTour,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
