import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { recipesApi, Recipe } from '../api/recipes';

export default function RecipeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) recipesApi.getOne(id).then(setRecipe).finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Delete this recipe?')) return;
    await recipesApi.delete(id!);
    navigate('/recipes');
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!recipe) return <div className="text-center py-16 text-gray-400">Recipe not found</div>;

  const totalTime = (recipe.prep_time_min || 0) + (recipe.cook_time_min || 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link to="/recipes" className="text-sm text-primary-600 hover:underline">← Back to Recipes</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">{recipe.name}</h1>
          {recipe.is_ai_generated && (
            <span className="inline-block text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium mt-1">AI Generated</span>
          )}
          {recipe.description && <p className="text-gray-500 mt-2">{recipe.description}</p>}
        </div>
        <button
          onClick={handleDelete}
          className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors flex-shrink-0"
        >
          Delete
        </button>
      </div>

      <div className="flex items-center gap-6 text-sm text-gray-500 bg-gray-50 rounded-xl p-4">
        <div className="text-center">
          <p className="font-semibold text-gray-900 text-lg">{recipe.servings}</p>
          <p>Servings</p>
        </div>
        {recipe.prep_time_min && (
          <div className="text-center">
            <p className="font-semibold text-gray-900 text-lg">{recipe.prep_time_min}m</p>
            <p>Prep</p>
          </div>
        )}
        {recipe.cook_time_min && (
          <div className="text-center">
            <p className="font-semibold text-gray-900 text-lg">{recipe.cook_time_min}m</p>
            <p>Cook</p>
          </div>
        )}
        {totalTime > 0 && (
          <div className="text-center">
            <p className="font-semibold text-gray-900 text-lg">{totalTime}m</p>
            <p>Total</p>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Ingredients</h2>
        <ul className="space-y-2">
          {recipe.ingredients.map((ing) => (
            <li key={ing.id} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
              <span className="w-2 h-2 bg-primary-400 rounded-full flex-shrink-0" />
              <span className="font-medium text-gray-700">{ing.quantity} {ing.unit}</span>
              <span className="text-gray-900">{ing.name}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Instructions</h2>
        <ol className="space-y-3">
          {recipe.steps.map((step) => (
            <li key={step.id} className="flex gap-4 p-4 bg-white border border-gray-200 rounded-lg">
              <span className="flex-shrink-0 w-7 h-7 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                {step.step_number}
              </span>
              <p className="text-gray-700 leading-relaxed">{step.instruction}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
