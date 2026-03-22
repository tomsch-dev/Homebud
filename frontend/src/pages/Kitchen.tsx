import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { foodItemsApi, FoodItem, CreateFoodItem } from '../api/foodItems';
import FoodItemModal from '../components/FoodItemModal';
import { useToast } from '../components/Toast';

const CATEGORY_EMOJI: Record<string, string> = {
  dairy: '🥛',
  meat: '🥩',
  seafood: '🐟',
  vegetables: '🥬',
  fruits: '🍎',
  grains: '🌾',
  beverages: '🥤',
  condiments: '🧂',
  snacks: '🍿',
  frozen: '🧊',
  other: '📦',
};

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  dairy: { bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/20', text: 'text-blue-700 dark:text-blue-300' },
  meat: { bg: 'bg-red-50 dark:bg-red-500/10', border: 'border-red-200 dark:border-red-500/20', text: 'text-red-700 dark:text-red-300' },
  seafood: { bg: 'bg-cyan-50 dark:bg-cyan-500/10', border: 'border-cyan-200 dark:border-cyan-500/20', text: 'text-cyan-700 dark:text-cyan-300' },
  vegetables: { bg: 'bg-green-50 dark:bg-green-500/10', border: 'border-green-200 dark:border-green-500/20', text: 'text-green-700 dark:text-green-300' },
  fruits: { bg: 'bg-yellow-50 dark:bg-yellow-500/10', border: 'border-yellow-200 dark:border-yellow-500/20', text: 'text-yellow-700 dark:text-yellow-300' },
  grains: { bg: 'bg-orange-50 dark:bg-orange-500/10', border: 'border-orange-200 dark:border-orange-500/20', text: 'text-orange-700 dark:text-orange-300' },
  beverages: { bg: 'bg-sky-50 dark:bg-sky-500/10', border: 'border-sky-200 dark:border-sky-500/20', text: 'text-sky-700 dark:text-sky-300' },
  condiments: { bg: 'bg-purple-50 dark:bg-purple-500/10', border: 'border-purple-200 dark:border-purple-500/20', text: 'text-purple-700 dark:text-purple-300' },
  snacks: { bg: 'bg-pink-50 dark:bg-pink-500/10', border: 'border-pink-200 dark:border-pink-500/20', text: 'text-pink-700 dark:text-pink-300' },
  frozen: { bg: 'bg-indigo-50 dark:bg-indigo-500/10', border: 'border-indigo-200 dark:border-indigo-500/20', text: 'text-indigo-700 dark:text-indigo-300' },
  other: { bg: 'bg-gray-50 dark:bg-gray-500/10', border: 'border-gray-200 dark:border-gray-500/20', text: 'text-gray-700 dark:text-gray-300' },
};

const CATEGORY_BADGE: Record<string, string> = {
  dairy: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
  meat: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
  seafood: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300',
  vegetables: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300',
  fruits: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300',
  grains: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300',
  beverages: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
  condiments: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300',
  snacks: 'bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300',
  frozen: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300',
  other: 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300',
};

// Fixed order so categories always appear in the same position
const CATEGORY_ORDER = ['dairy', 'meat', 'seafood', 'vegetables', 'fruits', 'grains', 'beverages', 'condiments', 'snacks', 'frozen', 'other'];

