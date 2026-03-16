import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from app.database import get_db
from app.models.food_data import FoodData
from app.schemas.food_data import FoodDataOut
from app.services import usda_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/food-data", tags=["food-data"])

# Minimum local results before we bother calling USDA
_LOCAL_THRESHOLD = 3


def _to_dict(food: FoodData) -> dict:
    return {c.key: getattr(food, c.key) for c in food.__table__.columns}


def _search_local(db: Session, term: str, category: Optional[str], limit: int) -> list[FoodData]:
    """Search the local food_data table."""
    query = (
        db.query(FoodData)
        .filter(or_(
            func.lower(FoodData.display_name).contains(term),
            func.lower(FoodData.canonical_name).contains(term),
        ))
    )
    if category:
        query = query.filter(FoodData.category == category)
    return query.order_by(FoodData.quality_score.desc().nullslast()).limit(limit).all()


def _cache_usda_results(db: Session, usda_foods: list[dict]) -> tuple[list[FoodData], set[str]]:
    """
    Cache USDA results into our local food_data table.
    Deduplicates by fdc_id — if already cached, returns the existing row.
    Returns (cached_foods, set_of_newly_inserted_api_food_ids).
    """
    cached = []
    new_ids: set[str] = set()
    for uf in usda_foods:
        fdc_id = uf.get("fdc_id")
        if not fdc_id:
            continue

        # Check if we already have this USDA food cached
        existing = db.query(FoodData).filter(FoodData.fdc_id == fdc_id).first()
        if existing:
            cached.append(existing)
            continue

        food_id = f"USDA{fdc_id}"
        food = FoodData(
            api_food_id=food_id,
            slug=uf["display_name"].lower().replace(" ", "-").replace(",", "")[:80],
            display_name=uf["display_name"],
            canonical_name=uf["canonical_name"],
            description=uf.get("description"),
            category=uf.get("category"),
            is_fast_food=uf.get("is_fast_food", False),
            calories_kcal=uf.get("calories_kcal"),
            protein_g=uf.get("protein_g"),
            carbs_g=uf.get("carbs_g"),
            sugars_g=uf.get("sugars_g"),
            fiber_g=uf.get("fiber_g"),
            fat_g=uf.get("fat_g"),
            saturated_fat_g=uf.get("saturated_fat_g"),
            sodium_mg=uf.get("sodium_mg"),
            cholesterol_mg=uf.get("cholesterol_mg"),
            quality_score=80,
            source="usda",
            fdc_id=fdc_id,
        )
        db.add(food)
        cached.append(food)
        new_ids.add(food_id)

    if cached:
        try:
            db.commit()
            for f in cached:
                db.refresh(f)
        except Exception:
            db.rollback()
            logger.exception("Failed to cache USDA results")
            return [], set()

    return cached, new_ids


@router.get("/search", response_model=List[FoodDataOut])
def search_food_data(
    q: str = Query(..., min_length=1, description="Search term"),
    category: Optional[str] = Query(None, description="Filter by category"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """
    Search food database by name.
    1. Search local DB first (previously cached USDA results)
    2. If local results < threshold, query USDA FDC API
    3. Cache any new USDA results for future searches
    4. Return combined, deduplicated results
    """
    term = q.lower().strip()

    # Step 1: Local search
    local_results = _search_local(db, term, category, limit)

    # Step 2: If we have enough local results, return them
    if len(local_results) >= _LOCAL_THRESHOLD:
        return [_to_dict(r) for r in local_results[:limit]]

    # Step 3: Not enough local results — query USDA API
    usda_foods = usda_service.search_foods(term, page_size=min(limit, 15))

    if not usda_foods:
        return [_to_dict(r) for r in local_results]

    # Step 4: Cache USDA results locally
    cached, new_ids = _cache_usda_results(db, usda_foods)

    # Step 5: Merge local + cached USDA, deduplicate
    seen_ids = set()
    merged: list[dict] = []
    for r in local_results + cached:
        if r.api_food_id not in seen_ids:
            seen_ids.add(r.api_food_id)
            d = _to_dict(r)
            d["is_new"] = r.api_food_id in new_ids
            merged.append(d)

    return merged[:limit]


@router.get("/categories", response_model=List[str])
def list_categories(db: Session = Depends(get_db)):
    """List all distinct food categories from cached data."""
    rows = (
        db.query(FoodData.category)
        .filter(FoodData.category.isnot(None))
        .distinct()
        .order_by(FoodData.category)
        .all()
    )
    return [r[0] for r in rows]


@router.get("/usda-status")
def usda_api_status():
    """Check remaining USDA API calls this hour."""
    return {
        "remaining_calls": usda_service.get_remaining_calls(),
        "max_per_hour": 900,
    }


@router.get("/{food_id}", response_model=FoodDataOut)
def get_food_data(food_id: str, db: Session = Depends(get_db)):
    """Get a single food item by its API food ID."""
    item = db.query(FoodData).filter(FoodData.api_food_id == food_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Food data not found")
    return _to_dict(item)
