import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      api.get('/auth/me')
        .then(res => setUser(res.data.user))
        .catch(() => { localStorage.removeItem('token'); delete api.defaults.headers.common['Authorization']; })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const setSession = (token, user) => {
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(user);
    return user;
  };

  const login = async (email, password) => {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const res = await api.post('/auth/login', { email: normalizedEmail, password });
    const { token, user } = res.data;
    return setSession(token, user);
  };

  const recruiterLogin = async (email, password) => {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const res = await api.post('/auth/recruiter-login', { email: normalizedEmail, password });
    const { token, user } = res.data;
    return setSession(token, user);
  };

  const register = async (data) => {
    const payload = { ...data, email: String(data.email || '').trim().toLowerCase() };
    const res = await api.post('/auth/register', payload);
    const { token, user } = res.data;
    return setSession(token, user);
  };

  const completeOAuthLogin = async (token) => {
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    const res = await api.get('/auth/me');
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, recruiterLogin, register, completeOAuthLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
