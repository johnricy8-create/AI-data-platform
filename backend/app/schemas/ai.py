from datetime import date

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    question: str = Field(min_length=2, max_length=1000)
    range: str = "7d"
    start: date | None = None
    end: date | None = None
    channel: str | None = None
    category: str | None = None
    save: bool = True
