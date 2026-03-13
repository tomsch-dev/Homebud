import httpx
from app.config import settings


async def fetch_nutrition(food_name: str, quantity: float, unit: str) -> dict:
    """
    Calls API Ninjas and returns aggregated nutrition fields.
    Raises ValueError if no data found.
    """
    query = f"{quantity}{unit} {food_name}"
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://api.api-ninjas.com/v1/nutrition",
            params={"query": query},
            headers={"X-Api-Key": settings.api_ninjas_key},
            timeout=10.0,
        )
        resp.raise_for_status()
        data = resp.json()

    if not data:
        raise ValueError(f"No nutrition data found for '{food_name}'")

    agg = {
        "serving_size_g": 0.0,
        "calories": 0.0,
        "fat_total_g": 0.0,
        "fat_saturated_g": 0.0,
        "protein_g": 0.0,
        "sodium_mg": 0.0,
        "potassium_mg": 0.0,
        "cholesterol_mg": 0.0,
        "carbohydrates_total_g": 0.0,
        "fiber_g": 0.0,
        "sugar_g": 0.0,
    }
    for item in data:
        agg["serving_size_g"] += item.get("serving_size_g", 0) or 0
        agg["calories"] += item.get("calories", 0) or 0
        agg["fat_total_g"] += item.get("fat_total_g", 0) or 0
        agg["fat_saturated_g"] += item.get("fat_saturated_g", 0) or 0
        agg["protein_g"] += item.get("protein_g", 0) or 0
        agg["sodium_mg"] += item.get("sodium_mg", 0) or 0
        agg["potassium_mg"] += item.get("potassium_mg", 0) or 0
        agg["cholesterol_mg"] += item.get("cholesterol_mg", 0) or 0
        agg["carbohydrates_total_g"] += item.get("carbohydrates_total_g", 0) or 0
        agg["fiber_g"] += item.get("fiber_g", 0) or 0
        agg["sugar_g"] += item.get("sugar_g", 0) or 0

    return agg
