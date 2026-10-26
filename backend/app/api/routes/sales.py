from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.metrics import get_sales_page, resolve_range

router = APIRouter(tags=["sales"])


@router.get("/sales")
def sales(
    range_key: str = Query("30d", alias="range"),
    start: date | None = None,
    end: date | None = None,
    channel: str | None = None,
    category: str | None = None,
    db: Session = Depends(get_db),
):
    start_date, end_date, _ = resolve_range(range_key, start, end)
    return get_sales_page(db, start_date, end_date, channel, category)
