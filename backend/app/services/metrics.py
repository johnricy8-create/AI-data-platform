from __future__ import annotations

from datetime import date, timedelta
from typing import Any

from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

from app.db.models import Inventory, Order, OrderItem, Product, TrafficDaily

SALES_STATUSES = ("paid", "shipped", "completed", "partially_refunded", "refunded")
STATUS_LABELS = {
    "paid": "已支付",
    "shipped": "已发货",
    "completed": "已完成",
    "refunded": "已退款",
    "partially_refunded": "部分退款",
    "cancelled": "已取消",
    "pending_payment": "待支付",
}
CHANNEL_ORDER = ["淘宝", "京东", "拼多多", "抖音", "其他"]


def yuan(cents: int | float | None) -> float:
    return round(float(cents or 0) / 100, 2)


def _pct_change(current: float, previous: float) -> float:
    if previous == 0:
        return 0.0
    return round((current - previous) / abs(previous) * 100, 1)


def _delta_pp(current: float, previous: float) -> float:
    return round(current - previous, 2)


def resolve_range(range_key: str | None, start: date | None, end: date | None) -> tuple[date, date, str]:
    today = date.today()
    if start and end:
        if start > end:
            start, end = end, start
        return start, end, "custom"
    key = range_key or "7d"
    if key == "today":
        return today, today, key
    if key == "30d":
        return today - timedelta(days=29), today, key
    if key == "90d":
        return today - timedelta(days=89), today, key
    return today - timedelta(days=6), today, "7d"


def previous_period(start: date, end: date) -> tuple[date, date]:
    length = (end - start).days + 1
    previous_end = start - timedelta(days=1)
    previous_start = previous_end - timedelta(days=length - 1)
    return previous_start, previous_end


def _order_filters(
    start: date,
    end: date,
    channel: str | None = None,
    category: str | None = None,
) -> list[Any]:
    filters: list[Any] = [
        Order.order_date >= start,
        Order.order_date <= end,
        Order.status.in_(SALES_STATUSES),
    ]
    if channel and channel != "all":
        filters.append(Order.channel == channel)
    if category and category != "all":
        category_orders = (
            select(OrderItem.order_id)
            .join(Product, OrderItem.product_id == Product.id)
            .where(Product.category == category)
        )
        filters.append(Order.id.in_(category_orders))
    return filters


def _traffic_filters(start: date, end: date, channel: str | None = None) -> list[Any]:
    filters: list[Any] = [TrafficDaily.date >= start, TrafficDaily.date <= end]
    if channel and channel != "all":
        filters.append(TrafficDaily.channel == channel)
    return filters


def _kpi_values(
    db: Session,
    start: date,
    end: date,
    channel: str | None = None,
    category: str | None = None,
) -> dict[str, Any]:
    order_filters = _order_filters(start, end, channel, category)
    net_expr = func.coalesce(
        func.sum(Order.total_amount_cents - Order.discount_cents - Order.refund_amount_cents), 0
    )
    refund_expr = func.coalesce(func.sum(Order.refund_amount_cents), 0)
    gross_expr = func.coalesce(func.sum(Order.total_amount_cents - Order.discount_cents), 0)
    net_sales, orders, refund_amount, gross_sales = db.execute(
        select(net_expr, func.count(func.distinct(Order.id)), refund_expr, gross_expr).where(*order_filters)
    ).one()

    cogs = db.scalar(
        select(
            func.coalesce(
                func.sum(OrderItem.cost_price_cents * (OrderItem.quantity - OrderItem.refund_qty)), 0
            )
        )
        .join(Order, OrderItem.order_id == Order.id)
        .where(*order_filters)
    ) or 0

    visitors = db.scalar(
        select(func.coalesce(func.sum(TrafficDaily.visitors), 0)).where(
            *_traffic_filters(start, end, channel)
        )
    ) or 0

    net_sales = int(net_sales or 0)
    orders = int(orders or 0)
    visitors = int(visitors or 0)
    gross_profit = max(0, net_sales - int(cogs))
    conversion = round(orders / visitors * 100, 2) if visitors else 0.0
    aov = round(net_sales / orders / 100, 2) if orders else 0.0
    gross_margin = round(gross_profit / net_sales * 100, 2) if net_sales else 0.0
    refund_rate = round(int(refund_amount or 0) / max(int(gross_sales or 0), 1) * 100, 2)

    return {
        "sales": yuan(net_sales),
        "sales_cents": net_sales,
        "orders": orders,
        "visitors": visitors,
        "conversion": conversion,
        "aov": aov,
        "gross_profit": yuan(gross_profit),
        "gross_margin": gross_margin,
        "refund_amount": yuan(refund_amount),
        "refund_rate": refund_rate,
    }


