"""Deterministic sample data for the MVP.

The data is intentionally realistic enough to exercise every screen:
- 75 days of orders, order items and traffic
- 12 SKUs across 4 categories
- 5 sales channels
- low-stock and high-growth cases
"""

from __future__ import annotations

import math
import random
from datetime import date, datetime, time, timedelta

from sqlalchemy import delete, func, insert, select
from sqlalchemy.orm import Session

from app.db.models import AIReport, ImportJob, Inventory, Order, OrderItem, Product, TrafficDaily
from app.db.session import SessionLocal

PRODUCTS = [
    {"id": "P001", "name": "蓝牙耳机 Pro", "category": "数码配件", "cost": 18000, "sale": 39900, "weight": 0.18},
    {"id": "P002", "name": "轻量跑鞋", "category": "运动户外", "cost": 21000, "sale": 46900, "weight": 0.15},
    {"id": "P003", "name": "磁吸手机壳", "category": "数码配件", "cost": 2500, "sale": 8900, "weight": 0.14},
    {"id": "P004", "name": "快充充电宝", "category": "数码配件", "cost": 9900, "sale": 15900, "weight": 0.12},
    {"id": "P005", "name": "城市机能卫衣", "category": "服饰鞋包", "cost": 12000, "sale": 29900, "weight": 0.08},
    {"id": "P006", "name": "智能手环", "category": "数码配件", "cost": 15000, "sale": 24900, "weight": 0.08},
    {"id": "P007", "name": "防晒外套", "category": "服饰鞋包", "cost": 8000, "sale": 19900, "weight": 0.06},
    {"id": "P008", "name": "便携咖啡杯", "category": "家居生活", "cost": 4500, "sale": 9900, "weight": 0.06},
    {"id": "P009", "name": "桌面收纳盒", "category": "家居生活", "cost": 3000, "sale": 6900, "weight": 0.05},
    {"id": "P010", "name": "运动水壶", "category": "运动户外", "cost": 3500, "sale": 7900, "weight": 0.04},
    {"id": "P011", "name": "无线鼠标", "category": "数码配件", "cost": 5000, "sale": 12900, "weight": 0.02},
    {"id": "P012", "name": "香薰蜡烛", "category": "家居生活", "cost": 2800, "sale": 7900, "weight": 0.02},
]

CHANNELS = [
    ("淘宝", 0.38, 0.026),
    ("京东", 0.22, 0.032),
    ("拼多多", 0.15, 0.021),
    ("抖音", 0.13, 0.024),
    ("其他", 0.12, 0.022),
]

STATUS_WEIGHTS = [
    ("completed", 0.80, 0),
    ("shipped", 0.08, 1),
    ("paid", 0.06, 2),
    ("refunded", 0.03, 3),
    ("partially_refunded", 0.01, 4),
    ("cancelled", 0.02, 5),
]

INVENTORY = {
    "P001": (4200, 800, 7),
    "P002": (64, 80, 10),
    "P003": (3800, 600, 5),
    "P004": (18, 60, 7),
    "P005": (1600, 300, 9),
    "P006": (350, 400, 8),
    "P007": (1200, 240, 10),
    "P008": (1800, 300, 7),
    "P009": (2200, 300, 5),
    "P010": (180, 200, 8),
    "P011": (900, 150, 7),
    "P012": (1400, 200, 7),
}


def _weighted_choice(rng: random.Random, items: list[tuple[str, float, int]] | list[dict], key: str | None = None):
    if key:
        total = sum(item[key] for item in items)
        roll = rng.random() * total
        upto = 0.0
        for item in items:
            upto += item[key]
            if roll <= upto:
                return item
        return items[-1]
    total = sum(item[1] for item in items)
    roll = rng.random() * total
    upto = 0.0
    for item in items:
        upto += item[1]
        if roll <= upto:
            return item
    return items[-1]


def _make_order(rng: random.Random, day: date, index: int) -> tuple[dict, list[dict]]:
    channel = _weighted_choice(rng, [(name, share, 0) for name, share, _ in CHANNELS])[0]
    status = _weighted_choice(rng, STATUS_WEIGHTS)[0]
    order_id = f"ORD-{day.strftime('%Y%m%d')}-{index:06d}"
    buyer_id = f"BUY-{day.strftime('%m%d')}-{rng.randint(1, 9000):05d}"

    item_count = rng.choices([1, 2, 3], weights=[0.90, 0.09, 0.01], k=1)[0]
    selected: set[str] = set()
    items: list[dict] = []
    total = 0

    for _ in range(item_count):
        product = _weighted_choice(rng, PRODUCTS, key="weight")
        if product["id"] in selected:
            continue
        selected.add(product["id"])
        quantity = rng.choices([1, 2, 3], weights=[0.86, 0.12, 0.02], k=1)[0]
        unit_price = product["sale"]
        if rng.random() < 0.06:
            unit_price = int(round(unit_price * rng.uniform(0.88, 0.98) / 100)) * 100
        line_total = unit_price * quantity
        total += line_total
        items.append(
            {
                "order_id": order_id,
                "product_id": product["id"],
                "quantity": quantity,
                "unit_price_cents": unit_price,
                "cost_price_cents": product["cost"],
                "refund_qty": 0,
                "refund_amount_cents": 0,
                "_line_total": line_total,
            }
        )

    if not items:
        product = PRODUCTS[0]
        items.append(
            {
                "order_id": order_id,
                "product_id": product["id"],
                "quantity": 1,
                "unit_price_cents": product["sale"],
                "cost_price_cents": product["cost"],
                "refund_qty": 0,
                "refund_amount_cents": 0,
                "_line_total": product["sale"],
            }
        )
        total = product["sale"]

    discount = rng.choice([0, 0, 0, 500, 1000, 2000]) if total >= 10000 else 0
    net_total = max(0, total - discount)
    refund_amount = 0

    if status == "refunded":
        refund_amount = net_total
        for item in items:
            item["refund_qty"] = item["quantity"]
            item["refund_amount_cents"] = item["_line_total"]
    elif status == "partially_refunded":
        ratio = rng.uniform(0.2, 0.55)
        refund_amount = int(round(net_total * ratio))
        for item in items:
            item["refund_qty"] = 1 if item["quantity"] > 1 and rng.random() < 0.5 else 0
            item["refund_amount_cents"] = int(round(item["_line_total"] * ratio))

    # Keep item-level refunds aligned with the order-level refund.
    item_refund_sum = sum(item["refund_amount_cents"] for item in items)
    if item_refund_sum > refund_amount and item_refund_sum > 0:
        scale = refund_amount / item_refund_sum
        for item in items:
            item["refund_amount_cents"] = int(round(item["refund_amount_cents"] * scale))
    if refund_amount == 0:
        for item in items:
            item["refund_amount_cents"] = 0
            item["refund_qty"] = 0

    paid_at = None
    if status not in {"cancelled", "pending_payment"}:
        paid_at = datetime.combine(day, time(rng.randint(8, 23), rng.randint(0, 59), rng.randint(0, 59)))

    order = {
        "id": order_id,
        "order_date": day,
        "paid_at": paid_at,
        "channel": channel,
        "status": status,
        "buyer_id": buyer_id,
        "total_amount_cents": total,
        "discount_cents": discount,
        "refund_amount_cents": refund_amount,
    }
    for item in items:
        item.pop("_line_total", None)
    return order, items


