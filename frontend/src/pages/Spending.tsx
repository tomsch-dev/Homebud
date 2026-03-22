import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { spendingApi, SpendingSummary, eatingOutApi, EatingOutExpense, CreateEatingOut } from '../api/spending';
import { groceryApi, GroceryTrip, CreateGroceryTrip, CreateGroceryTripItem } from '../api/grocery';
import { foodItemsApi, FoodItem, CreateFoodItem } from '../api/foodItems';
import { receiptScanApi, ReceiptScanResult } from '../api/receiptScan';
import { subscriptionApi, Subscription, CreateSubscription } from '../api/subscriptions';
import { useToast } from '../components/Toast';
import { useUser } from '../hooks/useUser';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const UNITS = ['g', 'kg', 'ml', 'l', 'pieces', 'tbsp', 'tsp', 'cup', 'oz', 'lb'];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'coffee', 'snack', 'other'];
const MEAL_ICONS: Record<string, string> = {
  breakfast: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z',
  lunch: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  dinner: 'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z',
  coffee: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  snack: 'M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0A1.75 1.75 0 003 15.546',
  other: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
};

const UNIT_ALIASES: Record<string, string> = {
  'stück': 'pieces', 'stueck': 'pieces', 'stk': 'pieces', 'pcs': 'pieces',
  'el': 'tbsp', 'tl': 'tsp', 'tasse': 'cup',
};
const normalizeUnit = (u: string): string => {
  const lower = u.toLowerCase().trim();
  return UNIT_ALIASES[lower] || (UNITS.includes(lower) ? lower : UNITS.includes(u) ? u : 'pieces');
};

type Tab = 'overview' | 'grocery' | 'eating-out' | 'subscriptions';
type Period = 'this-month' | 'last-month' | '3-months' | 'year' | 'custom';

function getDatesForPeriod(period: Period): { start: string; end: string } {
  const now = new Date();
  let s: Date, e: Date;
  switch (period) {
    case 'last-month':
      s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      e = new Date(now.getFullYear(), now.getMonth(), 0);
      break;
    case '3-months':
      s = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      e = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    case 'year':
      s = new Date(now.getFullYear(), 0, 1);
      e = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    default: // this-month
      s = new Date(now.getFullYear(), now.getMonth(), 1);
      e = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
  }
  return { start: s.toISOString().split('T')[0], end: e.toISOString().split('T')[0] };
}

