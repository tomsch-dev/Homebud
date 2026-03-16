import { useState, useEffect, useRef } from 'react';
import { CreateRecipe } from '../api/recipes';
import { FoodItem } from '../api/foodItems';
import { foodDataApi, FoodDataItem } from '../api/foodData';

interface Props {
  foodItems: FoodItem[];
  onSave: (data: CreateRecipe) => Promise<void>;
  onClose: () => void;
}

const UNITS = ['g', 'kg', 'ml', 'l', 'pieces', 'tbsp', 'tsp', 'cup', 'oz', 'lb'];

function IngredientNameInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (name: string) => void;
}) {
  const [suggestions, setSuggestions] = useState<FoodDataItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChange = (v: string) => {
    onChange(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (v.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await foodDataApi.search(v, 6);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch {
        setSuggestions([]);
      }
    }, 250);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        required
        placeholder="Ingredient"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
        autoComplete="off"
      />
      {showSuggestions && (
        <ul className="absolute z-30 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
          {suggestions.map((fd) => (
            <li
              key={fd.api_food_id}
              onClick={() => {
                onChange(fd.display_name);
                setShowSuggestions(false);
              }}
              className="px-2 py-1.5 hover:bg-primary-50 cursor-pointer text-xs border-b border-gray-50 last:border-0"
            >
              <span className="font-medium text-gray-800">{fd.display_name}</span>
              {fd.source === 'usda' && (
                <span className="text-blue-500 font-medium ml-1">USDA</span>
              )}
              {fd.calories_kcal != null && (
                <span className="text-gray-400 ml-1">{fd.calories_kcal} kcal/100g</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function RecipeFormModal({ foodItems, onSave, onClose }: Props) {
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
      setError('Failed to save recipe. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold">New Recipe</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && <p className="text-red-600 text-sm">{error}</p>}

          {/* Basic info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recipe Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g. Spaghetti Carbonara"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Servings</label>
                <input
                  type="number" min="1"
                  value={form.servings}
                  onChange={(e) => setForm({ ...form, servings: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prep (min)</label>
                <input
                  type="number" min="0"
                  value={form.prep_time_min}
                  onChange={(e) => setForm({ ...form, prep_time_min: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cook (min)</label>
                <input
                  type="number" min="0"
                  value={form.cook_time_min}
                  onChange={(e) => setForm({ ...form, cook_time_min: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Ingredients *</label>
              <button type="button" onClick={addIngredient} className="text-xs text-primary-600 hover:underline">+ Add</button>
            </div>
            <div className="space-y-2">
              {ingredients.map((ing, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-4">
                    <select
                      value={ing.food_item_id}
                      onChange={(e) => handleIngredientFoodItem(i, e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Custom...</option>
                      {foodItems.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <IngredientNameInput
                      value={ing.name}
                      onChange={(name) => setIngredients(ingredients.map((it, idx) => idx === i ? { ...it, name, food_item_id: '' } : it))}
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number" min="0" step="0.01"
                      value={ing.quantity}
                      onChange={(e) => setIngredients(ingredients.map((it, idx) => idx === i ? { ...it, quantity: parseFloat(e.target.value) } : it))}
                      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <select
                      value={ing.unit}
                      onChange={(e) => setIngredients(ingredients.map((it, idx) => idx === i ? { ...it, unit: e.target.value } : it))}
                      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div className="col-span-1 flex justify-center">
                    {ingredients.length > 1 && (
                      <button type="button" onClick={() => removeIngredient(i)} className="text-red-400 hover:text-red-600 text-sm">&times;</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Steps */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Instructions *</label>
              <button type="button" onClick={addStep} className="text-xs text-primary-600 hover:underline">+ Add Step</button>
            </div>
            <div className="space-y-2">
              {steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-1.5">
                    {step.step_number}
                  </span>
                  <textarea
                    required
                    value={step.instruction}
                    onChange={(e) => setSteps(steps.map((s, idx) => idx === i ? { ...s, instruction: e.target.value } : s))}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={2}
                    placeholder={`Step ${step.step_number}...`}
                  />
                  {steps.length > 1 && (
                    <button type="button" onClick={() => removeStep(i)} className="text-red-400 hover:text-red-600 mt-1.5">&times;</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 rounded-lg transition-colors">
              {saving ? 'Saving...' : 'Save Recipe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
