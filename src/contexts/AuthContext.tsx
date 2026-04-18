import {
  createContext,
  useState,
  useEffect,
  useContext,
  type ReactNode,
  useCallback,
} from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useToast } from './ToastContext';

interface User {
  id: number;
  email: string;
  role: string;
  token: string;
  isInitialPassword?: boolean;
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
  completePasswordChange: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToast();

  const logout = useCallback(() => {
    setUser(null);
    clearPersistedUser();
    delete api.defaults.headers.common['Authorization'];
    navigate('/login');
  }, [navigate]);

  const completePasswordChange = useCallback(() => {
    if (user) {
      const updatedUser = { ...user, isInitialPassword: false };
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
    const interceptorId = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (
          (error.response?.status === 403 || error.response?.status === 401) &&
          user
        ) {
          console.warn('Sessão expirada ou inválida. Realizando logout...');

          addToast({
            type: 'info',
            title: 'Sessão Expirada',
            description: 'Por favor, faça login novamente para continuar.',
          });

          logout();
        } else if (
          !error.response &&
          (error.code === 'ERR_NETWORK' || error.message === 'Network Error') &&
          user
        ) {
          console.warn('Servidor indisponível. Realizando logout...');

          addToast({
            type: 'error',
            title: 'Erro de Conexão',
            description: 'O servidor não está respondendo. Você foi desconectado.',
          });

          logout();
        }
        return Promise.reject(error);
      },
    );

    return () => {
      api.interceptors.response.eject(interceptorId);
    };
  }, [user, logout, addToast]);

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
