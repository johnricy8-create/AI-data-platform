from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = BASE_DIR / "data"


class Settings(BaseSettings):
    app_name: str = "AI Commerce Hub"
    api_prefix: str = "/api/v1"
    database_url: str = f"sqlite:///{(DATA_DIR / 'app.db').as_posix()}"
    zhipu_api_key: str = ""
    zhipu_base_url: str = "https://open.bigmodel.cn/api/paas/v4"
    zhipu_model: str = "glm-4.7-flash"
    zhipu_fallback_models: str = "glm-4.7"
    ai_mode: str = "zhipu"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173"
    max_upload_mb: int = 20

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def resolved_database_url(self) -> str:
        url = self.database_url
        if url.startswith("sqlite:///./"):
            relative = url.removeprefix("sqlite:///./")
            return f"sqlite:///{(BASE_DIR / relative).as_posix()}"
        if url.startswith("sqlite:///"):
            relative = url.removeprefix("sqlite:///")
            path = Path(relative)
            if not path.is_absolute():
                return f"sqlite:///{(BASE_DIR / path).as_posix()}"
        return url

    @property
    def fallback_models(self) -> list[str]:
        return [item.strip() for item in self.zhipu_fallback_models.split(",") if item.strip()]

    @property
    def cors_origin_list(self) -> list[str]:
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]

    @property
    def model_candidates(self) -> list[str]:
        models = [self.zhipu_model, *self.fallback_models]
        return list(dict.fromkeys(models))


settings = Settings()
