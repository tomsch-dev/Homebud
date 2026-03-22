import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { groceryApi, GroceryTrip, CreateGroceryTrip, CreateGroceryTripItem } from '../../api/grocery';
import { foodItemsApi, FoodItem, CreateFoodItem } from '../../api/foodItems';
import { receiptScanApi, ReceiptScanResult } from '../../api/receiptScan';
import { useToast } from '../../components/Toast';
import { useUser } from '../../hooks/useUser';
import { fmtCurrency, fmtDate } from '../../utils/currency';

const UNITS = ['g', 'kg', 'ml', 'l', 'pieces', 'tbsp', 'tsp', 'cup', 'oz', 'lb'];

const UNIT_ALIASES: Record<string, string> = {
  'stück': 'pieces', 'stueck': 'pieces', 'stk': 'pieces', 'pcs': 'pieces',
  'el': 'tbsp', 'tl': 'tsp', 'tasse': 'cup',
};
const normalizeUnit = (u: string): string => {
  const lower = u.toLowerCase().trim();
  return UNIT_ALIASES[lower] || (UNITS.includes(lower) ? lower : UNITS.includes(u) ? u : 'pieces');
};

interface Props {
  userCurrency: string;
  inputCls: string;
  inputClsSm: string;
}

export default function GroceryTab({ userCurrency, inputCls, inputClsSm }: Props) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const { isPremium } = useUser();

  const [trips, setTrips] = useState<GroceryTrip[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({ store_name: '', trip_date: '', notes: '', currency: userCurrency });
  const [items, setItems] = useState<CreateGroceryTripItem[]>([
    { name: '', quantity: 1, unit: 'pieces', price_per_unit: 0, discount: 0, currency: userCurrency },
  ]);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [scanPreview, setScanPreview] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ReceiptScanResult | null>(null);

  const load = () => {
    Promise.all([groceryApi.getAll(), foodItemsApi.getAll()])
      .then(([t, f]) => { setTrips(t); setFoodItems(f); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const addItem = () =>
    setItems([...items, { name: '', quantity: 1, unit: 'pieces', price_per_unit: 0, discount: 0, currency: userCurrency }]);

  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));

  const handleFoodItemSelect = (i: number, foodItemId: string) => {
    const fi = foodItems.find((f) => f.id === foodItemId);
    setItems(items.map((it, idx) => idx === i
      ? { ...it, food_item_id: foodItemId || undefined, name: fi ? fi.name : it.name, unit: fi ? fi.unit : it.unit }
      : it
    ));
  };

  const dismissScan = () => { setScanResult(null); setScanPreview(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data: CreateGroceryTrip = { ...form, items };
      await groceryApi.create(data);
      const addToKitchen = await toast.confirm(t('grocery.addToKitchenConfirm'), { confirmLabel: t('grocery.addToKitchen'), confirmColor: 'emerald' });
      if (addToKitchen) {
        for (const item of items) {
          try {
            await foodItemsApi.create({
              name: item.name, quantity: item.quantity, unit: item.unit,
              category: item.category || undefined, price_per_unit: item.price_per_unit, price_currency: form.currency,
            } as CreateFoodItem);
          } catch { /* skip */ }
        }
        toast.success(t('grocery.addedToKitchen'));
      }
      setShowForm(false);
      setForm({ store_name: '', trip_date: '', notes: '', currency: userCurrency });
      setItems([{ name: '', quantity: 1, unit: 'pieces', price_per_unit: 0, discount: 0, currency: userCurrency }]);
      dismissScan();
      load();
    } catch {
      toast.error(t('grocery.failedToSave'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await toast.confirm(t('grocery.deleteConfirm'));
    if (!confirmed) return;
    await groceryApi.delete(id);
    setTrips((prev) => prev.filter((t) => t.id !== id));
    toast.success(t('grocery.deleted'));
  };

  const handleScanFile = async (file: File) => {
    setScanPreview(URL.createObjectURL(file));
    setScanning(true);
    setScanResult(null);
    try {
      const result = await receiptScanApi.scan(file, form.currency, i18n.language);
      setScanResult(result);
      setForm((prev) => ({
        ...prev, store_name: result.store_name || prev.store_name,
        trip_date: result.trip_date || prev.trip_date, currency: result.currency || prev.currency,
      }));
      setItems(
        result.items.map((item) => ({
          name: item.name, quantity: item.quantity, unit: normalizeUnit(item.unit),
          price_per_unit: item.price_per_unit, discount: Math.abs(item.discount || 0),
          currency: result.currency || form.currency,
          category: item.category || undefined,
        }))
      );
      setShowForm(true);
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

  return (
    <>
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleFileChange} capture="environment" />

      {/* Receipt Scan Hero CTA */}
      {!showForm && (
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

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500 dark:text-gray-400 flex-1 min-w-0">{t('grocery.subtitle')}</p>
        <button onClick={() => { setShowForm(!showForm); dismissScan(); }}
          className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-sm font-medium min-h-[44px] whitespace-nowrap flex-shrink-0">
          {showForm ? t('common.cancel') : t('grocery.logTrip')}
        </button>
      </div>

      {/* Scan preview */}
      {scanResult && showForm && (
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
      {showForm && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 sm:p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">{t('grocery.newTrip')}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('grocery.store')} *</label>
                <input type="text" required value={form.store_name}
                  onChange={(e) => setForm({ ...form, store_name: e.target.value })}
                  className={inputCls} placeholder="e.g. REWE" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('grocery.date')} *</label>
                <input type="date" required value={form.trip_date}
                  onChange={(e) => setForm({ ...form, trip_date: e.target.value })}
                  className={inputCls} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('grocery.notes')}</label>
              <input type="text" value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className={inputCls} />
            </div>

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('common.items')} *</label>
                <button type="button" onClick={addItem} className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium py-1">{t('grocery.addItem')}</button>
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
                {items.map((it, i) => (
                  <div key={i} className="grid grid-cols-12 gap-1 items-center">
                    <div className="col-span-2">
                      <select value={it.food_item_id || ''} onChange={(e) => handleFoodItemSelect(i, e.target.value)} className={`w-full ${inputClsSm}`}>
                        <option value="">Custom</option>
                        {foodItems.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                      </select>
                    </div>
                    <div className="col-span-3">
                      <input type="text" required value={it.name} placeholder="Name"
                        onChange={(e) => setItems(items.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))}
                        className={`w-full ${inputClsSm}`} />
                    </div>
                    <div className="col-span-1">
                      <input type="number" min="0" step="0.001" value={it.quantity}
                        onChange={(e) => setItems(items.map((x, idx) => idx === i ? { ...x, quantity: parseFloat(e.target.value) } : x))}
                        className={`w-full ${inputClsSm}`} />
                    </div>
                    <div className="col-span-2">
                      <select value={it.unit} onChange={(e) => setItems(items.map((x, idx) => idx === i ? { ...x, unit: e.target.value } : x))} className={`w-full ${inputClsSm}`}>
                        {UNITS.map((u) => <option key={u} value={u}>{t(`units.${u}`)}</option>)}
                      </select>
                    </div>
                    <div className="col-span-1">
                      <input type="number" min="0" step="0.01" value={it.price_per_unit}
                        onChange={(e) => setItems(items.map((x, idx) => idx === i ? { ...x, price_per_unit: parseFloat(e.target.value) } : x))}
                        className={`w-full ${inputClsSm}`} placeholder="0.00" />
                    </div>
                    <div className="col-span-1">
                      <input type="number" min="0" step="0.01" value={it.discount || 0}
                        onChange={(e) => setItems(items.map((x, idx) => idx === i ? { ...x, discount: parseFloat(e.target.value) || 0 } : x))}
                        className={`w-full ${inputClsSm} ${(it.discount || 0) > 0 ? 'text-red-500' : ''}`} placeholder="0" />
                    </div>
                    <div className="col-span-1">
                      <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                        {fmtCurrency(it.quantity * it.price_per_unit - (it.discount || 0), form.currency)}
                      </span>
                    </div>
                    <div className="col-span-1 flex justify-center">
                      {items.length > 1 && (
                        <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 dark:hover:text-red-400 text-sm p-1">&times;</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile cards */}
              <div className="sm:hidden space-y-3">
                {items.map((it, i) => (
                  <div key={i} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 space-y-2 relative">
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(i)} className="absolute top-2 right-2 text-red-400 hover:text-red-600 dark:hover:text-red-400 text-lg p-1 leading-none">&times;</button>
                    )}
                    <select value={it.food_item_id || ''} onChange={(e) => handleFoodItemSelect(i, e.target.value)} className={inputCls}>
                      <option value="">{t('grocery.fromKitchen')}...</option>
                      {foodItems.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                    <input type="text" required value={it.name} placeholder={t('grocery.name')}
                      onChange={(e) => setItems(items.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))}
                      className={inputCls} />
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] text-gray-400 dark:text-gray-500 mb-0.5">{t('grocery.qty')}</label>
                        <input type="number" min="0" step="0.001" value={it.quantity}
                          onChange={(e) => setItems(items.map((x, idx) => idx === i ? { ...x, quantity: parseFloat(e.target.value) } : x))}
                          className={inputCls} />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 dark:text-gray-500 mb-0.5">{t('foodModal.unit')}</label>
                        <select value={it.unit} onChange={(e) => setItems(items.map((x, idx) => idx === i ? { ...x, unit: e.target.value } : x))} className={inputCls}>
                          {UNITS.map((u) => <option key={u} value={u}>{t(`units.${u}`)}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 dark:text-gray-500 mb-0.5">{t('grocery.price')}</label>
                        <input type="number" min="0" step="0.01" value={it.price_per_unit}
                          onChange={(e) => setItems(items.map((x, idx) => idx === i ? { ...x, price_per_unit: parseFloat(e.target.value) } : x))}
                          className={inputCls} placeholder="0.00" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <label className="block text-[10px] text-gray-400 dark:text-gray-500 mb-0.5">{t('grocery.discount')}</label>
                        <input type="number" min="0" step="0.01" value={it.discount || 0}
                          onChange={(e) => setItems(items.map((x, idx) => idx === i ? { ...x, discount: parseFloat(e.target.value) || 0 } : x))}
                          className={`${inputCls} ${(it.discount || 0) > 0 ? 'text-red-500' : ''}`} placeholder="0" />
                      </div>
                      <div className="text-right pt-3">
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 block">{t('grocery.net')}</span>
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                          {fmtCurrency(it.quantity * it.price_per_unit - (it.discount || 0), form.currency)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-right">
                {t('grocery.estimatedTotal')}: <span className="font-semibold text-gray-700 dark:text-gray-300">
                  {fmtCurrency(items.reduce((s, it) => s + it.quantity * it.price_per_unit - (it.discount || 0), 0), form.currency)}
                </span>
              </p>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors min-h-[48px]">
                {t('common.cancel')}
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 px-4 py-3 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition-colors min-h-[48px]">
                {saving ? t('common.saving') : t('grocery.saveTrip')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Trip list */}
      {loading ? (
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
                    <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">{fmtDate(trip.trip_date, i18n.language)}</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{trip.items.length} {t('common.items')}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400 text-base sm:text-lg">
                    {fmtCurrency(trip.total_amount, trip.currency)}
                  </span>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(trip.id); }}
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
                          <td className="py-1.5 text-right text-gray-500 dark:text-gray-400">{fmtCurrency(item.price_per_unit, item.currency)}</td>
                          <td className="py-1.5 text-right text-red-500">{item.discount > 0 ? `-${fmtCurrency(item.discount, item.currency)}` : ''}</td>
                          <td className="py-1.5 text-right font-medium text-gray-800 dark:text-gray-200">{fmtCurrency(item.total_price, item.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={4} className="pt-2 text-right font-semibold text-gray-700 dark:text-gray-300">{t('grocery.total')}</td>
                        <td className="pt-2 text-right font-bold text-emerald-700 dark:text-emerald-400">{fmtCurrency(trip.total_amount, trip.currency)}</td>
                      </tr>
                    </tfoot>
                  </table>
                  <div className="sm:hidden space-y-1.5">
                    {trip.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/50 last:border-0">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{item.name}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {item.quantity} {t(`units.${item.unit}`, item.unit)} &times; {fmtCurrency(item.price_per_unit, item.currency)}
                            {item.discount > 0 && <span className="text-red-500 ml-1">-{fmtCurrency(item.discount, item.currency)}</span>}
                          </p>
                        </div>
                        <span className="font-medium text-sm text-gray-800 dark:text-gray-200 ml-3 flex-shrink-0">{item.total_price.toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-2">
                      <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">{t('grocery.total')}</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">{fmtCurrency(trip.total_amount, trip.currency)}</span>
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
  );
}
