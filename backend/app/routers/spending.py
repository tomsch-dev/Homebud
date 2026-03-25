from datetime import date, timedelta
from collections import defaultdict
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user_id
from app.models.grocery import GroceryTrip, GroceryTripItem
from app.models.eating_out import EatingOutExpense
from app.models.subscription import Subscription
from app.models.income import Income
from app.schemas.spending import SpendingSummary, WeeklyBreakdown
from app.utils.household import get_visible_user_ids

CYCLE_MONTHLY_FACTOR = {
    "weekly": 52 / 12,
    "monthly": 1.0,
    "quarterly": 1 / 3,
    "yearly": 1 / 12,
}

router = APIRouter(prefix="/spending", tags=["spending"])


def _week_start(d: date) -> date:
    return d - timedelta(days=d.weekday())


@router.get("/summary", response_model=SpendingSummary)
def spending_summary(
    start: date = Query(..., description="Start date (YYYY-MM-DD)"),
    end: date = Query(..., description="End date (YYYY-MM-DD)"),
    currency: str = Query("EUR"),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    # Grocery totals per trip in range
    grocery_user_ids = get_visible_user_ids(user_id, "share_grocery_trips", db)
    trips = (
        db.query(GroceryTrip)
        .filter(
            GroceryTrip.user_id.in_(grocery_user_ids),
            GroceryTrip.trip_date >= start,
            GroceryTrip.trip_date <= end,
        )
        .all()
    )
    grocery_total = sum(t.total_amount for t in trips)

    # Eating out in range
    eating_user_ids = get_visible_user_ids(user_id, "share_eating_out", db)
    eating = (
        db.query(EatingOutExpense)
        .filter(
            EatingOutExpense.user_id.in_(eating_user_ids),
            EatingOutExpense.expense_date >= start,
            EatingOutExpense.expense_date <= end,
        )
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

    # Active subscriptions — prorate monthly cost by number of months in range
    sub_user_ids = get_visible_user_ids(user_id, "share_subscriptions", db)
    active_subs = (
        db.query(Subscription)
        .filter(Subscription.user_id.in_(sub_user_ids), Subscription.is_active == True)  # noqa: E712
        .all()
    )
    months_in_range = max(1, round((end - start).days / 30.44))
    subscription_total = sum(
        sub.amount * CYCLE_MONTHLY_FACTOR.get(sub.billing_cycle, 1.0) * months_in_range
        for sub in active_subs
    )

    # Income in range
    income_user_ids = get_visible_user_ids(user_id, "share_subscriptions", db)
    income_entries = (
        db.query(Income)
        .filter(Income.user_id.in_(income_user_ids), Income.income_date >= start, Income.income_date <= end)
        .all()
    )
    income_total = sum(i.amount for i in income_entries)

    return SpendingSummary(
        period_start=start,
        period_end=end,
        grocery_total=round(grocery_total, 2),
        eating_out_total=round(eating_out_total, 2),
        subscription_total=round(subscription_total, 2),
        income_total=round(income_total, 2),
        total=round(grocery_total + eating_out_total + subscription_total, 2),
        currency=currency,
        weekly_breakdown=weekly_breakdown,
        top_stores=top_stores,
        top_restaurants=top_restaurants,
    )
