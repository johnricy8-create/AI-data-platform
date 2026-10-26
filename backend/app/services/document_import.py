from __future__ import annotations

import time
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.agent.document_prompt import build_document_messages, parse_document_rows
from app.agent.provider import ProviderError, ZhipuProvider
from app.db.models import Product
from app.services.documents import ExtractedDocument, extract_document

ALIASES: dict[str, dict[str, str]] = {
    "orders": {
        "订单号": "order_id",
        "订单id": "order_id",
        "order_no": "order_id",
        "日期": "order_date",
        "下单日期": "order_date",
        "支付日期": "order_date",
        "渠道": "channel",
        "平台": "channel",
        "状态": "status",
        "订单状态": "status",
        "商品id": "product_id",
        "商品编号": "product_id",
        "商品名称": "product_name",
        "商品": "product_name",
        "数量": "quantity",
        "件数": "quantity",
        "单价": "unit_price",
        "成交价": "unit_price",
        "成本价": "cost_price",
        "成本": "cost_price",
        "优惠": "discount",
        "优惠金额": "discount",
        "退款": "refund_amount",
        "退款金额": "refund_amount",
        "买家": "buyer_id",
        "买家id": "buyer_id",
    },
    "products": {
        "商品id": "product_id",
        "商品编号": "product_id",
        "商品名称": "name",
        "名称": "name",
        "品类": "category",
        "分类": "category",
        "成本价": "cost_price",
        "成本": "cost_price",
        "售价": "sale_price",
        "价格": "sale_price",
    },
    "traffic": {
        "日期": "date",
        "渠道": "channel",
        "平台": "channel",
        "访客": "visitors",
        "访客数": "visitors",
        "浏览量": "page_views",
        "pv": "page_views",
        "加购": "add_to_cart",
        "加购数": "add_to_cart",
        "支付买家": "paid_buyers",
        "支付买家数": "paid_buyers",
    },
    "inventory": {
        "商品id": "product_id",
        "商品编号": "product_id",
        "库存": "stock_quantity",
        "当前库存": "stock_quantity",
        "安全库存": "safety_stock",
        "交期": "lead_time_days",
        "交期天数": "lead_time_days",
    },
}


def _normalize_row(row: dict[str, Any], data_type: str) -> dict[str, Any]:
    aliases = ALIASES.get(data_type, {})
    normalized: dict[str, Any] = {}
    for key, value in row.items():
        clean_key = str(key).strip()
        target = aliases.get(clean_key.lower()) or aliases.get(clean_key) or clean_key
        normalized[target] = value
    return normalized


def document_rows(
    db: Session,
    filename: str,
    content: bytes,
    data_type: str,
) -> tuple[list[dict[str, Any]], ExtractedDocument, dict[str, Any]]:
    extracted = extract_document(filename, content)
    if not extracted.text.strip() and not extracted.tables:
        raise ValueError("文档中没有可提取的文字或表格；如果是扫描件，需要先 OCR")

    provider = ZhipuProvider()
    if not provider.enabled:
        raise ValueError("文档智能解析需要配置智谱 API Key；Excel/CSV 可直接导入")

    started = time.perf_counter()
    try:
        result = provider.chat(
            build_document_messages(data_type, extracted.prompt_payload()),
            max_tokens=2400,
        )
    except ProviderError as exc:
        raise ValueError(f"文档智能解析失败：{exc}") from exc

    rows = [ _normalize_row(row, data_type) for row in parse_document_rows(result.content) ]
    if data_type == "orders":
        products = db.execute(select(Product.id, Product.name)).all()
        by_name = {name: product_id for product_id, name in products}
        for row in rows:
            if not row.get("product_id") and row.get("product_name"):
                row["product_id"] = by_name.get(str(row["product_name"]).strip())

    rows = rows[:200]
    extraction = {
        **extracted.meta(),
        "source": "document",
        "mode": "llm",
        "rows_extracted": len(rows),
        "model": result.model,
        "tokens": result.tokens,
        "latency_ms": int((time.perf_counter() - started) * 1000),
    }
    return rows, extracted, extraction
