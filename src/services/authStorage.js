const AUTH_STORAGE_KEY = 'garaone_admin_garage_session';
export const AUTH_SESSION_CHANGED_EVENT = 'garaone:auth-session-changed';

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

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

function normalizeGarage(rawGarage, rawSession = {}) {
  const source = rawGarage && typeof rawGarage === 'object' ? rawGarage : {};
  const id = source.id ?? source.garage_id ?? rawSession.garageId ?? rawSession.garage_id ?? null;
  const code = source.code ?? source.garage_code ?? rawSession.garageCode ?? rawSession.garage_code ?? null;

  if (!Object.keys(source).length && id === null && !code) {
    return null;
  }

  return {
    ...source,
    id,
    code,
    is_super_garage: parseBooleanFlag(source.is_super_garage ?? rawSession.is_super_garage),
  };
}

export function isAuthSessionExpired(session) {
  if (!session?.expiresAt) {
    return true;
  }

  const expiresAt = new Date(session.expiresAt).getTime();
  if (!Number.isFinite(expiresAt)) {
    return true;
  }

  return expiresAt <= Date.now();
}

function normalizeSession(raw) {
  const garage = normalizeGarage(raw?.garage, raw);

  if (!raw?.token || !garage) {
    return null;
  }

  const session = {
    token: raw.token,
    expiresAt: raw.expiresAt || raw.expires_at || null,
    garage,
    garageId: garage.id ?? null,
    garageCode: garage.code ?? null,
    sessionVersion: raw.sessionVersion || Date.now(),
  };

  return isAuthSessionExpired(session) ? null : session;
}

function emitAuthChange(detail) {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent(AUTH_SESSION_CHANGED_EVENT, { detail }));
}

export function getStoredAuthSession() {
  if (!canUseStorage()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    const session = normalizeSession(parsed);

    if (!session) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }

    return session;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function getAuthToken() {
  return getStoredAuthSession()?.token || null;
}

export function getStoredGarageContext() {
  const session = getStoredAuthSession();
  const garage = session?.garage || null;

  return {
    garage,
    id: session?.garageId ?? garage?.id ?? null,
    code: session?.garageCode ?? garage?.code ?? null,
  };
}

function clearGarageScopedBrowserState({ preserveAuth = false } = {}) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.clear();
  } catch {
    // Ignore session storage issues in unsupported environments.
  }

  try {
    window.localStorage.removeItem('fcm_token');
    if (!preserveAuth) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch {
    // Ignore local storage issues in unsupported environments.
  }
}

export function setStoredAuthSession(rawSession) {
  if (!canUseStorage()) {
    return null;
  }

  const session = normalizeSession({
    ...rawSession,
    sessionVersion: Date.now(),
  });

  if (!session) {
    clearGarageScopedBrowserState({ preserveAuth: false });
    emitAuthChange(null);
    return null;
  }

  clearGarageScopedBrowserState({ preserveAuth: true });
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  emitAuthChange(session);
  return session;
}

export function clearAuthSession(reason = 'logout') {
  clearGarageScopedBrowserState({ preserveAuth: false });
  emitAuthChange({ reason, cleared: true });
}
