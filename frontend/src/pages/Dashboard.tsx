import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { foodItemsApi, FoodItem } from '../api/foodItems';
import { recipesApi, Recipe } from '../api/recipes';
import { spendingApi, SpendingSummary } from '../api/spending';
import { subscriptionApi, Subscription } from '../api/subscriptions';
import { useUser } from '../hooks/useUser';
import { fmtCurrency } from '../utils/currency';
import { DashboardSkeleton } from '../components/Skeleton';

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useUser();
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [spending, setSpending] = useState<SpendingSummary | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  const userCurrency = user?.preferred_currency || 'EUR';

  useEffect(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    Promise.all([
      foodItemsApi.getAll(),
      recipesApi.getAll(),
      spendingApi.getSummary(monthStart, monthEnd, userCurrency).catch(() => null),
      subscriptionApi.getAll().catch(() => []),
    ])
      .then(([items, recs, spend, subs]) => {
        setFoodItems(items);
        setRecipes(recs);
        setSpending(spend);
        setSubscriptions(subs);
      })
      .finally(() => setLoading(false));
  }, [userCurrency]);

  const monthlySubCost = subscriptions
    .filter((s) => s.is_active)
    .reduce((sum, s) => sum + s.monthly_cost, 0);

  const expiredItems = foodItems.filter((item) => {
    if (!item.expiry_date) return false;
    return new Date(item.expiry_date) < new Date();
  });

  const firstName = user?.name?.split(' ')[0] || '';

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          {t('dashboard.greeting', { name: firstName })} 👋
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t('dashboard.welcome')}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/kitchen" className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 hover:shadow-md transition-shadow active:scale-[0.98]">
          <div className="flex items-center justify-between">
            <span className="text-2xl">🏠</span>
            {expiredItems.length > 0 && (
              <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{expiredItems.length}</span>
            )}
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{foodItems.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('dashboard.inYourKitchen')}</p>
        </Link>

        <Link to="/recipes" className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 hover:shadow-md transition-shadow active:scale-[0.98]">
          <span className="text-2xl">📖</span>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{recipes.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('dashboard.savedRecipes')}</p>
        </Link>

        <Link to="/spending" className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 hover:shadow-md transition-shadow active:scale-[0.98]">
          <span className="text-2xl">🛒</span>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {spending ? fmtCurrency(spending.grocery_total, userCurrency, 0) : '—'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('dashboard.groceryThisMonth')}</p>
        </Link>

        <Link to="/spending" className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 hover:shadow-md transition-shadow active:scale-[0.98]">
          <span className="text-2xl">🍽️</span>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-2">
            {spending ? fmtCurrency(spending.eating_out_total, userCurrency, 0) : '—'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('dashboard.eatingOutThisMonth')}</p>
        </Link>

        <Link to="/spending" className="col-span-2 bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 rounded-xl p-4 hover:shadow-md transition-shadow active:scale-[0.98]">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl">🔄</span>
              <p className="text-xs text-violet-600 dark:text-violet-400 mt-1">{t('dashboard.subscriptions')}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-violet-800 dark:text-violet-300">{fmtCurrency(monthlySubCost, userCurrency)}</p>
              <p className="text-xs text-violet-500 dark:text-violet-400">/{t('subscriptions.cycle_monthly').toLowerCase()}</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Quick action pills */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('dashboard.quickActions')}</h2>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Link
            to="/kitchen"
            state={{ openScanner: true }}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:shadow-md transition-shadow active:scale-[0.97] whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            <span className="text-base">📷</span>
            {t('dashboard.scanBarcode')}
          </Link>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-shopping-list'))}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:shadow-md transition-shadow active:scale-[0.97] whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            <span className="text-base">📝</span>
            {t('dashboard.shoppingList')}
          </button>
          <Link
            to="/kitchen"
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:shadow-md transition-shadow active:scale-[0.97] whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            <span className="text-base">➕</span>
            {t('dashboard.addItem')}
          </Link>
          <Link
            to="/spending"
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:shadow-md transition-shadow active:scale-[0.97] whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            <span className="text-base">🛒</span>
            {t('dashboard.logTrip')}
          </Link>
        </div>
      </div>

      {/* Monthly spending bar */}
      {spending && spending.total > 0 && (
        <Link to="/spending" className="block bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 hover:shadow-md transition-shadow active:scale-[0.99]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('dashboard.monthlySpending')}</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{fmtCurrency(spending.total, spending.currency)}</p>
          </div>
          <div className="flex rounded-full overflow-hidden h-3">
            {spending.grocery_total > 0 && <div className="bg-emerald-400 dark:bg-emerald-500 transition-all" style={{ width: `${Math.round((spending.grocery_total / spending.total) * 100)}%` }} />}
            {spending.eating_out_total > 0 && <div className="bg-orange-400 dark:bg-orange-500 transition-all" style={{ width: `${Math.round((spending.eating_out_total / spending.total) * 100)}%` }} />}
            {spending.subscription_total > 0 && <div className="bg-violet-400 dark:bg-violet-500 transition-all" style={{ width: `${Math.round((spending.subscription_total / spending.total) * 100)}%` }} />}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-xs text-gray-400 dark:text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-emerald-400 dark:bg-emerald-500 rounded-full inline-block" />
              {t('spending.groceries')} {fmtCurrency(spending.grocery_total, spending.currency, 0)}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-orange-400 dark:bg-orange-500 rounded-full inline-block" />
              {t('spending.eatingOut')} {fmtCurrency(spending.eating_out_total, spending.currency, 0)}
            </span>
            {spending.subscription_total > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-violet-400 dark:bg-violet-500 rounded-full inline-block" />
                {t('subscriptions.title')} {fmtCurrency(spending.subscription_total, spending.currency, 0)}
              </span>
            )}
          </div>
        </Link>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          to="/kitchen"
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 hover:shadow-md transition-shadow flex items-center gap-3 active:scale-[0.98]"
        >
          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 7V5a1 1 0 011-1h14a1 1 0 011 1v2M4 7l1 12a2 2 0 002 2h10a2 2 0 002-2l1-12" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{t('dashboard.manageKitchen')}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('dashboard.manageKitchenDesc')}</p>
          </div>
        </Link>

        <Link
          to="/spending"
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 hover:shadow-md transition-shadow flex items-center gap-3 active:scale-[0.98]"
        >
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{t('dashboard.groceryTrips')}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('dashboard.groceryTripsDesc')}</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
