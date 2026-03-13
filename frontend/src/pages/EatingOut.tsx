import { useEffect, useState } from 'react';
import { eatingOutApi, EatingOutExpense, CreateEatingOut } from '../api/spending';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'coffee', 'snack', 'other'];
const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF'];
const MEAL_EMOJI: Record<string, string> = {
  breakfast: '🍳', lunch: '🥗', dinner: '🍽️', coffee: '☕', snack: '🍪', other: '🍴',
};

export default function EatingOut() {
  const [expenses, setExpenses] = useState<EatingOutExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CreateEatingOut>({
    restaurant_name: '',
    expense_date: new Date().toISOString().split('T')[0],
    amount: 0,
    currency: 'EUR',
    meal_type: 'lunch',
    notes: '',
  });

  const load = () => {
    eatingOutApi.getAll().then(setExpenses).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await eatingOutApi.create(form);
      setShowForm(false);
      setForm({ restaurant_name: '', expense_date: new Date().toISOString().split('T')[0], amount: 0, currency: 'EUR', meal_type: 'lunch', notes: '' });
      load();
    } catch {
      alert('Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return;
    await eatingOutApi.delete(id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const totalThisMonth = expenses
    .filter((e) => {
      const d = new Date(e.expense_date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Eating Out</h1>
          <p className="text-gray-500 mt-1">Track your restaurant and cafe spending</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
        >
          {showForm ? 'Cancel' : '+ Add Expense'}
        </button>
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
        <p className="text-sm text-orange-700 font-medium">This month's eating out</p>
        <p className="text-2xl font-bold text-orange-800 mt-1">{totalThisMonth.toFixed(2)} EUR</p>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Log Expense</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant / Cafe *</label>
                <input type="text" required value={form.restaurant_name}
                  onChange={(e) => setForm({ ...form, restaurant_name: e.target.value })}
                  className={inputCls} placeholder="e.g. Starbucks" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input type="date" required value={form.expense_date}
                  onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
                  className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                <input type="number" required min="0" step="0.01" value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) })}
                  className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className={inputCls}>
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meal type</label>
                <select value={form.meal_type} onChange={(e) => setForm({ ...form, meal_type: e.target.value })} className={inputCls}>
                  {MEAL_TYPES.map((t) => <option key={t} value={t}>{MEAL_EMOJI[t]} {t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input type="text" value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputCls} />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
              <button type="submit" disabled={saving}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 rounded-lg transition-colors">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🍽️</p>
          <p className="text-lg font-medium">No eating out expenses yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {expenses.map((exp) => (
            <div key={exp.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
              <span className="text-2xl">{MEAL_EMOJI[exp.meal_type] || '🍴'}</span>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{exp.restaurant_name}</h3>
                <p className="text-sm text-gray-500">
                  {new Date(exp.expense_date).toLocaleDateString()} · {exp.meal_type}
                  {exp.notes && ` · ${exp.notes}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-gray-900">{exp.amount.toFixed(2)} {exp.currency}</span>
                <button onClick={() => handleDelete(exp.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
