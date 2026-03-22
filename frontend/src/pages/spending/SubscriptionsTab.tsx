import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { subscriptionApi, Subscription, CreateSubscription } from '../../api/subscriptions';
import { useToast } from '../../components/Toast';
import { fmtCurrency, currencySymbol, fmtDate } from '../../utils/currency';

const BILLING_CYCLES = ['monthly', 'yearly', 'weekly', 'quarterly'];
const SUB_CATEGORIES = ['streaming', 'music', 'software', 'fitness', 'cloud', 'insurance', 'other'];

interface Props {
  userCurrency: string;
  inputCls: string;
}

export default function SubscriptionsTab({ userCurrency, inputCls }: Props) {
  const { t, i18n } = useTranslation();
  const toast = useToast();

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editSub, setEditSub] = useState<Subscription | null>(null);
  const [form, setForm] = useState<CreateSubscription>({
    name: '', amount: 0, currency: userCurrency, billing_cycle: 'monthly', category: 'other', notes: '',
  });

  const load = () => {
    subscriptionApi.getAll().then(setSubscriptions).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const totalMonthly = subscriptions
    .filter((s) => s.is_active)
    .reduce((sum, s) => sum + s.monthly_cost, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editSub) {
        await subscriptionApi.update(editSub.id, form);
      } else {
        await subscriptionApi.create(form);
      }
      setShowForm(false);
      setEditSub(null);
      setForm({ name: '', amount: 0, currency: userCurrency, billing_cycle: 'monthly', category: 'other', notes: '' });
      load();
    } catch {
      toast.error(t('subscriptions.failedToSave'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await toast.confirm(t('subscriptions.deleteConfirm'));
    if (!confirmed) return;
    await subscriptionApi.delete(id);
    setSubscriptions((prev) => prev.filter((s) => s.id !== id));
    toast.success(t('subscriptions.deleted'));
  };

  const handleToggle = async (sub: Subscription) => {
    await subscriptionApi.update(sub.id, { is_active: !sub.is_active });
    load();
  };

  const startEdit = (sub: Subscription) => {
    setEditSub(sub);
    setForm({
      name: sub.name, amount: sub.amount, currency: sub.currency,
      billing_cycle: sub.billing_cycle, category: sub.category,
      next_billing_date: sub.next_billing_date || undefined, notes: sub.notes || '',
    });
    setShowForm(true);
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('subscriptions.subtitle')}</p>
        <button onClick={() => { setShowForm(!showForm); setEditSub(null); setForm({ name: '', amount: 0, currency: userCurrency, billing_cycle: 'monthly', category: 'other', notes: '' }); }}
          className="px-3 sm:px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-sm font-medium min-h-[44px]">
          {showForm ? t('common.cancel') : t('subscriptions.addSub')}
        </button>
      </div>

      {/* Monthly total card */}
      <div className="bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 rounded-xl p-4">
        <p className="text-sm text-violet-700 dark:text-violet-400 font-medium">{t('subscriptions.monthlyTotal')}</p>
        <p className="text-2xl font-bold text-violet-800 dark:text-violet-300 mt-1">{fmtCurrency(totalMonthly, userCurrency)}</p>
        <p className="text-xs text-violet-600 dark:text-violet-400 mt-0.5">{subscriptions.filter(s => s.is_active).length} {t('subscriptions.activeCount')}</p>
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 sm:p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">{editSub ? t('subscriptions.editSub') : t('subscriptions.addSub')}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('subscriptions.name')} *</label>
                <input type="text" required value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputCls} placeholder="e.g. Netflix" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('subscriptions.amount')} ({currencySymbol(userCurrency)}) *</label>
                <input type="number" required min="0" step="0.01" value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) })}
                  className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('subscriptions.billingCycle')}</label>
                <select value={form.billing_cycle} onChange={(e) => setForm({ ...form, billing_cycle: e.target.value })} className={inputCls}>
                  {BILLING_CYCLES.map((c) => <option key={c} value={c}>{t(`subscriptions.cycle_${c}`)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('subscriptions.category')}</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputCls}>
                  {SUB_CATEGORIES.map((c) => <option key={c} value={c}>{t(`subscriptions.cat_${c}`)}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('subscriptions.nextBilling')}</label>
                <input type="date" value={form.next_billing_date || ''}
                  onChange={(e) => setForm({ ...form, next_billing_date: e.target.value || undefined })}
                  className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('grocery.notes')}</label>
                <input type="text" value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputCls} />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => { setShowForm(false); setEditSub(null); }}
                className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors min-h-[48px]">{t('common.cancel')}</button>
              <button type="submit" disabled={saving}
                className="flex-1 px-4 py-3 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition-colors min-h-[48px]">
                {saving ? t('common.saving') : t('common.save')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Subscription list */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">{t('subscriptions.noSubs')}</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{t('subscriptions.noSubsHint')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {subscriptions.map((sub) => (
            <div key={sub.id} className={`bg-white dark:bg-gray-900 border rounded-xl p-3 sm:p-4 flex items-center gap-3 transition-opacity ${sub.is_active ? 'border-gray-200 dark:border-gray-800' : 'border-gray-100 dark:border-gray-800/50 opacity-60'}`}>
              <button onClick={() => handleToggle(sub)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${sub.is_active ? 'bg-violet-100 dark:bg-violet-500/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                {sub.is_active ? (
                  <svg className="w-5 h-5 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                )}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className={`font-semibold truncate ${sub.is_active ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 line-through'}`}>{sub.name}</h3>
                  <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full flex-shrink-0">{t(`subscriptions.cat_${sub.category}`)}</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {fmtCurrency(sub.amount, sub.currency)} / {t(`subscriptions.cycle_${sub.billing_cycle}`)}
                  {sub.monthly_cost !== sub.amount && <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">({fmtCurrency(sub.monthly_cost, sub.currency)}/mo)</span>}
                  {sub.next_billing_date && <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">&middot; {t('subscriptions.next')}: {fmtDate(sub.next_billing_date, i18n.language)}</span>}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => startEdit(sub)}
                  className="p-2 text-gray-400 dark:text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button onClick={() => handleDelete(sub.id)}
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
