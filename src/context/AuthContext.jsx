import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    api.get('/auth/me')
      .then((r) => setUser(r.data))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  const login = async (identifier, password) => {
    // `identifier` can be an email OR a student number
    const { data } = await api.post('/auth/login', { login: identifier, password });
    localStorage.setItem('token', data.token);
    const user = {
      _id:       data._id,
      email:     data.email,
      username:  data.username,
      role:      data.role,
      enrolled:  data.enrolled,
      studentId: data.studentId,
    };
    setUser(user);
    return user;
  };
    const register = async (email, password, firstName, lastName) => {
    const { data } = await api.post('/auth/register', {
      email, password, firstName, lastName,
    });
    localStorage.setItem('token', data.token);
    const user = {
      _id:       data._id,
      email:     data.email,
      username:  data.username  || null,
      role:      data.role,
      enrolled:  data.enrolled  || false,
      studentId: data.studentId || null,
    };
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
       <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
