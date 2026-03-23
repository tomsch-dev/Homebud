import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CreateFoodItem, FoodItem } from '../api/foodItems';

const UNITS = ['g', 'kg', 'ml', 'l', 'pieces', 'tbsp', 'tsp', 'cup', 'oz', 'lb'];
const CATEGORIES = ['dairy', 'meat', 'vegetables', 'fruits', 'grains', 'beverages', 'condiments', 'snacks', 'frozen', 'other'];
const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF'];

export default function FoodItemModal({
  item,
  onSave,
  onClose,
  prefill,
}: {
  item?: FoodItem;
  onSave: (data: CreateFoodItem) => Promise<void>;
  onClose: () => void;
  prefill?: Partial<CreateFoodItem>;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState<CreateFoodItem>({
    name: item?.name ?? prefill?.name ?? '',
    quantity: item?.quantity ?? prefill?.quantity ?? 1,
    unit: item?.unit ?? prefill?.unit ?? 'g',
    category: item?.category ?? prefill?.category ?? '',
    expiry_date: item?.expiry_date ?? prefill?.expiry_date ?? undefined,
    notes: item?.notes ?? prefill?.notes ?? '',
    price_per_unit: item?.price_per_unit ?? prefill?.price_per_unit ?? undefined,
    price_currency: item?.price_currency ?? prefill?.price_currency ?? 'EUR',
    calories_kcal: prefill?.calories_kcal ?? item?.nutrition?.calories ?? undefined,
    protein_g: prefill?.protein_g ?? item?.nutrition?.protein_g ?? undefined,
    carbs_g: prefill?.carbs_g ?? item?.nutrition?.carbohydrates_total_g ?? undefined,
    fat_g: prefill?.fat_g ?? item?.nutrition?.fat_total_g ?? undefined,
  });
  const [itemCount, setItemCount] = useState(1);
  const isBarcodeScan = !!prefill && !item;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showNutrition, setShowNutrition] = useState(
    !!(form.calories_kcal || form.protein_g || form.carbs_g || form.fat_g)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const submitData = { ...form };
      // Multiply quantity by item count (e.g. 6 cans of 330ml = 1980ml)
      if (itemCount > 1) {
        submitData.quantity = form.quantity * itemCount;
      }
      // If nutrition section is visible, send explicit values so backend can update/clear
      if (showNutrition) {
        submitData.calories_kcal = form.calories_kcal ?? 0;
        submitData.protein_g = form.protein_g ?? 0;
        submitData.carbs_g = form.carbs_g ?? 0;
        submitData.fat_g = form.fat_g ?? 0;
      }
      await onSave(submitData);
      onClose();
    } catch {
      setError(t('foodModal.failedToSave'));
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-base sm:text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors min-h-[44px]';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 sm:p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[92vh] sm:max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10 rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{item ? t('foodModal.editTitle') : t('foodModal.addTitle')}</h2>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {error && <p className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>}

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">{t('foodModal.foodItem')} *</label>
            <input
              type="text" required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
              placeholder={t('foodModal.searchPlaceholder')}
              autoFocus={!item}
            />
          </div>

          {/* Item count (for barcode scans — e.g. "I bought 6 of these") */}
          {isBarcodeScan && (
            <div className="bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-3">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">{t('foodModal.howMany')}</label>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setItemCount(Math.max(1, itemCount - 1))}
                  className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-lg font-bold transition-colors">−</button>
                <input type="number" min="1" step="1" value={itemCount}
                  onChange={(e) => setItemCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 text-center border border-gray-200 dark:border-gray-700 rounded-lg py-2 text-base font-semibold bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                <button type="button" onClick={() => setItemCount(itemCount + 1)}
                  className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-lg font-bold transition-colors">+</button>
                <span className="text-sm text-gray-500 dark:text-gray-400 flex-1">
                  × {form.quantity} {t(`units.${form.unit}`)} = <span className="font-semibold text-gray-700 dark:text-gray-300">{Math.round(form.quantity * itemCount * 100) / 100} {t(`units.${form.unit}`)}</span>
                </span>
              </div>
            </div>
          )}

          {/* Quantity + Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">{t('foodModal.quantity')} *</label>
              <input
                type="number" required min="0" step="0.01"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: parseFloat(e.target.value) })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">{t('foodModal.unit')} *</label>
              <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className={inputClass}>
                {UNITS.map((u) => <option key={u} value={u}>{t(`units.${u}`)}</option>)}
              </select>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">{t('foodModal.category')}</label>
            <select value={form.category ?? ''} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass}>
              <option value="">{t('foodModal.selectCategory')}</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{t(`categories.${c}`)}</option>)}
            </select>
          </div>

          {/* Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">{t('foodModal.pricePerUnit')}</label>
              <input
                type="number" min="0" step="0.01"
                value={form.price_per_unit ?? ''}
                onChange={(e) => setForm({ ...form, price_per_unit: e.target.value ? parseFloat(e.target.value) : undefined })}
                className={inputClass}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">{t('foodModal.currency')}</label>
              <select value={form.price_currency} onChange={(e) => setForm({ ...form, price_currency: e.target.value })} className={inputClass}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Expiry */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">{t('foodModal.expiryDate')}</label>
            <input
              type="date"
              value={form.expiry_date ?? ''}
              onChange={(e) => setForm({ ...form, expiry_date: e.target.value || undefined })}
              className={inputClass}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">{t('foodModal.notes')}</label>
            <textarea
              value={form.notes ?? ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className={inputClass}
              rows={2}
              placeholder={t('foodModal.notesPlaceholder')}
            />
          </div>

          {/* Nutrition toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowNutrition(!showNutrition)}
              className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
            >
              <svg className={`w-4 h-4 transition-transform ${showNutrition ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              {t('foodModal.nutritionData')}
            </button>

            {showNutrition && (
              <div className="mt-3 bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-4 space-y-3">
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">{t('foodModal.per100g')}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('nutrition.calories')} (kcal)</label>
                    <input
                      type="number" min="0" step="0.1"
                      value={form.calories_kcal ?? ''}
                      onChange={(e) => setForm({ ...form, calories_kcal: e.target.value ? parseFloat(e.target.value) : undefined })}
                      className={inputClass}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('nutrition.protein')} (g)</label>
                    <input
                      type="number" min="0" step="0.1"
                      value={form.protein_g ?? ''}
                      onChange={(e) => setForm({ ...form, protein_g: e.target.value ? parseFloat(e.target.value) : undefined })}
                      className={inputClass}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('nutrition.carbs')} (g)</label>
                    <input
                      type="number" min="0" step="0.1"
                      value={form.carbs_g ?? ''}
                      onChange={(e) => setForm({ ...form, carbs_g: e.target.value ? parseFloat(e.target.value) : undefined })}
                      className={inputClass}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('nutrition.fat')} (g)</label>
                    <input
                      type="number" min="0" step="0.1"
                      value={form.fat_g ?? ''}
                      onChange={(e) => setForm({ ...form, fat_g: e.target.value ? parseFloat(e.target.value) : undefined })}
                      className={inputClass}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors min-h-[48px]">
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition-colors shadow-sm min-h-[48px]">
              {saving ? t('common.saving') : item ? t('foodModal.update') : t('foodModal.addToKitchen')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
