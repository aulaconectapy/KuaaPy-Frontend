'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { getUserById } from '@/services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  /**
   * 🔐 Cargar usuario desde token
   */
  const loadUser = useCallback(async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem('token');

      // 🚫 No hay token
      if (!token) {
        setUser(null);
        return;
      }

      const decoded = jwtDecode(token);
      console.log("TOKEN DECODED:", decoded);

      // ⏳ Token expirado
      if (decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem('token');
        setUser(null);
        return;
      }

      // 👤 Obtener usuario desde backend
      const userData = await getUserById(decoded.userId);
      console.log('UserData recibido desde backend:', userData);

      setUser(userData);

    } catch (error) {
      console.error('Error cargando usuario:', error);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, []);

  /**
   * 🚪 Logout seguro
   */
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.dispatchEvent(new Event('auth-change'));
  };

  /**
   * 🚀 Inicialización y listener global
   */
  useEffect(() => {
    loadUser();

    const handleAuthChange = () => {
      loadUser();
    };

    window.addEventListener('auth-change', handleAuthChange);

    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, [loadUser]);

  return (
    <AuthContext.Provider value={{ user, loading, initialized, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
