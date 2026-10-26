from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.services.documents import DOCUMENT_FORMATS, LEGACY_FORMATS
from app.services.imports import DATA_TYPES, get_job, import_file, list_jobs, template_csv

router = APIRouter(tags=["imports"])


@router.get("/imports")
def imports(limit: int = 30, db: Session = Depends(get_db)):
    return {"items": list_jobs(db, limit=limit)}


@router.get("/imports/formats")
def formats():
    return {
        "data_types": sorted(DATA_TYPES),
        "table_formats": ["csv", "xlsx", "xls"],
        "document_formats": sorted(DOCUMENT_FORMATS),
        "legacy_formats": sorted(LEGACY_FORMATS),
        "max_upload_mb": settings.max_upload_mb,
        "document_mode": "AI 抽取表格/文本并结构化为标准字段",
    }


@router.get("/imports/template/{data_type}")
def template(data_type: str):
    try:
        content, filename = template_csv(data_type)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return Response(
        content=("\ufeff" + content).encode("utf-8"),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/imports")
def upload(
    file: UploadFile = File(...),
    data_type: str = Form("orders"),
    db: Session = Depends(get_db),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="文件名不能为空")
    content = file.file.read()
    try:
        return import_file(db, file.filename, data_type, content)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/imports/{job_id}")
def job(job_id: str, db: Session = Depends(get_db)):
    result = get_job(db, job_id)
    if not result:
        raise HTTPException(status_code=404, detail="导入任务不存在")
    return result
