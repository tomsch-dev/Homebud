import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { incomeApi, Income, CreateIncome } from '../../api/income';
import { useToast } from '../../components/Toast';
import { fmtCurrency, fmtDate } from '../../utils/currency';

interface Props {
  userCurrency: string;
  inputCls: string;
}

const FREQUENCIES = ['weekly', 'monthly', 'yearly'] as const;

export default function IncomeTab({ userCurrency, inputCls }: Props) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const [items, setItems] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [source, setSource] = useState('');
  const [amount, setAmount] = useState('');
  const [incomeDate, setIncomeDate] = useState(new Date().toISOString().split('T')[0]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<string>('monthly');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    incomeApi.getAll().then(setItems).finally(() => setLoading(false));
  }, []);

  const resetForm = () => {
    setSource('');
    setAmount('');
    setIncomeDate(new Date().toISOString().split('T')[0]);
    setIsRecurring(false);
    setFrequency('monthly');
    setNotes('');
    setEditId(null);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!source.trim() || !amount) return;
    const data: CreateIncome = {
      source: source.trim(),
      amount: parseFloat(amount),
      currency: userCurrency,
      income_date: incomeDate,
      is_recurring: isRecurring,
      frequency: isRecurring ? frequency : undefined,
      notes: notes.trim() || undefined,
    };
    if (editId) {
      const updated = await incomeApi.update(editId, data);
      setItems((prev) => prev.map((i) => (i.id === editId ? updated : i)));
    } else {
      const created = await incomeApi.create(data);
      setItems((prev) => [created, ...prev]);
    }
    toast.success(t('income.saved'));
    resetForm();
  };

  const startEdit = (item: Income) => {
    setSource(item.source);
    setAmount(String(item.amount));
    setIncomeDate(item.income_date);
    setIsRecurring(item.is_recurring);
    setFrequency(item.frequency || 'monthly');
    setNotes(item.notes || '');
    setEditId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await incomeApi.delete(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success(t('income.deleted'));
  };

  const totalIncome = items.reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="space-y-4">
      {/* Summary + Add */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('income.totalIncome')}</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{fmtCurrency(totalIncome, userCurrency)}</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-sm font-semibold min-h-[44px]"
        >
          {t('income.addIncome')}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
            {editId ? t('income.editIncome') : t('income.addIncome')}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('income.source')}</label>
              <input type="text" value={source} onChange={(e) => setSource(e.target.value)} className={inputCls} placeholder="e.g. Salary, Freelance" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('income.amount')}</label>
              <input type="text" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} placeholder="0.00" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('income.date')}</label>
              <input type="date" value={incomeDate} onChange={(e) => setIncomeDate(e.target.value)} className={inputCls} />
            </div>
            <div className="flex items-end gap-3">
              <label className="flex items-center gap-2 cursor-pointer py-2.5">
                <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{t('income.recurring')}</span>
              </label>
            </div>
            {isRecurring && (
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('income.frequency')}</label>
                <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className={inputCls}>
                  {FREQUENCIES.map((f) => (
                    <option key={f} value={f}>{t(`income.${f}`)}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('income.notes')}</label>
              <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} placeholder={t('income.notesPlaceholder')} />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleSubmit} disabled={!source.trim() || !amount}
              className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors text-sm font-semibold min-h-[44px]">
              {editId ? t('common.save') : t('income.addIncome')}
            </button>
            <button onClick={resetForm}
              className="px-4 py-2.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-sm min-h-[44px]">
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12">
          <span className="text-4xl block mb-3">💰</span>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('income.noIncome')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-lg">💰</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{item.source}</p>
                  {item.is_recurring && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 font-medium">
                      {t(`income.${item.frequency || 'monthly'}`)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{fmtDate(item.income_date, i18n.language)}</p>
              </div>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                +{fmtCurrency(item.amount, item.currency)}
              </p>
              <div className="flex gap-0.5 flex-shrink-0">
                <button onClick={() => startEdit(item)} className="p-2 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
