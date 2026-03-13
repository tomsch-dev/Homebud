import { Nutrition } from '../api/foodItems';

interface Props {
  nutrition: Nutrition;
}

export default function NutritionCard({ nutrition }: Props) {
  const rows = [
    { label: 'Calories', value: `${nutrition.calories.toFixed(1)} kcal` },
    { label: 'Protein', value: `${nutrition.protein_g.toFixed(1)} g` },
    { label: 'Total Fat', value: `${nutrition.fat_total_g.toFixed(1)} g` },
    { label: 'Saturated Fat', value: `${nutrition.fat_saturated_g.toFixed(1)} g` },
    { label: 'Carbohydrates', value: `${nutrition.carbohydrates_total_g.toFixed(1)} g` },
    { label: 'Fiber', value: `${nutrition.fiber_g.toFixed(1)} g` },
    { label: 'Sugar', value: `${nutrition.sugar_g.toFixed(1)} g` },
    { label: 'Sodium', value: `${nutrition.sodium_mg.toFixed(0)} mg` },
    { label: 'Potassium', value: `${nutrition.potassium_mg.toFixed(0)} mg` },
    { label: 'Cholesterol', value: `${nutrition.cholesterol_mg.toFixed(0)} mg` },
  ];

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h4 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">
        Nutrition Facts <span className="text-gray-400 font-normal normal-case">(per {nutrition.serving_size_g}g)</span>
      </h4>
      <div className="space-y-1">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between text-sm">
            <span className="text-gray-600">{row.label}</span>
            <span className="font-medium text-gray-800">{row.value}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-3">
        Last updated: {new Date(nutrition.fetched_at).toLocaleDateString()}
      </p>
    </div>
  );
}
