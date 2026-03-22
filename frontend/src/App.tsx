import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ThemeProvider from './components/ThemeProvider';
import ToastProvider from './components/Toast';
import Layout from './components/Layout';
import RequireAuth from './components/RequireAuth';
import TosGate from './components/TosGate';
import { UserContext, useUserLoader } from './hooks/useUser';
import Callback from './pages/Callback';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Kitchen = lazy(() => import('./pages/Kitchen'));
const Recipes = lazy(() => import('./pages/Recipes'));
const RecipeDetail = lazy(() => import('./pages/RecipeDetail'));
const Spending = lazy(() => import('./pages/Spending'));
const AdminConsole = lazy(() => import('./pages/AdminConsole'));
const Profile = lazy(() => import('./pages/Profile'));
const JoinHousehold = lazy(() => import('./pages/JoinHousehold'));
const NotFound = lazy(() => import('./pages/NotFound'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  const userCtx = useUserLoader();

  return (
    <UserContext.Provider value={userCtx}>
      <ThemeProvider>
        <ToastProvider>
          <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/callback" element={<Callback />} />
            <Route element={<RequireAuth><TosGate><Layout /></TosGate></RequireAuth>}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/kitchen" element={<Kitchen />} />
              <Route path="/recipes" element={<Recipes />} />
              <Route path="/recipes/:id" element={<RecipeDetail />} />
              <Route path="/spending" element={<Spending />} />
              <Route path="/admin" element={<AdminConsole />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/join" element={<JoinHousehold />} />
              {/* Redirects for old routes */}
              <Route path="/ai-chef" element={<Navigate to="/recipes" replace />} />
              <Route path="/grocery-trips" element={<Navigate to="/spending" replace />} />
              <Route path="/eating-out" element={<Navigate to="/spending" replace />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
          </Suspense>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
    </UserContext.Provider>
  );
}
