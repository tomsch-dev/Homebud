import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUser } from '../hooks/useUser';
import OverviewTab from './spending/OverviewTab';
import GroceryTab from './spending/GroceryTab';
import EatingOutTab from './spending/EatingOutTab';
import SubscriptionsTab from './spending/SubscriptionsTab';
import IncomeTab from './spending/IncomeTab';

type Tab = 'overview' | 'grocery' | 'eating-out' | 'subscriptions' | 'income';

export default function Spending() {
  const { t } = useTranslation();
  const { user } = useUser();
  const userCurrency = user?.preferred_currency || 'EUR';
  const [tab, setTab] = useState<Tab>('overview');

  const inputCls = 'w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2.5 text-base sm:text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-gray-700 min-h-[44px]';
  const inputClsSm = 'w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-lg px-2 py-2 text-sm sm:text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-gray-700 min-h-[40px]';

  const tabCls = (active: boolean) =>
    `flex-1 py-2.5 px-2 sm:px-3 text-xs sm:text-sm font-medium rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center gap-1.5 whitespace-nowrap ${
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

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100/50 dark:bg-gray-800/50 rounded-xl p-1 overflow-x-auto scrollbar-hide">
        <button onClick={() => setTab('overview')} className={tabCls(tab === 'overview')}>
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="hidden sm:inline">{t('spending.overview')}</span>
        </button>
        <button onClick={() => setTab('grocery')} className={tabCls(tab === 'grocery')}>
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
          </svg>
          <span className="hidden sm:inline">{t('spending.groceries')}</span>
        </button>
        <button onClick={() => setTab('eating-out')} className={tabCls(tab === 'eating-out')}>
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
          </svg>
          <span className="hidden sm:inline">{t('spending.eatingOut')}</span>
        </button>
        <button onClick={() => setTab('subscriptions')} className={tabCls(tab === 'subscriptions')}>
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="hidden sm:inline">{t('subscriptions.title')}</span>
        </button>
        <button onClick={() => setTab('income')} className={tabCls(tab === 'income')}>
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="hidden sm:inline">{t('income.title')}</span>
        </button>
      </div>

      {tab === 'overview' && <OverviewTab userCurrency={userCurrency} inputCls={inputCls} />}
      {tab === 'grocery' && <GroceryTab userCurrency={userCurrency} inputCls={inputCls} inputClsSm={inputClsSm} />}
      {tab === 'eating-out' && <EatingOutTab userCurrency={userCurrency} inputCls={inputCls} />}
      {tab === 'subscriptions' && <SubscriptionsTab userCurrency={userCurrency} inputCls={inputCls} />}
      {tab === 'income' && <IncomeTab userCurrency={userCurrency} inputCls={inputCls} />}
    </div>
  );
}
