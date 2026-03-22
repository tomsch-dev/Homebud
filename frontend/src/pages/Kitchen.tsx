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

const CATEGORY_CHIP_ACTIVE: Record<string, string> = {
  dairy: 'bg-blue-100 dark:bg-blue-500/20 ring-blue-300 dark:ring-blue-500/40',
  meat: 'bg-red-100 dark:bg-red-500/20 ring-red-300 dark:ring-red-500/40',
  seafood: 'bg-cyan-100 dark:bg-cyan-500/20 ring-cyan-300 dark:ring-cyan-500/40',
  vegetables: 'bg-green-100 dark:bg-green-500/20 ring-green-300 dark:ring-green-500/40',
  fruits: 'bg-yellow-100 dark:bg-yellow-500/20 ring-yellow-300 dark:ring-yellow-500/40',
  grains: 'bg-orange-100 dark:bg-orange-500/20 ring-orange-300 dark:ring-orange-500/40',
  beverages: 'bg-sky-100 dark:bg-sky-500/20 ring-sky-300 dark:ring-sky-500/40',
  condiments: 'bg-purple-100 dark:bg-purple-500/20 ring-purple-300 dark:ring-purple-500/40',
  snacks: 'bg-pink-100 dark:bg-pink-500/20 ring-pink-300 dark:ring-pink-500/40',
  frozen: 'bg-indigo-100 dark:bg-indigo-500/20 ring-indigo-300 dark:ring-indigo-500/40',
  other: 'bg-gray-100 dark:bg-gray-500/20 ring-gray-300 dark:ring-gray-500/40',
};

const CATEGORY_ORDER = ['dairy', 'meat', 'seafood', 'vegetables', 'fruits', 'grains', 'beverages', 'condiments', 'snacks', 'frozen', 'other'];

