import { useState, useEffect, useRef } from 'react';
import { CreateFoodItem, FoodItem } from '../api/foodItems';
import { foodDataApi, FoodDataItem } from '../api/foodData';

const UNITS = ['g', 'kg', 'ml', 'l', 'pieces', 'tbsp', 'tsp', 'cup', 'oz', 'lb'];
const CATEGORIES = ['dairy', 'meat', 'vegetables', 'fruits', 'grains', 'beverages', 'condiments', 'snacks', 'frozen', 'other'];
const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF'];

export default function FoodItemModal({
  item,
  onSave,
  onClose,
}: {
  item?: FoodItem;
  onSave: (data: CreateFoodItem) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<CreateFoodItem>({
    name: item?.name ?? '',
    quantity: item?.quantity ?? 1,
    unit: item?.unit ?? 'g',
    category: item?.category ?? '',
    expiry_date: item?.expiry_date ?? undefined,
    notes: item?.notes ?? '',
    price_per_unit: item?.price_per_unit ?? undefined,
    price_currency: item?.price_currency ?? 'EUR',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [suggestions, setSuggestions] = useState<FoodDataItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedFoodData, setSelectedFoodData] = useState<FoodDataItem | null>(null);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleNameChange = (value: string) => {
    setForm({ ...form, name: value });
    setSelectedFoodData(null);
    setHighlightIdx(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const results = await foodDataApi.search(value, 8);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch {
        setSuggestions([]);
      }
    }, 300);
  };

  const handleSelectSuggestion = (fd: FoodDataItem) => {
    setForm({
      ...form,
      name: fd.display_name,
      category: fd.category && CATEGORIES.includes(fd.category) ? fd.category : form.category,
      food_data_id: fd.api_food_id,
    });
    setSelectedFoodData(fd);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && highlightIdx >= 0) {
      e.preventDefault();
      handleSelectSuggestion(suggestions[highlightIdx]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave(form);
      onClose();
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{item ? 'Edit Item' : 'Add to Kitchen'}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          {/* Name with autocomplete */}
          <div ref={wrapperRef} className="relative">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Food Item *</label>
            <input
              type="text" required
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              className={inputClass}
              placeholder="Start typing to search..."
              autoComplete="off"
              autoFocus={!item}
            />
            {showSuggestions && (
              <ul className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-56 overflow-y-auto">
                {suggestions.map((fd, idx) => (
                  <li
                    key={fd.api_food_id}
                    onClick={() => handleSelectSuggestion(fd)}
                    className={`px-3 py-2.5 cursor-pointer border-b border-gray-50 last:border-0 transition-colors ${
                      idx === highlightIdx ? 'bg-primary-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 truncate">{fd.display_name}</span>
                      {fd.is_new && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded font-semibold flex-shrink-0 ml-2">NEW</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {fd.category && <span className="text-[11px] text-gray-400">{fd.category}</span>}
                      {fd.calories_kcal != null && (
                        <span className="text-[11px] text-gray-400">{fd.calories_kcal} kcal</span>
                      )}
                      {fd.protein_g != null && (
                        <span className="text-[11px] text-gray-400">{fd.protein_g}g P</span>
                      )}
                      {fd.carbs_g != null && (
                        <span className="text-[11px] text-gray-400">{fd.carbs_g}g C</span>
                      )}
                      {fd.fat_g != null && (
                        <span className="text-[11px] text-gray-400">{fd.fat_g}g F</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Nutrition preview */}
          {selectedFoodData && selectedFoodData.calories_kcal != null && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3">
              <p className="text-[11px] font-semibold text-green-600 mb-2">Nutrition auto-attached (per 100g)</p>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { val: selectedFoodData.calories_kcal, label: 'kcal', color: 'text-gray-900' },
                  { val: selectedFoodData.protein_g ?? 0, label: 'protein', color: 'text-blue-700' },
                  { val: selectedFoodData.carbs_g ?? 0, label: 'carbs', color: 'text-amber-700' },
                  { val: selectedFoodData.fat_g ?? 0, label: 'fat', color: 'text-red-600' },
                ].map(({ val, label, color }) => (
                  <div key={label} className="text-center">
                    <p className={`text-sm font-bold ${color}`}>{val}</p>
                    <p className="text-[10px] text-green-600">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quantity + Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Quantity *</label>
              <input
                type="number" required min="0" step="0.01"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: parseFloat(e.target.value) })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Unit *</label>
              <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className={inputClass}>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Category</label>
            <select value={form.category ?? ''} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass}>
              <option value="">Select category</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>

          {/* Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Price / unit</label>
              <input
                type="number" min="0" step="0.01"
                value={form.price_per_unit ?? ''}
                onChange={(e) => setForm({ ...form, price_per_unit: e.target.value ? parseFloat(e.target.value) : undefined })}
                className={inputClass}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Currency</label>
              <select value={form.price_currency} onChange={(e) => setForm({ ...form, price_currency: e.target.value })} className={inputClass}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Expiry */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Expiry Date</label>
            <input
              type="date"
              value={form.expiry_date ?? ''}
              onChange={(e) => setForm({ ...form, expiry_date: e.target.value || undefined })}
              className={inputClass}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Notes</label>
            <textarea
              value={form.notes ?? ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className={inputClass}
              rows={2}
              placeholder="Optional notes..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 rounded-xl transition-colors shadow-sm">
              {saving ? 'Saving...' : item ? 'Update' : 'Add to Kitchen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
