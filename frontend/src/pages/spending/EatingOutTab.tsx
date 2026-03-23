import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { eatingOutApi, EatingOutExpense, CreateEatingOut } from '../../api/spending';
import { receiptScanApi } from '../../api/receiptScan';
import { useToast } from '../../components/Toast';
import { useUser } from '../../hooks/useUser';
import { fmtCurrency, currencySymbol, fmtDate } from '../../utils/currency';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'coffee', 'snack', 'other'];
const MEAL_ICONS: Record<string, string> = {
  breakfast: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z',
  lunch: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  dinner: 'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z',
  coffee: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  snack: 'M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0A1.75 1.75 0 003 15.546',
  other: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
};

interface Props {
  userCurrency: string;
  inputCls: string;
}

export default function EatingOutTab({ userCurrency, inputCls }: Props) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const { isPremium } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);

  const [expenses, setExpenses] = useState<EatingOutExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CreateEatingOut>({
    restaurant_name: '', expense_date: new Date().toISOString().split('T')[0],
    amount: 0, currency: userCurrency, meal_type: 'lunch', notes: '',
  });

  useEffect(() => {
    eatingOutApi.getAll().then(setExpenses).finally(() => setLoading(false));
  }, []);

  const totalThisMonth = expenses
    .filter((e) => {
      const d = new Date(e.expense_date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await eatingOutApi.create(form);
      setShowForm(false);
      setForm({ restaurant_name: '', expense_date: new Date().toISOString().split('T')[0], amount: 0, currency: userCurrency, meal_type: 'lunch', notes: '' });
      eatingOutApi.getAll().then(setExpenses);
    } catch {
      toast.error(t('eatingOut.failedToSave'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await toast.confirm(t('eatingOut.deleteConfirm'));
    if (!confirmed) return;
    await eatingOutApi.delete(id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    toast.success(t('eatingOut.deleted'));
  };

  const handleScanFile = async (file: File) => {
    setScanning(true);
    try {
      const result = await receiptScanApi.scanEatingOut(file, userCurrency, i18n.language);
      setForm((prev) => ({
        ...prev,
        restaurant_name: result.restaurant_name || prev.restaurant_name,
        expense_date: result.expense_date || prev.expense_date,
        amount: result.amount || prev.amount,
        currency: result.currency || prev.currency,
        meal_type: result.meal_type || prev.meal_type,
      }));
      setShowForm(true);
      toast.success(t('eatingOut.scanSuccess'));
    } catch {
      toast.error(t('eatingOut.scanFailed'));
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
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleFileChange} />

      {/* Receipt Scan Hero CTA */}
      {!showForm && (
        isPremium ? (
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 rounded-2xl p-5 sm:p-6 text-white relative overflow-hidden">
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
                <h3 className="text-lg font-bold">{t('eatingOut.scanHeroTitle')}</h3>
                <p className="text-sm text-orange-100 mt-1">{t('eatingOut.scanHeroDesc')}</p>
              </div>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={scanning}
              className="mt-4 w-full py-3.5 bg-white text-orange-700 font-semibold rounded-xl hover:bg-orange-50 disabled:opacity-50 transition-colors text-sm flex items-center justify-center gap-2 min-h-[48px] shadow-lg shadow-orange-900/20"
            >
              {scanning ? (
                <>
                  <div className="w-5 h-5 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
                  {t('grocery.scanning')}
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {t('eatingOut.scanReceipt')}
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl p-5 sm:p-6 border border-gray-200 dark:border-gray-700 relative overflow-hidden">
            <div className="absolute top-2 right-3 px-2 py-0.5 bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 text-[10px] font-bold rounded-full uppercase tracking-wide">{t('premium.locked')}</div>
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-2xl flex items-center justify-center flex-shrink-0">
                <svg className="w-7 h-7 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0 pr-16">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('eatingOut.scanHeroTitle')}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('eatingOut.scanHeroDesc')}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{t('premium.testPhase')}</p>
              </div>
            </div>
          </div>
        )
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('eatingOut.subtitle')}</p>
        <button onClick={() => setShowForm(!showForm)}
          className="px-3 sm:px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-sm font-medium min-h-[44px]">
          {showForm ? t('common.cancel') : t('eatingOut.addExpense')}
        </button>
      </div>

      <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-xl p-4">
        <p className="text-sm text-orange-700 dark:text-orange-400 font-medium">{t('eatingOut.thisMonth')}</p>
        <p className="text-2xl font-bold text-orange-800 dark:text-orange-300 mt-1">{fmtCurrency(totalThisMonth, userCurrency)}</p>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 sm:p-6 overflow-hidden">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">{t('eatingOut.logExpense')}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('eatingOut.restaurant')} *</label>
              <input type="text" required value={form.restaurant_name}
                onChange={(e) => setForm({ ...form, restaurant_name: e.target.value })}
                className={inputCls} placeholder="e.g. Starbucks" />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className="min-w-0">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('eatingOut.date')} *</label>
                <input type="date" required value={form.expense_date}
                  onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
                  className={`${inputCls} max-w-full`} />
              </div>
              <div className="min-w-0">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('eatingOut.amount')} ({currencySymbol(userCurrency)}) *</label>
                <input type="text" inputMode="decimal" pattern="[0-9]*[.,]?[0-9]*" required value={form.amount || ''}
                  onChange={(e) => { const v = e.target.value.replace(',', '.'); if (v === '' || /^\d*\.?\d*$/.test(v)) setForm({ ...form, amount: parseFloat(v) || 0 }); }}
                  className={inputCls} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('eatingOut.mealType')}</label>
              <select value={form.meal_type} onChange={(e) => setForm({ ...form, meal_type: e.target.value })} className={inputCls}>
                {MEAL_TYPES.map((mt) => <option key={mt} value={mt}>{mt.charAt(0).toUpperCase() + mt.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('grocery.notes')}</label>
              <input type="text" value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputCls} />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors min-h-[48px]">{t('common.cancel')}</button>
              <button type="submit" disabled={saving}
                className="flex-1 px-4 py-3 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition-colors min-h-[48px]">
                {saving ? t('common.saving') : t('common.save')}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
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
                  {fmtDate(exp.expense_date, i18n.language)} &middot; {exp.meal_type}
                  {exp.notes && ` \u00B7 ${exp.notes}`}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">{fmtCurrency(exp.amount, exp.currency)}</span>
                <button onClick={() => handleDelete(exp.id)}
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
  );
}
