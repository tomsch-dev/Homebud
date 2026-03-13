from app.data.nutrition_lookup import lookup


def fetch_nutrition(food_name: str) -> dict:
    """
    Looks up nutrition data from the local food database.
    Raises ValueError if no match is found.
    """
    entry = lookup(food_name)
    if not entry:
        raise ValueError(f"No nutrition data found for '{food_name}'")

    def _f(val) -> float:
        try:
            return float(val) if val else 0.0
        except (TypeError, ValueError):
            return 0.0

    return {
        "serving_size_g": _f(entry.get("serving_size_g", 100)),
        "calories": _f(entry.get("calories")),
        "protein_g": _f(entry.get("protein_g")),
        "fat_total_g": _f(entry.get("fat_total_g")),
        "carbohydrates_total_g": _f(entry.get("carbohydrates_total_g")),
    }
