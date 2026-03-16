"""
USDA FoodData Central API client with rate-limit awareness.

Docs: https://fdc.nal.usda.gov/api-guide
Free tier: 1,000 requests/hour with DEMO_KEY, or get a key at api.nal.usda.gov.
"""

import re
import time
import logging
from typing import Optional

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

BASE_URL = "https://api.nal.usda.gov/fdc/v1"

# Nutrient IDs we care about
_NUTRIENT_IDS = {
    1008: "calories_kcal",      # Energy (kcal)
    1003: "protein_g",          # Protein
    1005: "carbs_g",            # Carbohydrate, by difference
    1004: "fat_g",              # Total lipid (fat)
    2000: "sugars_g",           # Total Sugars
    1079: "fiber_g",            # Fiber, total dietary
    1258: "saturated_fat_g",    # Fatty acids, total saturated
    1093: "sodium_mg",          # Sodium, Na
    1253: "cholesterol_mg",     # Cholesterol
}

# Simple in-memory rate limiter
_call_timestamps: list[float] = []
_MAX_CALLS_PER_HOUR = 900  # stay under the 1000 limit with margin


def _check_rate_limit() -> bool:
    """Return True if we can make a call, False if rate-limited."""
    now = time.time()
    cutoff = now - 3600
    # Prune old timestamps
    while _call_timestamps and _call_timestamps[0] < cutoff:
        _call_timestamps.pop(0)
    return len(_call_timestamps) < _MAX_CALLS_PER_HOUR


def _record_call():
    _call_timestamps.append(time.time())


def get_api_key() -> str:
    return settings.usda_api_key or "DEMO_KEY"


def search_foods(query: str, page_size: int = 8) -> list[dict]:
    """
    Search USDA FDC for foods matching query.
    Returns a list of simplified food dicts ready for caching.
    Returns empty list if rate-limited or on error.
    """
    if not _check_rate_limit():
        logger.warning("USDA API rate limit approaching, skipping call")
        return []

    try:
        _record_call()
        with httpx.Client(timeout=5.0) as client:
            # Prefer Foundation/SR Legacy for cleaner generic results
            resp = client.get(
                f"{BASE_URL}/foods/search",
                params={
                    "query": query,
                    "pageSize": page_size,
                    "api_key": get_api_key(),
                    "dataType": ["Foundation", "SR Legacy"],
                },
            )
            resp.raise_for_status()
            data = resp.json()

        results = []
        for food in data.get("foods", []):
            parsed = _parse_food(food)
            if parsed:
                results.append(parsed)

        # If Foundation/SR Legacy had few results, also search Branded
        if len(results) < 3 and _check_rate_limit():
            _record_call()
            with httpx.Client(timeout=5.0) as client:
                resp = client.get(
                    f"{BASE_URL}/foods/search",
                    params={
                        "query": query,
                        "pageSize": page_size,
                        "api_key": get_api_key(),
                        "dataType": ["Branded"],
                    },
                )
                resp.raise_for_status()
                branded = resp.json()

            seen_fdc = {r["fdc_id"] for r in results}
            for food in branded.get("foods", []):
                parsed = _parse_food(food)
                if parsed and parsed["fdc_id"] not in seen_fdc:
                    results.append(parsed)

        return results[:page_size]
    except Exception as e:
        logger.error(f"USDA API search failed: {e}")
        return []


def get_food_detail(fdc_id: int) -> Optional[dict]:
    """Fetch detailed nutrition for a single food by FDC ID."""
    if not _check_rate_limit():
        return None

    try:
        _record_call()
        with httpx.Client(timeout=5.0) as client:
            resp = client.get(
                f"{BASE_URL}/food/{fdc_id}",
                params={"api_key": get_api_key()},
            )
            resp.raise_for_status()
            return _parse_food(resp.json())
    except Exception as e:
        logger.error(f"USDA API detail fetch failed: {e}")
        return None


