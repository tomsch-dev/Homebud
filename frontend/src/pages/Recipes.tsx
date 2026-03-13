import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { recipesApi, Recipe, CreateRecipe } from '../api/recipes';
import { foodItemsApi, FoodItem } from '../api/foodItems';
import RecipeFormModal from '../components/RecipeFormModal';

export default function Recipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const load = () => {
    Promise.all([recipesApi.getAll(), foodItemsApi.getAll()])
      .then(([recs, items]) => { setRecipes(recs); setFoodItems(items); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this recipe?')) return;
    await recipesApi.delete(id);
    setRecipes((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSave = async (data: CreateRecipe) => {
    await recipesApi.create(data);
    load();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recipes</h1>
          <p className="text-gray-500 mt-1">{recipes.length} saved recipes</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/ai-recommendations"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
          >
            🤖 AI Suggestions
          </Link>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
          >
            + New Recipe
          </button>
        </div>
      </div>

      {recipes.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">👨‍🍳</p>
          <p className="text-lg font-medium">No recipes yet</p>
          <p className="text-sm mt-1">Create your first recipe or get AI suggestions</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <div key={recipe.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900 leading-snug">{recipe.name}</h3>
                  {recipe.is_ai_generated && (
                    <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium flex-shrink-0">AI</span>
                  )}
                </div>
                {recipe.description && (
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">{recipe.description}</p>
                )}
                <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                  {recipe.prep_time_min && <span>Prep: {recipe.prep_time_min}m</span>}
                  {recipe.cook_time_min && <span>Cook: {recipe.cook_time_min}m</span>}
                  <span>{recipe.servings} serving{recipe.servings !== 1 ? 's' : ''}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">{recipe.ingredients.length} ingredients • {recipe.steps.length} steps</p>
              </div>
              <div className="px-5 pb-4 flex gap-2">
                <Link
                  to={`/recipes/${recipe.id}`}
                  className="flex-1 text-center text-sm px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors font-medium"
                >
                  View
                </Link>
                <button
                  onClick={() => handleDelete(recipe.id)}
                  className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
