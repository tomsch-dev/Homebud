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
}

const UserContext = createContext<UserContextValue>({
  user: null,
  loading: true,
  isPremium: false,
});

export { UserContext };
export type { UserContextValue };

export function useUser() {
  return useContext(UserContext);
}

export function useUserLoader(): UserContextValue {
  const { isAuthenticated } = useLogto();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchUser = () => {
      client
        .get('/api/users/me')
        .then((res) => { if (!cancelled) setUser(res.data); })
        .catch(() => { if (!cancelled) setUser(null); })
        .finally(() => { if (!cancelled) setLoading(false); });
    };

    // Wait for AuthSync to set the token before calling the API
    const waitAndFetch = () => {
      if (isTokenReady()) {
        fetchUser();
      } else {
        const interval = setInterval(() => {
          if (isTokenReady()) {
            clearInterval(interval);
            if (!cancelled) fetchUser();
          }
        }, 20);
        // Safety timeout
        setTimeout(() => { clearInterval(interval); if (!cancelled && loading) fetchUser(); }, 3000);
      }
    };

    waitAndFetch();

    return () => { cancelled = true; };
  }, [isAuthenticated]);

  const isPremium = user?.roles?.includes('premium') ?? false;

  return { user, loading, isPremium };
}
