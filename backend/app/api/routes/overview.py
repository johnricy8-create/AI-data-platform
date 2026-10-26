from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.metrics import get_overview, resolve_range

router = APIRouter(tags=["overview"])


@router.get("/overview")
def overview(
    range_key: str = Query("7d", alias="range"),
    start: date | None = None,
    end: date | None = None,
    channel: str | None = None,
    category: str | None = None,
    db: Session = Depends(get_db),
):
    start_date, end_date, resolved_key = resolve_range(range_key, start, end)
    return get_overview(db, start_date, end_date, channel, category, resolved_key)
