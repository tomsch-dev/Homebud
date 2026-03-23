import { useState, useEffect, lazy, Suspense } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import Navbar from './Navbar';
import { useUser } from '../hooks/useUser';

const ShoppingList = lazy(() => import('./ShoppingList'));

export default function Layout() {
  const { user, loading } = useUser();
  const location = useLocation();
  const [showShoppingList, setShowShoppingList] = useState(false);

  // Listen for open-shopping-list events from other components
  useEffect(() => {
    const handler = () => setShowShoppingList(true);
    window.addEventListener('open-shopping-list', handler);
    return () => window.removeEventListener('open-shopping-list', handler);
  }, []);

  // Redirect to profile if name not set (but allow /profile and /join pages)
  const nameExemptPaths = ['/profile', '/join'];
  const needsName = !loading && user && !user.name && !nameExemptPaths.includes(location.pathname);

  if (needsName) {
    return <Navigate to="/profile" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      <Navbar />
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-24 lg:pb-8">
        <Outlet />
      </main>

      {showShoppingList && (
        <Suspense fallback={null}>
          <ShoppingList onClose={() => setShowShoppingList(false)} />
        </Suspense>
      )}
    </div>
  );
}
