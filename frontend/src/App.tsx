import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Kitchen from './pages/Kitchen';
import Recipes from './pages/Recipes';
import RecipeDetail from './pages/RecipeDetail';
import AIRecommendations from './pages/AIRecommendations';
import GroceryTrips from './pages/GroceryTrips';
import EatingOut from './pages/EatingOut';
import Spending from './pages/Spending';
import Callback from './pages/Callback';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/callback" element={<Callback />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/kitchen" element={<Kitchen />} />
          <Route path="/recipes" element={<Recipes />} />
          <Route path="/recipes/:id" element={<RecipeDetail />} />
          <Route path="/ai-recommendations" element={<AIRecommendations />} />
          <Route path="/grocery-trips" element={<GroceryTrips />} />
          <Route path="/eating-out" element={<EatingOut />} />
          <Route path="/spending" element={<Spending />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
