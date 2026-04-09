/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authAPI } from '../services/api';
import {
  AUTH_SESSION_CHANGED_EVENT,
  clearAuthSession,
  getStoredAuthSession,
  isAuthSessionExpired,
  setStoredAuthSession,
} from '../services/authStorage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getStoredAuthSession());
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const syncSession = () => {
      setSession(getStoredAuthSession());
    };

    syncSession();
    setAuthReady(true);

    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, syncSession);
    window.addEventListener('storage', syncSession);

    return () => {
      window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, syncSession);
      window.removeEventListener('storage', syncSession);
    };
  }, []);

  const logout = useCallback((reason = 'logout') => {
    clearAuthSession(reason);
    setSession(null);
  }, []);

  const login = useCallback(async (credentials) => {
    const response = await authAPI.loginGarage(credentials);
    const payload = response?.data || {};
    const rawGarage = payload.data && typeof payload.data === 'object' ? payload.data : {};
    const garage = {
      ...rawGarage,
      id: rawGarage.id ?? payload.garage_id ?? payload.garageId ?? null,
      code: rawGarage.code ?? payload.garage_code ?? payload.garageCode ?? credentials?.garage_code ?? null,
    };
    const nextSession = setStoredAuthSession({
      token: payload.token,
      expiresAt: payload.expires_at,
      garage,
      garageId: garage.id,
      garageCode: garage.code,
    });

    setSession(nextSession);
    return {
      session: nextSession,
      response,
    };
  }, []);

  useEffect(() => {
    if (!session) {
      return undefined;
    }

    if (isAuthSessionExpired(session)) {
      logout('expired');
      return undefined;
    }

    const remaining = new Date(session.expiresAt).getTime() - Date.now();
    const timer = window.setTimeout(() => {
      logout('expired');
    }, remaining);

    return () => {
      window.clearTimeout(timer);
    };
  }, [logout, session]);

  const value = useMemo(
    () => ({
      authReady,
      session,
      token: session?.token || null,
      expiresAt: session?.expiresAt || null,
      garage: session?.garage || null,
      isAuthenticated: Boolean(session?.token) && !isAuthSessionExpired(session),
      sessionVersion: session?.sessionVersion || 0,
      login,
      logout,
    }),
    [authReady, login, logout, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      authReady: true,
      session: null,
      token: null,
      expiresAt: null,
      garage: null,
      isAuthenticated: false,
      sessionVersion: 0,
      login: async () => {
        throw new Error('AuthProvider chưa sẵn sàng. Vui lòng tải lại trang.');
      },
      logout: () => {},
    };
  }
  return context;
}
