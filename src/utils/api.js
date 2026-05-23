import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://placement-portal-backend-4.onrender.com/api',
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor — attach JWT token on every request
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor for errors
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      window.location.href = window.location.pathname.startsWith('/recruiter') ? '/recruiter-login' : '/login';
    }
    return Promise.reject(err);
  }
);

export default api;