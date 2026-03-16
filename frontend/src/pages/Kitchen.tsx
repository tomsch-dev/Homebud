import { useEffect, useState } from 'react';
import { foodItemsApi, FoodItem, CreateFoodItem } from '../api/foodItems';
import FoodItemModal from '../components/FoodItemModal';
import NutritionCard from '../components/NutritionCard';
import { useToast } from '../components/Toast';

const CATEGORY_COLORS: Record<string, string> = {
  dairy: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
  meat: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
  seafood: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300',
  vegetables: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300',
  fruits: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300',
  grains: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300',
  beverages: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300',
  condiments: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300',
  snacks: 'bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300',
  frozen: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300',
  other: 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300',
};

export default function Kitchen() {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<FoodItem | undefined>();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
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

  const handleDelete = async (id: string) => {
    const confirmed = await toast.confirm('Delete this food item?');
    if (!confirmed) return;
    await foodItemsApi.delete(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success('Item deleted');
  };

  const filtered = items.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCategory || item.category === filterCategory;
    return matchSearch && matchCat;
  });

  const isExpired = (item: FoodItem) =>
    item.expiry_date ? new Date(item.expiry_date) < new Date() : false;

  const isExpiringSoon = (item: FoodItem) => {
    if (!item.expiry_date) return false;
    const days = Math.ceil((new Date(item.expiry_date).getTime() - Date.now()) / 86400000);
    return days <= 3 && days >= 0;
  };

  const categories = [...new Set(items.map((i) => i.category).filter(Boolean))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Kitchen</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
            {items.length} item{items.length !== 1 ? 's' : ''} tracked
            {items.filter(isExpired).length > 0 && (
              <span className="text-red-500 ml-2">
                {items.filter(isExpired).length} expired
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => { setEditItem(undefined); setShowModal(true); }}
          className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-sm font-semibold shadow-sm"
        >
          + Add Item
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-48 relative">
          <input
            type="text"
            placeholder="Search your kitchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-gray-700 focus:border-transparent transition-colors"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-gray-700 transition-colors"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c!.charAt(0).toUpperCase() + c!.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 7V5a1 1 0 011-1h14a1 1 0 011 1v2M4 7l1 12a2 2 0 002 2h10a2 2 0 002-2l1-12" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            {search || filterCategory ? 'No items match your search' : 'Your kitchen is empty'}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            {search || filterCategory ? 'Try a different search term' : 'Add your first food item to get started'}
          </p>
          {!search && !filterCategory && (
            <button
              onClick={() => { setEditItem(undefined); setShowModal(true); }}
              className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-sm font-medium transition-colors"
            >
              + Add Item
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((item) => {
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
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{item.name}</h3>
                        {item.category && (
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[item.category] || CATEGORY_COLORS.other}`}>
                            {item.category}
                          </span>
                        )}
                        {expired && <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 font-semibold">Expired</span>}
                        {expiring && !expired && <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold">Expiring soon</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-medium text-gray-700 dark:text-gray-300">{item.quantity} {item.unit}</span>
                        {item.price_per_unit != null && (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            {item.price_per_unit.toFixed(2)} {item.price_currency}/{item.unit}
                          </span>
                        )}
                        {item.expiry_date && (
                          <span className={expired ? 'text-red-500' : expiring ? 'text-amber-500' : ''}>
                            Exp. {new Date(item.expiry_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {item.notes && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">{item.notes}</p>}

                      {/* Inline nutrition summary */}
                      {item.nutrition && !expanded && (
                        <button
                          onClick={() => setExpandedId(item.id)}
                          className="mt-2 flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                          <span>{item.nutrition.calories} kcal</span>
                          <span>{item.nutrition.protein_g}g P</span>
                          <span>{item.nutrition.carbohydrates_total_g}g C</span>
                          <span>{item.nutrition.fat_total_g}g F</span>
                          <span className="text-emerald-500">&darr; details</span>
                        </button>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {item.nutrition && expanded && (
                        <button
                          onClick={() => setExpandedId(null)}
                          className="p-2 text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors text-xs"
                          title="Hide nutrition"
                        >
                          &#9650;
                        </button>
                      )}
                      <button
                        onClick={() => { setEditItem(item); setShowModal(true); }}
                        className="p-2 text-gray-300 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded nutrition */}
                {expanded && item.nutrition && (
                  <div className="px-4 pb-4 border-t border-gray-50 dark:border-gray-800 pt-3">
                    <NutritionCard nutrition={item.nutrition} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <FoodItemModal
          item={editItem}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
