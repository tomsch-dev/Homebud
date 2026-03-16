import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { recipesApi, Recipe, CreateRecipe } from '../api/recipes';
import { foodItemsApi, FoodItem } from '../api/foodItems';
import RecipeFormModal from '../components/RecipeFormModal';
import { useToast } from '../components/Toast';

export default function Recipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const toast = useToast();

  const load = () => {
    Promise.all([recipesApi.getAll(), foodItemsApi.getAll()])
      .then(([recs, items]) => { setRecipes(recs); setFoodItems(items); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    const confirmed = await toast.confirm('Delete this recipe?');
    if (!confirmed) return;
    await recipesApi.delete(id);
    setRecipes((prev) => prev.filter((r) => r.id !== id));
    toast.success('Recipe deleted');
  };

  const handleSave = async (data: CreateRecipe) => {
    await recipesApi.create(data);
    load();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Recipes</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{recipes.length} saved recipes</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/ai-recommendations"
            className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors text-sm font-medium"
          >
            AI Suggestions
          </Link>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-sm font-medium"
          >
            + New Recipe
          </button>
        </div>
      </div>

      {recipes.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">No recipes yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Create your first recipe or get AI suggestions</p>
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
                  {recipe.prep_time_min && <span>Prep: {recipe.prep_time_min}m</span>}
                  {recipe.cook_time_min && <span>Cook: {recipe.cook_time_min}m</span>}
                  <span>{recipe.servings} serving{recipe.servings !== 1 ? 's' : ''}</span>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{recipe.ingredients.length} ingredients &middot; {recipe.steps.length} steps</p>
              </div>
              <div className="px-5 pb-4 flex gap-2">
                <Link
                  to={`/recipes/${recipe.id}`}
                  className="flex-1 text-center text-sm px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors font-medium"
                >
                  View
                </Link>
                <button
                  onClick={() => handleDelete(recipe.id)}
                  className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
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
