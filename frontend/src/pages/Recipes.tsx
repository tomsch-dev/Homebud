import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { recipesApi, Recipe, RecipeSuggestion, CreateRecipe } from '../api/recipes';
import { foodItemsApi, FoodItem } from '../api/foodItems';
import RecipeFormModal from '../components/RecipeFormModal';
import { useToast } from '../components/Toast';
import { useUser } from '../hooks/useUser';

const CATEGORY_EMOJI: Record<string, string> = {
  dairy: '🥛', meat: '🥩', seafood: '🐟', vegetables: '🥬', fruits: '🍎',
  grains: '🌾', beverages: '🥤', condiments: '🧂', snacks: '🍿', frozen: '🧊', other: '📦',
};

const CATEGORY_ORDER = ['vegetables', 'fruits', 'meat', 'seafood', 'dairy', 'grains', 'condiments', 'beverages', 'snacks', 'frozen', 'other'];

type Tab = 'recipes' | 'ai' | 'discover';

const RECIPE_SITES = [
  { name: 'Chefkoch', url: 'https://www.chefkoch.de/rs/s0/', icon: '🇩🇪', lang: 'de' },
  { name: 'AllRecipes', url: 'https://www.allrecipes.com/search?q=', icon: '🇺🇸', lang: 'en' },
  { name: 'BBC Good Food', url: 'https://www.bbcgoodfood.com/search?q=', icon: '🇬🇧', lang: 'en' },
  { name: 'Epicurious', url: 'https://www.epicurious.com/search/', icon: '🍽️', lang: 'en' },
  { name: 'Simply Recipes', url: 'https://www.simplyrecipes.com/search?q=', icon: '🥘', lang: 'en' },
  { name: 'Lecker', url: 'https://www.lecker.de/suche?search=', icon: '🇩🇪', lang: 'de' },
];

