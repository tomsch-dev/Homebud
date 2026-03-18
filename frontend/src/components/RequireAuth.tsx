import { useLogto } from '@logto/react';
import Landing from '../pages/Landing';

/**
 * Shows the Landing page for unauthenticated users.
 * In dev mode (no VITE_LOGTO_ENDPOINT), renders children without auth.
 */
export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useLogto();

  const isDevMode = !import.meta.env.VITE_LOGTO_ENDPOINT;

  if (isDevMode) return <>{children}</>;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Landing />;
  }

  return <>{children}</>;
}
