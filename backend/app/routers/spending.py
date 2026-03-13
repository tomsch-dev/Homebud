from datetime import date, timedelta
from collections import defaultdict
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.grocery import GroceryTrip, GroceryTripItem
from app.models.eating_out import EatingOutExpense
from app.schemas.spending import SpendingSummary, WeeklyBreakdown

router = APIRouter(prefix="/spending", tags=["spending"])


def _week_start(d: date) -> date:
    return d - timedelta(days=d.weekday())


@router.get("/summary", response_model=SpendingSummary)
def spending_summary(
    start: date = Query(..., description="Start date (YYYY-MM-DD)"),
    end: date = Query(..., description="End date (YYYY-MM-DD)"),
    currency: str = Query("EUR"),
    db: Session = Depends(get_db),
):
    # Grocery totals per trip in range
    trips = (
        db.query(GroceryTrip)
        .filter(GroceryTrip.trip_date >= start, GroceryTrip.trip_date <= end)
        .all()
    )
    grocery_total = sum(t.total_amount for t in trips)

    # Eating out in range
    eating = (
        db.query(EatingOutExpense)
        .filter(EatingOutExpense.expense_date >= start, EatingOutExpense.expense_date <= end)
        .all()
    )
    eating_out_total = sum(e.amount for e in eating)

    # Weekly breakdown
    weekly: dict[date, dict] = defaultdict(lambda: {"grocery": 0.0, "eating_out": 0.0})
    for t in trips:
        ws = _week_start(t.trip_date)
        weekly[ws]["grocery"] += t.total_amount
    for e in eating:
        ws = _week_start(e.expense_date)
        weekly[ws]["eating_out"] += e.amount

    weekly_breakdown = sorted([
        WeeklyBreakdown(
            week_start=ws,
            week_end=ws + timedelta(days=6),
            grocery_total=round(v["grocery"], 2),
            eating_out_total=round(v["eating_out"], 2),
            total=round(v["grocery"] + v["eating_out"], 2),
            currency=currency,
        )
        for ws, v in weekly.items()
    ], key=lambda x: x.week_start)

    # Top stores
    store_totals: dict[str, float] = defaultdict(float)
    for t in trips:
        store_totals[t.store_name] += t.total_amount
    top_stores = sorted(
        [{"store": k, "total": round(v, 2)} for k, v in store_totals.items()],
        key=lambda x: x["total"], reverse=True
    )[:5]

    # Top restaurants
    rest_totals: dict[str, float] = defaultdict(float)
    for e in eating:
        rest_totals[e.restaurant_name] += e.amount
    top_restaurants = sorted(
        [{"restaurant": k, "total": round(v, 2)} for k, v in rest_totals.items()],
        key=lambda x: x["total"], reverse=True
    )[:5]

    return SpendingSummary(
        period_start=start,
        period_end=end,
        grocery_total=round(grocery_total, 2),
        eating_out_total=round(eating_out_total, 2),
        total=round(grocery_total + eating_out_total, 2),
        currency=currency,
        weekly_breakdown=weekly_breakdown,
        top_stores=top_stores,
        top_restaurants=top_restaurants,
    )
