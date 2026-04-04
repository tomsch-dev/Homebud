import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUser } from '../hooks/useUser';
import OverviewTab from './spending/OverviewTab';
import ExpensesTab from './spending/ExpensesTab';
import IncomeTab from './spending/IncomeTab';

type Tab = 'overview' | 'expenses' | 'income';

export default function Spending() {
  const { t } = useTranslation();
  const { user } = useUser();
  const userCurrency = user?.preferred_currency || 'EUR';
  const [tab, setTab] = useState<Tab>('overview');

  const inputCls = 'w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2.5 text-base sm:text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-gray-700 min-h-[44px]';
  const inputClsSm = 'w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-lg px-2 py-2 text-sm sm:text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-gray-700 min-h-[40px]';

  const tabCls = (active: boolean) =>
    `flex-1 py-2.5 px-4 text-sm font-medium rounded-lg transition-colors min-h-[44px] flex items-center justify-center gap-2 ${
      active
        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
    }`;

  return (
    <div className="space-y-3 sm:space-y-6 overflow-x-hidden">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t('spending.title')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('spending.subtitle')}</p>
      </div>

      {/* 3 clean tabs */}
      <div className="flex gap-1 bg-gray-100/50 dark:bg-gray-800/50 rounded-xl p-1">
        <button onClick={() => setTab('overview')} className={tabCls(tab === 'overview')}>
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span>{t('spending.overview')}</span>
        </button>
        <button onClick={() => setTab('expenses')} className={tabCls(tab === 'expenses')}>
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
          </svg>
          <span>{t('spending.expenses')}</span>
        </button>
        <button onClick={() => setTab('income')} className={tabCls(tab === 'income')}>
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{t('spending.income')}</span>
        </button>
      </div>

      {tab === 'overview' && <OverviewTab userCurrency={userCurrency} inputCls={inputCls} />}
      {tab === 'expenses' && <ExpensesTab userCurrency={userCurrency} inputCls={inputCls} inputClsSm={inputClsSm} />}
      {tab === 'income' && <IncomeTab userCurrency={userCurrency} inputCls={inputCls} />}
    </div>
  );
}
