from __future__ import annotations

import re
from datetime import date, datetime, timedelta
from typing import Any

from sqlalchemy.orm import Session

from app.services.metrics import (
    CHANNEL_ORDER,
    get_channel_share,
    get_inventory_alerts,
    get_kpis,
    get_product_detail,
    get_products,
    get_trend,
    resolve_range,
)

CATEGORIES = ["数码配件", "运动户外", "服饰鞋包", "家居生活"]


def _fmt_money(value: float) -> str:
    return f"¥{value:,.0f}"


def _fmt_pct(value: float) -> str:
    return f"{value:.2f}%"


def parse_intent(
    question: str,
    range_key: str = "7d",
    start: date | None = None,
    end: date | None = None,
    channel: str | None = None,
    category: str | None = None,
) -> dict[str, Any]:
    today = date.today()
    default_start, default_end, key = resolve_range(range_key, start, end)
    intent_start = default_start
    intent_end = default_end
    label = {"today": "今日", "7d": "近7天", "30d": "近30天", "90d": "近90天"}.get(key, "当前范围")

    if re.search(r"昨天|昨日", question):
        intent_start = intent_end = today - timedelta(days=1)
        label = "昨天"
    elif re.search(r"今天|今日|当日", question):
        intent_start = intent_end = today
        label = "今天"
    elif re.search(r"近\s*30|最近\s*30|过去\s*30|本月", question):
        intent_start, intent_end = today - timedelta(days=29), today
        label = "近30天"
    elif re.search(r"近\s*7|最近\s*7|过去\s*7|本周", question):
        intent_start, intent_end = today - timedelta(days=6), today
        label = "近7天"

    intent_channel = channel if channel and channel != "all" else None
    for name in CHANNEL_ORDER:
        if name in question:
            intent_channel = name
            break

    intent_category = category if category and category != "all" else None
    for name in CATEGORIES:
        if name in question:
            intent_category = name
            break

    product_id = None
    product_name = None
    # Product names are short; resolve them from the facts loader.
    return {
        "start": intent_start,
        "end": intent_end,
        "range_label": label,
        "channel": intent_channel,
        "category": intent_category,
        "product_id": product_id,
        "product_name": product_name,
    }


def build_facts(db: Session, intent: dict[str, Any]) -> dict[str, Any]:
    start: date = intent["start"]
    end: date = intent["end"]
    channel = intent.get("channel")
    category = intent.get("category")
    kpis = get_kpis(db, start, end, channel, category)
    trend = get_trend(db, start, end, channel, category)
    channels = get_channel_share(db, start, end, category)
    products = get_products(db, start, end, channel, category, limit=8, sort="sales")
    inventory = get_inventory_alerts(db)

    product_detail = None
    product_id = intent.get("product_id")
    if product_id:
        product_detail = get_product_detail(db, product_id)

    # Resolve product mention from the question is handled by the caller
    # because it has access to the product catalog. Keep the intent contract
    # stable even when no product is selected.
    total_sales = sum(trend["sales"])
    peak_index = max(range(len(trend["sales"])), key=lambda i: trend["sales"][i]) if trend["sales"] else 0
    peak_label = trend["labels"][peak_index] if trend["labels"] else "-"
    top_channel = max(channels, key=lambda item: item["sales"]) if channels else None
    top_product = products[0] if products else None
    fastest = max(products, key=lambda item: item["growth"]) if products else None
    low_margin = min(products, key=lambda item: item["margin"]) if products else None
    top_alert = inventory[0] if inventory else None

    evidence = [
        {"id": "E1", "label": "净销售额", "value": _fmt_money(kpis["sales"]), "source": "orders"},
        {"id": "E2", "label": "订单量", "value": f"{kpis['orders']:,}", "source": "orders"},
        {"id": "E3", "label": "访客数", "value": f"{kpis['visitors']:,}", "source": "traffic_daily"},
        {"id": "E4", "label": "转化率", "value": _fmt_pct(kpis["conversion"]), "source": "orders / traffic_daily"},
        {"id": "E5", "label": "毛利率", "value": _fmt_pct(kpis["gross_margin"]), "source": "orders / order_items"},
        {"id": "E6", "label": "退款率", "value": _fmt_pct(kpis["refund_rate"]), "source": "orders"},
        {"id": "E7", "label": "销售趋势", "value": f"{intent['range_label']}累计 {_fmt_money(total_sales)}，峰值日 {peak_label}", "source": "orders"},
        {"id": "E8", "label": "渠道结构", "value": f"{top_channel['name'] if top_channel else '-'}占比 {top_channel['share'] if top_channel else 0}%，环比 {top_channel['growth'] if top_channel else 0:+.1f}%", "source": "orders"},
        {"id": "E9", "label": "商品排行", "value": f"{top_product['name'] if top_product else '-'}销售额 {_fmt_money(top_product['sales']) if top_product else '-'}，增长最快 {fastest['name'] if fastest else '-'} {fastest['growth'] if fastest else 0:+.1f}%", "source": "order_items"},
        {"id": "E10", "label": "库存预警", "value": f"{top_alert['name']}库存 {top_alert['stock']} 件，可售 {top_alert['days']} 天" if top_alert else "暂无库存预警", "source": "inventory"},
    ]

    return {
        "range": {
            "start": start.isoformat(),
            "end": end.isoformat(),
            "label": intent["range_label"],
            "channel": channel or "全部渠道",
            "category": category or "全部品类",
        },
        "kpis": kpis,
        "trend": trend,
        "channels": channels,
        "products": products,
        "inventory_alerts": inventory[:8],
        "product": product_detail,
        "summary": {
            "total_sales": round(total_sales, 2),
            "peak_label": peak_label,
            "top_channel": top_channel,
            "top_product": top_product,
            "fastest": fastest,
            "low_margin": low_margin,
            "top_alert": top_alert,
        },
        "evidence": evidence,
    }


