from datetime import date, datetime
from typing import Any

from sqlalchemy import (
    JSON,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Product(Base):
    __tablename__ = "products"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    category: Mapped[str] = mapped_column(String(60), nullable=False, index=True)
    cost_price_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    sale_price_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(String(48), primary_key=True)
    order_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    channel: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    buyer_id: Mapped[str | None] = mapped_column(String(48), nullable=True, index=True)
    total_amount_cents: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    discount_cents: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    refund_amount_cents: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    __table_args__ = (
        Index("ix_orders_date_channel", "order_date", "channel"),
        Index("ix_orders_date_status", "order_date", "status"),
    )


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    order_id: Mapped[str] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id: Mapped[str] = mapped_column(ForeignKey("products.id"), nullable=False, index=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    cost_price_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    refund_qty: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    refund_amount_cents: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class TrafficDaily(Base):
    __tablename__ = "traffic_daily"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    channel: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    visitors: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    page_views: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    add_to_cart: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    paid_buyers: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    __table_args__ = (Index("ix_traffic_date_channel", "date", "channel"),)


class Inventory(Base):
    __tablename__ = "inventory"

    product_id: Mapped[str] = mapped_column(ForeignKey("products.id"), primary_key=True)
    stock_quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    safety_stock: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    lead_time_days: Mapped[int] = mapped_column(Integer, nullable=False, default=7)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)


class ImportJob(Base):
    __tablename__ = "import_jobs"

    id: Mapped[str] = mapped_column(String(48), primary_key=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    data_type: Mapped[str] = mapped_column(String(30), nullable=False)
    rows: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    success_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    failed_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="success")
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    errors_json: Mapped[list[dict[str, Any]] | None] = mapped_column(JSON, nullable=True)
    meta_json: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)


class AIReport(Base):
    __tablename__ = "ai_reports"

    id: Mapped[str] = mapped_column(String(48), primary_key=True)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    date_start: Mapped[date | None] = mapped_column(Date, nullable=True)
    date_end: Mapped[date | None] = mapped_column(Date, nullable=True)
    channel: Mapped[str | None] = mapped_column(String(30), nullable=True)
    category: Mapped[str | None] = mapped_column(String(60), nullable=True)
    headline: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    summary: Mapped[str] = mapped_column(Text, nullable=False, default="")
    report_json: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    model: Mapped[str | None] = mapped_column(String(80), nullable=True)
    mode: Mapped[str] = mapped_column(String(20), nullable=False, default="fallback")
    tokens: Mapped[int | None] = mapped_column(Integer, nullable=True)
    latency_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
