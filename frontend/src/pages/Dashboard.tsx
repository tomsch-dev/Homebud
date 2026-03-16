import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { foodItemsApi, FoodItem } from '../api/foodItems';
import { recipesApi, Recipe } from '../api/recipes';

export default function Dashboard() {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([foodItemsApi.getAll(), recipesApi.getAll()])
      .then(([items, recs]) => {
        setFoodItems(items);
        setRecipes(recs);
      })
      .finally(() => setLoading(false));
  }, []);

  const expiringItems = foodItems.filter((item) => {
    if (!item.expiry_date) return false;
    const daysUntilExpiry = Math.ceil(
      (new Date(item.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 3 && daysUntilExpiry >= 0;
  });

  const expiredItems = foodItems.filter((item) => {
    if (!item.expiry_date) return false;
    return new Date(item.expiry_date) < new Date();
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome to your Kitchen Helper</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Items"
          value={foodItems.length}
          description="in your kitchen"
          color="emerald"
          href="/kitchen"
        />
        <StatCard
          title="Expiring Soon"
          value={expiringItems.length}
          description="within 3 days"
          color="amber"
          href="/kitchen"
        />
        <StatCard
          title="Recipes"
          value={recipes.length}
          description="saved recipes"
          color="blue"
          href="/recipes"
        />
      </div>

      {/* Alerts */}
      {expiredItems.length > 0 && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4">
          <h3 className="font-semibold text-red-800 dark:text-red-400 mb-2">Expired Items</h3>
          <ul className="space-y-1">
            {expiredItems.map((item) => (
              <li key={item.id} className="text-sm text-red-700 dark:text-red-300">
                {item.name} — expired {new Date(item.expiry_date!).toLocaleDateString()}
              </li>
            ))}
          </ul>
        </div>
      )}

      {expiringItems.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4">
          <h3 className="font-semibold text-amber-800 dark:text-amber-400 mb-2">Expiring Soon</h3>
          <ul className="space-y-1">
            {expiringItems.map((item) => (
              <li key={item.id} className="text-sm text-amber-700 dark:text-amber-300">
                {item.name} — expires {new Date(item.expiry_date!).toLocaleDateString()}
              </li>
            ))}
          </ul>
          <Link
            to="/ai-recommendations"
            className="inline-block mt-3 text-sm font-medium text-amber-800 dark:text-amber-400 underline hover:text-amber-900 dark:hover:text-amber-300"
          >
            Get AI recipe suggestions using expiring ingredients
          </Link>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <QuickAction
          title="Manage Kitchen"
          description="Add, edit, or remove food items and view nutrition data"
          href="/kitchen"
          icon="M4 7h16M4 7V5a1 1 0 011-1h14a1 1 0 011 1v2M4 7l1 12a2 2 0 002 2h10a2 2 0 002-2l1-12"
          color="emerald"
        />
        <QuickAction
          title="AI Chef"
          description="Get recipe recommendations based on what's in your fridge"
          href="/ai-recommendations"
          icon="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          color="purple"
        />
      </div>
    </div>
  );
}

function StatCard({
  title, value, description, color, href,
}: {
  title: string; value: number; description: string; color: string; href: string;
}) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20',
    amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-500/20',
    blue: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-500/20',
  };
  return (
    <Link to={href} className={`rounded-xl border p-5 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20 transition-shadow ${colors[color]}`}>
      <p className="text-sm font-medium opacity-75">{title}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
      <p className="text-sm opacity-75 mt-1">{description}</p>
    </Link>
  );
}

function QuickAction({ title, description, href, icon, color }: { title: string; description: string; href: string; icon: string; color: string }) {
  const iconColors: Record<string, string> = {
    emerald: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    purple: 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400',
  };
  return (
    <Link
      to={href}
      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20 transition-shadow flex items-start gap-4"
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${iconColors[color]}`}>
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
        </svg>
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
      </div>
    </Link>
  );
}