export default function Spending() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const { user, isPremium } = useUser();
  const userCurrency = user?.preferred_currency || 'EUR';
  const [tab, setTab] = useState<Tab>('overview');

  // --- Overview state ---
  const defaults = getDatesForPeriod('this-month');
  const [period, setPeriod] = useState<Period>('this-month');
  const [start, setStart] = useState(defaults.start);
  const [end, setEnd] = useState(defaults.end);
  const [summary, setSummary] = useState<SpendingSummary | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState('');

  // --- Grocery state ---
  const [trips, setTrips] = useState<GroceryTrip[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [groceryLoading, setGroceryLoading] = useState(true);
  const [showGroceryForm, setShowGroceryForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [groceryForm, setGroceryForm] = useState({ store_name: '', trip_date: '', notes: '', currency: userCurrency });
  const [groceryItems, setGroceryItems] = useState<CreateGroceryTripItem[]>([
    { name: '', quantity: 1, unit: 'pieces', price_per_unit: 0, discount: 0, currency: userCurrency },
  ]);
  const [grocerySaving, setGrocerySaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [scanPreview, setScanPreview] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ReceiptScanResult | null>(null);

  // --- Eating out state ---
  const [expenses, setExpenses] = useState<EatingOutExpense[]>([]);
  const [eatingLoading, setEatingLoading] = useState(true);
  const [showEatingForm, setShowEatingForm] = useState(false);
  const [eatingSaving, setEatingSaving] = useState(false);
  const [eatingForm, setEatingForm] = useState<CreateEatingOut>({
    restaurant_name: '', expense_date: new Date().toISOString().split('T')[0],
    amount: 0, currency: userCurrency, meal_type: 'lunch', notes: '',
  });

  // --- Subscription state ---
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [subsLoading, setSubsLoading] = useState(true);
  const [showSubForm, setShowSubForm] = useState(false);
  const [subSaving, setSubSaving] = useState(false);
  const [editSub, setEditSub] = useState<Subscription | null>(null);
  const BILLING_CYCLES = ['monthly', 'yearly', 'weekly', 'quarterly'];
  const SUB_CATEGORIES = ['streaming', 'music', 'software', 'fitness', 'cloud', 'insurance', 'other'];
  const [subForm, setSubForm] = useState<CreateSubscription>({
    name: '', amount: 0, currency: userCurrency, billing_cycle: 'monthly', category: 'other', notes: '',
  });

  // --- Loaders ---
  const loadOverview = useCallback(async () => {
    setOverviewLoading(true);
    setOverviewError('');
    try {
      const data = await spendingApi.getSummary(start, end, userCurrency);
      setSummary(data);
    } catch {
      setOverviewError(t('spending.failedToLoad'));
    } finally {
      setOverviewLoading(false);
    }
  }, [start, end, userCurrency, t]);

  const loadGrocery = () => {
    Promise.all([groceryApi.getAll(), foodItemsApi.getAll()])
      .then(([t, f]) => { setTrips(t); setFoodItems(f); })
      .finally(() => setGroceryLoading(false));
  };

  const loadEating = () => {
    eatingOutApi.getAll().then(setExpenses).finally(() => setEatingLoading(false));
  };

  const loadSubs = () => {
    subscriptionApi.getAll().then(setSubscriptions).finally(() => setSubsLoading(false));
  };

  const selectPeriod = (p: Period) => {
    setPeriod(p);
    if (p !== 'custom') {
      const dates = getDatesForPeriod(p);
      setStart(dates.start);
      setEnd(dates.end);
    }
  };

  // Auto-load when period/dates/currency change
  useEffect(() => { if (period !== 'custom') loadOverview(); }, [period, userCurrency]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { loadOverview(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { loadGrocery(); }, []);
  useEffect(() => { loadEating(); }, []);
  useEffect(() => { loadSubs(); }, []);

  // --- Grocery handlers ---
  const addGroceryItem = () =>
    setGroceryItems([...groceryItems, { name: '', quantity: 1, unit: 'pieces', price_per_unit: 0, discount: 0, currency: userCurrency }]);

  const removeGroceryItem = (i: number) => setGroceryItems(groceryItems.filter((_, idx) => idx !== i));

  const handleFoodItemSelect = (i: number, foodItemId: string) => {
    const fi = foodItems.find((f) => f.id === foodItemId);
    setGroceryItems(groceryItems.map((it, idx) => idx === i
      ? { ...it, food_item_id: foodItemId || undefined, name: fi ? fi.name : it.name, unit: fi ? fi.unit : it.unit }
      : it
    ));
  };

  const handleGrocerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGrocerySaving(true);
    try {
      const data: CreateGroceryTrip = { ...groceryForm, items: groceryItems };
      await groceryApi.create(data);
      const addToKitchen = await toast.confirm(t('grocery.addToKitchenConfirm'), { confirmLabel: t('grocery.addToKitchen'), confirmColor: 'emerald' });
      if (addToKitchen) {
        for (const item of groceryItems) {
          try {
            await foodItemsApi.create({
              name: item.name, quantity: item.quantity, unit: item.unit,
              category: item.category || undefined, price_per_unit: item.price_per_unit, price_currency: groceryForm.currency,
            } as CreateFoodItem);
          } catch { /* skip */ }
        }
        toast.success(t('grocery.addedToKitchen'));
      }
      setShowGroceryForm(false);
      setGroceryForm({ store_name: '', trip_date: '', notes: '', currency: userCurrency });
      setGroceryItems([{ name: '', quantity: 1, unit: 'pieces', price_per_unit: 0, discount: 0, currency: userCurrency }]);
      dismissScan();
      loadGrocery();
      loadOverview();
    } catch {
      toast.error(t('grocery.failedToSave'));
    } finally {
      setGrocerySaving(false);
    }
  };

  const handleGroceryDelete = async (id: string) => {
    const confirmed = await toast.confirm(t('grocery.deleteConfirm'));
    if (!confirmed) return;
    await groceryApi.delete(id);
    setTrips((prev) => prev.filter((t) => t.id !== id));
    toast.success(t('grocery.deleted'));
    loadOverview();
  };

  const handleScanFile = async (file: File) => {
    setScanPreview(URL.createObjectURL(file));
    setScanning(true);
    setScanResult(null);
    try {
      const result = await receiptScanApi.scan(file, groceryForm.currency, i18n.language);
      setScanResult(result);
      setGroceryForm((prev) => ({
        ...prev, store_name: result.store_name || prev.store_name,
        trip_date: result.trip_date || prev.trip_date, currency: result.currency || prev.currency,
      }));
      setGroceryItems(
        result.items.map((item) => ({
          name: item.name, quantity: item.quantity, unit: normalizeUnit(item.unit),
          price_per_unit: item.price_per_unit, discount: Math.abs(item.discount || 0),
          currency: result.currency || groceryForm.currency,
          category: item.category || undefined,
        }))
      );
      setShowGroceryForm(true);
      toast.success(t('grocery.scanSuccess'));
    } catch {
      toast.error(t('grocery.scanFailed'));
    } finally {
      setScanning(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleScanFile(file);
    e.target.value = '';
  };

  const dismissScan = () => { setScanResult(null); setScanPreview(null); };

  // --- Eating out handlers ---
  const handleEatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEatingSaving(true);
    try {
      await eatingOutApi.create(eatingForm);
      setShowEatingForm(false);
      setEatingForm({ restaurant_name: '', expense_date: new Date().toISOString().split('T')[0], amount: 0, currency: userCurrency, meal_type: 'lunch', notes: '' });
      loadEating();
      loadOverview();
    } catch {
      toast.error(t('eatingOut.failedToSave'));
    } finally {
      setEatingSaving(false);
    }
  };

  const handleEatingDelete = async (id: string) => {
    const confirmed = await toast.confirm(t('eatingOut.deleteConfirm'));
    if (!confirmed) return;
    await eatingOutApi.delete(id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    toast.success(t('eatingOut.deleted'));
    loadOverview();
  };

  // --- Subscription handlers ---
  const handleSubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubSaving(true);
    try {
      if (editSub) {
        await subscriptionApi.update(editSub.id, subForm);
      } else {
        await subscriptionApi.create(subForm);
      }
      setShowSubForm(false);
      setEditSub(null);
      setSubForm({ name: '', amount: 0, currency: userCurrency, billing_cycle: 'monthly', category: 'other', notes: '' });
      loadSubs();
      loadOverview();
    } catch {
      toast.error(t('subscriptions.failedToSave'));
    } finally {
      setSubSaving(false);
    }
  };

  const handleSubDelete = async (id: string) => {
    const confirmed = await toast.confirm(t('subscriptions.deleteConfirm'));
    if (!confirmed) return;
    await subscriptionApi.delete(id);
    setSubscriptions((prev) => prev.filter((s) => s.id !== id));
    toast.success(t('subscriptions.deleted'));
    loadOverview();
  };

  const handleSubToggle = async (sub: Subscription) => {
    await subscriptionApi.update(sub.id, { is_active: !sub.is_active });
    loadSubs();
    loadOverview();
  };

  const startEditSub = (sub: Subscription) => {
    setEditSub(sub);
    setSubForm({
      name: sub.name, amount: sub.amount, currency: sub.currency,
      billing_cycle: sub.billing_cycle, category: sub.category,
      next_billing_date: sub.next_billing_date || undefined, notes: sub.notes || '',
    });
    setShowSubForm(true);
  };

  const totalMonthlySubscriptions = subscriptions
    .filter((s) => s.is_active)
    .reduce((sum, s) => sum + s.monthly_cost, 0);

  const totalEatingThisMonth = expenses
    .filter((e) => {
      const d = new Date(e.expense_date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, e) => sum + e.amount, 0);

  // --- Shared ---
  const groceryPct = summary && summary.total > 0 ? Math.round((summary.grocery_total / summary.total) * 100) : 0;
  const eatingPct = summary && summary.total > 0 ? Math.round((summary.eating_out_total / summary.total) * 100) : 0;
  const subPct = summary && summary.total > 0 ? Math.round((summary.subscription_total / summary.total) * 100) : 0;
  const inputCls = 'w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2.5 text-base sm:text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-gray-700 min-h-[44px]';
  const inputClsSm = 'w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-lg px-2 py-2 text-sm sm:text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-gray-700 min-h-[40px]';

  const tabCls = (active: boolean) =>
    `flex-1 py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-colors min-h-[44px] flex items-center justify-center gap-1.5 ${
      active
        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
    }`;

  const periodCls = (p: Period) =>
    `flex-1 py-2 px-2 text-xs font-medium rounded-lg transition-colors min-h-[40px] ${
      period === p
        ? 'bg-emerald-600 text-white shadow-sm'
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
    }`;

  return (
    <div className="space-y-3 sm:space-y-6 overflow-x-hidden">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t('spending.title')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('spending.subtitle')}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100/50 dark:bg-gray-800/50 rounded-xl p-1">
        <button onClick={() => setTab('overview')} className={tabCls(tab === 'overview')}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="hidden sm:inline">{t('spending.overview')}</span>
          <span className="sm:hidden">{t('spending.overview')}</span>
        </button>
        <button onClick={() => setTab('grocery')} className={tabCls(tab === 'grocery')}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
          </svg>
          <span className="hidden sm:inline">{t('spending.groceries')}</span>
          <span className="sm:hidden">{t('spending.groceries')}</span>
        </button>
        <button onClick={() => setTab('eating-out')} className={tabCls(tab === 'eating-out')}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
          </svg>
          <span className="hidden sm:inline">{t('spending.eatingOut')}</span>
          <span className="sm:hidden">{t('spending.eatingOut')}</span>
        </button>
        <button onClick={() => setTab('subscriptions')} className={tabCls(tab === 'subscriptions')}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="hidden sm:inline">{t('subscriptions.title')}</span>
          <span className="sm:hidden">{t('subscriptions.titleShort')}</span>
        </button>
      </div>

      {/* ========== OVERVIEW TAB ========== */}
      {tab === 'overview' && (
        <>
          {/* Period presets */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-2 sm:p-3 space-y-2">
            <div className="flex flex-wrap gap-1">
              <button onClick={() => selectPeriod('this-month')} className={periodCls('this-month')}>
                {t('spending.thisMonth')}
              </button>
              <button onClick={() => selectPeriod('last-month')} className={periodCls('last-month')}>
                {t('spending.lastMonth')}
              </button>
              <button onClick={() => selectPeriod('3-months')} className={periodCls('3-months')}>
                {t('spending.threeMonths')}
              </button>
              <button onClick={() => selectPeriod('year')} className={periodCls('year')}>
                {t('spending.thisYear')}
              </button>
              <button onClick={() => selectPeriod('custom')} className={periodCls('custom')}>
                {t('spending.custom')}
              </button>
            </div>

            {/* Custom date range — only shown when custom is selected */}
            {period === 'custom' && (
              <div className="grid grid-cols-2 gap-2 pt-1 overflow-hidden">
                <div className="min-w-0">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('spending.from')}</label>
                  <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className={`${inputCls} max-w-full`} />
                </div>
                <div className="min-w-0">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('spending.to')}</label>
                  <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className={`${inputCls} max-w-full`} />
                </div>
              </div>
            )}

            {/* Load button for custom period */}
            {period === 'custom' && (
              <button onClick={loadOverview} disabled={overviewLoading}
                className="w-full py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors text-sm font-medium min-h-[44px]">
                {overviewLoading ? t('common.loading') : t('spending.load')}
              </button>
            )}
          </div>

          {overviewError && <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4 text-red-700 dark:text-red-400 text-sm">{overviewError}</div>}

          {summary && (
            <div className="space-y-4 sm:space-y-6">
              {/* Summary cards — horizontal scroll on mobile */}
              <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 sm:overflow-visible snap-x snap-mandatory">
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 sm:p-5 min-w-[140px] flex-shrink-0 sm:flex-shrink sm:min-w-0 snap-start">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('spending.totalSpending')}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{summary.total.toFixed(2)}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{summary.currency}</p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-4 sm:p-5 min-w-[140px] flex-shrink-0 sm:flex-shrink sm:min-w-0 snap-start">
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">{t('spending.groceries')}</p>
                  <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-300 mt-1">{summary.grocery_total.toFixed(2)}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">{groceryPct}%</p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-xl p-4 sm:p-5 min-w-[140px] flex-shrink-0 sm:flex-shrink sm:min-w-0 snap-start">
                  <p className="text-xs text-orange-700 dark:text-orange-400">{t('spending.eatingOut')}</p>
                  <p className="text-2xl font-bold text-orange-800 dark:text-orange-300 mt-1">{summary.eating_out_total.toFixed(2)}</p>
                  <p className="text-xs text-orange-600 dark:text-orange-400">{eatingPct}%</p>
                </div>
                {summary.subscription_total > 0 && (
                  <div className="bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 rounded-xl p-4 sm:p-5 min-w-[140px] flex-shrink-0 sm:flex-shrink sm:min-w-0 snap-start">
                    <p className="text-xs text-violet-700 dark:text-violet-400">{t('subscriptions.title')}</p>
                    <p className="text-2xl font-bold text-violet-800 dark:text-violet-300 mt-1">{summary.subscription_total.toFixed(2)}</p>
                    <p className="text-xs text-violet-600 dark:text-violet-400">{subPct}%</p>
                  </div>
                )}
              </div>

              {summary.total > 0 && (
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('spending.spendingBreakdown')}</p>
                  <div className="flex rounded-full overflow-hidden h-5">
                    {groceryPct > 0 && <div className="bg-emerald-400 dark:bg-emerald-500 transition-all" style={{ width: `${groceryPct}%` }} />}
                    {eatingPct > 0 && <div className="bg-orange-400 dark:bg-orange-500 transition-all" style={{ width: `${eatingPct}%` }} />}
                    {subPct > 0 && <div className="bg-violet-400 dark:bg-violet-500 transition-all" style={{ width: `${subPct}%` }} />}
                  </div>
                  <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-emerald-400 dark:bg-emerald-500 rounded-full inline-block" /> {t('spending.groceries')} {groceryPct}%</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-orange-400 dark:bg-orange-500 rounded-full inline-block" /> {t('spending.eatingOut')} {eatingPct}%</span>
                    {subPct > 0 && <span className="flex items-center gap-1"><span className="w-3 h-3 bg-violet-400 dark:bg-violet-500 rounded-full inline-block" /> {t('subscriptions.title')} {subPct}%</span>}
                  </div>
                </div>
              )}

              {/* Charts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Donut chart — category breakdown */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                  <h2 className="font-semibold text-gray-900 dark:text-white mb-3">{t('spending.spendingBreakdown')}</h2>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: t('spending.groceries'), value: summary.grocery_total },
                            { name: t('spending.eatingOut'), value: summary.eating_out_total },
                            ...(summary.subscription_total > 0 ? [{ name: t('subscriptions.title'), value: summary.subscription_total }] : []),
                          ].filter(d => d.value > 0)}
                          cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value"
                        >
                          <Cell fill="#34d399" />
                          <Cell fill="#fb923c" />
                          {summary.subscription_total > 0 && <Cell fill="#a78bfa" />}
                        </Pie>
                        <Tooltip formatter={(value: any) => `${Number(value).toFixed(2)} ${summary.currency}`} />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Bar chart — weekly spending */}
                {summary.weekly_breakdown.length > 0 && (
                  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                    <h2 className="font-semibold text-gray-900 dark:text-white mb-3">{t('spending.weeklyChart')}</h2>
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={summary.weekly_breakdown.map(w => ({
                          week: new Date(w.week_start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                          [t('spending.groceries')]: w.grocery_total,
                          [t('spending.eatingOut')]: w.eating_out_total,
                        }))}>
                          <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} width={45} />
                          <Tooltip formatter={(value: any) => `${Number(value).toFixed(2)} ${summary.currency}`} />
                          <Bar dataKey={t('spending.groceries')} stackId="a" fill="#34d399" radius={[0, 0, 0, 0]} />
                          <Bar dataKey={t('spending.eatingOut')} stackId="a" fill="#fb923c" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>

              {summary.weekly_breakdown.length > 0 && (
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                  <h2 className="font-semibold text-gray-900 dark:text-white mb-3">{t('spending.weeklyBreakdown')}</h2>
                  <div className="space-y-2">
                    {summary.weekly_breakdown.map((week) => (
                      <div key={week.week_start} className="text-sm">
                        <div className="flex items-center justify-between mb-1 sm:mb-0">
                          <span className="text-gray-500 dark:text-gray-400 text-xs">
                            {new Date(week.week_start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – {new Date(week.week_end).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                          <span className="font-semibold text-gray-800 dark:text-gray-200 text-right sm:hidden">{week.total.toFixed(2)} {week.currency}</span>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4">
                          <div className="flex-1 flex gap-1 h-5">
                            {week.grocery_total > 0 && (
                              <div className="bg-emerald-200 dark:bg-emerald-500/30 rounded-sm flex items-center px-1 text-xs text-emerald-800 dark:text-emerald-300 whitespace-nowrap"
                                style={{ width: `${(week.grocery_total / summary.total) * 100}%`, minWidth: '2rem' }}>
                                {week.grocery_total.toFixed(0)}
                              </div>
                            )}
                            {week.eating_out_total > 0 && (
                              <div className="bg-orange-200 dark:bg-orange-500/30 rounded-sm flex items-center px-1 text-xs text-orange-800 dark:text-orange-300 whitespace-nowrap"
                                style={{ width: `${(week.eating_out_total / summary.total) * 100}%`, minWidth: '2rem' }}>
                                {week.eating_out_total.toFixed(0)}
                              </div>
                            )}
                          </div>
                          <span className="font-semibold text-gray-800 dark:text-gray-200 w-20 text-right hidden sm:block">{week.total.toFixed(2)} {week.currency}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {summary.top_stores.length > 0 && (
                  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                    <h2 className="font-semibold text-gray-900 dark:text-white mb-3">{t('spending.topStores')}</h2>
                    <ul className="space-y-2">
                      {summary.top_stores.map((s) => (
                        <li key={s.store} className="flex justify-between text-sm">
                          <span className="text-gray-700 dark:text-gray-300">{s.store}</span>
                          <span className="font-semibold text-gray-900 dark:text-white">{s.total.toFixed(2)} {userCurrency}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {summary.top_restaurants.length > 0 && (
                  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                    <h2 className="font-semibold text-gray-900 dark:text-white mb-3">{t('spending.topRestaurants')}</h2>
                    <ul className="space-y-2">
                      {summary.top_restaurants.map((r) => (
                        <li key={r.restaurant} className="flex justify-between text-sm">
                          <span className="text-gray-700 dark:text-gray-300">{r.restaurant}</span>
                          <span className="font-semibold text-gray-900 dark:text-white">{r.total.toFixed(2)} {userCurrency}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ========== GROCERY TAB ========== */}
      {tab === 'grocery' && (
        <>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleFileChange} capture="environment" />

          {/* Receipt Scan Hero CTA */}
          {!showGroceryForm && (
            isPremium ? (
              <div className="bg-gradient-to-br from-purple-600 to-purple-700 dark:from-purple-700 dark:to-purple-800 rounded-2xl p-5 sm:p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-6 -translate-x-6" />
                <div className="relative flex items-start gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold">{t('grocery.scanHeroTitle')}</h3>
                    <p className="text-sm text-purple-100 mt-1">{t('grocery.scanHeroDesc')}</p>
                  </div>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={scanning}
                  className="mt-4 w-full py-3.5 bg-white text-purple-700 font-semibold rounded-xl hover:bg-purple-50 disabled:opacity-50 transition-colors text-sm flex items-center justify-center gap-2 min-h-[48px] shadow-lg shadow-purple-900/20"
                >
                  {scanning ? (
                    <>
                      <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                      {t('grocery.scanning')}
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {t('grocery.scanReceipt')}
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl p-5 sm:p-6 border border-gray-200 dark:border-gray-700 relative overflow-hidden">
                <div className="absolute top-2 right-3 px-2 py-0.5 bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 text-[10px] font-bold rounded-full uppercase tracking-wide">{t('premium.locked')}</div>
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-7 h-7 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0 pr-16">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('grocery.scanHeroTitle')}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('grocery.scanHeroDesc')}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{t('premium.testPhase')}</p>
                  </div>
                </div>
              </div>
            )
          )}

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('grocery.subtitle')}</p>
            <button onClick={() => { setShowGroceryForm(!showGroceryForm); dismissScan(); }}
              className="px-3 sm:px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-sm font-medium min-h-[44px]">
              {showGroceryForm ? t('common.cancel') : t('grocery.logTrip')}
            </button>
          </div>

          {/* Scan preview */}
          {scanResult && showGroceryForm && (
            <div className="bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 rounded-xl p-3 sm:p-4 flex items-start gap-3">
              {scanPreview && <img src={scanPreview} alt="Receipt" className="w-12 h-16 sm:w-16 sm:h-20 object-cover rounded-lg border border-purple-200 dark:border-purple-500/30 flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-purple-800 dark:text-purple-300 text-sm">{t('grocery.scanComplete')}</h3>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">{t('grocery.scanItemsFound', { count: scanResult.items.length })}</p>
              </div>
              <button onClick={dismissScan} className="text-purple-400 hover:text-purple-600 dark:hover:text-purple-300 text-lg p-1">&times;</button>
            </div>
          )}

          {/* Grocery form */}
          {showGroceryForm && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 sm:p-6">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">{t('grocery.newTrip')}</h2>
              <form onSubmit={handleGrocerySubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('grocery.store')} *</label>
                    <input type="text" required value={groceryForm.store_name}
                      onChange={(e) => setGroceryForm({ ...groceryForm, store_name: e.target.value })}
                      className={inputCls} placeholder="e.g. REWE" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('grocery.date')} *</label>
                    <input type="date" required value={groceryForm.trip_date}
                      onChange={(e) => setGroceryForm({ ...groceryForm, trip_date: e.target.value })}
                      className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('grocery.notes')}</label>
                  <input type="text" value={groceryForm.notes}
                    onChange={(e) => setGroceryForm({ ...groceryForm, notes: e.target.value })}
                    className={inputCls} />
                </div>

                {/* Items */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('common.items')} *</label>
                    <button type="button" onClick={addGroceryItem} className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium py-1">{t('grocery.addItem')}</button>
                  </div>

                  {/* Desktop table */}
                  <div className="hidden sm:block space-y-2">
                    <div className="grid grid-cols-12 gap-1 text-xs text-gray-400 dark:text-gray-500 font-medium px-1">
                      <div className="col-span-2">{t('grocery.fromKitchen')}</div>
                      <div className="col-span-3">{t('grocery.name')}</div>
                      <div className="col-span-1">{t('grocery.qty')}</div>
                      <div className="col-span-2">{t('foodModal.unit')}</div>
                      <div className="col-span-1">{t('grocery.price')}</div>
                      <div className="col-span-1">{t('grocery.discount')}</div>
                      <div className="col-span-1">{t('grocery.net')}</div>
                      <div className="col-span-1"></div>
                    </div>
                    {groceryItems.map((it, i) => (
                      <div key={i} className="grid grid-cols-12 gap-1 items-center">
                        <div className="col-span-2">
                          <select value={it.food_item_id || ''} onChange={(e) => handleFoodItemSelect(i, e.target.value)} className={`w-full ${inputClsSm}`}>
                            <option value="">Custom</option>
                            {foodItems.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                          </select>
                        </div>
                        <div className="col-span-3">
                          <input type="text" required value={it.name} placeholder="Name"
                            onChange={(e) => setGroceryItems(groceryItems.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))}
                            className={`w-full ${inputClsSm}`} />
                        </div>
                        <div className="col-span-1">
                          <input type="number" min="0" step="0.001" value={it.quantity}
                            onChange={(e) => setGroceryItems(groceryItems.map((x, idx) => idx === i ? { ...x, quantity: parseFloat(e.target.value) } : x))}
                            className={`w-full ${inputClsSm}`} />
                        </div>
                        <div className="col-span-2">
                          <select value={it.unit} onChange={(e) => setGroceryItems(groceryItems.map((x, idx) => idx === i ? { ...x, unit: e.target.value } : x))} className={`w-full ${inputClsSm}`}>
                            {UNITS.map((u) => <option key={u} value={u}>{t(`units.${u}`)}</option>)}
                          </select>
                        </div>
                        <div className="col-span-1">
                          <input type="number" min="0" step="0.01" value={it.price_per_unit}
                            onChange={(e) => setGroceryItems(groceryItems.map((x, idx) => idx === i ? { ...x, price_per_unit: parseFloat(e.target.value) } : x))}
                            className={`w-full ${inputClsSm}`} placeholder="0.00" />
                        </div>
                        <div className="col-span-1">
                          <input type="number" min="0" step="0.01" value={it.discount || 0}
                            onChange={(e) => setGroceryItems(groceryItems.map((x, idx) => idx === i ? { ...x, discount: parseFloat(e.target.value) || 0 } : x))}
                            className={`w-full ${inputClsSm} ${(it.discount || 0) > 0 ? 'text-red-500' : ''}`} placeholder="0" />
                        </div>
                        <div className="col-span-1">
                          <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                            {(it.quantity * it.price_per_unit - (it.discount || 0)).toFixed(2)}
                          </span>
                        </div>
                        <div className="col-span-1 flex justify-center">
                          {groceryItems.length > 1 && (
                            <button type="button" onClick={() => removeGroceryItem(i)} className="text-red-400 hover:text-red-600 dark:hover:text-red-400 text-sm p-1">&times;</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Mobile cards */}
                  <div className="sm:hidden space-y-3">
                    {groceryItems.map((it, i) => (
                      <div key={i} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 space-y-2 relative">
                        {groceryItems.length > 1 && (
                          <button type="button" onClick={() => removeGroceryItem(i)} className="absolute top-2 right-2 text-red-400 hover:text-red-600 dark:hover:text-red-400 text-lg p-1 leading-none">&times;</button>
                        )}
                        <select value={it.food_item_id || ''} onChange={(e) => handleFoodItemSelect(i, e.target.value)} className={inputCls}>
                          <option value="">{t('grocery.fromKitchen')}...</option>
                          {foodItems.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                        <input type="text" required value={it.name} placeholder={t('grocery.name')}
                          onChange={(e) => setGroceryItems(groceryItems.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))}
                          className={inputCls} />
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[10px] text-gray-400 dark:text-gray-500 mb-0.5">{t('grocery.qty')}</label>
                            <input type="number" min="0" step="0.001" value={it.quantity}
                              onChange={(e) => setGroceryItems(groceryItems.map((x, idx) => idx === i ? { ...x, quantity: parseFloat(e.target.value) } : x))}
                              className={inputCls} />
                          </div>
                          <div>
                            <label className="block text-[10px] text-gray-400 dark:text-gray-500 mb-0.5">{t('foodModal.unit')}</label>
                            <select value={it.unit} onChange={(e) => setGroceryItems(groceryItems.map((x, idx) => idx === i ? { ...x, unit: e.target.value } : x))} className={inputCls}>
                              {UNITS.map((u) => <option key={u} value={u}>{t(`units.${u}`)}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] text-gray-400 dark:text-gray-500 mb-0.5">{t('grocery.price')}</label>
                            <input type="number" min="0" step="0.01" value={it.price_per_unit}
                              onChange={(e) => setGroceryItems(groceryItems.map((x, idx) => idx === i ? { ...x, price_per_unit: parseFloat(e.target.value) } : x))}
                              className={inputCls} placeholder="0.00" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1">
                            <label className="block text-[10px] text-gray-400 dark:text-gray-500 mb-0.5">{t('grocery.discount')}</label>
                            <input type="number" min="0" step="0.01" value={it.discount || 0}
                              onChange={(e) => setGroceryItems(groceryItems.map((x, idx) => idx === i ? { ...x, discount: parseFloat(e.target.value) || 0 } : x))}
                              className={`${inputCls} ${(it.discount || 0) > 0 ? 'text-red-500' : ''}`} placeholder="0" />
                          </div>
                          <div className="text-right pt-3">
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 block">{t('grocery.net')}</span>
                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                              {(it.quantity * it.price_per_unit - (it.discount || 0)).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-right">
                    {t('grocery.estimatedTotal')}: <span className="font-semibold text-gray-700 dark:text-gray-300">
                      {groceryItems.reduce((s, it) => s + it.quantity * it.price_per_unit - (it.discount || 0), 0).toFixed(2)} {groceryForm.currency}
                    </span>
                  </p>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowGroceryForm(false)}
                    className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors min-h-[48px]">
                    {t('common.cancel')}
                  </button>
                  <button type="submit" disabled={grocerySaving}
                    className="flex-1 px-4 py-3 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition-colors min-h-[48px]">
                    {grocerySaving ? t('common.saving') : t('grocery.saveTrip')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Trip list */}
          {groceryLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : trips.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300">{t('grocery.noTrips')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {trips.map((trip) => (
                <div key={trip.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                  <div className="p-3 sm:p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors active:bg-gray-100 dark:active:bg-gray-800"
                    onClick={() => setExpandedId(expandedId === trip.id ? null : trip.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">{trip.store_name}</h3>
                        <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">{new Date(trip.trip_date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{trip.items.length} {t('common.items')}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400 text-base sm:text-lg">
                        {trip.total_amount.toFixed(2)} {trip.currency}
                      </span>
                      <button onClick={(e) => { e.stopPropagation(); handleGroceryDelete(trip.id); }}
                        className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      <span className="text-gray-400 dark:text-gray-500 text-sm">{expandedId === trip.id ? '\u25B2' : '\u25BC'}</span>
                    </div>
                  </div>
                  {expandedId === trip.id && (
                    <div className="border-t border-gray-100 dark:border-gray-800 px-3 sm:px-4 pb-3 sm:pb-4 pt-3">
                      <table className="w-full text-sm hidden sm:table">
                        <thead>
                          <tr className="text-xs text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800">
                            <th className="text-left pb-1">{t('common.item')}</th>
                            <th className="text-right pb-1">{t('grocery.qty')}</th>
                            <th className="text-right pb-1">{t('grocery.price')}</th>
                            <th className="text-right pb-1">{t('grocery.discount')}</th>
                            <th className="text-right pb-1">{t('grocery.total')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {trip.items.map((item) => (
                            <tr key={item.id} className="border-b border-gray-50 dark:border-gray-800/50">
                              <td className="py-1.5 text-gray-700 dark:text-gray-300">{item.name}</td>
                              <td className="py-1.5 text-right text-gray-500 dark:text-gray-400">{item.quantity} {t(`units.${item.unit}`, item.unit)}</td>
                              <td className="py-1.5 text-right text-gray-500 dark:text-gray-400">{item.price_per_unit.toFixed(2)}</td>
                              <td className="py-1.5 text-right text-red-500">{item.discount > 0 ? `-${item.discount.toFixed(2)}` : ''}</td>
                              <td className="py-1.5 text-right font-medium text-gray-800 dark:text-gray-200">{item.total_price.toFixed(2)} {item.currency}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan={4} className="pt-2 text-right font-semibold text-gray-700 dark:text-gray-300">{t('grocery.total')}</td>
                            <td className="pt-2 text-right font-bold text-emerald-700 dark:text-emerald-400">{trip.total_amount.toFixed(2)} {trip.currency}</td>
                          </tr>
                        </tfoot>
                      </table>
                      <div className="sm:hidden space-y-1.5">
                        {trip.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/50 last:border-0">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{item.name}</p>
                              <p className="text-xs text-gray-400 dark:text-gray-500">
                                {item.quantity} {t(`units.${item.unit}`, item.unit)} &times; {item.price_per_unit.toFixed(2)}
                                {item.discount > 0 && <span className="text-red-500 ml-1">-{item.discount.toFixed(2)}</span>}
                              </p>
                            </div>
                            <span className="font-medium text-sm text-gray-800 dark:text-gray-200 ml-3 flex-shrink-0">{item.total_price.toFixed(2)}</span>
                          </div>
                        ))}
                        <div className="flex items-center justify-between pt-2">
                          <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">{t('grocery.total')}</span>
                          <span className="font-bold text-emerald-700 dark:text-emerald-400">{trip.total_amount.toFixed(2)} {trip.currency}</span>
                        </div>
                      </div>
                      {trip.notes && <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{trip.notes}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ========== EATING OUT TAB ========== */}
      {tab === 'eating-out' && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('eatingOut.subtitle')}</p>
            <button onClick={() => setShowEatingForm(!showEatingForm)}
              className="px-3 sm:px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-sm font-medium min-h-[44px]">
              {showEatingForm ? t('common.cancel') : t('eatingOut.addExpense')}
            </button>
          </div>

          <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-xl p-4">
            <p className="text-sm text-orange-700 dark:text-orange-400 font-medium">{t('eatingOut.thisMonth')}</p>
            <p className="text-2xl font-bold text-orange-800 dark:text-orange-300 mt-1">{totalEatingThisMonth.toFixed(2)} {userCurrency}</p>
          </div>

          {showEatingForm && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">{t('eatingOut.logExpense')}</h2>
              <form onSubmit={handleEatingSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('eatingOut.restaurant')} *</label>
                    <input type="text" required value={eatingForm.restaurant_name}
                      onChange={(e) => setEatingForm({ ...eatingForm, restaurant_name: e.target.value })}
                      className={inputCls} placeholder="e.g. Starbucks" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('eatingOut.date')} *</label>
                    <input type="date" required value={eatingForm.expense_date}
                      onChange={(e) => setEatingForm({ ...eatingForm, expense_date: e.target.value })}
                      className={inputCls} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('eatingOut.amount')} ({userCurrency}) *</label>
                    <input type="number" required min="0" step="0.01" value={eatingForm.amount}
                      onChange={(e) => setEatingForm({ ...eatingForm, amount: parseFloat(e.target.value) })}
                      className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('eatingOut.mealType')}</label>
                    <select value={eatingForm.meal_type} onChange={(e) => setEatingForm({ ...eatingForm, meal_type: e.target.value })} className={inputCls}>
                      {MEAL_TYPES.map((mt) => <option key={mt} value={mt}>{mt.charAt(0).toUpperCase() + mt.slice(1)}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('grocery.notes')}</label>
                  <input type="text" value={eatingForm.notes ?? ''} onChange={(e) => setEatingForm({ ...eatingForm, notes: e.target.value })} className={inputCls} />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowEatingForm(false)}
                    className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors min-h-[48px]">{t('common.cancel')}</button>
                  <button type="submit" disabled={eatingSaving}
                    className="flex-1 px-4 py-3 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition-colors min-h-[48px]">
                    {eatingSaving ? t('common.saving') : t('common.save')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {eatingLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300">{t('eatingOut.noExpenses')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {expenses.map((exp) => (
                <div key={exp.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 sm:p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={MEAL_ICONS[exp.meal_type] || MEAL_ICONS.other} />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">{exp.restaurant_name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {new Date(exp.expense_date).toLocaleDateString()} &middot; {exp.meal_type}
                      {exp.notes && ` \u00B7 ${exp.notes}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">{exp.amount.toFixed(2)} {exp.currency}</span>
                    <button onClick={() => handleEatingDelete(exp.id)}
                      className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ========== SUBSCRIPTIONS TAB ========== */}
      {tab === 'subscriptions' && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('subscriptions.subtitle')}</p>
            <button onClick={() => { setShowSubForm(!showSubForm); setEditSub(null); setSubForm({ name: '', amount: 0, currency: userCurrency, billing_cycle: 'monthly', category: 'other', notes: '' }); }}
              className="px-3 sm:px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-sm font-medium min-h-[44px]">
              {showSubForm ? t('common.cancel') : t('subscriptions.addSub')}
            </button>
          </div>

          {/* Monthly total card */}
          <div className="bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 rounded-xl p-4">
            <p className="text-sm text-violet-700 dark:text-violet-400 font-medium">{t('subscriptions.monthlyTotal')}</p>
            <p className="text-2xl font-bold text-violet-800 dark:text-violet-300 mt-1">{totalMonthlySubscriptions.toFixed(2)} {userCurrency}</p>
            <p className="text-xs text-violet-600 dark:text-violet-400 mt-0.5">{subscriptions.filter(s => s.is_active).length} {t('subscriptions.activeCount')}</p>
          </div>

          {/* Add/Edit form */}
          {showSubForm && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 sm:p-6">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">{editSub ? t('subscriptions.editSub') : t('subscriptions.addSub')}</h2>
              <form onSubmit={handleSubSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('subscriptions.name')} *</label>
                    <input type="text" required value={subForm.name}
                      onChange={(e) => setSubForm({ ...subForm, name: e.target.value })}
                      className={inputCls} placeholder="e.g. Netflix" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('subscriptions.amount')} ({userCurrency}) *</label>
                    <input type="number" required min="0" step="0.01" value={subForm.amount}
                      onChange={(e) => setSubForm({ ...subForm, amount: parseFloat(e.target.value) })}
                      className={inputCls} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('subscriptions.billingCycle')}</label>
                    <select value={subForm.billing_cycle} onChange={(e) => setSubForm({ ...subForm, billing_cycle: e.target.value })} className={inputCls}>
                      {BILLING_CYCLES.map((c) => <option key={c} value={c}>{t(`subscriptions.cycle_${c}`)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('subscriptions.category')}</label>
                    <select value={subForm.category} onChange={(e) => setSubForm({ ...subForm, category: e.target.value })} className={inputCls}>
                      {SUB_CATEGORIES.map((c) => <option key={c} value={c}>{t(`subscriptions.cat_${c}`)}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('subscriptions.nextBilling')}</label>
                    <input type="date" value={subForm.next_billing_date || ''}
                      onChange={(e) => setSubForm({ ...subForm, next_billing_date: e.target.value || undefined })}
                      className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('grocery.notes')}</label>
                    <input type="text" value={subForm.notes ?? ''} onChange={(e) => setSubForm({ ...subForm, notes: e.target.value })} className={inputCls} />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => { setShowSubForm(false); setEditSub(null); }}
                    className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors min-h-[48px]">{t('common.cancel')}</button>
                  <button type="submit" disabled={subSaving}
                    className="flex-1 px-4 py-3 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition-colors min-h-[48px]">
                    {subSaving ? t('common.saving') : t('common.save')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Subscription list */}
          {subsLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300">{t('subscriptions.noSubs')}</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{t('subscriptions.noSubsHint')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {subscriptions.map((sub) => (
                <div key={sub.id} className={`bg-white dark:bg-gray-900 border rounded-xl p-3 sm:p-4 flex items-center gap-3 transition-opacity ${sub.is_active ? 'border-gray-200 dark:border-gray-800' : 'border-gray-100 dark:border-gray-800/50 opacity-60'}`}>
                  <button onClick={() => handleSubToggle(sub)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${sub.is_active ? 'bg-violet-100 dark:bg-violet-500/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                    {sub.is_active ? (
                      <svg className="w-5 h-5 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-semibold truncate ${sub.is_active ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 line-through'}`}>{sub.name}</h3>
                      <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full flex-shrink-0">{t(`subscriptions.cat_${sub.category}`)}</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {sub.amount.toFixed(2)} {sub.currency} / {t(`subscriptions.cycle_${sub.billing_cycle}`)}
                      {sub.monthly_cost !== sub.amount && <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">({sub.monthly_cost.toFixed(2)}/mo)</span>}
                      {sub.next_billing_date && <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">&middot; {t('subscriptions.next')}: {new Date(sub.next_billing_date).toLocaleDateString()}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => startEditSub(sub)}
                      className="p-2 text-gray-400 dark:text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button onClick={() => handleSubDelete(sub.id)}
                      className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
