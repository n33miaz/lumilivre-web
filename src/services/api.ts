import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL; // http://localhost:8080

if (import.meta.env.DEV) {
  console.info('API base URL:', baseURL);
}

const api = axios.create({
  baseURL: baseURL,
  // Identifica o canal para a auditoria de acessos. O app envia 'APP'.
  headers: {
    'X-Client': 'WEB',
  },
});

export default api;
