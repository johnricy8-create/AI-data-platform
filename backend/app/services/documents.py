from __future__ import annotations

import io
import json
import shutil
import subprocess
import tempfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import pdfplumber
from docx import Document
from pptx import Presentation

LEGACY_FORMATS = {"doc", "ppt"}
MODERN_DOCUMENT_FORMATS = {"docx", "pptx", "pdf"}
DOCUMENT_FORMATS = MODERN_DOCUMENT_FORMATS | LEGACY_FORMATS


@dataclass
class ExtractedDocument:
    format: str
    text: str = ""
    tables: list[list[list[str]]] = field(default_factory=list)
    pages: int = 0
    slides: int = 0
    warnings: list[str] = field(default_factory=list)
    converted_from: str | None = None

    @property
    def text_chars(self) -> int:
        return len(self.text)

    def prompt_payload(self, max_chars: int = 16000) -> str:
        text = self.text[:max_chars]
        payload: dict[str, Any] = {
            "format": self.format,
            "text": text,
            "tables": self.tables[:40],
        }
        if len(self.text) > max_chars:
            payload["truncated"] = True
        if self.warnings:
            payload["warnings"] = self.warnings
        return json.dumps(payload, ensure_ascii=False)

    def meta(self) -> dict[str, Any]:
        return {
            "format": self.format,
            "pages": self.pages,
            "slides": self.slides,
            "text_chars": self.text_chars,
            "table_count": len(self.tables),
            "warnings": self.warnings,
            "converted_from": self.converted_from,
        }


def _find_soffice() -> str | None:
    candidates = [
        shutil.which("soffice"),
        r"C:\Program Files\LibreOffice\program\soffice.exe",
        r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
    ]
    for candidate in candidates:
        if candidate and Path(candidate).exists():
            return candidate
    return None


def _convert_legacy(filename: str, content: bytes) -> tuple[str, bytes, str]:
    """Convert .doc/.ppt with LibreOffice when available.

    Office COM automation is intentionally not used here: it requires Excel/Word
    to be installed and is fragile in service processes.
    """
    suffix = filename.lower().rsplit(".", 1)[-1]
    target = "docx" if suffix == "doc" else "pptx"
    soffice = _find_soffice()
    if not soffice:
        raise ValueError(
            f"暂不支持直接解析旧版 .{suffix}。请先另存为 .{target}，或安装 LibreOffice 后重试。"
        )
    with tempfile.TemporaryDirectory(prefix="ai-hub-doc-") as temp_dir:
        input_path = Path(temp_dir) / f"source.{suffix}"
        input_path.write_bytes(content)
        result = subprocess.run(
            [soffice, "--headless", "--convert-to", target, "--outdir", temp_dir, str(input_path)],
            capture_output=True,
            text=True,
            timeout=90,
        )
        output_path = Path(temp_dir) / f"source.{target}"
        if result.returncode != 0 or not output_path.exists():
            raise ValueError(f"旧版 .{suffix} 转换失败：{result.stderr[:200]}")
        return f"converted.{target}", output_path.read_bytes(), suffix


def _extract_docx(content: bytes) -> tuple[str, list[list[list[str]]], int, list[str]]:
    document = Document(io.BytesIO(content))
    paragraphs = [paragraph.text.strip() for paragraph in document.paragraphs if paragraph.text.strip()]
    tables: list[list[list[str]]] = []
    for table in document.tables:
        rows: list[list[str]] = []
        for row in table.rows:
            cells = [cell.text.strip() for cell in row.cells]
            if any(cells):
                rows.append(cells)
        if rows:
            tables.append(rows)
    warnings: list[str] = []
    if not paragraphs and not tables:
        warnings.append("文档中没有可读取的文字或表格")
    return "\n".join(paragraphs), tables, 0, warnings


def _extract_pptx(content: bytes) -> tuple[str, list[list[list[str]]], int, list[str]]:
    presentation = Presentation(io.BytesIO(content))
    texts: list[str] = []
    tables: list[list[list[str]]] = []
    for slide_index, slide in enumerate(presentation.slides, start=1):
        for shape in slide.shapes:
            if getattr(shape, "has_text_frame", False):
                value = shape.text.strip()
                if value:
                    texts.append(f"[Slide {slide_index}] {value}")
            if getattr(shape, "has_table", False):
                rows: list[list[str]] = []
                for row in shape.table.rows:
                    cells = [cell.text.strip() for cell in row.cells]
                    if any(cells):
                        rows.append(cells)
                if rows:
                    tables.append(rows)
    warnings: list[str] = []
    if not texts and not tables:
        warnings.append("PPT 中没有可读取的文字或表格")
    return "\n".join(texts), tables, len(presentation.slides), warnings


def _extract_pdf(content: bytes) -> tuple[str, list[list[list[str]]], int, list[str]]:
    texts: list[str] = []
    tables: list[list[list[str]]] = []
    warnings: list[str] = []
    with pdfplumber.open(io.BytesIO(content)) as pdf:
        pages = len(pdf.pages)
        for page_index, page in enumerate(pdf.pages, start=1):
            text = (page.extract_text() or "").strip()
            if text:
                texts.append(f"[Page {page_index}] {text}")
            for table in page.extract_tables() or []:
                rows = [[(cell or "").strip() for cell in row] for row in table]
                rows = [row for row in rows if any(row)]
                if rows:
                    tables.append(rows)
        if not texts and not tables:
            warnings.append("PDF 没有可提取的文字，可能是扫描件，需要 OCR")
    return "\n".join(texts), tables, pages, warnings


def extract_document(filename: str, content: bytes) -> ExtractedDocument:
    suffix = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
    converted_from = None
    if suffix in LEGACY_FORMATS:
        filename, content, converted_from = _convert_legacy(filename, content)
        suffix = filename.lower().rsplit(".", 1)[-1]

    if suffix == "docx":
        text, tables, pages, warnings = _extract_docx(content)
        return ExtractedDocument("docx", text, tables, pages=pages, warnings=warnings, converted_from=converted_from)
    if suffix == "pptx":
        text, tables, slides, warnings = _extract_pptx(content)
        return ExtractedDocument("pptx", text, tables, slides=slides, warnings=warnings, converted_from=converted_from)
    if suffix == "pdf":
        text, tables, pages, warnings = _extract_pdf(content)
        return ExtractedDocument("pdf", text, tables, pages=pages, warnings=warnings, converted_from=converted_from)
    raise ValueError("不支持的文档格式")
