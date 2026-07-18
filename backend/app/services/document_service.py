"""
Orchestrates the document lifecycle:
  upload -> parse -> chunk -> embed -> index -> ready

Also owns the small JSON-backed metadata store (list of DocumentMetadata)
that the frontend's document list / status polling reads from.
"""
from __future__ import annotations

import json
import os
import threading
import uuid
from datetime import datetime

from app.core.config import get_settings
from app.models.schemas import DocumentMetadata, DocumentStatus
from app.services import llm_service, pdf_service
from app.services.vector_store import get_vector_store

settings = get_settings()
_lock = threading.Lock()


def _load_all() -> dict[str, dict]:
    if os.path.exists(settings.metadata_path):
        with open(settings.metadata_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def _save_all(data: dict[str, dict]) -> None:
    os.makedirs(os.path.dirname(settings.metadata_path), exist_ok=True)
    with open(settings.metadata_path, "w", encoding="utf-8") as f:
        json.dump(data, f, default=str)


def list_documents() -> list[DocumentMetadata]:
    with _lock:
        data = _load_all()
    docs = [DocumentMetadata(**v) for v in data.values()]
    return sorted(docs, key=lambda d: d.uploaded_at, reverse=True)


def get_document(document_id: str) -> DocumentMetadata | None:
    with _lock:
        data = _load_all()
    raw = data.get(document_id)
    return DocumentMetadata(**raw) if raw else None


def _upsert(meta: DocumentMetadata) -> None:
    with _lock:
        data = _load_all()
        data[meta.id] = json.loads(meta.model_dump_json())
        _save_all(data)


def delete_document(document_id: str) -> bool:
    with _lock:
        data = _load_all()
        meta = data.pop(document_id, None)
        _save_all(data)
    if meta is None:
        return False

    get_vector_store().delete_document(document_id)

    file_path = os.path.join(settings.upload_dir, f"{document_id}.pdf")
    if os.path.exists(file_path):
        os.remove(file_path)
    return True


async def process_upload(filename: str, file_bytes: bytes) -> DocumentMetadata:
    """
    Save the raw PDF, register it as 'processing', then parse/chunk/embed
    it and flip status to 'ready' (or 'error' on failure).
    This runs inline (awaited) so the caller can report exact failures,
    but is fast enough for typical PDFs (a few seconds).
    """
    document_id = str(uuid.uuid4())
    os.makedirs(settings.upload_dir, exist_ok=True)
    file_path = os.path.join(settings.upload_dir, f"{document_id}.pdf")
    with open(file_path, "wb") as f:
        f.write(file_bytes)

    meta = DocumentMetadata(
        id=document_id,
        filename=filename,
        size_bytes=len(file_bytes),
        status=DocumentStatus.PROCESSING,
        uploaded_at=datetime.utcnow(),
    )
    _upsert(meta)

    try:
        page_count = pdf_service.get_page_count(file_path)
        chunks = pdf_service.chunk_pdf(file_path)

        chunk_dicts = [{"text": c.text, "page_number": c.page_number} for c in chunks]

        # Describe embedded images/diagrams/charts (and, for scanned pages
        # with no text layer, the whole rendered page) via Gemini Vision,
        # and fold them in as additional citable chunks tagged by page.
        images = pdf_service.extract_images(file_path)
        if images:
            descriptions = await llm_service.describe_images(
                [(img.image_bytes, img.mime_type) for img in images]
            )
            for img, description in zip(images, descriptions):
                if not description:
                    continue  # skipped/failed image description
                label = "Scanned page content" if img.is_full_page_render else "Image"
                chunk_dicts.append(
                    {"text": f"[{label}] {description}", "page_number": img.page_number}
                )

        if not chunk_dicts:
            raise ValueError("No extractable text or describable images found in this PDF.")

        texts = [c["text"] for c in chunk_dicts]
        embeddings = await llm_service.embed_texts(texts)

        get_vector_store().add_chunks(
            document_id=document_id,
            filename=filename,
            chunks=chunk_dicts,
            embeddings=embeddings,
        )

        meta.page_count = page_count
        meta.chunk_count = len(chunk_dicts)
        meta.status = DocumentStatus.READY
    except Exception as exc:  # noqa: BLE001 - surface any failure to the UI
        meta.status = DocumentStatus.ERROR
        meta.error_message = str(exc)

    _upsert(meta)
    return meta


async def summarize_document(document_id: str) -> str:
    meta = get_document(document_id)
    if meta is None:
        raise ValueError("Document not found")
    if meta.summary:
        return meta.summary

    full_text = get_vector_store().get_document_text(document_id)
    if not full_text:
        raise ValueError("Document has no indexed content to summarize")

    summary = await llm_service.generate_summary(full_text, meta.filename)
    meta.summary = summary
    _upsert(meta)
    return summary
