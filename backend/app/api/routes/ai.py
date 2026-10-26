from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session

from app.agent.provider import ZhipuProvider
from app.db.session import get_db
from app.schemas.ai import ChatRequest
from app.services.ai_service import answer_question, get_report, list_reports, report_markdown

router = APIRouter(tags=["ai"])


@router.post("/ai/chat")
def chat(payload: ChatRequest, db: Session = Depends(get_db)):
    try:
        return answer_question(
            db,
            question=payload.question,
            range_key=payload.range,
            start=payload.start,
            end=payload.end,
            channel=payload.channel,
            category=payload.category,
            save=payload.save,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"分析失败：{exc}") from exc


@router.get("/ai/health")
def health():
    return ZhipuProvider().health()


@router.get("/ai/reports")
def reports(limit: int = Query(30, ge=1, le=100), db: Session = Depends(get_db)):
    return {"items": list_reports(db, limit=limit)}


@router.get("/ai/reports/{report_id}")
def report(report_id: str, db: Session = Depends(get_db)):
    result = get_report(db, report_id)
    if not result:
        raise HTTPException(status_code=404, detail="报告不存在")
    return result


@router.get("/ai/reports/{report_id}/markdown")
def report_markdown_download(report_id: str, db: Session = Depends(get_db)):
    result = get_report(db, report_id)
    if not result:
        raise HTTPException(status_code=404, detail="报告不存在")
    markdown = report_markdown(result)
    return PlainTextResponse(
        markdown,
        media_type="text/markdown; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{report_id}.md"'},
    )
