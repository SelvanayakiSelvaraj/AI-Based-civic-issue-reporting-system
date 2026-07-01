import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [userRole, setUserRole] = useState(null); 
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const normalizeRole = (role) => {
    if (!role) return null;
    const cleaned = String(role).trim();

    switch (cleaned.toLowerCase()) {
      case 'citizen':
        return 'Citizen';
      case 'admin':
        return 'Admin';
      case 'technician':
      case 'tech':
        return 'Technician';
      default:
        return null;
    }
  };

  const login = async (token, role, data) => {
    setIsLoading(true);
    const normalizedRole = normalizeRole(role);
    setUserToken(token);
    setUserRole(normalizedRole);
    setUserData(data);
    
    if (Platform.OS === 'web') {
      localStorage.setItem('userToken', token);
      if (normalizedRole) {
        localStorage.setItem('userRole', normalizedRole);
      } else {
        localStorage.removeItem('userRole');
      }
      localStorage.setItem('userData', JSON.stringify(data));
    } else {
      await SecureStore.setItemAsync('userToken', token);
      if (normalizedRole) {
        await SecureStore.setItemAsync('userRole', normalizedRole);
      } else {
        await SecureStore.deleteItemAsync('userRole');
      }
      await SecureStore.setItemAsync('userData', JSON.stringify(data));
    }
    setIsLoading(false);
  };

  const logout = async () => {
    setIsLoading(true);
    setUserToken(null);
    setUserRole(null);
    setUserData(null);
    if (Platform.OS === 'web') {
      localStorage.removeItem('userToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userData');
    } else {
      await SecureStore.deleteItemAsync('userToken');
      await SecureStore.deleteItemAsync('userRole');
      await SecureStore.deleteItemAsync('userData');
    }
    setIsLoading(false);
  };

  const isLoggedIn = async () => {
    try {
      setIsLoading(true);
      let token = null;
      let role = null;
      let data = null;
      
      if (Platform.OS === 'web') {
        token = localStorage.getItem('userToken');
        role = localStorage.getItem('userRole');
        const storedData = localStorage.getItem('userData');
        if (storedData) data = JSON.parse(storedData);
      } else {
        token = await SecureStore.getItemAsync('userToken');
        role = await SecureStore.getItemAsync('userRole');
        const storedData = await SecureStore.getItemAsync('userData');
        if (storedData) data = JSON.parse(storedData);
      }

      const normalizedRole = normalizeRole(role);
      if (token) {
        setUserToken(token);
        setUserRole(normalizedRole);
        setUserData(data);
      }
      setIsLoading(false);
    } catch (e) {
      console.log(`isLoggedIn error ${e}`);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    isLoggedIn();
  }, []);

  return (
    <AuthContext.Provider value={{ login, logout, userToken, userRole, userData, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
