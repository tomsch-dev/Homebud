import { useState, useEffect, createContext, useContext } from 'react';
import { useLogto } from '@logto/react';
import client, { tokenReady } from '../api/client';

interface UserData {
  id: string;
  email: string | null;
  name: string | null;
  avatar: string | null;
  roles: string[];
  household_id: string | null;
  preferred_currency: string;
}

interface UserContextValue {
  user: UserData | null;
  loading: boolean;
  isPremium: boolean;
  isAdmin: boolean;
  refresh: () => void;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  loading: true,
  isPremium: false,
  isAdmin: false,
  refresh: () => {},
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

  const fetchUser = () => {
    if (!client.defaults.headers.common['Authorization']) return;
    client
      .get('/api/users/me')
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (logtoLoading || !isAuthenticated) {
      setUser(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    // Wait for AuthSync to set the token, then fetch user
    tokenReady.then(() => {
      if (!cancelled) fetchUser();
    });

    return () => { cancelled = true; };
  }, [isAuthenticated, logtoLoading]);

  const isPremium = user?.roles?.includes('premium') ?? false;
  const isAdmin = user?.roles?.includes('admin') ?? false;

  return { user, loading, isPremium, isAdmin, refresh: fetchUser };
}