export default function Kitchen() {
  const { t } = useTranslation();
  const [items, setItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<FoodItem | undefined>();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
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
  const getCategory = (item: FoodItem) => item.category || 'other';

  // Group items by category
  const categoryMap = items.reduce<Record<string, FoodItem[]>>((acc, item) => {
    const cat = getCategory(item);
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  // Categories that have items, in fixed order
  const populatedCategories = CATEGORY_ORDER.filter((c) => categoryMap[c]?.length > 0);

  // Filtered items based on search + selected category chip
  const filtered = items.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCategory || getCategory(item) === filterCategory;
    return matchSearch && matchCat;
  });

  // Group filtered items by category for the grouped list view
  const groupedFiltered = CATEGORY_ORDER.reduce<{ cat: string; items: FoodItem[] }[]>((acc, cat) => {
    const catItems = filtered.filter((item) => getCategory(item) === cat);
    if (catItems.length > 0) acc.push({ cat, items: catItems });
    return acc;
  }, []);

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

      {/* Search */}
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

      {/* Category filter chips — horizontal scroll */}
      {items.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {/* All chip */}
          <button
            onClick={() => setFilterCategory(null)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all min-h-[40px] ${
              !filterCategory
                ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-300 dark:ring-emerald-500/40'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <span className="text-base">🏠</span>
            <span>{t('kitchen.allCategories')}</span>
            <span className="text-xs opacity-60">{items.length}</span>
          </button>

          {populatedCategories.map((cat) => {
            const count = categoryMap[cat].length;
            const active = filterCategory === cat;
            const expiringCount = (categoryMap[cat] || []).filter((i) => isExpiringSoon(i) || isExpired(i)).length;

            return (
              <button
                key={cat}
                onClick={() => setFilterCategory(active ? null : cat)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all min-h-[40px] relative ${
                  active
                    ? `${CATEGORY_CHIP_ACTIVE[cat] || CATEGORY_CHIP_ACTIVE.other} ring-2`
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {expiringCount > 0 && !active && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {expiringCount}
                  </span>
                )}
                <span className="text-base">{CATEGORY_EMOJI[cat] || CATEGORY_EMOJI.other}</span>
                <span className="hidden sm:inline">{catLabel(cat)}</span>
                <span className="text-xs opacity-60">{count}</span>
              </button>
            );
          })}
        </div>
      )}

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
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">{t('kitchen.noMatch')}</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{t('kitchen.noMatchHint')}</p>
        </div>
      ) : (
        /* Grouped item list */
        <div className="space-y-6">
          {groupedFiltered.map(({ cat, items: catItems }) => (
            <div key={cat}>
              {/* Section header — only show when viewing "All" (not filtering by a single category) */}
              {!filterCategory && (
                <div className="flex items-center gap-2 mb-2 sticky top-0 bg-gray-50/95 dark:bg-gray-950/95 backdrop-blur-sm py-2 -mx-1 px-1 z-10">
                  <span className="text-lg">{CATEGORY_EMOJI[cat] || CATEGORY_EMOJI.other}</span>
                  <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">{catLabel(cat)}</h2>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{catItems.length}</span>
                  <div className="flex-1 border-t border-gray-200 dark:border-gray-800 ml-2" />
                </div>
              )}

              <div className="grid gap-2">
                {catItems.map((item) => {
                  const expired = isExpired(item);
                  const expiring = isExpiringSoon(item);
                  const expanded = expandedId === item.id;

                  return (
                    <div
                      key={item.id}
                      className={`bg-white dark:bg-gray-900 border rounded-xl overflow-hidden transition-all hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20 ${
                        expired ? 'border-red-200 dark:border-red-500/30 bg-red-50/30 dark:bg-red-500/5' : expiring ? 'border-amber-200 dark:border-amber-500/30' : 'border-gray-100 dark:border-gray-800'
                      }`}
                    >
                      <div className="p-3 sm:p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-gray-900 dark:text-white">{item.name}</h3>
                              {expired && <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 font-semibold">{t('kitchen.expiredBadge')}</span>}
                              {expiring && !expired && <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold">{t('kitchen.expiringSoonBadge')}</span>}
                              {/* Show category badge only when searching or viewing "All" */}
                              {(search || !filterCategory) && item.category && (
                                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${CATEGORY_BADGE[item.category] || CATEGORY_BADGE.other}`}>
                                  {catLabel(item.category)}
                                </span>
                              )}
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
                                onClick={() => setExpandedId(item.id)}
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
                                onClick={() => setExpandedId(null)}
                                className="p-2.5 text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors text-xs min-w-[40px] min-h-[40px] flex items-center justify-center"
                              >
                                &#9650;
                              </button>
                            )}
                            <button
                              onClick={() => { setReduceId(reduceId === item.id ? null : item.id); setReduceAmount(1); }}
                              className="p-2.5 text-gray-300 dark:text-gray-600 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
                              title={t('kitchen.reduceQuantity')}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
                              </svg>
                            </button>
                            <button
                              onClick={() => { setEditItem(item); setShowModal(true); }}
                              className="p-2.5 text-gray-300 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
                              title={t('common.edit')}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setDeleteTarget(item)}
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
                        <div className="px-3 sm:px-4 pb-3 border-t border-gray-50 dark:border-gray-800 pt-3">
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{t('kitchen.removeAmount')}</label>
                            <input
                              type="number"
                              min="0.01"
                              max={item.quantity}
                              step="0.01"
                              value={reduceAmount}
                              onChange={(e) => setReduceAmount(parseFloat(e.target.value) || 0)}
                              className="w-20 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <span className="text-xs text-gray-400 dark:text-gray-500">{t(`units.${item.unit}`, item.unit)}</span>
                            <button
                              onClick={() => handleReduce(item)}
                              disabled={reduceAmount <= 0}
                              className="px-3 py-1.5 text-xs font-medium bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-500/30 disabled:opacity-50 transition-colors"
                            >
                              {reduceAmount >= item.quantity ? t('common.delete') : t('kitchen.reduce')}
                            </button>
                            <button
                              onClick={() => setReduceId(null)}
                              className="px-2 py-1.5 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                              {t('common.cancel')}
                            </button>
                          </div>
                        </div>
                      )}

                      {expanded && item.nutrition && (
                        <div className="px-3 sm:px-4 pb-4 border-t border-gray-50 dark:border-gray-800 pt-3">
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
                })}
              </div>
            </div>
          ))}
        </div>
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