export default function Kitchen() {
  const { t } = useTranslation();
  const [items, setItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<FoodItem | undefined>();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const toast = useToast();

  const load = () => {
    foodItemsApi.getAll().then(setItems).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (data: CreateFoodItem) => {
    if (editItem) {
      await foodItemsApi.update(editItem.id, data);
    } else {
      await foodItemsApi.create(data);
    }
    load();
  };

  const [reduceId, setReduceId] = useState<string | null>(null);
  const [reduceAmount, setReduceAmount] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<FoodItem | null>(null);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await foodItemsApi.delete(deleteTarget.id);
    setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
    setDeleteTarget(null);
    toast.success(t('kitchen.deleted'));
  };

  const handleReduce = async (item: FoodItem) => {
    const newQty = item.quantity - reduceAmount;
    if (newQty <= 0) {
      await foodItemsApi.delete(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } else {
      await foodItemsApi.update(item.id, { quantity: newQty });
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, quantity: newQty } : i));
    }
    setReduceId(null);
    setReduceAmount(1);
    toast.success(t('kitchen.quantityReduced'));
  };

  const isExpired = (item: FoodItem) =>
    item.expiry_date ? new Date(item.expiry_date) < new Date() : false;

  const isExpiringSoon = (item: FoodItem) => {
    if (!item.expiry_date) return false;
    const days = Math.ceil((new Date(item.expiry_date).getTime() - Date.now()) / 86400000);
    return days <= 3 && days >= 0;
  };

  const catLabel = (cat: string) => t(`categories.${cat}`, cat.charAt(0).toUpperCase() + cat.slice(1));

  // Normalize category: uncategorized → 'other'
  const getCategory = (item: FoodItem) => item.category || 'other';

  // Group items by category with counts
  const categoryMap = items.reduce<Record<string, FoodItem[]>>((acc, item) => {
    const cat = getCategory(item);
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  // Categories that have items, in fixed order
  const populatedCategories = CATEGORY_ORDER.filter((c) => categoryMap[c]?.length > 0);

  // Items for the active category, filtered by search
  const categoryItems = activeCategory
    ? (categoryMap[activeCategory] || []).filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  // Expiring items count for alert badges on cards
  const getExpiringCount = (cat: string) =>
    (categoryMap[cat] || []).filter((i) => isExpiringSoon(i) || isExpired(i)).length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t('kitchen.title')}</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
            {items.length} {t('common.items')} {t('kitchen.tracked')}
            {items.filter(isExpired).length > 0 && (
              <span className="text-red-500 ml-2">
                {items.filter(isExpired).length} {t('kitchen.expired')}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => { setEditItem(undefined); setShowModal(true); }}
          className="px-3 sm:px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-sm font-semibold shadow-sm min-h-[44px]"
        >
          {t('kitchen.addItem')}
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 7V5a1 1 0 011-1h14a1 1 0 011 1v2M4 7l1 12a2 2 0 002 2h10a2 2 0 002-2l1-12" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">{t('kitchen.empty')}</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{t('kitchen.emptyHint')}</p>
          <button
            onClick={() => { setEditItem(undefined); setShowModal(true); }}
            className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-sm font-medium transition-colors"
          >
            {t('kitchen.addItem')}
          </button>
        </div>
      ) : !activeCategory ? (
        /* ========== CATEGORY OVERVIEW GRID ========== */
        <>
          {/* Search across all items */}
          <div className="relative">
            <input
              type="text"
              placeholder={t('kitchen.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2.5 text-base sm:text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-gray-700 focus:border-transparent transition-colors min-h-[44px]"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {search ? (
            /* Search results view */
            (() => {
              const searchResults = items.filter((item) =>
                item.name.toLowerCase().includes(search.toLowerCase())
              );
              return searchResults.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">{t('kitchen.noMatch')}</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{t('kitchen.noMatchHint')}</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {searchResults.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      isExpired={isExpired(item)}
                      isExpiringSoon={isExpiringSoon(item)}
                      expanded={expandedId === item.id}
                      reduceId={reduceId}
                      reduceAmount={reduceAmount}
                      onToggleExpand={() => setExpandedId(expandedId === item.id ? null : item.id)}
                      onEdit={() => { setEditItem(item); setShowModal(true); }}
                      onDelete={() => setDeleteTarget(item)}
                      onReduceToggle={() => { setReduceId(reduceId === item.id ? null : item.id); setReduceAmount(1); }}
                      onReduceAmountChange={setReduceAmount}
                      onReduceConfirm={() => handleReduce(item)}
                      onReduceCancel={() => setReduceId(null)}
                      catLabel={catLabel}
                      t={t}
                    />
                  ))}
                </div>
              );
            })()
          ) : (
            /* Category cards grid */
            <div className="grid grid-cols-2 gap-3">
              {populatedCategories.map((cat) => {
                const count = categoryMap[cat].length;
                const expiringCount = getExpiringCount(cat);
                const colors = CATEGORY_COLORS[cat] || CATEGORY_COLORS.other;
                const emoji = CATEGORY_EMOJI[cat] || CATEGORY_EMOJI.other;

                return (
                  <button
                    key={cat}
                    onClick={() => { setActiveCategory(cat); setSearch(''); }}
                    className={`relative ${colors.bg} ${colors.border} border rounded-2xl p-4 text-left transition-all hover:shadow-md active:scale-[0.98] min-h-[88px] flex flex-col justify-between`}
                  >
                    {expiringCount > 0 && (
                      <span className="absolute top-2 right-2 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {expiringCount}
                      </span>
                    )}
                    <span className="text-2xl">{emoji}</span>
                    <div className="mt-1">
                      <p className={`text-sm font-semibold ${colors.text}`}>{catLabel(cat)}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {count} {count === 1 ? t('common.item') : t('common.items')}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* ========== CATEGORY DETAIL VIEW ========== */
        <>
          {/* Back button + category header */}
          <button
            onClick={() => { setActiveCategory(null); setSearch(''); setExpandedId(null); setReduceId(null); }}
            className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors min-h-[44px] -mb-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            {t('kitchen.allCategories')}
          </button>

          <div className="flex items-center gap-3">
            <span className="text-3xl">{CATEGORY_EMOJI[activeCategory] || CATEGORY_EMOJI.other}</span>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{catLabel(activeCategory)}</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {(categoryMap[activeCategory] || []).length} {t('common.items')}
              </p>
            </div>
          </div>

          {/* Search within category */}
          <div className="relative">
            <input
              type="text"
              placeholder={t('kitchen.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2.5 text-base sm:text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-gray-700 focus:border-transparent transition-colors min-h-[44px]"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {categoryItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">{t('kitchen.noMatch')}</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{t('kitchen.noMatchHint')}</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {categoryItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  isExpired={isExpired(item)}
                  isExpiringSoon={isExpiringSoon(item)}
                  expanded={expandedId === item.id}
                  reduceId={reduceId}
                  reduceAmount={reduceAmount}
                  onToggleExpand={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  onEdit={() => { setEditItem(item); setShowModal(true); }}
                  onDelete={() => setDeleteTarget(item)}
                  onReduceToggle={() => { setReduceId(reduceId === item.id ? null : item.id); setReduceAmount(1); }}
                  onReduceAmountChange={setReduceAmount}
                  onReduceConfirm={() => handleReduce(item)}
                  onReduceCancel={() => setReduceId(null)}
                  catLabel={catLabel}
                  t={t}
                />
              ))}
            </div>
          )}
        </>
      )}

      {showModal && (
        <FoodItemModal
          item={editItem}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* Delete confirmation popup */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDeleteTarget(null)}>
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-sm p-6 space-y-4 animate-[popIn_0.2s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center">
                <svg className="w-7 h-7 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('kitchen.deleteConfirm')}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  <span className="font-medium text-gray-700 dark:text-gray-300">{deleteTarget.name}</span> — {deleteTarget.quantity} {t(`units.${deleteTarget.unit}`, deleteTarget.unit)}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors min-h-[48px]"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-3 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors min-h-[48px]"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


/* ========== ITEM CARD COMPONENT ========== */

function ItemCard({
  item, isExpired: expired, isExpiringSoon: expiring, expanded, reduceId, reduceAmount,
  onToggleExpand, onEdit, onDelete, onReduceToggle, onReduceAmountChange, onReduceConfirm, onReduceCancel,
  catLabel, t,
}: {
  item: FoodItem;
  isExpired: boolean;
  isExpiringSoon: boolean;
  expanded: boolean;
  reduceId: string | null;
  reduceAmount: number;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onReduceToggle: () => void;
  onReduceAmountChange: (v: number) => void;
  onReduceConfirm: () => void;
  onReduceCancel: () => void;
  catLabel: (cat: string) => string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
}) {
  return (
    <div
      className={`bg-white dark:bg-gray-900 border rounded-xl overflow-hidden transition-all hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20 ${
        expired ? 'border-red-200 dark:border-red-500/30 bg-red-50/30 dark:bg-red-500/5' : expiring ? 'border-amber-200 dark:border-amber-500/30' : 'border-gray-100 dark:border-gray-800'
      }`}
    >
      <div className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900 dark:text-white">{item.name}</h3>
              {item.category && (
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${CATEGORY_BADGE[item.category] || CATEGORY_BADGE.other}`}>
                  {catLabel(item.category)}
                </span>
              )}
              {expired && <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 font-semibold">{t('kitchen.expiredBadge')}</span>}
              {expiring && !expired && <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold">{t('kitchen.expiringSoonBadge')}</span>}
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-medium text-gray-700 dark:text-gray-300">{item.quantity} {t(`units.${item.unit}`, item.unit)}</span>
              {item.price_per_unit != null && (
                <span className="text-emerald-600 dark:text-emerald-400">
                  {item.price_per_unit.toFixed(2)} {item.price_currency}/{t(`units.${item.unit}`, item.unit)}
                </span>
              )}
              {item.expiry_date && (
                <span className={expired ? 'text-red-500' : expiring ? 'text-amber-500' : ''}>
                  Exp. {new Date(item.expiry_date).toLocaleDateString()}
                </span>
              )}
            </div>
            {item.notes && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">{item.notes}</p>}

            {item.nutrition && !expanded && (
              <button
                onClick={onToggleExpand}
                className="mt-2 flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <span>{item.nutrition.calories} kcal</span>
                <span>{item.nutrition.protein_g}g P</span>
                <span>{item.nutrition.carbohydrates_total_g}g C</span>
                <span>{item.nutrition.fat_total_g}g F</span>
                <span className="text-emerald-500">&darr; {t('kitchen.details')}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-0.5 flex-shrink-0">
            {item.nutrition && expanded && (
              <button
                onClick={onToggleExpand}
                className="p-2.5 text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors text-xs min-w-[40px] min-h-[40px] flex items-center justify-center"
              >
                &#9650;
              </button>
            )}
            <button
              onClick={onReduceToggle}
              className="p-2.5 text-gray-300 dark:text-gray-600 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
              title={t('kitchen.reduceQuantity')}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
              </svg>
            </button>
            <button
              onClick={onEdit}
              className="p-2.5 text-gray-300 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
              title={t('common.edit')}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              onClick={onDelete}
              className="p-2.5 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
              title={t('common.delete')}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {reduceId === item.id && (
        <div className="px-4 pb-3 border-t border-gray-50 dark:border-gray-800 pt-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{t('kitchen.removeAmount')}</label>
            <input
              type="number"
              min="0.01"
              max={item.quantity}
              step="0.01"
              value={reduceAmount}
              onChange={(e) => onReduceAmountChange(parseFloat(e.target.value) || 0)}
              className="w-20 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <span className="text-xs text-gray-400 dark:text-gray-500">{t(`units.${item.unit}`, item.unit)}</span>
            <button
              onClick={onReduceConfirm}
              disabled={reduceAmount <= 0}
              className="px-3 py-1.5 text-xs font-medium bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-500/30 disabled:opacity-50 transition-colors"
            >
              {reduceAmount >= item.quantity ? t('common.delete') : t('kitchen.reduce')}
            </button>
            <button
              onClick={onReduceCancel}
              className="px-2 py-1.5 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      {expanded && item.nutrition && (
        <div className="px-4 pb-4 border-t border-gray-50 dark:border-gray-800 pt-3">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('nutrition.title')}</h4>
              <span className="text-[11px] text-gray-400 dark:text-gray-500">{t('nutrition.per')} {item.nutrition.serving_size_g}g</span>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: t('nutrition.calories'), value: item.nutrition.calories, unit: 'kcal', color: 'text-gray-900 dark:text-white' },
                { label: t('nutrition.protein'), value: item.nutrition.protein_g, unit: 'g', color: 'text-blue-600 dark:text-blue-400' },
                { label: t('nutrition.carbs'), value: item.nutrition.carbohydrates_total_g, unit: 'g', color: 'text-amber-600 dark:text-amber-400' },
                { label: t('nutrition.fat'), value: item.nutrition.fat_total_g, unit: 'g', color: 'text-red-500 dark:text-red-400' },
              ].map(({ label, value, unit, color }) => (
                <div key={label} className="text-center">
                  <p className={`text-lg font-bold ${color}`}>{value.toFixed(0)}</p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">{unit} {label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
