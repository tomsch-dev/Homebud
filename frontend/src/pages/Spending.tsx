import { useState } from 'react';
import { spendingApi, SpendingSummary } from '../api/spending';

function getDefaultDates() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

export default function Spending() {
  const defaults = getDefaultDates();
  const [start, setStart] = useState(defaults.start);
  const [end, setEnd] = useState(defaults.end);
  const [currency, setCurrency] = useState('EUR');
  const [summary, setSummary] = useState<SpendingSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLoad = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await spendingApi.getSummary(start, end, currency);
      setSummary(data);
    } catch {
      setError('Failed to load spending data.');
    } finally {
      setLoading(false);
    }
  };

  const pct = summary && summary.total > 0
    ? Math.round((summary.grocery_total / summary.total) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Spending Overview</h1>
        <p className="text-gray-500 mt-1">Analyze your grocery and eating out expenses</p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
          <input type="date" value={end} onChange={(e) => setEnd(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Currency</label>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            {['EUR', 'USD', 'GBP', 'CHF'].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <button onClick={handleLoad} disabled={loading}
          className="px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors text-sm font-medium">
          {loading ? 'Loading...' : 'Load'}
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{error}</div>}

      {summary && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-sm text-gray-500">Total Spending</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{summary.total.toFixed(2)}</p>
              <p className="text-sm text-gray-400">{summary.currency}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
              <p className="text-sm text-green-700">Groceries</p>
              <p className="text-3xl font-bold text-green-800 mt-1">{summary.grocery_total.toFixed(2)}</p>
              <p className="text-sm text-green-600">{pct}% of total · {summary.currency}</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
              <p className="text-sm text-orange-700">Eating Out</p>
              <p className="text-3xl font-bold text-orange-800 mt-1">{summary.eating_out_total.toFixed(2)}</p>
              <p className="text-sm text-orange-600">{100 - pct}% of total · {summary.currency}</p>
            </div>
          </div>

          {/* Visual bar */}
          {summary.total > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-sm font-medium text-gray-700 mb-2">Grocery vs Eating Out</p>
              <div className="flex rounded-full overflow-hidden h-5">
                <div className="bg-green-400 transition-all" style={{ width: `${pct}%` }} title={`Groceries ${pct}%`} />
                <div className="bg-orange-400 flex-1" title={`Eating out ${100 - pct}%`} />
              </div>
              <div className="flex gap-4 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-400 rounded-full inline-block" /> Groceries</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-orange-400 rounded-full inline-block" /> Eating Out</span>
              </div>
            </div>
          )}

          {/* Weekly breakdown */}
          {summary.weekly_breakdown.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="font-semibold text-gray-900 mb-3">Weekly Breakdown</h2>
              <div className="space-y-2">
                {summary.weekly_breakdown.map((week) => (
                  <div key={week.week_start} className="flex items-center gap-4 text-sm">
                    <span className="w-32 text-gray-500 flex-shrink-0 text-xs">
                      {new Date(week.week_start).toLocaleDateString()} – {new Date(week.week_end).toLocaleDateString()}
                    </span>
                    <div className="flex-1 flex gap-1 h-5">
                      {week.grocery_total > 0 && (
                        <div className="bg-green-200 rounded-sm flex items-center px-1 text-xs text-green-800 whitespace-nowrap"
                          style={{ width: `${(week.grocery_total / summary.total) * 100}%`, minWidth: '2rem' }}>
                          {week.grocery_total.toFixed(0)}
                        </div>
                      )}
                      {week.eating_out_total > 0 && (
                        <div className="bg-orange-200 rounded-sm flex items-center px-1 text-xs text-orange-800 whitespace-nowrap"
                          style={{ width: `${(week.eating_out_total / summary.total) * 100}%`, minWidth: '2rem' }}>
                          {week.eating_out_total.toFixed(0)}
                        </div>
                      )}
                    </div>
                    <span className="font-semibold text-gray-800 w-20 text-right">{week.total.toFixed(2)} {week.currency}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {summary.top_stores.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h2 className="font-semibold text-gray-900 mb-3">Top Stores</h2>
                <ul className="space-y-2">
                  {summary.top_stores.map((s) => (
                    <li key={s.store} className="flex justify-between text-sm">
                      <span className="text-gray-700">{s.store}</span>
                      <span className="font-semibold text-gray-900">{s.total.toFixed(2)} {currency}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {summary.top_restaurants.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h2 className="font-semibold text-gray-900 mb-3">Top Restaurants</h2>
                <ul className="space-y-2">
                  {summary.top_restaurants.map((r) => (
                    <li key={r.restaurant} className="flex justify-between text-sm">
                      <span className="text-gray-700">{r.restaurant}</span>
                      <span className="font-semibold text-gray-900">{r.total.toFixed(2)} {currency}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
