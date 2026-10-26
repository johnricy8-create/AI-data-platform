from __future__ import annotations

import json
from typing import Any

SYSTEM_PROMPT = """你是「AI 电商数据中台」的经营分析助手。

硬性规则：
1. 只能使用用户提供的 facts 中的数字，不得编造或推算未给出的数字。
2. 每条结论、原因、建议都必须引用 evidence_ids，且只能引用 facts.evidence 中存在的 ID。
3. 如果数据不足，明确写出 data_gaps，不要断言具体原因。
4. 所有建议都必须是“建议”，不能声称已经执行；价格、库存、广告动作需人工确认。
5. 只输出 JSON，不要输出 Markdown 代码块、前后解释或多余文字。
6. 输出要短：findings 2-3 条，causes 2-3 条，actions 2-3 条，summary 不超过 150 字，data_gaps 2-4 条。
7. findings / causes / actions 必须是对象数组，不能是字符串数组；每条尽量带 evidence_ids。
8. JSON 必须完整闭合，不要输出思考过程，不要在字符串里使用未转义的换行或双引号。

JSON 结构：
{
  "headline": "一句话结论",
  "summary": "2-3 句经营总结",
  "findings": [{"text": "有数据支持的事实", "evidence_ids": ["E1"], "confidence": "high|medium|low"}],
  "causes": [{"text": "可能原因", "evidence_ids": ["E2"], "confidence": "high|medium|low"}],
  "actions": [{"priority": "P0|P1|P2", "title": "动作标题", "detail": "具体做法", "evidence_ids": ["E1"]}],
  "data_gaps": ["需要补充的数据"]
}
"""


def build_messages(question: str, facts: dict[str, Any], intent: dict[str, Any]) -> list[dict[str, str]]:
    payload = {
        "question": question,
        "time_range": facts["range"],
        "kpis": {
            key: facts["kpis"].get(key)
            for key in (
                "sales",
                "orders",
                "visitors",
                "conversion",
                "aov",
                "gross_margin",
                "refund_rate",
                "sales_growth",
                "orders_growth",
                "visitors_growth",
                "conversion_growth",
            )
        },
        "summary": {
            "total_sales": facts["summary"].get("total_sales"),
            "peak_label": facts["summary"].get("peak_label"),
            "top_channel": facts["summary"].get("top_channel"),
            "fastest": facts["summary"].get("fastest"),
            "low_margin": facts["summary"].get("low_margin"),
            "top_alert": facts["summary"].get("top_alert"),
        },
        "channels": facts["channels"][:5],
        "products": [
            {
                "name": item["name"],
                "category": item["category"],
                "sales": item["sales"],
                "qty": item["qty"],
                "margin": item["margin"],
                "growth": item["growth"],
                "stock": item["stock"],
                "safety": item["safety"],
            }
            for item in facts["products"][:6]
        ],
        "inventory_alerts": facts["inventory_alerts"][:5],
        "product_detail": facts.get("product"),
        "evidence": facts["evidence"],
        "intent": {
            "range_label": intent.get("range_label"),
            "channel": intent.get("channel"),
            "category": intent.get("category"),
        },
    }
    user_prompt = (
        "请基于以下 facts 回答用户问题，并严格按系统要求输出 JSON。\n\n"
        f"FACTS:\n{json.dumps(payload, ensure_ascii=False, default=str)}\n\n"
        f"USER QUESTION:\n{question}"
    )
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt},
    ]
