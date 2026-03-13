import { useState } from 'react';
import { recipesApi } from '../api/recipes';
import { useNavigate } from 'react-router-dom';

interface AiRecipe {
  name: string;
  description: string;
  servings: number;
  prepTimeMin?: number;
  cookTimeMin?: number;
  ingredients: { name: string; quantity: number; unit: string }[];
  steps: { stepNumber: number; instruction: string }[];
}

export default function AIRecommendations() {
  const [recommendations, setRecommendations] = useState<AiRecipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);
  const navigate = useNavigate();

  const handleGetRecommendations = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await recipesApi.getRecommendations();
      setRecommendations(data.recommendations || []);
    } catch {
      setError('Failed to get recommendations. Make sure your OpenAI API key is configured and you have items in your kitchen.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (recipe: AiRecipe, index: number) => {
    setSavingId(index);
    try {
      const saved = await recipesApi.saveRecommendation({
        ...recipe,
        isAiGenerated: true,
      });
      navigate(`/recipes/${saved.id}`);
    } catch {
      alert('Failed to save recipe.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Chef</h1>
        <p className="text-gray-500 mt-1">
          Get personalized recipe suggestions based on what's in your kitchen
        </p>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6 text-center">
        <p className="text-4xl mb-3">🤖</p>
        <h2 className="text-lg font-semibold text-purple-900 mb-2">Ready to cook something amazing?</h2>
        <p className="text-sm text-purple-700 mb-4">
          The AI chef will analyze your ingredients and suggest 3 recipes you can make right now.
          Expiring ingredients are prioritized.
        </p>
        <button
          onClick={handleGetRecommendations}
          disabled={loading}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors font-medium"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Thinking...
            </span>
          ) : (
            'Get Recipe Suggestions'
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{error}</div>
      )}

      {recommendations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Suggested Recipes</h2>
          {recommendations.map((recipe, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div
                className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpanded(expanded === index ? null : index)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{recipe.name}</h3>
                    {recipe.description && <p className="text-sm text-gray-500 mt-1">{recipe.description}</p>}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      {recipe.prepTimeMin && <span>Prep: {recipe.prepTimeMin}m</span>}
                      {recipe.cookTimeMin && <span>Cook: {recipe.cookTimeMin}m</span>}
                      <span>{recipe.servings} serving{recipe.servings !== 1 ? 's' : ''}</span>
                      <span>{recipe.ingredients.length} ingredients</span>
                    </div>
                  </div>
                  <span className="text-gray-400 text-sm">{expanded === index ? '▲' : '▼'}</span>
                </div>
              </div>

              {expanded === index && (
                <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2 text-sm">Ingredients</h4>
                    <ul className="space-y-1">
                      {recipe.ingredients.map((ing, i) => (
                        <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-primary-400 rounded-full flex-shrink-0" />
                          {ing.quantity} {ing.unit} {ing.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2 text-sm">Instructions</h4>
                    <ol className="space-y-2">
                      {recipe.steps.map((step, i) => (
                        <li key={i} className="text-sm text-gray-600 flex gap-3">
                          <span className="flex-shrink-0 w-5 h-5 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {step.stepNumber}
                          </span>
                          {step.instruction}
                        </li>
                      ))}
                    </ol>
                  </div>
                  <button
                    onClick={() => handleSave(recipe, index)}
                    disabled={savingId === index}
                    className="w-full py-2 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors text-sm font-medium"
                  >
                    {savingId === index ? 'Saving...' : 'Save to My Recipes'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
