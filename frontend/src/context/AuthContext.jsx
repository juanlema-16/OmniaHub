import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { TOKEN_KEY, USER_KEY } from '../api/axios';
import * as authApi from '../api/auth';

const AuthContext = createContext(null);

const leerUsuario = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(leerUsuario);
  const [wallet, setWallet] = useState(null);
  const [cargando, setCargando] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));

  const guardarSesion = useCallback(({ token: nuevoToken, user: nuevoUser, wallet: nuevaWallet }) => {
    localStorage.setItem(TOKEN_KEY, nuevoToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nuevoUser));
    setToken(nuevoToken);
    setUser(nuevoUser);
    setWallet(nuevaWallet ?? null);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    setWallet(null);
  }, []);

  // Recarga usuario y saldo desde la API (KYC aprobado, saldo nuevo, cuenta bloqueada…)
  const refresh = useCallback(async () => {
    if (!localStorage.getItem(TOKEN_KEY)) return;
    try {
      const data = await authApi.me();
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setUser(data.user);
      setWallet(data.wallet);
    } catch (error) {
      if ([401, 403].includes(error.response?.status)) logout();
    } finally {
      setCargando(false);
    }
  }, [logout]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!token) return undefined;
    const alVolver = () => document.visibilityState === 'visible' && refresh();
    const intervalo = setInterval(refresh, 60_000);
    document.addEventListener('visibilitychange', alVolver);
    return () => {
      clearInterval(intervalo);
      document.removeEventListener('visibilitychange', alVolver);
    };
  }, [token, refresh]);

  // El interceptor de axios avisa cuando el token ya no sirve
  useEffect(() => {
    window.addEventListener('omniahub:logout', logout);
    return () => window.removeEventListener('omniahub:logout', logout);
  }, [logout]);

  const login = useCallback(
    async (credenciales) => {
      const data = await authApi.login(credenciales);
      guardarSesion(data);
      return data.user;
    },
    [guardarSesion]
  );

  const verifyEmail = useCallback(
    async (email, code) => {
      const data = await authApi.verifyEmail(email, code);
      guardarSesion(data);
      return data.user;
    },
    [guardarSesion]
  );

  const value = useMemo(
    () => ({ token, user, wallet, cargando, autenticado: Boolean(token && user), login, verifyEmail, logout, refresh }),
    [token, user, wallet, cargando, login, verifyEmail, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
};
