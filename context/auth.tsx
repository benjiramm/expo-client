import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useState } from 'react';

const STORE_KEY_INSTANCE_URL = 'ha_instance_url';
const STORE_KEY_ACCESS_TOKEN = 'ha_access_token';
const STORE_KEY_REFRESH_TOKEN = 'ha_refresh_token';
const STORE_KEY_EXPIRES_AT = 'ha_expires_at';

export const HA_CLIENT_ID = 'https://lights-app.dev/';

export type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | {
      status: 'authenticated';
      instanceUrl: string;
      accessToken: string;
    };

type AuthContextValue = {
  auth: AuthState;
  login: (instanceUrl: string, code: string, redirectUri: string, clientId: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({ status: 'loading' });

  useEffect(() => {
    restoreSession();
  }, []);

  async function restoreSession() {
    try {
      const [instanceUrl, accessToken, refreshTokenValue, expiresAt] = await Promise.all([
        SecureStore.getItemAsync(STORE_KEY_INSTANCE_URL),
        SecureStore.getItemAsync(STORE_KEY_ACCESS_TOKEN),
        SecureStore.getItemAsync(STORE_KEY_REFRESH_TOKEN),
        SecureStore.getItemAsync(STORE_KEY_EXPIRES_AT),
      ]);

      if (!instanceUrl || !accessToken || !refreshTokenValue) {
        setAuth({ status: 'unauthenticated' });
        return;
      }

      const now = Date.now();
      const expiry = expiresAt ? parseInt(expiresAt, 10) : 0;

      if (expiry > 0 && now >= expiry - 60_000) {
        const newToken = await exchangeRefreshToken(instanceUrl, refreshTokenValue);
        if (!newToken) {
          setAuth({ status: 'unauthenticated' });
          return;
        }
        setAuth({ status: 'authenticated', instanceUrl, accessToken: newToken });
      } else {
        setAuth({ status: 'authenticated', instanceUrl, accessToken });
      }
    } catch {
      setAuth({ status: 'unauthenticated' });
    }
  }

  async function login(instanceUrl: string, code: string, redirectUri: string, clientId: string) {
    const url = instanceUrl.replace(/\/$/, '');
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      redirect_uri: redirectUri,
    });

    const res = await fetch(`${url}/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!res.ok) throw new Error('Token exchange failed');

    const data = await res.json();
    const expiresAt = Date.now() + data.expires_in * 1000;

    await Promise.all([
      SecureStore.setItemAsync(STORE_KEY_INSTANCE_URL, url),
      SecureStore.setItemAsync(STORE_KEY_ACCESS_TOKEN, data.access_token),
      SecureStore.setItemAsync(STORE_KEY_REFRESH_TOKEN, data.refresh_token),
      SecureStore.setItemAsync(STORE_KEY_EXPIRES_AT, String(expiresAt)),
    ]);

    setAuth({ status: 'authenticated', instanceUrl: url, accessToken: data.access_token });
  }

  async function logout() {
    await Promise.all([
      SecureStore.deleteItemAsync(STORE_KEY_INSTANCE_URL),
      SecureStore.deleteItemAsync(STORE_KEY_ACCESS_TOKEN),
      SecureStore.deleteItemAsync(STORE_KEY_REFRESH_TOKEN),
      SecureStore.deleteItemAsync(STORE_KEY_EXPIRES_AT),
    ]);
    setAuth({ status: 'unauthenticated' });
  }

  async function refreshToken(): Promise<string | null> {
    const [instanceUrl, storedRefreshToken] = await Promise.all([
      SecureStore.getItemAsync(STORE_KEY_INSTANCE_URL),
      SecureStore.getItemAsync(STORE_KEY_REFRESH_TOKEN),
    ]);

    if (!instanceUrl || !storedRefreshToken) return null;

    const newToken = await exchangeRefreshToken(instanceUrl, storedRefreshToken);
    if (newToken && auth.status === 'authenticated') {
      setAuth({ ...auth, accessToken: newToken });
    }
    return newToken;
  }

  return (
    <AuthContext.Provider value={{ auth, login, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

async function exchangeRefreshToken(instanceUrl: string, token: string): Promise<string | null> {
  try {
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: token,
      client_id: HA_CLIENT_ID,
    });

    const res = await fetch(`${instanceUrl}/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const expiresAt = Date.now() + data.expires_in * 1000;

    await Promise.all([
      SecureStore.setItemAsync(STORE_KEY_ACCESS_TOKEN, data.access_token),
      SecureStore.setItemAsync(STORE_KEY_EXPIRES_AT, String(expiresAt)),
      data.refresh_token
        ? SecureStore.setItemAsync(STORE_KEY_REFRESH_TOKEN, data.refresh_token)
        : Promise.resolve(),
    ]);

    return data.access_token;
  } catch {
    return null;
  }
}