export default function Recipes() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const { isPremium, loading: userLoading } = useUser();
  const [tab, setTab] = useState<Tab>('recipes');

  // Recipes state
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // AI state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [suggestions, setSuggestions] = useState<RecipeSuggestion[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [savedIdx, setSavedIdx] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [ingredientFilter, setIngredientFilter] = useState('');

  const load = () => {
    Promise.all([recipesApi.getAll(), foodItemsApi.getAll()])
      .then(([recs, items]) => {
        setRecipes(recs);
        setFoodItems(items);
        setSelectedIds(new Set(items.map((i) => i.id)));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    const confirmed = await toast.confirm(t('recipes.deleteConfirm'));
    if (!confirmed) return;
    await recipesApi.delete(id);
    setRecipes((prev) => prev.filter((r) => r.id !== id));
    toast.success(t('recipes.deleted'));
  };

  const handleSave = async (data: CreateRecipe) => {
    await recipesApi.create(data);
    load();
  };

  // AI Chef handlers
  const toggleItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === foodItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(foodItems.map((i) => i.id)));
    }
  };

  const handleGenerate = async () => {
    if (selectedIds.size === 0) return;
    setAiLoading(true);
    setSuggestions([]);
    setSavedIdx(new Set());
    try {
      const ids = Array.from(selectedIds);
      const recipes = await recipesApi.getRecommendations(i18n.language, ids);
      setSuggestions(recipes);
    } catch {
      toast.error(t('aiChef.failedToGet'));
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveAi = async (recipe: RecipeSuggestion, idx: number) => {
    try {
      const data: CreateRecipe = { ...recipe, is_ai_generated: true };
      await recipesApi.create(data);
      setSavedIdx((prev) => new Set(prev).add(idx));
      toast.success(t('aiChef.saved'));
      load();
    } catch {
      toast.error(t('aiChef.failedToSave'));
    }
  };

  const isExpiringSoon = (item: FoodItem) => {
    if (!item.expiry_date) return false;
    const soon = new Date();
    soon.setDate(soon.getDate() + 3);
    return new Date(item.expiry_date) <= soon;
  };

  const expiringItems = useMemo(() => foodItems.filter(isExpiringSoon), [foodItems]);

  const filteredItems = useMemo(() => {
    if (!ingredientFilter.trim()) return foodItems;
    const q = ingredientFilter.toLowerCase();
    return foodItems.filter((i) => i.name.toLowerCase().includes(q));
  }, [foodItems, ingredientFilter]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, FoodItem[]> = {};
    for (const item of filteredItems) {
      const cat = item.category || 'other';
      (groups[cat] ??= []).push(item);
    }
    return CATEGORY_ORDER
      .filter((cat) => groups[cat]?.length)
      .map((cat) => ({ category: cat, items: groups[cat] }));
  }, [filteredItems]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const tabCls = (active: boolean) =>
    `flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium rounded-lg transition-colors min-h-[40px] ${
      active
        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
    }`;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t('recipes.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{recipes.length} {t('recipes.savedRecipes')}</p>
        </div>
        {tab === 'recipes' && (
          <button
            onClick={() => setShowModal(true)}
            className="px-3 sm:px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-sm font-medium min-h-[44px]"
          >
            {t('recipes.newRecipe')}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100/50 dark:bg-gray-800/50 rounded-xl p-1">
        <button onClick={() => setTab('recipes')} className={tabCls(tab === 'recipes')}>
          <span className="text-base">📖</span>
          {t('recipes.myRecipes')}
        </button>
        <button onClick={() => setTab('ai')} className={tabCls(tab === 'ai')}>
          <span className="text-base">✨</span>
          {t('recipes.aiShort')}
        </button>
        <button onClick={() => setTab('discover')} className={tabCls(tab === 'discover')}>
          <span className="text-base">🔍</span>
          {t('recipes.discover')}
        </button>
      </div>

      {/* Recipes tab */}
      {tab === 'recipes' && (
        <>
          {recipes.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300">{t('recipes.noRecipes')}</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{t('recipes.noRecipesHint')}</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recipes.map((recipe) => (
                <div key={recipe.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20 transition-shadow">
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white leading-snug">{recipe.name}</h3>
                      {recipe.is_ai_generated && (
                        <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 rounded-full font-medium flex-shrink-0">AI</span>
                      )}
                    </div>
                    {recipe.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">{recipe.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-3 text-xs text-gray-400 dark:text-gray-500">
                      {recipe.prep_time_min && <span>{t('recipes.prep')}: {recipe.prep_time_min}m</span>}
                      {recipe.cook_time_min && <span>{t('recipes.cook')}: {recipe.cook_time_min}m</span>}
                      <span>{recipe.servings} {recipe.servings !== 1 ? t('common.servings') : t('common.serving')}</span>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{recipe.ingredients.length} ingredients &middot; {recipe.steps.length} steps</p>
                  </div>
                  <div className="px-4 sm:px-5 pb-4 flex gap-2">
                    <Link
                      to={`/recipes/${recipe.id}`}
                      className="flex-1 text-center text-sm px-3 py-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors font-medium min-h-[44px] flex items-center justify-center"
                    >
                      {t('recipes.view')}
                    </Link>
                    <button
                      onClick={() => handleDelete(recipe.id)}
                      className="px-3 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors min-h-[44px]"
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* AI Chef tab */}
      {tab === 'ai' && (
        <>
          {!userLoading && !isPremium ? (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 sm:p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-500/20 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('premium.locked')}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">{t('premium.testPhase')}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('premium.contactUs')}{' '}
                <a href="mailto:schoenfelddev@gmail.com" className="text-purple-600 dark:text-purple-400 font-medium hover:underline">
                  schoenfelddev@gmail.com
                </a>
              </p>
            </div>
          ) : (
            <>
              {/* Ingredient selection */}
              {foodItems.length > 0 && (
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 sm:p-5 space-y-3">
                  {/* Header with search */}
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex-shrink-0">{t('aiChef.selectIngredients')}</h2>
                    <button onClick={toggleAll} className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-medium whitespace-nowrap">
                      {selectedIds.size === foodItems.length ? t('aiChef.deselectAll') : t('aiChef.selectAll')}
                    </button>
                  </div>

                  {/* Search filter */}
                  {foodItems.length > 6 && (
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                      </svg>
                      <input
                        type="text"
                        value={ingredientFilter}
                        onChange={(e) => setIngredientFilter(e.target.value)}
                        className="w-full border border-gray-200 dark:border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                        placeholder={t('aiChef.filterIngredients')}
                      />
                    </div>
                  )}

                  {/* Expiring soon section */}
                  {expiringItems.length > 0 && !ingredientFilter && (
                    <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-1">
                        <span>⚠️</span> {t('aiChef.expiringSoon')}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {expiringItems.map((item) => {
                          const selected = selectedIds.has(item.id);
                          return (
                            <button
                              key={item.id}
                              onClick={() => toggleItem(item.id)}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                                selected
                                  ? 'bg-amber-100 dark:bg-amber-500/20 border-amber-400 dark:border-amber-500/40 text-amber-800 dark:text-amber-300'
                                  : 'bg-white dark:bg-gray-800 border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400/70'
                              }`}
                            >
                              {selected && <span className="mr-1">✓</span>}
                              {item.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Grouped by category */}
                  <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                    {groupedItems.map(({ category, items: catItems }) => (
                      <div key={category}>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="text-sm">{CATEGORY_EMOJI[category] || CATEGORY_EMOJI.other}</span>
                          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t(`categories.${category}`)}</span>
                          <span className="text-[10px] text-gray-400 dark:text-gray-600">({catItems.length})</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {catItems.map((item) => {
                            const selected = selectedIds.has(item.id);
                            const expiring = isExpiringSoon(item);
                            return (
                              <button
                                key={item.id}
                                onClick={() => toggleItem(item.id)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                                  selected
                                    ? expiring
                                      ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30 text-amber-700 dark:text-amber-400'
                                      : 'bg-purple-50 dark:bg-purple-500/10 border-purple-300 dark:border-purple-500/30 text-purple-700 dark:text-purple-400'
                                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'
                                }`}
                              >
                                {selected ? <span className="mr-1">✓</span> : <span className="mr-1 opacity-0 w-0 inline-block">✓</span>}
                                {item.name}
                                <span className="ml-1 opacity-50">{item.quantity}{t(`units.${item.unit}`, item.unit)}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    {groupedItems.length === 0 && ingredientFilter && (
                      <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">{t('common.noResults')}</p>
                    )}
                  </div>

                  {/* Footer with count + generate button */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {t('aiChef.selectedCount', { count: selectedIds.size, total: foodItems.length })}
                    </p>
                    <button
                      onClick={handleGenerate}
                      disabled={aiLoading || selectedIds.size === 0}
                      className="px-5 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
                    >
                      {aiLoading ? t('aiChef.thinking') : t('aiChef.getSuggestions')}
                    </button>
                  </div>
                </div>
              )}

              {/* Empty kitchen */}
              {foodItems.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-purple-100 dark:bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium text-gray-700 dark:text-gray-300">{t('aiChef.emptyKitchen')}</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{t('aiChef.emptyKitchenHint')}</p>
                </div>
              )}

              {/* Loading suggestions */}
              {aiLoading && (
                <div className="text-center py-12">
                  <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">{t('aiChef.thinking')}</p>
                </div>
              )}

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('aiChef.suggestedRecipes')}</h2>
                  {suggestions.map((recipe, idx) => (
                    <div key={idx} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{recipe.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{recipe.description}</p>
                        </div>
                        <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 rounded-full font-medium flex-shrink-0">AI</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
                        <span>{recipe.servings} {t('common.servings')}</span>
                        <span>{t('recipes.prep')}: {recipe.prep_time_min}m</span>
                        <span>{t('recipes.cook')}: {recipe.cook_time_min}m</span>
                        <span>{recipe.ingredients.length} {t('recipes.ingredients')}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                          <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-1">{t('recipes.ingredients')}</h4>
                          <ul className="space-y-0.5">
                            {recipe.ingredients.map((ing, i) => (
                              <li key={i} className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                                {ing.quantity} {t(`units.${ing.unit}`, ing.unit)} {ing.name}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-1">{t('recipes.instructions')}</h4>
                          <ol className="space-y-1">
                            {recipe.steps.map((step) => (
                              <li key={step.step_number} className="text-gray-500 dark:text-gray-400 text-xs">
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{step.step_number}.</span> {step.instruction}
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>
                      <button
                        onClick={() => handleSaveAi(recipe, idx)}
                        disabled={savedIdx.has(idx)}
                        className={`w-full text-sm font-medium py-3 rounded-lg transition-colors min-h-[48px] ${
                          savedIdx.has(idx)
                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-default'
                            : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20'
                        }`}
                      >
                        {savedIdx.has(idx) ? t('aiChef.saved') : t('aiChef.saveToRecipes')}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Discover tab */}
      {tab === 'discover' && (
        <div className="space-y-4">
          {/* Search box */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{t('recipes.searchRecipes')}</h2>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      window.open(`https://www.google.com/search?q=${encodeURIComponent(searchQuery + ' recipe')}`, '_blank');
                    }
                  }}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl pl-9 pr-3 py-3 text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                  placeholder={t('recipes.searchPlaceholder')}
                />
              </div>
              <button
                onClick={() => {
                  if (searchQuery.trim()) {
                    window.open(`https://www.google.com/search?q=${encodeURIComponent(searchQuery + ' recipe')}`, '_blank');
                  }
                }}
                disabled={!searchQuery.trim()}
                className="px-5 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium text-sm disabled:opacity-50 min-h-[48px] whitespace-nowrap"
              >
                {t('recipes.search')}
              </button>
            </div>
          </div>

          {/* Recipe sites */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{t('recipes.popularSites')}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('recipes.popularSitesDesc')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {RECIPE_SITES
                .filter((site) => site.lang === (i18n.language?.startsWith('de') ? 'de' : 'en') || site.lang === 'all')
                .concat(RECIPE_SITES.filter((site) => site.lang !== (i18n.language?.startsWith('de') ? 'de' : 'en') && site.lang !== 'all'))
                .map((site) => (
                <a
                  key={site.name}
                  href={searchQuery.trim() ? `${site.url}${encodeURIComponent(searchQuery)}` : site.url.replace(/[?/]$/, '').replace(/search$/, '')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:border-gray-200 dark:hover:border-gray-700 transition-colors group"
                >
                  <span className="text-xl flex-shrink-0">{site.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{site.name}</p>
                  </div>
                  <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <RecipeFormModal
          foodItems={foodItems}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
