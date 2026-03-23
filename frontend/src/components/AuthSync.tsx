import { useEffect, useCallback, useRef } from 'react';
import { useLogto } from '@logto/react';
import { setAuthToken } from '../api/client';
import client from '../api/client';

const API_RESOURCE = import.meta.env.VITE_LOGTO_API_RESOURCE || undefined;

/**
 * Syncs the Logto access token to the API client.
 * On first auth, also syncs user profile (email, name, avatar) from Logto to backend.
 */
export default function AuthSync({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, getAccessToken, fetchUserInfo } = useLogto();
  const syncedRef = useRef(false);

  const fetchToken = useCallback(async () => {
    try {
      const token = await getAccessToken(API_RESOURCE);
      setAuthToken(token || null);
    } catch {
      setAuthToken(null);
    }
  }, [getAccessToken]);

  // Sync Logto profile info to our backend (once per session)
  const syncProfile = useCallback(async () => {
    if (syncedRef.current) return;
    syncedRef.current = true;
    try {
      const userInfo = await fetchUserInfo();
      if (userInfo) {
        const patch: Record<string, string> = {};
        if (userInfo.email) patch.email = userInfo.email;
        if (userInfo.name) patch.name = userInfo.name;
        if (userInfo.picture) patch.avatar = userInfo.picture;
        if (Object.keys(patch).length > 0) {
          await client.patch('/api/users/me', patch);
        }
      }
    } catch {
      // Non-critical — profile sync can fail silently
    }
  }, [fetchUserInfo]);

  useEffect(() => {
    if (!isAuthenticated) {
      setAuthToken(null);
      syncedRef.current = false;
      return;
    }

    fetchToken().then(() => syncProfile());

    const interval = setInterval(fetchToken, 50 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchToken, syncProfile]);

  return <>{children}</>;
}
