import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { spendingApi, SpendingSummary } from '../../api/spending';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { fmtCurrency, fmtDate } from '../../utils/currency';

/* eslint-disable @typescript-eslint/no-explicit-any */

function CustomTooltip({ active, payload, currencyCode }: { active?: boolean; payload?: any[]; currencyCode: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 dark:bg-gray-800 text-white rounded-lg px-3 py-2 text-xs shadow-xl border border-gray-700/50">
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="text-gray-300">{entry.name}:</span>
          <span className="font-semibold">{fmtCurrency(Number(entry.value), currencyCode)}</span>
        </div>
      ))}
    </div>
  );
}

type Period = 'this-month' | 'last-month' | '3-months' | 'year' | 'custom';

function getDatesForPeriod(period: Period): { start: string; end: string } {
  const now = new Date();
  let s: Date, e: Date;
  switch (period) {
    case 'last-month':
      s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      e = new Date(now.getFullYear(), now.getMonth(), 0);
      break;
    case '3-months':
      s = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      e = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    case 'year':
      s = new Date(now.getFullYear(), 0, 1);
      e = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    default:
      s = new Date(now.getFullYear(), now.getMonth(), 1);
      e = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
  }
  return { start: s.toISOString().split('T')[0], end: e.toISOString().split('T')[0] };
}

interface Props {
  userCurrency: string;
  inputCls: string;
}