def _parse_food(food: dict) -> Optional[dict]:
    """Parse a USDA FDC food response into our simplified format."""
    fdc_id = food.get("fdcId")
    description = food.get("description", "")
    if not fdc_id or not description:
        return None

    # Extract nutrients
    nutrients: dict[str, Optional[float]] = {}
    for n in food.get("foodNutrients", []):
        nid = n.get("nutrientId") or (n.get("nutrient", {}).get("id"))
        if nid and nid in _NUTRIENT_IDS:
            nutrients[_NUTRIENT_IDS[nid]] = n.get("value") or n.get("amount")

    display_name = _clean_name(description.strip(), food.get("dataType", ""))
    category = _clean_category(food.get("foodCategory", "") or "")

    return {
        "fdc_id": fdc_id,
        "display_name": display_name,
        "canonical_name": display_name.lower(),
        "description": food.get("additionalDescriptions", ""),
        "category": category,
        "is_fast_food": False,
        "data_type": food.get("dataType", ""),
        "calories_kcal": nutrients.get("calories_kcal"),
        "protein_g": nutrients.get("protein_g"),
        "carbs_g": nutrients.get("carbs_g"),
        "fat_g": nutrients.get("fat_g"),
        "sugars_g": nutrients.get("sugars_g"),
        "fiber_g": nutrients.get("fiber_g"),
        "saturated_fat_g": nutrients.get("saturated_fat_g"),
        "sodium_mg": nutrients.get("sodium_mg"),
        "cholesterol_mg": nutrients.get("cholesterol_mg"),
    }


# Regex to strip package sizes like "170g", "500ml", "16 fl oz/473 mL", "7 oz/198 g"
_PACKAGE_SIZE_RE = re.compile(
    r",?\s*\d+\s*(?:fl\s*)?(?:g|kg|ml|l|oz|lb|mL|fl oz)(?:\s*/\s*\d+\s*(?:g|kg|ml|l|mL))?\s*$",
    re.IGNORECASE,
)
def _clean_name(raw: str, data_type: str = "") -> str:
    """Clean up USDA food names: title-case, strip package sizes, trim redundancy."""
    name = raw.strip()

    # Title-case ALL CAPS branded names
    if name.isupper():
        name = name.title()

    # Strip package size suffixes like "170g", "16 fl oz/473 mL"
    name = _PACKAGE_SIZE_RE.sub("", name).strip().rstrip(",").strip()

    # For branded: if name has comma-separated parts, keep the most descriptive
    # e.g. "Plain Skyr Icelandic Yogurt Skyr Yogurt, Plain Skyr" -> "Plain Skyr Icelandic Yogurt"
    if data_type == "Branded" and ", " in name:
        parts = [p.strip() for p in name.split(", ")]
        # Use the shortest meaningful part, or first part if similar length
        if len(parts) >= 2:
            # Pick the shorter half — usually the clean product name
            a, b = parts[0], parts[-1]
            # If last part is contained in first part, just use first part
            if b.lower() in a.lower():
                name = a
            elif a.lower() in b.lower():
                name = b
            else:
                name = parts[0]

    # Collapse multiple spaces
    name = re.sub(r"\s{2,}", " ", name).strip()

    return name


# Category mapping: USDA categories -> clean short labels
_CATEGORY_MAP = {
    "yogurt": "dairy",
    "cheese": "dairy",
    "milk": "dairy",
    "cream": "dairy",
    "butter": "dairy",
    "ice cream": "dairy",
    "poultry": "meat",
    "chicken": "meat",
    "beef": "meat",
    "pork": "meat",
    "lamb": "meat",
    "sausage": "meat",
    "fish": "seafood",
    "shellfish": "seafood",
    "seafood": "seafood",
    "fruit": "fruits",
    "vegetable": "vegetables",
    "legume": "grains",
    "grain": "grains",
    "cereal": "grains",
    "bread": "grains",
    "pasta": "grains",
    "rice": "grains",
    "baked": "grains",
    "beverage": "beverages",
    "juice": "beverages",
    "water": "beverages",
    "coffee": "beverages",
    "tea": "beverages",
    "soda": "beverages",
    "sauce": "condiments",
    "condiment": "condiments",
    "spice": "condiments",
    "dressing": "condiments",
    "oil": "condiments",
    "vinegar": "condiments",
    "snack": "snacks",
    "chip": "snacks",
    "cracker": "snacks",
    "candy": "snacks",
    "chocolate": "snacks",
    "cookie": "snacks",
    "frozen": "frozen",
    "baby": "other",
    "infant": "other",
    "supplement": "other",
    "dessert": "snacks",
}


def _clean_category(raw: str) -> Optional[str]:
    """Map USDA food categories to our clean category labels."""
    if not raw:
        return None

    lower = raw.lower().replace("_", " ").replace("/", " ")

    # Direct keyword matching against our map
    for keyword, cat in _CATEGORY_MAP.items():
        if keyword in lower:
            return cat

    return "other"


def get_remaining_calls() -> int:
    """Return approximate remaining API calls this hour."""
    now = time.time()
    cutoff = now - 3600
    while _call_timestamps and _call_timestamps[0] < cutoff:
        _call_timestamps.pop(0)
    return _MAX_CALLS_PER_HOUR - len(_call_timestamps)
