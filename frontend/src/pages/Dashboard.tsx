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
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome to your Kitchen Helper</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Items"
          value={foodItems.length}
          description="in your kitchen"
          color="blue"
          href="/kitchen"
        />
        <StatCard
          title="Expiring Soon"
          value={expiringItems.length}
          description="within 3 days"
          color="yellow"
          href="/kitchen"
        />
        <StatCard
          title="Recipes"
          value={recipes.length}
          description="saved recipes"
          color="green"
          href="/recipes"
        />
      </div>

      {/* Alerts */}
      {expiredItems.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-semibold text-red-800 mb-2">Expired Items</h3>
          <ul className="space-y-1">
            {expiredItems.map((item) => (
              <li key={item.id} className="text-sm text-red-700">
                {item.name} — expired {new Date(item.expiry_date!).toLocaleDateString()}
              </li>
            ))}
          </ul>
        </div>
      )}

      {expiringItems.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">Expiring Soon</h3>
          <ul className="space-y-1">
            {expiringItems.map((item) => (
              <li key={item.id} className="text-sm text-yellow-700">
                {item.name} — expires {new Date(item.expiry_date!).toLocaleDateString()}
              </li>
            ))}
          </ul>
          <Link
            to="/ai-recommendations"
            className="inline-block mt-3 text-sm font-medium text-yellow-800 underline hover:text-yellow-900"
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
          emoji="🥦"
        />
        <QuickAction
          title="AI Chef"
          description="Get recipe recommendations based on what's in your fridge"
          href="/ai-recommendations"
          emoji="🤖"
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
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-100',
    green: 'bg-green-50 text-green-700 border-green-100',
  };
  return (
    <Link to={href} className={`rounded-xl border p-5 hover:shadow-md transition-shadow ${colors[color]}`}>
      <p className="text-sm font-medium opacity-75">{title}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
      <p className="text-sm opacity-75 mt-1">{description}</p>
    </Link>
  );
}

function QuickAction({ title, description, href, emoji }: { title: string; description: string; href: string; emoji: string }) {
  return (
    <Link
      to={href}
      className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow flex items-start gap-4"
    >
      <span className="text-3xl">{emoji}</span>
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
    </Link>
  );
}
