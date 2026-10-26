from __future__ import annotations

import json
from typing import Any

from json_repair import repair_json

SYSTEM_PROMPT = """你是 AI 电商数据中台的结构化数据抽取器。

规则：
1. 只能使用文档中明确出现的数据，不得编造、补全或猜测。
2. 缺失字段填 null；无法确定的行不要输出。
3. 只输出 JSON 数组，不要输出 Markdown、解释或思考过程。
4. 金额统一输出为“元”数值；数量输出为整数；日期输出 YYYY-MM-DD。
5. 如果文档中没有可导入的数据行，输出 []。
"""

SCHEMAS: dict[str, dict[str, Any]] = {
    "orders": {
        "description": "订单明细；一行代表一个订单中的一个商品",
        "fields": {
            "order_id": "订单号，必填",
            "order_date": "下单/支付日期 YYYY-MM-DD，必填",
            "channel": "渠道：淘宝/京东/拼多多/抖音/其他",
            "status": "paid/shipped/completed/refunded/partially_refunded/cancelled",
            "product_id": "商品 ID，如 P001；没有则填 null",
            "product_name": "商品名称；如果文档只有名称则填写",
            "quantity": "数量，整数",
            "unit_price": "成交单价（元）",
            "cost_price": "成本单价（元），没有则 null",
            "discount": "优惠金额（元），没有填 0",
            "refund_amount": "退款金额（元），没有填 0",
            "buyer_id": "买家 ID，没有填 null",
        },
    },
    "products": {
        "description": "商品主数据；一行代表一个 SKU",
        "fields": {
            "product_id": "商品 ID，必填",
            "name": "商品名称，必填",
            "category": "品类",
            "cost_price": "成本价（元）",
            "sale_price": "售价（元）",
        },
    },
    "traffic": {
        "description": "每日流量数据；一行代表某天某渠道",
        "fields": {
            "date": "日期 YYYY-MM-DD，必填",
            "channel": "渠道",
            "visitors": "访客数，整数",
            "page_views": "浏览量，整数",
            "add_to_cart": "加购数，整数",
            "paid_buyers": "支付买家数，整数",
        },
    },
    "inventory": {
        "description": "库存快照；一行代表一个 SKU",
        "fields": {
            "product_id": "商品 ID，必填",
            "stock_quantity": "当前库存，整数",
            "safety_stock": "安全库存，整数",
            "lead_time_days": "交期（天），整数",
        },
    },
}


def build_document_messages(data_type: str, payload: str) -> list[dict[str, str]]:
    schema = SCHEMAS.get(data_type)
    if not schema:
        raise ValueError("不支持的数据类型")
    example = {
        "orders": [
            {
                "order_id": "ORD-001",
                "order_date": "2026-10-01",
                "channel": "淘宝",
                "status": "completed",
                "product_id": "P001",
                "product_name": "蓝牙耳机 Pro",
                "quantity": 1,
                "unit_price": 399,
                "cost_price": 180,
                "discount": 0,
                "refund_amount": 0,
                "buyer_id": "BUY-001",
            }
        ],
        "products": [
            {"product_id": "P013", "name": "示例商品", "category": "数码配件", "cost_price": 99, "sale_price": 199}
        ],
        "traffic": [
            {"date": "2026-10-01", "channel": "淘宝", "visitors": 12000, "page_views": 36000, "add_to_cart": 1100, "paid_buyers": 320}
        ],
        "inventory": [
            {"product_id": "P001", "stock_quantity": 500, "safety_stock": 200, "lead_time_days": 7}
        ],
    }[data_type]
    user_prompt = (
        f"目标数据类型：{data_type}\n"
        f"说明：{schema['description']}\n"
        f"字段定义：{json.dumps(schema['fields'], ensure_ascii=False)}\n"
        f"输出示例：{json.dumps(example, ensure_ascii=False)}\n\n"
        f"文档内容（已抽取为文本和表格）：\n{payload}\n\n"
        "请输出 JSON 数组。"
    )
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt},
    ]


def parse_document_rows(content: str) -> list[dict[str, Any]]:
    text = content.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.startswith("json"):
            text = text[4:].strip()
    start_array = text.find("[")
    end_array = text.rfind("]")
    start_object = text.find("{")
    end_object = text.rfind("}")
    if start_array >= 0 and end_array > start_array:
        text = text[start_array : end_array + 1]
    elif start_object >= 0 and end_object > start_object:
        text = text[start_object : end_object + 1]

    try:
        payload = json.loads(text)
    except json.JSONDecodeError:
        payload = repair_json(text, return_objects=True)

    if isinstance(payload, dict):
        payload = payload.get("rows") or payload.get("data") or []
    if not isinstance(payload, list):
        raise ValueError("模型没有返回结构化数据数组")
    rows = [item for item in payload if isinstance(item, dict)]
    if not rows:
        raise ValueError("文档中没有识别到可导入的数据行")
    return rows
