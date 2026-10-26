from __future__ import annotations

import json
import time
from typing import Any, TypedDict

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.agent.prompts import build_messages
from app.agent.provider import ProviderError, ZhipuProvider
from json_repair import repair_json
from app.agent.tools import build_deterministic_report, build_facts, normalize_report, parse_intent
from app.core.config import settings
from app.db.models import Product


class AgentState(TypedDict, total=False):
    db: Session
    question: str
    requested: dict[str, Any]
    intent: dict[str, Any]
    facts: dict[str, Any]
    deterministic: dict[str, Any]
    llm_payload: dict[str, Any]
    report: dict[str, Any]
    mode: str
    model: str | None
    tokens: int
    latency_ms: int
    attempts: list[dict[str, Any]]
    llm_error: str | None


def _parse_json(content: str) -> dict[str, Any]:
    text = content.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.startswith("json"):
            text = text[4:].strip()
    start = text.find("{")
    end = text.rfind("}")
    if start >= 0 and end > start:
        text = text[start : end + 1]
    try:
        payload = json.loads(text)
    except json.JSONDecodeError:
        payload = repair_json(text, return_objects=True)
    if not isinstance(payload, dict):
        raise ValueError("模型输出不是 JSON 对象")
    return payload


def _resolve_product(db: Session, question: str, intent: dict[str, Any]) -> dict[str, Any]:
    rows = db.execute(select(Product.id, Product.name)).all()
    for product_id, name in sorted(rows, key=lambda item: len(item[1]), reverse=True):
        if name in question:
            intent["product_id"] = product_id
            intent["product_name"] = name
            break
    return intent


def _parse_intent_node(state: AgentState) -> AgentState:
    requested = state.get("requested") or {}
    intent = parse_intent(
        state["question"],
        range_key=requested.get("range", "7d"),
        start=requested.get("start"),
        end=requested.get("end"),
        channel=requested.get("channel"),
        category=requested.get("category"),
    )
    intent = _resolve_product(state["db"], state["question"], intent)
    return {"intent": intent}


def _fetch_facts_node(state: AgentState) -> AgentState:
    facts = build_facts(state["db"], state["intent"])
    return {"facts": facts}


def _analyze_node(state: AgentState) -> AgentState:
    deterministic = build_deterministic_report(state["facts"], state["intent"])
    return {"deterministic": deterministic}


def _compose_node(state: AgentState) -> AgentState:
    deterministic = state["deterministic"]
    provider = ZhipuProvider()
    if not provider.enabled:
        return {
            "report": deterministic,
            "mode": "fallback",
            "model": None,
            "tokens": 0,
            "latency_ms": 0,
            "attempts": [],
            "llm_error": "大模型未配置，使用规则分析",
        }

    started = time.perf_counter()
    result = None
    try:
        result = provider.chat(build_messages(state["question"], state["facts"], state["intent"]))
        payload = _parse_json(result.content)
        return {
            "llm_payload": payload,
            "mode": "zhipu",
            "model": result.model,
            "tokens": result.tokens,
            "latency_ms": result.latency_ms,
            "attempts": result.attempts,
            "llm_error": None,
        }
    except (ProviderError, ValueError, json.JSONDecodeError) as exc:
        detail = str(exc)
        if result is not None:
            detail = f"{detail} (finish={result.finish_reason or '-'}, chars={len(result.content)})"
        return {
            "report": deterministic,
            "mode": "fallback",
            "model": None,
            "tokens": 0,
            "latency_ms": int((time.perf_counter() - started) * 1000),
            "attempts": result.attempts if result else [],
            "llm_error": detail,
        }


def _validate_node(state: AgentState) -> AgentState:
    facts = state["facts"]
    deterministic = state["deterministic"]
    payload = state.get("llm_payload")
    if payload:
        allowed = {item["id"] for item in facts["evidence"]}
        report = normalize_report(payload, deterministic, allowed)
        if report.get("source") == "llm":
            report["evidence"] = facts["evidence"]
            report["kpis"] = facts["kpis"]
            return {"report": report}
    report = {**deterministic, "evidence": facts["evidence"], "kpis": facts["kpis"]}
    return {"report": report}


def _build_graph():
    from langgraph.graph import END, START, StateGraph

    builder = StateGraph(AgentState)
    builder.add_node("parse_intent", _parse_intent_node)
    builder.add_node("fetch_facts", _fetch_facts_node)
    builder.add_node("analyze", _analyze_node)
    builder.add_node("compose", _compose_node)
    builder.add_node("validate", _validate_node)
    builder.add_edge(START, "parse_intent")
    builder.add_edge("parse_intent", "fetch_facts")
    builder.add_edge("fetch_facts", "analyze")
    builder.add_edge("analyze", "compose")
    builder.add_edge("compose", "validate")
    builder.add_edge("validate", END)
    return builder.compile()


_GRAPH = None


def run_workflow(
    db: Session,
    question: str,
    range_key: str = "7d",
    start=None,
    end=None,
    channel: str | None = None,
    category: str | None = None,
) -> dict[str, Any]:
    global _GRAPH
    if _GRAPH is None:
        _GRAPH = _build_graph()
    result = _GRAPH.invoke(
        {
            "db": db,
            "question": question,
            "requested": {
                "range": range_key,
                "start": start,
                "end": end,
                "channel": channel,
                "category": category,
            },
        }
    )
    return {
        "intent": result["intent"],
        "facts": result["facts"],
        "report": result["report"],
        "mode": result.get("mode", "fallback"),
        "model": result.get("model"),
        "tokens": result.get("tokens", 0),
        "latency_ms": result.get("latency_ms", 0),
        "attempts": result.get("attempts", []),
        "llm_error": result.get("llm_error"),
        "llm_payload": result.get("llm_payload"),
    }
