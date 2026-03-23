import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { shoppingListApi, ShoppingListItem, ShoppingListSuggestion } from '../api/shoppingList';
import { useToast } from './Toast';

const CATEGORY_EMOJI: Record<string, string> = {
  dairy: '🥛', meat: '🥩', seafood: '🐟', vegetables: '🥬', fruits: '🍎',
  grains: '🌾', beverages: '🥤', condiments: '🧂', snacks: '🍿', frozen: '🧊', other: '📦',
};

export default function ShoppingList({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [suggestions, setSuggestions] = useState<ShoppingListSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const load = () => {
    Promise.all([shoppingListApi.getAll(), shoppingListApi.getSuggestions()])
      .then(([items, sugg]) => { setItems(items); setSuggestions(sugg); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);

  const addItem = async (name: string, category?: string) => {
    if (!name.trim()) return;
    const item = await shoppingListApi.create({ name: name.trim(), category });
    setItems((prev) => [item, ...prev]);
    setNewItem('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const toggleCheck = async (item: ShoppingListItem) => {
    const updated = await shoppingListApi.update(item.id, { checked: !item.checked });
    setItems((prev) => prev.map((i) => i.id === item.id ? updated : i));
  };

  const deleteItem = async (id: string) => {
    await shoppingListApi.delete(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const clearChecked = async () => {
    await shoppingListApi.clearChecked();
    setItems((prev) => prev.filter((i) => !i.checked));
    toast.success(t('shoppingList.cleared'));
  };

  // Filter suggestions: exclude items already on the list
  const existingNames = new Set(items.map((i) => i.name.toLowerCase()));
  const filteredSuggestions = suggestions.filter((s) => !existingNames.has(s.name.toLowerCase()));
  const matchingSuggestions = newItem.trim()
    ? filteredSuggestions.filter((s) => s.name.toLowerCase().includes(newItem.toLowerCase())).slice(0, 5)
    : filteredSuggestions.slice(0, 8);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 sm:p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[92vh] sm:max-h-[88vh] flex flex-col border border-gray-200 dark:border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">🛒</span>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('shoppingList.title')}</h2>
            {unchecked.length > 0 && (
              <span className="text-xs bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-medium">{unchecked.length}</span>
            )}
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-xl">&times;</button>
        </div>

        {/* Add item input */}
        <div className="px-4 pt-3 pb-2 flex-shrink-0">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newItem}
              onChange={(e) => { setNewItem(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={(e) => { if (e.key === 'Enter') addItem(newItem); }}
              className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-base sm:text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
              placeholder={t('shoppingList.addPlaceholder')}
            />
            <button
              onClick={() => addItem(newItem)}
              disabled={!newItem.trim()}
              className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors text-sm font-semibold min-h-[44px]"
            >
              +
            </button>
          </div>

          {/* Suggestions */}
          {showSuggestions && matchingSuggestions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {matchingSuggestions.map((s) => (
                <button
                  key={s.name}
                  onClick={() => addItem(s.name, s.category)}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-gray-700 dark:text-gray-300 hover:text-emerald-700 dark:hover:text-emerald-300 rounded-lg text-xs font-medium transition-colors"
                >
                  <span>{CATEGORY_EMOJI[s.category || 'other'] || '📦'}</span>
                  <span>{s.name}</span>
                  <span className="text-gray-400 dark:text-gray-500 text-[10px]">×{s.frequency}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Item list */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-4xl block mb-3">🛒</span>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('shoppingList.empty')}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('shoppingList.emptyHint')}</p>
            </div>
          ) : (
            <>
              {/* Unchecked items */}
              {unchecked.length > 0 && (
                <div className="space-y-1 mt-2">
                  {unchecked.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 group transition-colors">
                      <button onClick={() => toggleCheck(item)} className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600 hover:border-emerald-500 dark:hover:border-emerald-400 flex-shrink-0 transition-colors" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-gray-900 dark:text-white">{item.name}</span>
                        {item.quantity && (
                          <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">{item.quantity} {item.unit || ''}</span>
                        )}
                      </div>
                      {item.category && (
                        <span className="text-sm flex-shrink-0">{CATEGORY_EMOJI[item.category] || '📦'}</span>
                      )}
                      <button onClick={() => deleteItem(item.id)}
                        className="text-gray-300 dark:text-gray-700 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-lg flex-shrink-0 p-1">&times;</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Checked items */}
              {checked.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">{t('shoppingList.checked')} ({checked.length})</span>
                    <button onClick={clearChecked} className="text-xs text-red-500 hover:text-red-600 dark:hover:text-red-400 font-medium transition-colors">
                      {t('shoppingList.clearChecked')}
                    </button>
                  </div>
                  <div className="space-y-1">
                    {checked.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 group transition-colors">
                        <button onClick={() => toggleCheck(item)} className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <span className="text-sm text-gray-400 dark:text-gray-500 line-through flex-1 min-w-0">{item.name}</span>
                        <button onClick={() => deleteItem(item.id)}
                          className="text-gray-300 dark:text-gray-700 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-lg flex-shrink-0 p-1">&times;</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