def get_kpis(
    db: Session,
    start: date,
    end: date,
    channel: str | None = None,
    category: str | None = None,
) -> dict[str, Any]:
    current = _kpi_values(db, start, end, channel, category)
    prev_start, prev_end = previous_period(start, end)
    previous = _kpi_values(db, prev_start, prev_end, channel, category)

    def growth(key: str) -> float:
        return _pct_change(current[key], previous[key])

    return {
        **current,
        "previous": {
            "sales": previous["sales"],
            "orders": previous["orders"],
            "visitors": previous["visitors"],
            "conversion": previous["conversion"],
            "gross_margin": previous["gross_margin"],
            "refund_rate": previous["refund_rate"],
        },
        "sales_growth": growth("sales"),
        "orders_growth": growth("orders"),
        "visitors_growth": growth("visitors"),
        "conversion_growth": _delta_pp(current["conversion"], previous["conversion"]),
        "gross_margin_growth": _delta_pp(current["gross_margin"], previous["gross_margin"]),
        "refund_rate_growth": _delta_pp(current["refund_rate"], previous["refund_rate"]),
    }


def _daily_order_map(
    db: Session,
    start: date,
    end: date,
    channel: str | None = None,
    category: str | None = None,
) -> dict[date, dict[str, int]]:
    net_expr = func.coalesce(
        func.sum(Order.total_amount_cents - Order.discount_cents - Order.refund_amount_cents), 0
    )
    rows = db.execute(
        select(
            Order.order_date,
            net_expr,
            func.count(func.distinct(Order.id)),
            func.coalesce(func.sum(Order.refund_amount_cents), 0),
        )
        .where(*_order_filters(start, end, channel, category))
        .group_by(Order.order_date)
    ).all()
    return {
        row[0]: {"sales": int(row[1] or 0), "orders": int(row[2] or 0), "refund": int(row[3] or 0)}
        for row in rows
    }


def _daily_traffic_map(db: Session, start: date, end: date, channel: str | None = None) -> dict[date, int]:
    rows = db.execute(
        select(TrafficDaily.date, func.coalesce(func.sum(TrafficDaily.visitors), 0))
        .where(*_traffic_filters(start, end, channel))
        .group_by(TrafficDaily.date)
    ).all()
    return {row[0]: int(row[1] or 0) for row in rows}


def get_trend(
    db: Session,
    start: date,
    end: date,
    channel: str | None = None,
    category: str | None = None,
) -> dict[str, Any]:
    current_orders = _daily_order_map(db, start, end, channel, category)
    current_traffic = _daily_traffic_map(db, start, end, channel)
    prev_start, prev_end = previous_period(start, end)
    previous_orders = _daily_order_map(db, prev_start, prev_end, channel, category)

    labels: list[str] = []
    sales: list[float] = []
    orders: list[int] = []
    visitors: list[int] = []
    conversion: list[float] = []
    previous_sales: list[float] = []
    refunds: list[float] = []

    cursor = start
    while cursor <= end:
        row = current_orders.get(cursor, {"sales": 0, "orders": 0, "refund": 0})
        visit = current_traffic.get(cursor, 0)
        labels.append(cursor.isoformat())
        sales.append(yuan(row["sales"]))
        orders.append(row["orders"])
        visitors.append(visit)
        conversion.append(round(row["orders"] / visit * 100, 2) if visit else 0.0)
        refunds.append(yuan(row["refund"]))
        previous_date = cursor - timedelta(days=(end - start).days + 1)
        previous_sales.append(yuan(previous_orders.get(previous_date, {}).get("sales", 0)))
        cursor += timedelta(days=1)

    return {
        "labels": labels,
        "sales": sales,
        "orders": orders,
        "visitors": visitors,
        "conversion": conversion,
        "previous_sales": previous_sales,
        "refunds": refunds,
    }


