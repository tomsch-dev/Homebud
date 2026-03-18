import { useEffect } from 'react';
import { useLogto } from '@logto/react';

/**
 * Redirects unauthenticated users to Logto sign-in.
 * In dev mode (no VITE_LOGTO_ENDPOINT), renders children without auth.
 */
export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, signIn } = useLogto();

  const isDevMode = !import.meta.env.VITE_LOGTO_ENDPOINT;

  useEffect(() => {
    if (isDevMode || isLoading || isAuthenticated) return;
    signIn(`${window.location.origin}/callback`);
  }, [isDevMode, isLoading, isAuthenticated, signIn]);

  if (isDevMode) return <>{children}</>;

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Signing you in...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
