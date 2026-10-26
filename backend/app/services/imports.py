from __future__ import annotations

import csv
import io
import random
import uuid
from datetime import date, datetime
from typing import Any

import pandas as pd
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models import ImportJob, Inventory, Order, OrderItem, Product, TrafficDaily
from app.services.document_import import ALIASES, document_rows
from app.services.documents import DOCUMENT_FORMATS, LEGACY_FORMATS

DATA_TYPES = {"orders", "products", "traffic", "inventory"}

TEMPLATES: dict[str, list[str]] = {
    "orders": [
        "order_id",
        "order_date",
        "channel",
        "status",
        "product_id",
        "quantity",
        "unit_price",
        "cost_price",
        "discount",
        "refund_amount",
        "buyer_id",
    ],
    "products": ["product_id", "name", "category", "cost_price", "sale_price"],
    "traffic": ["date", "channel", "visitors", "page_views", "add_to_cart", "paid_buyers"],
    "inventory": ["product_id", "stock_quantity", "safety_stock", "lead_time_days"],
}

SAMPLES: dict[str, list[list[Any]]] = {
    "orders": [
        ["ORD-EXAMPLE-001", "2026-10-26", "淘宝", "completed", "P001", 1, 399, 180, 0, 0, "BUY-EXAMPLE-01"],
    ],
    "products": [["P013", "示例商品", "数码配件", 99, 199]],
    "traffic": [["2026-10-26", "淘宝", 12000, 36000, 1100, 320]],
    "inventory": [["P001", 500, 200, 7]],
}


def template_csv(data_type: str) -> tuple[str, str]:
    if data_type not in DATA_TYPES:
        raise ValueError("不支持的数据类型")
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(TEMPLATES[data_type])
    writer.writerows(SAMPLES[data_type])
    return buffer.getvalue(), f"{data_type}_template.csv"


def _read_frame(filename: str, content: bytes) -> pd.DataFrame:
    suffix = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
    if suffix == "csv":
        try:
            return pd.read_csv(io.BytesIO(content))
        except UnicodeDecodeError:
            return pd.read_csv(io.BytesIO(content), encoding="gbk")
    if suffix == "xlsx":
        return pd.read_excel(io.BytesIO(content), engine="openpyxl")
    if suffix == "xls":
        return pd.read_excel(io.BytesIO(content), engine="xlrd")
    raise ValueError("不支持的文件格式")


def _normalize_frame_columns(frame: pd.DataFrame, data_type: str) -> pd.DataFrame:
    aliases = ALIASES.get(data_type, {})

    def resolve(column: Any) -> str:
        raw = str(column).strip()
        return aliases.get(raw.lower()) or aliases.get(raw) or raw

    return frame.rename(columns=resolve)


def _clean(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, float) and pd.isna(value):
        return None
    if pd.isna(value):
        return None
    return value


def _to_cents(value: Any) -> int:
    text = (
        str(value)
        .strip()
        .replace(",", "")
        .replace("，", "")
        .replace("¥", "")
        .replace("￥", "")
        .replace("元", "")
        .replace(" ", "")
    )
    return int(round(float(text) * 100))


def _to_int(value: Any) -> int:
    text = str(value).strip().replace(",", "").replace("，", "").replace("件", "").replace("个", "").replace(" ", "")
    return int(float(text))


def _parse_date(value: Any) -> date:
    parsed = pd.to_datetime(value)
    if pd.isna(parsed):
        raise ValueError("日期为空")
    return parsed.date()


def _error(row: int, field: str, value: Any, reason: str) -> dict[str, Any]:
    return {"row": row, "field": field, "value": str(value)[:120] if value is not None else "", "reason": reason}


