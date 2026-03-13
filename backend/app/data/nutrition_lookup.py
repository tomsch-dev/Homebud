"""
Local food nutrition database lookup.
Searches foods.json for a matching entry by food name.
"""
import json
from pathlib import Path

_DB_PATH = Path(__file__).parent / "foods.json"
_foods: list[dict] | None = None


def _load() -> list[dict]:
    global _foods
    if _foods is None:
        with open(_DB_PATH, encoding="utf-8") as f:
            _foods = json.load(f)
    return _foods


def _all_names(entry: dict) -> list[str]:
    """Returns the canonical name plus all aliases, lowercased."""
    names = [entry["name"].lower()]
    names += [a.lower() for a in entry.get("aliases", [])]
    return names


def lookup(food_name: str) -> dict | None:
    """
    Returns the best-matching nutrition entry for food_name, or None if not found.
    Searches canonical name and aliases (supports English, German, etc.).
    Match priority: exact → starts-with → contains (all case-insensitive).
    """
    foods = _load()
    query = food_name.strip().lower()

    exact = next((f for f in foods if query in _all_names(f)), None)
    if exact:
        return exact

    starts = next((f for f in foods if any(n.startswith(query) for n in _all_names(f))), None)
    if starts:
        return starts

    contains = next((f for f in foods if any(query in n for n in _all_names(f))), None)
    return contains
