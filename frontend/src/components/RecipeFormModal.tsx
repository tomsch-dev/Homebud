import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CreateRecipe } from '../api/recipes';
import { FoodItem } from '../api/foodItems';

interface Props {
  foodItems: FoodItem[];
  onSave: (data: CreateRecipe) => Promise<void>;
  onClose: () => void;
}

const UNITS = ['g', 'kg', 'ml', 'l', 'pieces', 'tbsp', 'tsp', 'cup', 'oz', 'lb'];

export default function RecipeFormModal({ foodItems, onSave, onClose }: Props) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: '',
    description: '',
    servings: 1,
    prep_time_min: 0,
    cook_time_min: 0,
  });
  const [ingredients, setIngredients] = useState([{ name: '', quantity: 1, unit: 'g', food_item_id: '' }]);
  const [steps, setSteps] = useState([{ step_number: 1, instruction: '' }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const addIngredient = () =>
    setIngredients([...ingredients, { name: '', quantity: 1, unit: 'g', food_item_id: '' }]);

  const removeIngredient = (i: number) =>
    setIngredients(ingredients.filter((_, idx) => idx !== i));

  const addStep = () =>
    setSteps([...steps, { step_number: steps.length + 1, instruction: '' }]);

  const removeStep = (i: number) => {
    setSteps(steps.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, step_number: idx + 1 })));
  };

  const handleIngredientFoodItem = (i: number, food_item_id: string) => {
    const foodItem = foodItems.find((f) => f.id === food_item_id);
    setIngredients(ingredients.map((ing, idx) =>
      idx === i
        ? { ...ing, food_item_id, name: foodItem ? foodItem.name : ing.name }
        : ing
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave({
        ...form,
        is_ai_generated: false,
        ingredients: ingredients.map((ing) => ({
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          food_item_id: ing.food_item_id || undefined,
        })),
        steps: steps.filter((s) => s.instruction.trim()),
      });
      onClose();
    } catch {
      setError(t('recipeForm.failedToSave'));
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2.5 text-base sm:text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-gray-700 min-h-[44px]';
  const inputClsSm = 'w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-lg px-2 py-2 text-base sm:text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-gray-700 min-h-[40px]';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 sm:p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10 rounded-t-2xl">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('recipeForm.title')}</h2>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
          {error && <p className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('recipeForm.recipeName')} *</label>
              <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder={t('recipeForm.recipeNamePlaceholder')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('recipeForm.description')}</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls} rows={2} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('common.servings')}</label>
                <input type="number" min="1" value={form.servings} onChange={(e) => setForm({ ...form, servings: parseInt(e.target.value) })} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('recipeForm.prepMin')}</label>
                <input type="number" min="0" value={form.prep_time_min} onChange={(e) => setForm({ ...form, prep_time_min: parseInt(e.target.value) })} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('recipeForm.cookMin')}</label>
                <input type="number" min="0" value={form.cook_time_min} onChange={(e) => setForm({ ...form, cook_time_min: parseInt(e.target.value) })} className={inputCls} />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('recipes.ingredients')} *</label>
              <button type="button" onClick={addIngredient} className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline">{t('recipeForm.addIngredient')}</button>
            </div>
            <div className="space-y-2">
              {ingredients.map((ing, i) => (
                <div key={i} className="relative">
                  {/* Desktop: grid row */}
                  <div className="hidden sm:grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-3">
                      <select value={ing.food_item_id} onChange={(e) => handleIngredientFoodItem(i, e.target.value)} className={inputClsSm}>
                        <option value="">Custom...</option>
                        {foodItems.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                      </select>
                    </div>
                    <div className="col-span-4">
                      <input type="text" required placeholder={t('recipes.ingredients')} value={ing.name}
                        onChange={(e) => setIngredients(ingredients.map((it, idx) => idx === i ? { ...it, name: e.target.value, food_item_id: '' } : it))}
                        className={inputClsSm} autoComplete="off" />
                    </div>
                    <div className="col-span-2">
                      <input type="number" min="0" step="0.01" value={ing.quantity}
                        onChange={(e) => setIngredients(ingredients.map((it, idx) => idx === i ? { ...it, quantity: parseFloat(e.target.value) } : it))}
                        className={inputClsSm} />
                    </div>
                    <div className="col-span-2">
                      <select value={ing.unit} onChange={(e) => setIngredients(ingredients.map((it, idx) => idx === i ? { ...it, unit: e.target.value } : it))} className={inputClsSm}>
                        {UNITS.map((u) => <option key={u} value={u}>{t(`units.${u}`)}</option>)}
                      </select>
                    </div>
                    <div className="col-span-1 flex justify-center">
                      {ingredients.length > 1 && (
                        <button type="button" onClick={() => removeIngredient(i)} className="text-red-400 hover:text-red-600 dark:hover:text-red-400 text-sm">&times;</button>
                      )}
                    </div>
                  </div>
                  {/* Mobile: stacked card */}
                  <div className="sm:hidden bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 space-y-2">
                    {ingredients.length > 1 && (
                      <button type="button" onClick={() => removeIngredient(i)} className="absolute top-2 right-2 text-red-400 hover:text-red-600 dark:hover:text-red-400 text-lg p-1 leading-none">&times;</button>
                    )}
                    <select value={ing.food_item_id} onChange={(e) => handleIngredientFoodItem(i, e.target.value)} className={inputCls}>
                      <option value="">Custom...</option>
                      {foodItems.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                    <input type="text" required placeholder={t('recipes.ingredients')} value={ing.name}
                      onChange={(e) => setIngredients(ingredients.map((it, idx) => idx === i ? { ...it, name: e.target.value, food_item_id: '' } : it))}
                      className={inputCls} autoComplete="off" />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" min="0" step="0.01" value={ing.quantity}
                        onChange={(e) => setIngredients(ingredients.map((it, idx) => idx === i ? { ...it, quantity: parseFloat(e.target.value) } : it))}
                        className={inputCls} placeholder={t('grocery.qty')} />
                      <select value={ing.unit} onChange={(e) => setIngredients(ingredients.map((it, idx) => idx === i ? { ...it, unit: e.target.value } : it))} className={inputCls}>
                        {UNITS.map((u) => <option key={u} value={u}>{t(`units.${u}`)}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('recipes.instructions')} *</label>
              <button type="button" onClick={addStep} className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline">{t('recipeForm.addStep')}</button>
            </div>
            <div className="space-y-2">
              {steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-1.5">
                    {step.step_number}
                  </span>
                  <textarea required value={step.instruction}
                    onChange={(e) => setSteps(steps.map((s, idx) => idx === i ? { ...s, instruction: e.target.value } : s))}
                    className={`flex-1 ${inputCls}`} rows={2} placeholder={`Step ${step.step_number}...`} />
                  {steps.length > 1 && (
                    <button type="button" onClick={() => removeStep(i)} className="text-red-400 hover:text-red-600 dark:hover:text-red-400 mt-1.5">&times;</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors min-h-[48px]">
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-3 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition-colors min-h-[48px]">
              {saving ? t('common.saving') : t('recipeForm.saveRecipe')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