def _import_orders(db: Session, frame: pd.DataFrame, errors: list[dict[str, Any]]) -> int:
    required = ["order_id", "order_date", "channel", "status", "product_id", "quantity", "unit_price", "cost_price"]
    missing = [field for field in required if field not in frame.columns]
    if missing:
        raise ValueError(f"缺少字段：{', '.join(missing)}")

    product_ids = {row[0] for row in db.execute(select(Product.id)).all()}
    groups: dict[str, list[dict[str, Any]]] = {}
    seen_orders: set[str] = set()
    success_rows = 0

    for idx, raw in frame.iterrows():
        excel_row = int(idx) + 2
        row = {key: _clean(raw.get(key)) for key in frame.columns}
        missing_values = [field for field in required if row.get(field) is None]
        if missing_values:
            errors.append(_error(excel_row, missing_values[0], None, "必填字段为空"))
            continue
        order_id = str(row["order_id"]).strip()
        if order_id in seen_orders:
            errors.append(_error(excel_row, "order_id", order_id, "同一文件内订单号重复"))
            continue
        seen_orders.add(order_id)
        try:
            order_date = _parse_date(row["order_date"])
        except Exception:
            errors.append(_error(excel_row, "order_date", row["order_date"], "日期格式无法解析"))
            continue
        status = str(row["status"]).strip()
        status = {
            "已完成": "completed",
            "已发货": "shipped",
            "已支付": "paid",
            "已退款": "refunded",
            "部分退款": "partially_refunded",
            "已取消": "cancelled",
        }.get(status, status)
        if status not in {"paid", "shipped", "completed", "refunded", "partially_refunded", "cancelled"}:
            errors.append(_error(excel_row, "status", status, "订单状态不在允许范围"))
            continue
        product_id = str(row["product_id"]).strip()
        if product_id not in product_ids:
            errors.append(_error(excel_row, "product_id", product_id, "商品 ID 不存在"))
            continue
        try:
            quantity = _to_int(row["quantity"])
            if quantity <= 0:
                raise ValueError
        except Exception:
            errors.append(_error(excel_row, "quantity", row["quantity"], "数量必须为正整数"))
            continue
        try:
            unit_price = _to_cents(row["unit_price"])
            cost_price = _to_cents(row["cost_price"])
        except Exception:
            errors.append(_error(excel_row, "unit_price", row["unit_price"], "金额格式无法解析"))
            continue

        groups.setdefault(order_id, []).append(
            {
                "row": excel_row,
                "order_date": order_date,
                "channel": str(row["channel"]).strip(),
                "status": status,
                "product_id": product_id,
                "quantity": quantity,
                "unit_price_cents": unit_price,
                "cost_price_cents": cost_price,
                "discount_cents": _to_cents(row.get("discount") or 0),
                "refund_amount_cents": _to_cents(row.get("refund_amount") or 0),
                "buyer_id": str(row.get("buyer_id") or "").strip() or None,
            }
        )
        success_rows += 1

    for order_id, items in groups.items():
        if db.get(Order, order_id):
            for item in items:
                errors.append(_error(item["row"], "order_id", order_id, "订单号已存在，已跳过整单"))
            success_rows -= len(items)
            continue
        total = sum(item["unit_price_cents"] * item["quantity"] for item in items)
        first = items[0]
        order = Order(
            id=order_id,
            order_date=first["order_date"],
            paid_at=datetime.combine(first["order_date"], datetime.min.time()),
            channel=first["channel"],
            status=first["status"],
            buyer_id=first["buyer_id"],
            total_amount_cents=total,
            discount_cents=first["discount_cents"],
            refund_amount_cents=min(first["refund_amount_cents"], max(0, total - first["discount_cents"])),
        )
        db.add(order)
        for item in items:
            db.add(
                OrderItem(
                    order_id=order_id,
                    product_id=item["product_id"],
                    quantity=item["quantity"],
                    unit_price_cents=item["unit_price_cents"],
                    cost_price_cents=item["cost_price_cents"],
                    refund_qty=0,
                    refund_amount_cents=0,
                )
            )
    return success_rows


def _import_products(db: Session, frame: pd.DataFrame, errors: list[dict[str, Any]]) -> int:
    required = ["product_id", "name", "category", "cost_price", "sale_price"]
    missing = [field for field in required if field not in frame.columns]
    if missing:
        raise ValueError(f"缺少字段：{', '.join(missing)}")
    success = 0
    for idx, raw in frame.iterrows():
        excel_row = int(idx) + 2
        row = {key: _clean(raw.get(key)) for key in frame.columns}
        if any(row.get(field) is None for field in required):
            errors.append(_error(excel_row, "required", None, "必填字段为空"))
            continue
        try:
            cost = _to_cents(row["cost_price"])
            sale = _to_cents(row["sale_price"])
            if cost < 0 or sale <= 0:
                raise ValueError
        except Exception:
            errors.append(_error(excel_row, "price", row["sale_price"], "价格格式不正确"))
            continue
        product_id = str(row["product_id"]).strip()
        existing = db.get(Product, product_id)
        if existing:
            existing.name = str(row["name"]).strip()
            existing.category = str(row["category"]).strip()
            existing.cost_price_cents = cost
            existing.sale_price_cents = sale
        else:
            db.add(
                Product(
                    id=product_id,
                    name=str(row["name"]).strip(),
                    category=str(row["category"]).strip(),
                    cost_price_cents=cost,
                    sale_price_cents=sale,
                    status="active",
                )
            )
        success += 1
    return success


def _import_traffic(db: Session, frame: pd.DataFrame, errors: list[dict[str, Any]]) -> int:
    required = ["date", "channel", "visitors"]
    missing = [field for field in required if field not in frame.columns]
    if missing:
        raise ValueError(f"缺少字段：{', '.join(missing)}")
    success = 0
    for idx, raw in frame.iterrows():
        excel_row = int(idx) + 2
        row = {key: _clean(raw.get(key)) for key in frame.columns}
        if any(row.get(field) is None for field in required):
            errors.append(_error(excel_row, "required", None, "必填字段为空"))
            continue
        try:
            day = _parse_date(row["date"])
            visitors = _to_int(row["visitors"])
            if visitors < 0:
                raise ValueError
        except Exception:
            errors.append(_error(excel_row, "date/visitors", row.get("date"), "日期或访客数格式不正确"))
            continue
        channel = str(row["channel"]).strip()
        db.execute(delete(TrafficDaily).where(TrafficDaily.date == day, TrafficDaily.channel == channel))
        db.add(
            TrafficDaily(
                date=day,
                channel=channel,
                visitors=visitors,
                page_views=_to_int(row.get("page_views") or visitors * 3),
                add_to_cart=_to_int(row.get("add_to_cart") or visitors * 0.1),
                paid_buyers=_to_int(row.get("paid_buyers") or 0),
            )
        )
        success += 1
    return success


