import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

const normalizeRole = (role) => {
  if (!role) return null;
  const cleaned = String(role).trim().toLowerCase();

  if (cleaned === 'citizen') return 'Citizen';
  if (cleaned === 'admin') return 'Admin';
  if (cleaned === 'technician' || cleaned === 'tech') return 'Technician';

  return null;
};

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState('');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    const role = normalizeRole(localStorage.getItem('userRole'));
    const name = localStorage.getItem('userName') || '';

    if (token && role) {
      api.setToken(token);
      setUserToken(token);
      setUserRole(role);
      setUserName(name);
    }

    setIsReady(true);
  }, []);

  const login = ({ token, role, name }) => {
    const normalized = normalizeRole(role);
    if (!normalized) throw new Error('Invalid role received from server');

    localStorage.setItem('userToken', token);
    localStorage.setItem('userRole', normalized);
    localStorage.setItem('userName', name);

    api.setToken(token);
    setUserToken(token);
    setUserRole(normalized);
    setUserName(name);
  };

  const logout = () => {
    api.setToken(null);
    localStorage.removeItem('userToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    setUserToken(null);
    setUserRole(null);
    setUserName('');
  };

  const value = useMemo(
    () => ({ userToken, userRole, userName, login, logout, isReady }),
    [userToken, userRole, userName, isReady]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
