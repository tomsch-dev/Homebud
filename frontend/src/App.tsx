import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ThemeProvider from './components/ThemeProvider';
import ToastProvider from './components/Toast';
import Layout from './components/Layout';
import RequireAuth from './components/RequireAuth';
import { UserContext, useUserLoader } from './hooks/useUser';
import Dashboard from './pages/Dashboard';
import Kitchen from './pages/Kitchen';
import Recipes from './pages/Recipes';
import RecipeDetail from './pages/RecipeDetail';
import GroceryTrips from './pages/GroceryTrips';
import EatingOut from './pages/EatingOut';
import Spending from './pages/Spending';
import AIRecommendations from './pages/AIRecommendations';
import AdminConsole from './pages/AdminConsole';
import Callback from './pages/Callback';

export default function App() {
  const userCtx = useUserLoader();

  return (
    <UserContext.Provider value={userCtx}>
      <ThemeProvider>
        <ToastProvider>
          <BrowserRouter>
          <Routes>
            <Route path="/callback" element={<Callback />} />
            <Route element={<RequireAuth><Layout /></RequireAuth>}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/kitchen" element={<Kitchen />} />
              <Route path="/recipes" element={<Recipes />} />
              <Route path="/recipes/:id" element={<RecipeDetail />} />
              <Route path="/ai-chef" element={<AIRecommendations />} />
              <Route path="/grocery-trips" element={<GroceryTrips />} />
              <Route path="/eating-out" element={<EatingOut />} />
              <Route path="/spending" element={<Spending />} />
              <Route path="/admin" element={<AdminConsole />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
    </UserContext.Provider>
  );
}
