import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import GroceryTab from './GroceryTab';
import EatingOutTab from './EatingOutTab';
import SubscriptionsTab from './SubscriptionsTab';

type SubCategory = 'grocery' | 'eating-out' | 'recurring';

interface Props {
  userCurrency: string;
  inputCls: string;
  inputClsSm: string;
}

export default function ExpensesTab({ userCurrency, inputCls, inputClsSm }: Props) {
  const { t } = useTranslation();
  const [sub, setSub] = useState<SubCategory>('grocery');

  const pillCls = (active: boolean) =>
    `px-3.5 py-2 text-xs sm:text-sm font-medium rounded-full transition-colors whitespace-nowrap min-h-[36px] flex items-center gap-1.5 ${
      active
        ? 'bg-emerald-600 text-white shadow-sm'
        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
    }`;

  return (
    <div className="space-y-4">
      {/* Sub-category pills */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        <button onClick={() => setSub('grocery')} className={pillCls(sub === 'grocery')}>
          <span>🛒</span>
          <span>{t('spending.groceries')}</span>
        </button>
        <button onClick={() => setSub('eating-out')} className={pillCls(sub === 'eating-out')}>
          <span>🍽️</span>
          <span>{t('spending.eatingOut')}</span>
        </button>
        <button onClick={() => setSub('recurring')} className={pillCls(sub === 'recurring')}>
          <span>🔄</span>
          <span>{t('spending.recurring')}</span>
        </button>
      </div>

      {/* Sub-tab content */}
      {sub === 'grocery' && <GroceryTab userCurrency={userCurrency} inputCls={inputCls} inputClsSm={inputClsSm} />}
      {sub === 'eating-out' && <EatingOutTab userCurrency={userCurrency} inputCls={inputCls} />}
      {sub === 'recurring' && <SubscriptionsTab userCurrency={userCurrency} inputCls={inputCls} />}
    </div>
  );
}