def get_channel_share(
    db: Session,
    start: date,
    end: date,
    category: str | None = None,
) -> list[dict[str, Any]]:
    net_expr = func.coalesce(
        func.sum(Order.total_amount_cents - Order.discount_cents - Order.refund_amount_cents), 0
    )
    current_rows = db.execute(
        select(Order.channel, net_expr, func.count(func.distinct(Order.id)))
        .where(*_order_filters(start, end, None, category))
        .group_by(Order.channel)
    ).all()
    prev_start, prev_end = previous_period(start, end)
    previous_rows = db.execute(
        select(Order.channel, net_expr)
        .where(*_order_filters(prev_start, prev_end, None, category))
        .group_by(Order.channel)
    ).all()
    previous = {row[0]: int(row[1] or 0) for row in previous_rows}
    total = sum(int(row[1] or 0) for row in current_rows) or 1
    rows_by_channel = {row[0]: row for row in current_rows}
    result: list[dict[str, Any]] = []
    for name in CHANNEL_ORDER:
        row = rows_by_channel.get(name)
        sales_cents = int(row[1] or 0) if row else 0
        result.append(
            {
                "name": name,
                "sales": yuan(sales_cents),
                "orders": int(row[2] or 0) if row else 0,
                "share": round(sales_cents / total * 100, 1),
                "growth": _pct_change(sales_cents, previous.get(name, 0)),
            }
        )
    return result


def _product_rows(
    db: Session,
    start: date,
    end: date,
    channel: str | None = None,
    category: str | None = None,
) -> dict[str, dict[str, Any]]:
    rows = db.execute(
        select(
            Product.id,
            Product.name,
            Product.category,
            Product.sale_price_cents,
            func.coalesce(func.sum(OrderItem.quantity), 0),
            func.coalesce(func.sum(OrderItem.quantity - OrderItem.refund_qty), 0),
            func.coalesce(func.sum(OrderItem.unit_price_cents * OrderItem.quantity), 0),
            func.coalesce(func.sum(OrderItem.unit_price_cents * OrderItem.quantity - OrderItem.refund_amount_cents), 0),
            func.coalesce(func.sum(OrderItem.refund_amount_cents), 0),
            func.coalesce(func.sum(OrderItem.cost_price_cents * (OrderItem.quantity - OrderItem.refund_qty)), 0),
        )
        .join(OrderItem, Product.id == OrderItem.product_id)
        .join(Order, OrderItem.order_id == Order.id)
        .where(*_order_filters(start, end, channel, category))
        .group_by(Product.id)
    ).all()
    result: dict[str, dict[str, Any]] = {}
    for row in rows:
        (
            product_id,
            name,
            category_name,
            sale_price,
            qty,
            net_qty,
            gross_sales,
            net_sales,
            refund,
            cogs,
        ) = row
        net_sales = int(net_sales or 0)
        cogs = int(cogs or 0)
        gross_profit = max(0, net_sales - cogs)
        result[product_id] = {
            "id": product_id,
            "name": name,
            "category": category_name,
            "sale_price": yuan(sale_price),
            "qty": int(qty or 0),
            "net_qty": int(net_qty or 0),
            "sales": yuan(net_sales),
            "sales_cents": net_sales,
            "gross_profit": yuan(gross_profit),
            "margin": round(gross_profit / net_sales * 100, 1) if net_sales else 0.0,
            "refund": round(int(refund or 0) / max(int(gross_sales or 0), 1) * 100, 1),
        }
    return result


