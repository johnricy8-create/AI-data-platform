from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.metrics import get_inventory_alerts, get_product_detail, get_products_page, resolve_range

router = APIRouter(tags=["products"])


@router.get("/products")
def products(
    range_key: str = Query("30d", alias="range"),
    start: date | None = None,
    end: date | None = None,
    channel: str | None = None,
    category: str | None = None,
    db: Session = Depends(get_db),
):
    start_date, end_date, _ = resolve_range(range_key, start, end)
    return get_products_page(db, start_date, end_date, channel, category)


@router.get("/products/{product_id}")
def product_detail(product_id: str, db: Session = Depends(get_db)):
    detail = get_product_detail(db, product_id)
    if not detail:
        raise HTTPException(status_code=404, detail="商品不存在")
    return detail


@router.get("/inventory/alerts")
def inventory_alerts(db: Session = Depends(get_db)):
    return {"items": get_inventory_alerts(db)}