def seed_database(force: bool = False) -> dict[str, int]:
    with SessionLocal() as db:
        existing = db.scalar(select(func.count()).select_from(Product)) or 0
        if existing and not force:
            return {"seeded": 0, "orders": 0, "items": 0, "products": existing}

        if force:
            db.execute(delete(AIReport))
            db.execute(delete(ImportJob))
            db.execute(delete(TrafficDaily))
            db.execute(delete(OrderItem))
            db.execute(delete(Order))
            db.execute(delete(Inventory))
            db.execute(delete(Product))
            db.commit()

        rng = random.Random(20261026)
        now = datetime.now()
        db.execute(
            insert(Product),
            [
                {
                    "id": product["id"],
                    "name": product["name"],
                    "category": product["category"],
                    "cost_price_cents": product["cost"],
                    "sale_price_cents": product["sale"],
                    "status": "active",
                    "created_at": now,
                }
                for product in PRODUCTS
            ],
        )

        end = date.today()
        start = end - timedelta(days=74)
        orders: list[dict] = []
        items: list[dict] = []
        day_channel_orders: dict[tuple[date, str], list[str]] = {}
        order_index = 0

        for day_offset in range(75):
            day = start + timedelta(days=day_offset)
            seasonal = 1 + 0.12 * math.sin(day_offset / 5.2) + (0.06 if day.weekday() >= 5 else 0)
            base_orders = int(650 * seasonal)
            for _ in range(base_orders):
                order_index += 1
                order, order_items = _make_order(rng, day, order_index)
                orders.append(order)
                items.extend(order_items)
                day_channel_orders.setdefault((day, order["channel"]), []).append(order["id"])

        traffic: list[dict] = []
        for day_offset in range(75):
            day = start + timedelta(days=day_offset)
            for channel, share, conversion in CHANNELS:
                channel_orders = day_channel_orders.get((day, channel), [])
                order_count = len(channel_orders)
                visitors = max(1, int(round(order_count / conversion * rng.uniform(0.94, 1.06))))
                traffic.append(
                    {
                        "date": day,
                        "channel": channel,
                        "visitors": visitors,
                        "page_views": int(visitors * rng.uniform(2.7, 4.1)),
                        "add_to_cart": int(visitors * rng.uniform(0.075, 0.12)),
                        "paid_buyers": max(0, int(round(order_count * rng.uniform(0.92, 0.99)))),
                    }
                )

        inventory = [
            {
                "product_id": product_id,
                "stock_quantity": stock,
                "safety_stock": safety,
                "lead_time_days": lead,
                "updated_at": now,
            }
            for product_id, (stock, safety, lead) in INVENTORY.items()
        ]

        import_jobs = [
            {
                "id": "IMP-DEMO-001",
                "filename": "orders_sample.csv",
                "data_type": "orders",
                "rows": 120,
                "success_count": 117,
                "failed_count": 3,
                "status": "partial",
                "error_message": "3 rows failed validation",
                "errors_json": [
                    {"row": 18, "field": "order_id", "reason": "重复订单号"},
                    {"row": 56, "field": "order_date", "reason": "日期格式无法解析"},
                    {"row": 99, "field": "product_id", "reason": "商品不存在"},
                ],
                "created_at": now,
            },
            {
                "id": "IMP-DEMO-002",
                "filename": "products_master.xlsx",
                "data_type": "products",
                "rows": 12,
                "success_count": 12,
                "failed_count": 0,
                "status": "success",
                "error_message": None,
                "errors_json": None,
                "created_at": now,
            },
        ]

        db.execute(insert(Order), orders)
        db.execute(insert(OrderItem), items)
        db.execute(insert(TrafficDaily), traffic)
        db.execute(insert(Inventory), inventory)
        db.execute(insert(ImportJob), import_jobs)
        db.commit()

        return {
            "seeded": 1,
            "products": len(PRODUCTS),
            "orders": len(orders),
            "items": len(items),
            "traffic_rows": len(traffic),
            "start": start.isoformat(),
            "end": end.isoformat(),
        }


if __name__ == "__main__":
    print(seed_database(force=True))
