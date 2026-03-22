import { useEffect, useCallback } from 'react';
import { useLogto } from '@logto/react';
import { setAuthToken } from '../api/client';

const API_RESOURCE = import.meta.env.VITE_LOGTO_API_RESOURCE || undefined;

/**
 * Syncs the Logto access token to the API client.
 * Calls setAuthToken which resolves the tokenReady promise.
 */
export default function AuthSync({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, getAccessToken } = useLogto();

  const fetchToken = useCallback(async () => {
    try {
      const token = await getAccessToken(API_RESOURCE);
      setAuthToken(token || null);
    } catch {
      setAuthToken(null);
    }
  }, [getAccessToken]);

  useEffect(() => {
    if (!isAuthenticated) {
      setAuthToken(null);
      return;
    }

    fetchToken();

    const interval = setInterval(fetchToken, 50 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchToken]);

  return <>{children}</>;
}
