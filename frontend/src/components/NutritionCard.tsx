import { Nutrition } from '../api/foodItems';

interface Props {
  nutrition: Nutrition;
}

export default function NutritionCard({ nutrition }: Props) {
  const macros = [
    { label: 'Calories', value: nutrition.calories, unit: 'kcal', color: 'text-gray-900' },
    { label: 'Protein', value: nutrition.protein_g, unit: 'g', color: 'text-blue-600' },
    { label: 'Carbs', value: nutrition.carbohydrates_total_g, unit: 'g', color: 'text-amber-600' },
    { label: 'Fat', value: nutrition.fat_total_g, unit: 'g', color: 'text-red-500' },
  ];

  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Nutrition Facts
        </h4>
        <span className="text-[11px] text-gray-400">per {nutrition.serving_size_g}g</span>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {macros.map(({ label, value, unit, color }) => (
          <div key={label} className="text-center">
            <p className={`text-lg font-bold ${color}`}>{value.toFixed(0)}</p>
            <p className="text-[11px] text-gray-400">{unit} {label.toLowerCase()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
