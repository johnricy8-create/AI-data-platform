from __future__ import annotations

import time
import uuid
from datetime import date, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.agent.workflow import run_workflow
from app.db.models import AIReport


def answer_question(
    db: Session,
    question: str,
    range_key: str = "7d",
    start: date | None = None,
    end: date | None = None,
    channel: str | None = None,
    category: str | None = None,
    save: bool = True,
) -> dict[str, Any]:
    started = time.perf_counter()
    result = run_workflow(db, question, range_key, start, end, channel, category)
    facts = result["facts"]
    report = result["report"]
    mode = "zhipu" if report.get("source") == "llm" else "fallback"
    report_id = f"RPT-{datetime.now().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:4].upper()}"
    elapsed = int((time.perf_counter() - started) * 1000)

    response: dict[str, Any] = {
        "id": report_id,
        "question": question,
        "range": facts["range"],
        "kpis": facts["kpis"],
        "evidence": facts["evidence"],
        "report": report,
        "model": result.get("model") if mode == "zhipu" else None,
        "mode": mode,
        "tokens": result.get("tokens", 0),
        "latency_ms": elapsed,
        "llm_latency_ms": result.get("latency_ms", 0),
        "attempts": result.get("attempts", []),
        "llm_error": result.get("llm_error"),
        "created_at": datetime.now().isoformat(),
    }

    if save:
        row = AIReport(
            id=report_id,
            question=question,
            date_start=date.fromisoformat(facts["range"]["start"]),
            date_end=date.fromisoformat(facts["range"]["end"]),
            channel=facts["range"].get("channel"),
            category=facts["range"].get("category"),
            headline=report.get("headline", ""),
            summary=report.get("summary", ""),
            report_json=response,
            model=response["model"],
            mode=mode,
            tokens=response["tokens"],
            latency_ms=elapsed,
        )
        db.add(row)
        db.commit()
        db.refresh(row)
        response["created_at"] = row.created_at.isoformat() if row.created_at else response["created_at"]

    return response


def list_reports(db: Session, limit: int = 30) -> list[dict[str, Any]]:
    rows = db.execute(select(AIReport).order_by(AIReport.created_at.desc()).limit(limit)).scalars().all()
    return [
        {
            "id": row.id,
            "question": row.question,
            "headline": row.headline,
            "summary": row.summary,
            "mode": row.mode,
            "model": row.model,
            "tokens": row.tokens,
            "latency_ms": row.latency_ms,
            "created_at": row.created_at.isoformat() if row.created_at else None,
        }
        for row in rows
    ]


def get_report(db: Session, report_id: str) -> dict[str, Any] | None:
    row = db.get(AIReport, report_id)
    if not row:
        return None
    return row.report_json


def report_markdown(report: dict[str, Any]) -> str:
    body = report.get("report") or {}
    lines = [
        f"# {body.get('headline', '经营分析报告')}",
        "",
        f"> 问题：{report.get('question', '')}",
        f"> 范围：{report.get('range', {}).get('start', '')} 至 {report.get('range', {}).get('end', '')}",
        f"> 模式：{report.get('mode', 'fallback')}",
        "",
        body.get("summary", ""),
        "",
        "## 数据依据",
    ]
    for item in body.get("findings", []):
        refs = ", ".join(item.get("evidence_ids", []))
        lines.append(f"- {item.get('text', '')}（{refs}，{item.get('confidence', 'medium')}）")
    lines.extend(["", "## 可能原因"])
    for item in body.get("causes", []):
        refs = ", ".join(item.get("evidence_ids", []))
        lines.append(f"- {item.get('text', '')}（{refs}，{item.get('confidence', 'medium')}）")
    lines.extend(["", "## 建议动作"])
    for item in body.get("actions", []):
        lines.append(f"- [{item.get('priority', 'P2')}] **{item.get('title', '')}**：{item.get('detail', '')}")
    lines.extend(["", "## 需要补充的数据"])
    for item in body.get("data_gaps", []):
        lines.append(f"- {item}")
    lines.extend(
        [
            "",
            "---",
            "本报告由 AI 电商数据中台生成，所有指标由程序计算；执行价格、库存、投放等动作前需人工确认。",
        ]
    )
    return "\n".join(lines)
