from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.metrics import get_meta

router = APIRouter(tags=["meta"])


@router.get("/meta/filters")
def filters(db: Session = Depends(get_db)):
    return get_meta(db)
