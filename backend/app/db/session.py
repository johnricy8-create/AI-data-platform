from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import DATA_DIR, settings
from app.db.base import Base

DATA_DIR.mkdir(parents=True, exist_ok=True)

url = settings.resolved_database_url
connect_args = {"check_same_thread": False} if url.startswith("sqlite") else {}
engine = create_engine(url, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    from app.db import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    if url.startswith("sqlite"):
        # Lightweight migration for existing local databases.
        with engine.begin() as connection:
            columns = [row[1] for row in connection.exec_driver_sql("PRAGMA table_info(import_jobs)").fetchall()]
            if "meta_json" not in columns:
                connection.exec_driver_sql("ALTER TABLE import_jobs ADD COLUMN meta_json JSON")