export default function OverviewTab({ userCurrency, inputCls }: Props) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const defaults = getDatesForPeriod('this-month');
  const [period, setPeriod] = useState<Period>('this-month');
  const [start, setStart] = useState(defaults.start);
  const [end, setEnd] = useState(defaults.end);
  const [summary, setSummary] = useState<SpendingSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await spendingApi.getSummary(start, end, userCurrency);
      setSummary(data);
    } catch {
      setError(t('spending.failedToLoad'));
    } finally {
      setLoading(false);
    }
  }, [start, end, userCurrency, t]);

  const selectPeriod = (p: Period) => {
    setPeriod(p);
    if (p !== 'custom') {
      const dates = getDatesForPeriod(p);
      setStart(dates.start);
      setEnd(dates.end);
    }
  };

  useEffect(() => { if (period !== 'custom') loadOverview(); }, [period, userCurrency]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { loadOverview(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const groceryPct = summary && summary.total > 0 ? Math.round((summary.grocery_total / summary.total) * 100) : 0;
  const eatingPct = summary && summary.total > 0 ? Math.round((summary.eating_out_total / summary.total) * 100) : 0;
  const subPct = summary && summary.total > 0 ? Math.round((summary.subscription_total / summary.total) * 100) : 0;

  const periodCls = (p: Period) =>
    `flex-1 py-2 px-2 text-xs font-medium rounded-lg transition-colors min-h-[40px] ${
      period === p
        ? 'bg-emerald-600 text-white shadow-sm'
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
    }`;

  return (
    <>
      {/* Period presets */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-2 sm:p-3 space-y-2">
        <div className="flex flex-wrap gap-1">
          <button onClick={() => selectPeriod('this-month')} className={periodCls('this-month')}>{t('spending.thisMonth')}</button>
          <button onClick={() => selectPeriod('last-month')} className={periodCls('last-month')}>{t('spending.lastMonth')}</button>
          <button onClick={() => selectPeriod('3-months')} className={periodCls('3-months')}>{t('spending.threeMonths')}</button>
          <button onClick={() => selectPeriod('year')} className={periodCls('year')}>{t('spending.thisYear')}</button>
          <button onClick={() => selectPeriod('custom')} className={periodCls('custom')}>{t('spending.custom')}</button>
        </div>

        {period === 'custom' && (
          <div className="grid grid-cols-2 gap-2 pt-1 overflow-hidden">
            <div className="min-w-0">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('spending.from')}</label>
              <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className={`${inputCls} max-w-full`} />
            </div>
            <div className="min-w-0">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('spending.to')}</label>
              <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className={`${inputCls} max-w-full`} />
            </div>
          </div>
        )}

        {period === 'custom' && (
          <button onClick={loadOverview} disabled={loading}
            className="w-full py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors text-sm font-medium min-h-[44px]">
            {loading ? t('common.loading') : t('spending.load')}
          </button>
        )}
      </div>

      {error && <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4 text-red-700 dark:text-red-400 text-sm">{error}</div>}

      {summary && (
        <div className="space-y-4 sm:space-y-6">
          {/* Summary cards */}
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 sm:overflow-visible snap-x snap-mandatory">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 sm:p-5 min-w-[140px] flex-shrink-0 sm:flex-shrink sm:min-w-0 snap-start">
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('spending.totalSpending')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{fmtCurrency(summary.total, summary.currency)}</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-4 sm:p-5 min-w-[140px] flex-shrink-0 sm:flex-shrink sm:min-w-0 snap-start">
              <p className="text-xs text-emerald-700 dark:text-emerald-400">{t('spending.groceries')}</p>
              <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-300 mt-1">{fmtCurrency(summary.grocery_total, summary.currency)}</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">{groceryPct}%</p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-xl p-4 sm:p-5 min-w-[140px] flex-shrink-0 sm:flex-shrink sm:min-w-0 snap-start">
              <p className="text-xs text-orange-700 dark:text-orange-400">{t('spending.eatingOut')}</p>
              <p className="text-2xl font-bold text-orange-800 dark:text-orange-300 mt-1">{fmtCurrency(summary.eating_out_total, summary.currency)}</p>
              <p className="text-xs text-orange-600 dark:text-orange-400">{eatingPct}%</p>
            </div>
            <div className="bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 rounded-xl p-4 sm:p-5 min-w-[140px] flex-shrink-0 sm:flex-shrink sm:min-w-0 snap-start">
              <p className="text-xs text-violet-700 dark:text-violet-400">{t('subscriptions.title')}</p>
              <p className="text-2xl font-bold text-violet-800 dark:text-violet-300 mt-1">{fmtCurrency(summary.subscription_total, summary.currency)}</p>
              <p className="text-xs text-violet-600 dark:text-violet-400">{subPct}%</p>
            </div>
          </div>

          {summary.total > 0 && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('spending.spendingBreakdown')}</p>
              <div className="flex rounded-full overflow-hidden h-5">
                {groceryPct > 0 && <div className="bg-emerald-400 dark:bg-emerald-500 transition-all" style={{ width: `${groceryPct}%` }} />}
                {eatingPct > 0 && <div className="bg-orange-400 dark:bg-orange-500 transition-all" style={{ width: `${eatingPct}%` }} />}
                {subPct > 0 && <div className="bg-violet-400 dark:bg-violet-500 transition-all" style={{ width: `${subPct}%` }} />}
              </div>
              <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-emerald-400 dark:bg-emerald-500 rounded-full inline-block" /> {t('spending.groceries')} {groceryPct}%</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-orange-400 dark:bg-orange-500 rounded-full inline-block" /> {t('spending.eatingOut')} {eatingPct}%</span>
                {subPct > 0 && <span className="flex items-center gap-1"><span className="w-3 h-3 bg-violet-400 dark:bg-violet-500 rounded-full inline-block" /> {t('subscriptions.title')} {subPct}%</span>}
              </div>
            </div>
          )}

          {/* Charts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-3">{t('spending.spendingBreakdown')}</h2>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: t('spending.groceries'), value: summary.grocery_total },
                        { name: t('spending.eatingOut'), value: summary.eating_out_total },
                        ...(summary.subscription_total > 0 ? [{ name: t('subscriptions.title'), value: summary.subscription_total }] : []),
                      ].filter(d => d.value > 0)}
                      cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value"
                    >
                      <Cell fill="#34d399" />
                      <Cell fill="#fb923c" />
                      {summary.subscription_total > 0 && <Cell fill="#a78bfa" />}
                    </Pie>
                    <Tooltip content={<CustomTooltip currencyCode={summary.currency} />} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {summary.weekly_breakdown.length > 0 && (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-3">{t('spending.weeklyChart')}</h2>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={summary.weekly_breakdown.map(w => ({
                      week: fmtDate(w.week_start, lang, { month: 'short', day: 'numeric' }),
                      [t('spending.groceries')]: w.grocery_total,
                      [t('spending.eatingOut')]: w.eating_out_total,
                    }))} barCategoryGap="30%" maxBarSize={40}>
                      <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} width={45} />
                      <Tooltip content={<CustomTooltip currencyCode={summary.currency} />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                      <Bar dataKey={t('spending.groceries')} stackId="a" fill="#34d399" radius={[0, 0, 0, 0]} />
                      <Bar dataKey={t('spending.eatingOut')} stackId="a" fill="#fb923c" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {summary.weekly_breakdown.length > 0 && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-3">{t('spending.weeklyBreakdown')}</h2>
              <div className="space-y-2">
                {summary.weekly_breakdown.map((week) => (
                  <div key={week.week_start} className="text-sm">
                    <div className="flex items-center justify-between mb-1 sm:mb-0">
                      <span className="text-gray-500 dark:text-gray-400 text-xs">
                        {fmtDate(week.week_start, lang, { month: 'short', day: 'numeric' })} – {fmtDate(week.week_end, lang, { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200 text-right sm:hidden">{fmtCurrency(week.total, week.currency)}</span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                      <div className="flex-1 flex gap-1 h-5">
                        {week.grocery_total > 0 && (
                          <div className="bg-emerald-200 dark:bg-emerald-500/30 rounded-sm flex items-center px-1 text-xs text-emerald-800 dark:text-emerald-300 whitespace-nowrap"
                            style={{ width: `${(week.grocery_total / summary.total) * 100}%`, minWidth: '2rem' }}>
                            {fmtCurrency(week.grocery_total, week.currency, 0)}
                          </div>
                        )}
                        {week.eating_out_total > 0 && (
                          <div className="bg-orange-200 dark:bg-orange-500/30 rounded-sm flex items-center px-1 text-xs text-orange-800 dark:text-orange-300 whitespace-nowrap"
                            style={{ width: `${(week.eating_out_total / summary.total) * 100}%`, minWidth: '2rem' }}>
                            {fmtCurrency(week.eating_out_total, week.currency, 0)}
                          </div>
                        )}
                      </div>
                      <span className="font-semibold text-gray-800 dark:text-gray-200 w-20 text-right hidden sm:block">{fmtCurrency(week.total, week.currency)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {summary.top_stores.length > 0 && (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-3">{t('spending.topStores')}</h2>
                <ul className="space-y-2">
                  {summary.top_stores.map((s) => (
                    <li key={s.store} className="flex justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300">{s.store}</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{fmtCurrency(s.total, userCurrency)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {summary.top_restaurants.length > 0 && (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-3">{t('spending.topRestaurants')}</h2>
                <ul className="space-y-2">
                  {summary.top_restaurants.map((r) => (
                    <li key={r.restaurant} className="flex justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300">{r.restaurant}</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{fmtCurrency(r.total, userCurrency)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