def get_products(
    db: Session,
    start: date,
    end: date,
    channel: str | None = None,
    category: str | None = None,
    limit: int = 20,
    sort: str = "sales",
) -> list[dict[str, Any]]:
    current = _product_rows(db, start, end, channel, category)
    prev_start, prev_end = previous_period(start, end)
    previous = _product_rows(db, prev_start, prev_end, channel, category)
    inventory_rows = db.execute(select(Inventory)).scalars().all()
    inventory = {row.product_id: row for row in inventory_rows}

    result: list[dict[str, Any]] = []
    for product_id, row in current.items():
        previous_sales = previous.get(product_id, {}).get("sales_cents", 0)
        stock_row = inventory.get(product_id)
        result.append(
            {
                **row,
                "growth": _pct_change(row["sales_cents"], previous_sales),
                "stock": stock_row.stock_quantity if stock_row else 0,
                "safety": stock_row.safety_stock if stock_row else 0,
            }
        )
    key = sort if sort in {"sales", "qty", "margin", "refund"} else "sales"
    result.sort(key=lambda item: item.get(key, 0), reverse=True)
    return result[:limit]


def get_overview(
    db: Session,
    start: date,
    end: date,
    channel: str | None = None,
    category: str | None = None,
    range_key: str = "7d",
) -> dict[str, Any]:
    kpis = get_kpis(db, start, end, channel, category)
    trend = get_trend(db, start, end, channel, category)
    channels = get_channel_share(db, start, end, category)
    products = get_products(db, start, end, channel, category, limit=8, sort="sales")
    inventory = get_inventory_alerts(db)
    return {
        "range": {
            "start": start.isoformat(),
            "end": end.isoformat(),
            "key": range_key,
            "label": {"today": "今日", "7d": "近7天", "30d": "近30天", "90d": "近90天"}.get(range_key, "自定义"),
            "channel": channel or "all",
            "category": category or "all",
        },
        "kpis": kpis,
        "trend": trend,
        "channels": channels,
        "products": products,
        "inventory_alerts": inventory,
        "insights": build_insights(products, inventory),
    }


def get_products_page(
    db: Session,
    start: date,
    end: date,
    channel: str | None = None,
    category: str | None = None,
) -> dict[str, Any]:
    products = get_products(db, start, end, channel, category, limit=100, sort="sales")
    inventory = get_inventory_alerts(db)
    avg_margin = round(sum(item["margin"] for item in products) / len(products), 1) if products else 0
    return {
        "products": products,
        "inventory_alerts": inventory,
        "summary": {
            "active_products": len(products),
            "hot_products": len([item for item in products if item["growth"] >= 20]),
            "inventory_alerts": len(inventory),
            "avg_margin": avg_margin,
        },
        "scatter": [
            {
                "id": item["id"],
                "name": item["name"],
                "sales": item["sales"],
                "margin": item["margin"],
                "qty": item["qty"],
            }
            for item in products
        ],
        "insights": build_insights(products, inventory),
    }


