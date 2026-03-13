import { useEffect, useState } from 'react';
import { groceryApi, GroceryTrip, CreateGroceryTrip, CreateGroceryTripItem } from '../api/grocery';
import { foodItemsApi, FoodItem } from '../api/foodItems';

const UNITS = ['g', 'kg', 'ml', 'l', 'pieces', 'tbsp', 'tsp', 'cup', 'oz', 'lb'];
const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF'];

export default function GroceryTrips() {
  const [trips, setTrips] = useState<GroceryTrip[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [form, setForm] = useState({ store_name: '', trip_date: '', notes: '', currency: 'EUR' });
  const [items, setItems] = useState<CreateGroceryTripItem[]>([
    { name: '', quantity: 1, unit: 'pieces', price_per_unit: 0, currency: 'EUR' },
  ]);
  const [saving, setSaving] = useState(false);

  const load = () => {
    Promise.all([groceryApi.getAll(), foodItemsApi.getAll()])
      .then(([t, f]) => { setTrips(t); setFoodItems(f); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const addItem = () =>
    setItems([...items, { name: '', quantity: 1, unit: 'pieces', price_per_unit: 0, currency: form.currency }]);

  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));

  const handleFoodItemSelect = (i: number, foodItemId: string) => {
    const fi = foodItems.find((f) => f.id === foodItemId);
    setItems(items.map((it, idx) => idx === i
      ? { ...it, food_item_id: foodItemId || undefined, name: fi ? fi.name : it.name, unit: fi ? fi.unit : it.unit }
      : it
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data: CreateGroceryTrip = { ...form, items };
      await groceryApi.create(data);
      setShowForm(false);
      setForm({ store_name: '', trip_date: '', notes: '', currency: 'EUR' });
      setItems([{ name: '', quantity: 1, unit: 'pieces', price_per_unit: 0, currency: 'EUR' }]);
      load();
    } catch {
      alert('Failed to save trip.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this trip?')) return;
    await groceryApi.delete(id);
    setTrips((prev) => prev.filter((t) => t.id !== id));
  };

  const inputCls = 'border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Grocery Trips</h1>
          <p className="text-gray-500 mt-1">Track your grocery shopping and spending</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
        >
          {showForm ? 'Cancel' : '+ Log Trip'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="font-semibold text-gray-900 mb-4">New Grocery Trip</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store *</label>
                <input type="text" required value={form.store_name}
                  onChange={(e) => setForm({ ...form, store_name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g. REWE" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input type="date" required value={form.trip_date}
                  onChange={(e) => setForm({ ...form, trip_date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <input type="text" value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Items *</label>
                <button type="button" onClick={addItem} className="text-xs text-primary-600 hover:underline">+ Add item</button>
              </div>
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-1 text-xs text-gray-400 font-medium px-1">
                  <div className="col-span-3">From kitchen</div>
                  <div className="col-span-3">Name</div>
                  <div className="col-span-1">Qty</div>
                  <div className="col-span-2">Unit</div>
                  <div className="col-span-2">Price/unit</div>
                  <div className="col-span-1"></div>
                </div>
                {items.map((it, i) => (
                  <div key={i} className="grid grid-cols-12 gap-1 items-center">
                    <div className="col-span-3">
                      <select value={it.food_item_id || ''} onChange={(e) => handleFoodItemSelect(i, e.target.value)} className={`w-full ${inputCls}`}>
                        <option value="">Custom</option>
                        {foodItems.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                      </select>
                    </div>
                    <div className="col-span-3">
                      <input type="text" required value={it.name} placeholder="Name"
                        onChange={(e) => setItems(items.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))}
                        className={`w-full ${inputCls}`} />
                    </div>
                    <div className="col-span-1">
                      <input type="number" min="0" step="0.01" value={it.quantity}
                        onChange={(e) => setItems(items.map((x, idx) => idx === i ? { ...x, quantity: parseFloat(e.target.value) } : x))}
                        className={`w-full ${inputCls}`} />
                    </div>
                    <div className="col-span-2">
                      <select value={it.unit} onChange={(e) => setItems(items.map((x, idx) => idx === i ? { ...x, unit: e.target.value } : x))} className={`w-full ${inputCls}`}>
                        {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <input type="number" min="0" step="0.01" value={it.price_per_unit}
                        onChange={(e) => setItems(items.map((x, idx) => idx === i ? { ...x, price_per_unit: parseFloat(e.target.value) } : x))}
                        className={`w-full ${inputCls}`} placeholder="0.00" />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      {items.length > 1 && (
                        <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 text-sm">×</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2 text-right">
                Estimated total: <span className="font-semibold text-gray-700">
                  {items.reduce((s, it) => s + it.quantity * it.price_per_unit, 0).toFixed(2)} {form.currency}
                </span>
              </p>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 rounded-lg transition-colors">
                {saving ? 'Saving...' : 'Save Trip'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : trips.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🛒</p>
          <p className="text-lg font-medium">No grocery trips logged yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {trips.map((trip) => (
            <div key={trip.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedId(expandedId === trip.id ? null : trip.id)}>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{trip.store_name}</h3>
                    <span className="text-xs text-gray-400">{new Date(trip.trip_date).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{trip.items.length} items</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-primary-700 text-lg">
                    {trip.total_amount.toFixed(2)} {trip.currency}
                  </span>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(trip.id); }}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm">
                    🗑️
                  </button>
                  <span className="text-gray-400 text-sm">{expandedId === trip.id ? '▲' : '▼'}</span>
                </div>
              </div>
              {expandedId === trip.id && (
                <div className="border-t border-gray-100 px-4 pb-4 pt-3">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-gray-400 border-b">
                        <th className="text-left pb-1">Item</th>
                        <th className="text-right pb-1">Qty</th>
                        <th className="text-right pb-1">Price/unit</th>
                        <th className="text-right pb-1">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trip.items.map((item) => (
                        <tr key={item.id} className="border-b border-gray-50">
                          <td className="py-1.5 text-gray-700">{item.name}</td>
                          <td className="py-1.5 text-right text-gray-500">{item.quantity} {item.unit}</td>
                          <td className="py-1.5 text-right text-gray-500">{item.price_per_unit.toFixed(2)}</td>
                          <td className="py-1.5 text-right font-medium text-gray-800">{item.total_price.toFixed(2)} {item.currency}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={3} className="pt-2 text-right font-semibold text-gray-700">Total</td>
                        <td className="pt-2 text-right font-bold text-primary-700">{trip.total_amount.toFixed(2)} {trip.currency}</td>
                      </tr>
                    </tfoot>
                  </table>
                  {trip.notes && <p className="text-xs text-gray-400 mt-2">{trip.notes}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
