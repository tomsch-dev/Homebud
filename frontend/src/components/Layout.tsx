import { useState, lazy, Suspense } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import Navbar from './Navbar';
import { useUser } from '../hooks/useUser';

const ShoppingList = lazy(() => import('./ShoppingList'));

export default function Layout() {
  const { user, loading } = useUser();
  const location = useLocation();
  const [showShoppingList, setShowShoppingList] = useState(false);

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

      {/* Floating shopping list button */}
      <button
        onClick={() => setShowShoppingList(true)}
        className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-40 w-14 h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
        title="Shopping List"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
        </svg>
      </button>

      {showShoppingList && (
        <Suspense fallback={null}>
          <ShoppingList onClose={() => setShowShoppingList(false)} />
        </Suspense>
      )}
    </div>
  );
}