def get_product_detail(db: Session, product_id: str) -> dict[str, Any] | None:
    product = db.get(Product, product_id)
    if not product:
        return None
    end = date.today()
    start = end - timedelta(days=29)
    rows = _product_rows(db, start, end)
    row = rows.get(product_id)
    inventory = db.get(Inventory, product_id)

    trend_start = end - timedelta(days=6)
    trend_rows = db.execute(
        select(
            Order.order_date,
            func.coalesce(
                func.sum(OrderItem.unit_price_cents * OrderItem.quantity - OrderItem.refund_amount_cents), 0
            ),
        )
        .join(OrderItem, Order.id == OrderItem.order_id)
        .where(
            OrderItem.product_id == product_id,
            Order.order_date >= trend_start,
            Order.order_date <= end,
            Order.status.in_(SALES_STATUSES),
        )
        .group_by(Order.order_date)
    ).all()
    trend_map = {row[0]: int(row[1] or 0) for row in trend_rows}
    labels: list[str] = []
    trend_sales: list[float] = []
    cursor = trend_start
    while cursor <= end:
        labels.append(cursor.isoformat())
        trend_sales.append(yuan(trend_map.get(cursor, 0)))
        cursor += timedelta(days=1)
    qty = row["qty"] if row else 0
    net_sales = row["sales_cents"] if row else 0
    margin = row["margin"] if row else 0
    growth = 0.0
    if row:
        prev_start, prev_end = previous_period(start, end)
        previous = _product_rows(db, prev_start, prev_end).get(product_id)
        growth = _pct_change(net_sales, previous["sales_cents"] if previous else 0)

    diagnosis = f"{product.name}近 30 天销售额 ¥{yuan(net_sales):,.2f}，毛利率 {margin:.1f}%。"
    if inventory and inventory.stock_quantity < inventory.safety_stock:
        diagnosis += f"当前库存 {inventory.stock_quantity} 件，低于安全库存 {inventory.safety_stock} 件，建议关注补货。"
    else:
        diagnosis += "当前库存处于健康区间，可继续观察动销变化。"

    return {
        "product": {
            "id": product.id,
            "name": product.name,
            "category": product.category,
            "sale_price": yuan(product.sale_price_cents),
            "cost_price": yuan(product.cost_price_cents),
            "status": product.status,
        },
        "metrics": {
            "sales": yuan(net_sales),
            "qty": qty,
            "margin": margin,
            "growth": growth,
            "refund": row["refund"] if row else 0,
        },
        "inventory": {
            "stock": inventory.stock_quantity if inventory else 0,
            "safety": inventory.safety_stock if inventory else 0,
            "lead_time_days": inventory.lead_time_days if inventory else 0,
        },
        "trend": {
            "labels": labels,
            "sales": trend_sales,
        },
        "diagnosis": diagnosis,
    }


def get_inventory_alerts(db: Session) -> list[dict[str, Any]]:
    end = date.today()
    start = end - timedelta(days=13)
    avg_rows = db.execute(
        select(OrderItem.product_id, func.coalesce(func.sum(OrderItem.quantity), 0))
        .join(Order, OrderItem.order_id == Order.id)
        .where(Order.order_date >= start, Order.order_date <= end, Order.status.in_(SALES_STATUSES))
        .group_by(OrderItem.product_id)
    ).all()
    avg_daily = {row[0]: int(row[1] or 0) / 14 for row in avg_rows}
    rows = db.execute(select(Inventory, Product).join(Product, Inventory.product_id == Product.id)).all()
    alerts: list[dict[str, Any]] = []
    for inventory, product in rows:
        daily = avg_daily.get(product.id, 0)
        days = round(inventory.stock_quantity / daily, 1) if daily else 999
        if inventory.stock_quantity < inventory.safety_stock or days < 7:
            level = "high" if inventory.stock_quantity < inventory.safety_stock * 0.5 or days < 3 else "medium"
            alerts.append(
                {
                    "id": product.id,
                    "name": product.name,
                    "stock": inventory.stock_quantity,
                    "safety": inventory.safety_stock,
                    "days": days,
                    "level": level,
                    "note": "预计 2 天内售罄" if days < 3 else "低于安全库存",
                }
            )
    alerts.sort(key=lambda item: (item["level"] != "high", item["days"]))
    return alerts


