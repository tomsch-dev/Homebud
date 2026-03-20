import { useState, useEffect, createContext, useContext } from 'react';
import { useLogto } from '@logto/react';
import client from '../api/client';
import { isTokenReady } from '../components/AuthSync';

interface UserData {
  id: string;
  email: string | null;
  name: string | null;
  avatar: string | null;
  roles: string[];
}

interface UserContextValue {
  user: UserData | null;
  loading: boolean;
  isPremium: boolean;
  isAdmin: boolean;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  loading: true,
  isPremium: false,
  isAdmin: false,
});

export { UserContext };
export type { UserContextValue };

export function useUser() {
  return useContext(UserContext);
}

export function useUserLoader(): UserContextValue {
  const { isAuthenticated, isLoading: logtoLoading } = useLogto();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // Don't fetch if Logto is still loading or user isn't authenticated
    if (logtoLoading || !isAuthenticated) {
      setUser(null);
      setLoading(false);
      return;
    }

    const fetchUser = () => {
      // Only fetch if we actually have an auth header set
      if (!client.defaults.headers.common['Authorization']) {
        return;
      }
      client
        .get('/api/users/me')
        .then((res) => { if (!cancelled) setUser(res.data); })
        .catch(() => { if (!cancelled) setUser(null); })
        .finally(() => { if (!cancelled) setLoading(false); });
    };

    // Wait for AuthSync to set the token before calling the API
    const waitAndFetch = () => {
      if (client.defaults.headers.common['Authorization']) {
        fetchUser();
      } else {
        const interval = setInterval(() => {
          if (client.defaults.headers.common['Authorization']) {
            clearInterval(interval);
            if (!cancelled) fetchUser();
          }
        }, 50);
        // Safety timeout
        setTimeout(() => { clearInterval(interval); if (!cancelled) setLoading(false); }, 5000);
      }
    };

    setLoading(true);
    waitAndFetch();

    return () => { cancelled = true; };
  }, [isAuthenticated, logtoLoading]);

  const isPremium = user?.roles?.includes('premium') ?? false;
  const isAdmin = user?.roles?.includes('admin') ?? false;

  return { user, loading, isPremium, isAdmin };
}
