/**
 * AuthContext - Manages Authentication and Authorization
 * Controls user sessions and role permissions.
 */

import React, { createContext, useContext, useState } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('brightloop_auth_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.login({ email, password });
      const userObj = {
        ...res.user,
        token: res.token
      };
      setCurrentUser(userObj);
      localStorage.setItem('brightloop_auth_user', JSON.stringify(userObj));
      localStorage.setItem('brightloop_token', res.token);
      return res;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('brightloop_auth_user');
    localStorage.removeItem('brightloop_token');
    localStorage.removeItem('brightloop_sim_role');
    localStorage.removeItem('brightloop_sim_customer_id');
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      login,
      logout,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
