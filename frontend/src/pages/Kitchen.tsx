import { useEffect, useState } from 'react';
import { foodItemsApi, FoodItem, CreateFoodItem } from '../api/foodItems';
import FoodItemModal from '../components/FoodItemModal';
import NutritionCard from '../components/NutritionCard';

const CATEGORY_COLORS: Record<string, string> = {
  dairy: 'bg-blue-100 text-blue-700',
  meat: 'bg-red-100 text-red-700',
  vegetables: 'bg-green-100 text-green-700',
  fruits: 'bg-yellow-100 text-yellow-700',
  grains: 'bg-orange-100 text-orange-700',
  beverages: 'bg-cyan-100 text-cyan-700',
  condiments: 'bg-purple-100 text-purple-700',
  snacks: 'bg-pink-100 text-pink-700',
  frozen: 'bg-indigo-100 text-indigo-700',
  other: 'bg-gray-100 text-gray-700',
};

export default function Kitchen() {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<FoodItem | undefined>();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [fetchingNutrition, setFetchingNutrition] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

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
    if (!confirm('Delete this food item?')) return;
    await foodItemsApi.delete(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleFetchNutrition = async (item: FoodItem) => {
    setFetchingNutrition(item.id);
    try {
      await foodItemsApi.fetchNutrition(item.id);
      load();
      setExpandedId(item.id);
    } catch {
      alert('Failed to fetch nutrition data.');
    } finally {
      setFetchingNutrition(null);
    }
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Kitchen</h1>
          <p className="text-gray-500 mt-1">{items.length} items tracked</p>
        </div>
        <button
          onClick={() => { setEditItem(undefined); setShowModal(true); }}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
        >
          + Add Item
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All categories</option>
          {Object.keys(CATEGORY_COLORS).map((c) => (
            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🥦</p>
          <p className="text-lg font-medium">Your kitchen is empty</p>
          <p className="text-sm mt-1">Add your first food item to get started</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`bg-white border rounded-xl overflow-hidden transition-shadow hover:shadow-md ${
                isExpired(item) ? 'border-red-300' : isExpiringSoon(item) ? 'border-yellow-300' : 'border-gray-200'
              }`}
            >
              <div className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    {item.category && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[item.category] || CATEGORY_COLORS.other}`}>
                        {item.category}
                      </span>
                    )}
                    {isExpired(item) && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Expired</span>}
                    {isExpiringSoon(item) && !isExpired(item) && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">Expiring soon</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {item.quantity} {item.unit}
                    {item.price_per_unit != null && (
                      <span className="ml-2 text-primary-600 font-medium">
                        {item.price_per_unit.toFixed(2)} {item.price_currency}/{item.unit}
                      </span>
                    )}
                    {item.expiry_date && ` • Expires ${new Date(item.expiry_date).toLocaleDateString()}`}
                  </p>
                  {item.notes && <p className="text-xs text-gray-400 mt-1">{item.notes}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleFetchNutrition(item)}
                    disabled={fetchingNutrition === item.id}
                    title="Fetch nutrition data"
                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors text-sm"
                  >
                    {fetchingNutrition === item.id ? '...' : item.nutrition ? '🔄' : '📊'}
                  </button>
                  {item.nutrition && (
                    <button
                      onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm"
                      title="Toggle nutrition"
                    >
                      {expandedId === item.id ? '▲' : '▼'}
                    </button>
                  )}
                  <button
                    onClick={() => { setEditItem(item); setShowModal(true); }}
                    className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              {expandedId === item.id && item.nutrition && (
                <div className="px-4 pb-4">
                  <NutritionCard nutrition={item.nutrition} />
                </div>
              )}
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
    </div>
  );
}
