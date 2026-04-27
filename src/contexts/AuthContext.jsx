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

function parseBooleanFlag(value) {
  if (value === true || value === false) {
    return value;
  }

  if (typeof value === 'number') {
    return value === 1;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === '1' || normalized === 'true';
  }

  return false;
}

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
    const loginData = payload.data && typeof payload.data === 'object' ? payload.data : {};
    const garageData = payload.garage && typeof payload.garage === 'object' ? payload.garage : {};

    const garage = {
      ...garageData,
      ...loginData,
      garage_manager_id: payload.garage_manager_id ?? loginData.garage_manager_id ?? null,
      user_type: loginData.user_type ?? 'garage_manager',
      id: garageData.id ?? loginData.id ?? loginData.garage_id ?? payload.garage_id ?? payload.garageId ?? null,
      code: garageData.code ?? loginData.code ?? payload.garage_code ?? payload.garageCode ?? null,
      name: garageData.name ?? loginData.name ?? null,
      is_super_garage: parseBooleanFlag(
        garageData.is_super_garage ?? loginData.is_super_garage ?? payload.is_super_garage
      ),
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
      isSuperGarage: Boolean(session?.garage?.is_super_garage),
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
      isSuperGarage: false,
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