def build_deterministic_report(facts: dict[str, Any], intent: dict[str, Any]) -> dict[str, Any]:
    kpis = facts["kpis"]
    summary = facts["summary"]
    product_detail = facts.get("product")
    label = facts["range"]["label"]
    sales_growth = kpis["sales_growth"]
    direction = "增长" if sales_growth >= 0 else "回落"

    findings: list[dict[str, Any]] = [
        {
            "text": f"{label}净销售额 {_fmt_money(kpis['sales'])}，环比{direction} {abs(sales_growth):.1f}%；订单量 {kpis['orders']:,}，转化率 {kpis['conversion']:.2f}%。",
            "evidence_ids": ["E1", "E2", "E4"],
            "confidence": "high",
        }
    ]

    top_channel = summary.get("top_channel")
    if top_channel:
        findings.append(
            {
                "text": f"{top_channel['name']}是最大渠道，贡献 {top_channel['share']}% 的销售额，环比 {top_channel['growth']:+.1f}%。",
                "evidence_ids": ["E8"],
                "confidence": "high",
            }
        )

    fastest = summary.get("fastest")
    if fastest:
        findings.append(
            {
                "text": f"{fastest['name']}增长最快，销售额环比 {fastest['growth']:+.1f}%，当前库存 {fastest['stock']} 件。",
                "evidence_ids": ["E9", "E10"],
                "confidence": "high" if fastest["stock"] >= fastest["safety"] else "medium",
            }
        )

    alert = summary.get("top_alert")
    if alert:
        findings.append(
            {
                "text": f"{alert['name']}当前库存 {alert['stock']} 件，可售约 {alert['days']} 天，存在断货风险。",
                "evidence_ids": ["E10"],
                "confidence": "high",
            }
        )

    if product_detail:
        metrics = product_detail["metrics"]
        findings = [
            {
                "text": f"{product_detail['product']['name']}近 30 天销售额 {_fmt_money(metrics['sales'])}，销量 {metrics['qty']:,}，毛利率 {metrics['margin']:.1f}%，环比 {metrics['growth']:+.1f}%。",
                "evidence_ids": ["E9", "E1"],
                "confidence": "high",
            },
            {
                "text": f"当前库存 {product_detail['inventory']['stock']} 件，安全库存 {product_detail['inventory']['safety']} 件。",
                "evidence_ids": ["E10"],
                "confidence": "high",
            },
        ]

    causes = [
        {
            "text": "渠道流量与转化率变化是本期波动的主要解释变量。",
            "evidence_ids": ["E3", "E4", "E8"],
            "confidence": "medium",
        },
        {
            "text": "商品动销与库存状态会影响可售规模和后续销售。",
            "evidence_ids": ["E9", "E10"],
            "confidence": "medium",
        },
        {
            "text": "缺少广告花费、竞品价格与分时流量，无法进一步判断投放或价格因素。",
            "evidence_ids": [],
            "confidence": "low",
        },
    ]

    actions: list[dict[str, Any]] = []
    if alert:
        actions.append(
            {
                "priority": "P0",
                "title": f"处理 {alert['name']} 的库存风险",
                "detail": f"按近 14 日动销补货，优先覆盖 21 天安全库存；补货到仓前控制放量。",
                "evidence_ids": ["E10"],
            }
        )
    if top_channel and top_channel["growth"] < 0:
        actions.append(
            {
                "priority": "P1",
                "title": f"修复 {top_channel['name']} 渠道",
                "detail": "检查主推计划、关键词出价与预算消耗，优先恢复访客量。",
                "evidence_ids": ["E8"],
            }
        )
    else:
        actions.append(
            {
                "priority": "P1",
                "title": "放大高增长渠道与商品",
                "detail": f"优先复用 {fastest['name'] if fastest else '高增长商品'} 的素材与人群，控制 7 天测试预算。",
                "evidence_ids": ["E8", "E9"],
            }
        )
    actions.append(
        {
            "priority": "P2",
            "title": "补齐归因数据",
            "detail": "接入广告花费、竞品价格与分时流量，建立更完整的归因分析。",
            "evidence_ids": ["E2", "E4"],
        }
    )

    headline = (
        f"{label}销售额 {_fmt_money(kpis['sales'])}，环比{direction} {abs(sales_growth):.1f}%"
        if kpis["orders"]
        else f"{label}暂无足够订单数据"
    )
    return {
        "headline": headline,
        "summary": f"本期订单量 {kpis['orders']:,}，访客数 {kpis['visitors']:,}，转化率 {kpis['conversion']:.2f}%，毛利率 {kpis['gross_margin']:.1f}%。建议先处理库存与高增长商品的供给，再优化渠道投放。",
        "findings": findings,
        "causes": causes,
        "actions": actions,
        "data_gaps": ["广告花费", "竞品价格", "分时流量来源", "供应商交期"],
        "source": "fallback",
    }