def _import_inventory(db: Session, frame: pd.DataFrame, errors: list[dict[str, Any]]) -> int:
    required = ["product_id", "stock_quantity", "safety_stock"]
    missing = [field for field in required if field not in frame.columns]
    if missing:
        raise ValueError(f"缺少字段：{', '.join(missing)}")
    product_ids = {row[0] for row in db.execute(select(Product.id)).all()}
    success = 0
    for idx, raw in frame.iterrows():
        excel_row = int(idx) + 2
        row = {key: _clean(raw.get(key)) for key in frame.columns}
        if any(row.get(field) is None for field in required):
            errors.append(_error(excel_row, "required", None, "必填字段为空"))
            continue
        product_id = str(row["product_id"]).strip()
        if product_id not in product_ids:
            errors.append(_error(excel_row, "product_id", product_id, "商品 ID 不存在"))
            continue
        try:
            stock = _to_int(row["stock_quantity"])
            safety = _to_int(row["safety_stock"])
            lead = _to_int(row.get("lead_time_days") or 7)
        except Exception:
            errors.append(_error(excel_row, "stock", row["stock_quantity"], "库存字段格式不正确"))
            continue
        existing = db.get(Inventory, product_id)
        if existing:
            existing.stock_quantity = stock
            existing.safety_stock = safety
            existing.lead_time_days = lead
            existing.updated_at = datetime.now()
        else:
            db.add(
                Inventory(
                    product_id=product_id,
                    stock_quantity=stock,
                    safety_stock=safety,
                    lead_time_days=lead,
                    updated_at=datetime.now(),
                )
            )
        success += 1
    return success


def import_file(db: Session, filename: str, data_type: str, content: bytes) -> dict[str, Any]:
    if data_type not in DATA_TYPES:
        raise ValueError("不支持的数据类型")
    if not filename:
        raise ValueError("文件名不能为空")
    if len(content) > settings.max_upload_mb * 1024 * 1024:
        raise ValueError(f"文件不能超过 {settings.max_upload_mb}MB")

    suffix = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
    extraction_meta: dict[str, Any]
    if suffix in DOCUMENT_FORMATS:
        rows, extracted, extraction_meta = document_rows(db, filename, content, data_type)
        frame = pd.DataFrame(rows)
    else:
        frame = _read_frame(filename, content)
        extraction_meta = {
            "source": "table",
            "format": suffix,
            "mode": "direct",
            "rows_extracted": len(frame),
            "warnings": [],
        }

    frame = _normalize_frame_columns(frame, data_type)
    frame.columns = [str(column).strip() for column in frame.columns]
    errors: list[dict[str, Any]] = []
    success = 0
    try:
        if data_type == "orders":
            success = _import_orders(db, frame, errors)
        elif data_type == "products":
            success = _import_products(db, frame, errors)
        elif data_type == "traffic":
            success = _import_traffic(db, frame, errors)
        else:
            success = _import_inventory(db, frame, errors)
    except ValueError:
        raise
    except Exception as exc:
        db.rollback()
        raise ValueError(f"文件解析失败：{exc}") from exc

    status = "success" if not errors else ("partial" if success > 0 else "failed")
    job = ImportJob(
        id=f"IMP-{datetime.now().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:4].upper()}",
        filename=filename,
        data_type=data_type,
        rows=len(frame),
        success_count=max(0, success),
        failed_count=len(errors),
        status=status,
        error_message=None if not errors else f"{len(errors)} 条记录未通过校验",
        errors_json=errors[:100],
        meta_json=extraction_meta,
    )
    db.add(job)
    db.commit()
    return serialize_job(job)


def serialize_job(job: ImportJob) -> dict[str, Any]:
    return {
        "id": job.id,
        "filename": job.filename,
        "data_type": job.data_type,
        "rows": job.rows,
        "success_count": job.success_count,
        "failed_count": job.failed_count,
        "status": job.status,
        "error_message": job.error_message,
        "errors": job.errors_json or [],
        "extraction": job.meta_json,
        "created_at": job.created_at.isoformat() if job.created_at else None,
    }


def list_jobs(db: Session, limit: int = 30) -> list[dict[str, Any]]:
    jobs = db.execute(select(ImportJob).order_by(ImportJob.created_at.desc()).limit(limit)).scalars().all()
    return [serialize_job(job) for job in jobs]


def get_job(db: Session, job_id: str) -> dict[str, Any] | None:
    job = db.get(ImportJob, job_id)
    return serialize_job(job) if job else None
