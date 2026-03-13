import { Link, useLocation } from 'react-router-dom';
import { useLogto } from '@logto/react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/kitchen', label: 'My Kitchen' },
  { path: '/recipes', label: 'Recipes' },
  { path: '/ai-recommendations', label: 'AI Chef' },
  { path: '/grocery-trips', label: 'Grocery' },
  { path: '/eating-out', label: 'Eating Out' },
  { path: '/spending', label: 'Spending' },
];

export default function Navbar() {
  const location = useLocation();
  const { isAuthenticated, signIn, signOut } = useLogto();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="text-xl font-bold text-primary-600">
              Kitchen Helper
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            {isAuthenticated ? (
              <button
                onClick={() => signOut(window.location.origin)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                Sign Out
              </button>
            ) : (
              <button
                onClick={() => signIn(`${window.location.origin}/callback`)}
                className="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