def infer_evidence_ids(text: str, allowed: set[str]) -> list[str]:
    mapping = [
        (("销售额", "营收", "销售", "大盘", "业绩"), "E1"),
        (("订单",), "E2"),
        (("访客", "流量", "曝光"), "E3"),
        (("转化",), "E4"),
        (("毛利", "利润", "成本"), "E5"),
        (("退款",), "E6"),
        (("趋势", "峰值", "环比", "同比"), "E7"),
        (("渠道", "淘宝", "京东", "拼多多", "抖音"), "E8"),
        (("商品", "SKU", "爆款", "动销"), "E9"),
        (("库存", "补货", "断货", "售罄"), "E10"),
    ]
    ids: list[str] = []
    for keywords, evidence_id in mapping:
        if evidence_id in allowed and any(keyword in text for keyword in keywords):
            ids.append(evidence_id)
    return ids[:2] or (["E1"] if "E1" in allowed else [])


def normalize_report(
    payload: dict[str, Any],
    deterministic: dict[str, Any],
    allowed_evidence: set[str],
) -> dict[str, Any]:
    def text(value: Any, default: str = "") -> str:
        return str(value).strip() if value is not None else default

    def evidence_ids(value: Any, fallback_text: str = "") -> list[str]:
        if isinstance(value, list):
            ids = [str(item) for item in value if str(item) in allowed_evidence]
            if ids:
                return ids
        return infer_evidence_ids(fallback_text, allowed_evidence)

    def confidence(value: Any) -> str:
        return value if value in {"high", "medium", "low"} else "medium"

    findings = []
    for item in payload.get("findings") or []:
        if isinstance(item, str) and item.strip():
            findings.append(
                {
                    "text": item.strip(),
                    "evidence_ids": infer_evidence_ids(item, allowed_evidence),
                    "confidence": "medium",
                }
            )
            continue
        if not isinstance(item, dict):
            continue
        body = text(item.get("text"))
        ids = evidence_ids(item.get("evidence_ids"), body)
        if body and ids:
            findings.append({"text": body, "evidence_ids": ids, "confidence": confidence(item.get("confidence"))})

    causes = []
    for item in payload.get("causes") or []:
        if isinstance(item, str) and item.strip():
            causes.append({"text": item.strip(), "evidence_ids": infer_evidence_ids(item, allowed_evidence), "confidence": "medium"})
            continue
        if not isinstance(item, dict):
            continue
        body = text(item.get("text"))
        ids = evidence_ids(item.get("evidence_ids"), body)
        if body:
            causes.append({"text": body, "evidence_ids": ids, "confidence": confidence(item.get("confidence"))})

    actions = []
    for item in payload.get("actions") or []:
        if isinstance(item, str) and item.strip():
            actions.append(
                {
                    "priority": "P2",
                    "title": item.strip(),
                    "detail": "",
                    "evidence_ids": infer_evidence_ids(item, allowed_evidence),
                }
            )
            continue
        if not isinstance(item, dict):
            continue
        title = text(item.get("title"))
        detail = text(item.get("detail"))
        priority = text(item.get("priority"), "P2").upper()
        if priority not in {"P0", "P1", "P2"}:
            priority = "P2"
        if title:
            actions.append(
                {
                    "priority": priority,
                    "title": title,
                    "detail": detail,
                    "evidence_ids": evidence_ids(item.get("evidence_ids"), f"{title} {detail}"),
                }
            )

    if not findings or not actions:
        return deterministic

    return {
        "headline": text(payload.get("headline"), deterministic["headline"]),
        "summary": text(payload.get("summary"), deterministic["summary"]),
        "findings": findings,
        "causes": causes or deterministic["causes"],
        "actions": actions,
        "data_gaps": [text(item) for item in payload.get("data_gaps") or deterministic["data_gaps"] if text(item)],
        "source": "llm",
    }
