from datetime import date, datetime, time

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.base import Base
from app.db.models import Inventory, Order, OrderItem, Product, TrafficDaily


@pytest.fixture()
def db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine, expire_on_commit=False)()
    today = date.today()
    now = datetime.combine(today, time(10, 0))

    session.add_all(
        [
            Product(id="P1", name="测试商品一", category="数码配件", cost_price_cents=5000, sale_price_cents=10000),
            Product(id="P2", name="测试商品二", category="运动户外", cost_price_cents=2000, sale_price_cents=5000),
        ]
    )
    session.add_all(
        [
            Order(
                id="O1",
                order_date=today,
                paid_at=now,
                channel="淘宝",
                status="completed",
                buyer_id="B1",
                total_amount_cents=10000,
                discount_cents=0,
                refund_amount_cents=0,
            ),
            Order(
                id="O2",
                order_date=today,
                paid_at=now,
                channel="京东",
                status="refunded",
                buyer_id="B2",
                total_amount_cents=5000,
                discount_cents=0,
                refund_amount_cents=5000,
            ),
            Order(
                id="O3",
                order_date=today,
                paid_at=now,
                channel="淘宝",
                status="cancelled",
                buyer_id="B3",
                total_amount_cents=9000,
                discount_cents=0,
                refund_amount_cents=0,
            ),
        ]
    )
    session.add_all(
        [
            OrderItem(order_id="O1", product_id="P1", quantity=1, unit_price_cents=10000, cost_price_cents=5000),
            OrderItem(
                order_id="O2",
                product_id="P2",
                quantity=1,
                unit_price_cents=5000,
                cost_price_cents=2000,
                refund_qty=1,
                refund_amount_cents=5000,
            ),
            OrderItem(order_id="O3", product_id="P1", quantity=1, unit_price_cents=9000, cost_price_cents=5000),
        ]
    )
    session.add_all(
        [
            TrafficDaily(date=today, channel="淘宝", visitors=600, page_views=1800, add_to_cart=60, paid_buyers=1),
            TrafficDaily(date=today, channel="京东", visitors=400, page_views=1200, add_to_cart=40, paid_buyers=1),
            Inventory(product_id="P1", stock_quantity=5, safety_stock=10, lead_time_days=7),
            Inventory(product_id="P2", stock_quantity=100, safety_stock=10, lead_time_days=7),
        ]
    )
    session.commit()
    yield session
    session.close()
