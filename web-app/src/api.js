import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname || '127.0.0.1'}:5000/api`;
export const API_URL = BASE_URL;

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

if (typeof window !== 'undefined') {
  const savedToken = localStorage.getItem('userToken');
  if (savedToken) {
    api.defaults.headers.common.Authorization = `Bearer ${savedToken}`;
  }
}

api.setToken = (token) => {
  api.defaults.headers.common.Authorization = token ? `Bearer ${token}` : undefined;
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('userToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
    }
    return Promise.reject(error);
  }
);

export default api;
