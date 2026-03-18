import { useEffect, useState, useCallback } from 'react';
import { useLogto } from '@logto/react';
import { setAuthToken, setOpaqueToken } from '../api/client';

const API_RESOURCE = import.meta.env.VITE_LOGTO_API_RESOURCE || undefined;

/**
 * Syncs the Logto access token to the API client.
 * Exposes `tokenReady` so children can wait before making API calls.
 */
export default function AuthSync({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, getAccessToken } = useLogto();
  const [tokenReady, setTokenReady] = useState(false);

  const fetchToken = useCallback(async () => {
    try {
      const token = await getAccessToken(API_RESOURCE);
      if (token) {
        setAuthToken(token);
      }
      // Also fetch the opaque token (no resource) which contains roles
      const opaqueToken = await getAccessToken();
      if (opaqueToken) {
        setOpaqueToken(opaqueToken);
      }
      setTokenReady(true);
    } catch {
      setAuthToken(null);
      setOpaqueToken(null);
      setTokenReady(true);
    }
  }, [getAccessToken]);

  useEffect(() => {
    if (!isAuthenticated) {
      setAuthToken(null);
      setOpaqueToken(null);
      setTokenReady(true);
      return;
    }

    fetchToken();

    const interval = setInterval(fetchToken, 50 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchToken]);

  // Expose tokenReady via a global so useUser can check it
  useEffect(() => {
    (window as any).__authTokenReady = tokenReady;
  }, [tokenReady]);

  return <>{children}</>;
}

export function isTokenReady(): boolean {
  return (window as any).__authTokenReady ?? false;
}
