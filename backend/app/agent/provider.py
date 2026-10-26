from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Any

import httpx

from app.core.config import settings


class ProviderError(RuntimeError):
    pass


@dataclass
class ProviderResult:
    content: str
    model: str
    tokens: int = 0
    latency_ms: int = 0
    finish_reason: str = ""
    attempts: list[dict[str, Any]] = field(default_factory=list)


class ZhipuProvider:
    """Small OpenAI-compatible client for Zhipu BigModel.

    The primary model is configurable. If it is rate-limited / unavailable,
    the client transparently falls back to the configured backup model.
    """

    def __init__(self) -> None:
        self.base_url = settings.zhipu_base_url.rstrip("/")
        self.api_key = settings.zhipu_api_key
        self.models = settings.model_candidates

    @property
    def enabled(self) -> bool:
        return bool(self.api_key) and settings.ai_mode != "mock"

    def chat(self, messages: list[dict[str, str]], max_tokens: int = 2400) -> ProviderResult:
        if not self.enabled:
            raise ProviderError("大模型未配置，使用规则分析")

        attempts: list[dict[str, Any]] = []
        started = time.perf_counter()
        last_error = "unknown error"

        for model in self.models:
            payload: dict[str, Any] = {
                "model": model,
                "messages": messages,
                "temperature": 0.2,
                "max_tokens": max_tokens,
                "stream": False,
            }
            # GLM-4.x supports disabling the reasoning chain; it keeps the
            # structured report fast and makes the JSON easier to parse.
            if model.startswith("glm-4"):
                payload["thinking"] = {"type": "disabled"}

            try:
                with httpx.Client(timeout=httpx.Timeout(22.0, connect=8.0)) as client:
                    response = client.post(
                        f"{self.base_url}/chat/completions",
                        headers={
                            "Authorization": f"Bearer {self.api_key}",
                            "Content-Type": "application/json",
                        },
                        json=payload,
                    )
                elapsed = int((time.perf_counter() - started) * 1000)
                if response.status_code == 200:
                    data = response.json()
                    choice = (data.get("choices") or [{}])[0]
                    message = choice.get("message") or {}
                    content = (message.get("content") or "").strip()
                    usage = data.get("usage") or {}
                    attempts.append({"model": model, "status": 200, "latency_ms": elapsed})
                    if not content:
                        last_error = "模型返回内容为空"
                        continue
                    return ProviderResult(
                        content=content,
                        model=data.get("model") or model,
                        tokens=int(usage.get("total_tokens") or 0),
                        latency_ms=elapsed,
                        finish_reason=choice.get("finish_reason") or "",
                        attempts=attempts,
                    )

                body = response.text[:300]
                attempts.append({"model": model, "status": response.status_code, "error": body})
                last_error = f"{model} HTTP {response.status_code}: {body}"
                # 429 / 404 / 5xx -> try the next candidate model.
                if response.status_code not in {404, 408, 409, 429, 500, 502, 503, 504}:
                    raise ProviderError(last_error)
            except httpx.HTTPError as exc:
                attempts.append({"model": model, "status": "network_error", "error": str(exc)})
                last_error = f"{model} 网络异常：{exc}"
            except ProviderError:
                raise

        raise ProviderError(f"所有模型均不可用：{last_error}")

    def health(self) -> dict[str, Any]:
        return {
            "enabled": self.enabled,
            "mode": settings.ai_mode,
            "primary_model": settings.zhipu_model,
            "fallback_models": settings.fallback_models,
            "base_url": self.base_url,
        }