def build_insights(products: list[dict[str, Any]], inventory: list[dict[str, Any]]) -> list[dict[str, Any]]:
    insights: list[dict[str, Any]] = []
    growers = [item for item in products if item["growth"] > 0]
    if growers:
        top = max(growers, key=lambda item: item["growth"])
        insights.append(
            {
                "tag": "增长机会",
                "tone": "teal",
                "title": f"{top['name']}正在加速放量",
                "text": f"销售额环比增长 {top['growth']:.1f}%，当前库存 {top['stock']} 件，建议同步评估补货与投放节奏。",
                "evidence": f"商品排行 · {top['name']}",
            }
        )
    if products:
        high_sales = sorted(products, key=lambda item: item["sales"], reverse=True)[:5]
        low_margin = min(high_sales, key=lambda item: item["margin"])
        insights.append(
            {
                "tag": "利润优化",
                "tone": "violet",
                "title": f"{low_margin['name']}需要关注毛利",
                "text": f"销售额 ¥{low_margin['sales']:,.0f}，但毛利率仅 {low_margin['margin']:.1f}%，建议检查成本与组合定价。",
                "evidence": f"商品毛利 · {low_margin['name']}",
            }
        )
    if inventory:
        top = inventory[0]
        insights.append(
            {
                "tag": "库存风险",
                "tone": "amber",
                "title": f"{top['name']}库存进入警戒线",
                "text": f"当前库存 {top['stock']} 件，按近 14 日动销测算可售约 {top['days']} 天，建议优先处理。",
                "evidence": f"库存预警 · {top['name']}",
            }
        )
    return insights[:3]


def get_sales_page(
    db: Session,
    start: date,
    end: date,
    channel: str | None = None,
    category: str | None = None,
) -> dict[str, Any]:
    trend = get_trend(db, start, end, channel, category)
    channels = get_channel_share(db, start, end, category)
    category_rows = db.execute(
        select(
            Product.category,
            func.coalesce(
                func.sum(OrderItem.unit_price_cents * OrderItem.quantity - OrderItem.refund_amount_cents), 0
            ),
        )
        .join(OrderItem, Product.id == OrderItem.product_id)
        .join(Order, OrderItem.order_id == Order.id)
        .where(*_order_filters(start, end, channel, category))
        .group_by(Product.category)
    ).all()
    total_category = sum(int(row[1] or 0) for row in category_rows) or 1
    categories = [
        {
            "name": row[0],
            "sales": yuan(row[1]),
            "share": round(int(row[1] or 0) / total_category * 100, 1),
        }
        for row in category_rows
    ]
    categories.sort(key=lambda item: item["sales"], reverse=True)

    status_rows = db.execute(
        select(Order.status, func.count(func.distinct(Order.id)))
        .where(Order.order_date >= start, Order.order_date <= end, Order.status.in_([*SALES_STATUSES, "cancelled"]))
        .group_by(Order.status)
    ).all()
    status = [
        {"status": row[0], "label": STATUS_LABELS.get(row[0], row[0]), "count": int(row[1] or 0)}
        for row in status_rows
    ]
    status.sort(key=lambda item: item["count"], reverse=True)

    return {
        "range": {"start": start.isoformat(), "end": end.isoformat()},
        "kpis": get_kpis(db, start, end, channel, category),
        "trend": trend,
        "channels": channels,
        "categories": categories,
        "status": status,
    }


def get_meta(db: Session) -> dict[str, Any]:
    min_date, max_date = db.execute(select(func.min(Order.order_date), func.max(Order.order_date))).one()
    channels = [row[0] for row in db.execute(select(Order.channel).distinct().order_by(Order.channel)).all()]
    categories = [row[0] for row in db.execute(select(Product.category).distinct().order_by(Product.category)).all()]
    return {
        "min_date": min_date.isoformat() if min_date else None,
        "max_date": max_date.isoformat() if max_date else None,
        "channels": channels,
        "categories": categories,
        "products": [
            {"id": row[0], "name": row[1], "category": row[2]}
            for row in db.execute(select(Product.id, Product.name, Product.category).order_by(Product.id)).all()
        ],
        "demo": True,
    }
