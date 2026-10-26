from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy import func, select

from app.api.routes import ai, imports, meta, overview, products, sales
from app.core.config import BASE_DIR, settings
from app.db.models import Product
from app.db.seed import seed_database
from app.db.session import SessionLocal, init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    with SessionLocal() as db:
        count = db.scalar(select(func.count()).select_from(Product)) or 0
    if count == 0:
        seed_database()
    yield


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="AI 电商数据中台 API",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    return JSONResponse(status_code=400, content={"detail": str(exc)})


for router in (meta.router, overview.router, products.router, sales.router, imports.router, ai.router):
    app.include_router(router, prefix=settings.api_prefix)


@app.get("/api/v1/health")
def health():
    return {
        "status": "ok",
        "app": settings.app_name,
        "ai_mode": settings.ai_mode,
        "model": settings.zhipu_model,
        "fallback_models": settings.fallback_models,
    }


frontend_dist = BASE_DIR.parent / "frontend" / "dist"
if frontend_dist.exists():

    @app.get("/{full_path:path}", include_in_schema=False)
    def spa(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not Found")
        root = frontend_dist.resolve()
        candidate = (root / full_path).resolve()
        if candidate.is_file() and candidate.is_relative_to(root):
            return FileResponse(candidate)
        return FileResponse(root / "index.html")

else:

    @app.get("/")
    def root():
        return {
            "app": settings.app_name,
            "docs": "/docs",
            "api": settings.api_prefix,
            "message": "前端尚未构建，开发模式请运行 frontend 的 npm run dev",
        }
