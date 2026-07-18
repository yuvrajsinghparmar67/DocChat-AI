"""Endpoints for uploading, listing, deleting, and summarizing PDFs."""
from __future__ import annotations

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.core.config import get_settings
from app.models.schemas import (
    DeleteResponse,
    DocumentListResponse,
    DocumentMetadata,
    SummaryResponse,
)
from app.services import document_service

router = APIRouter(prefix="/api/documents", tags=["documents"])
settings = get_settings()


@router.get("", response_model=DocumentListResponse)
async def list_documents() -> DocumentListResponse:
    return DocumentListResponse(documents=document_service.list_documents())


@router.post("/upload", response_model=DocumentMetadata)
async def upload_document(file: UploadFile = File(...)) -> DocumentMetadata:
    if file.content_type != "application/pdf" and not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    file_bytes = await file.read()
    max_bytes = settings.max_upload_mb * 1024 * 1024
    if len(file_bytes) > max_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds the {settings.max_upload_mb}MB upload limit.",
        )
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    existing = document_service.list_documents()
    if len(existing) >= settings.max_docs_per_session:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum of {settings.max_docs_per_session} documents reached. Delete one first.",
        )

    meta = await document_service.process_upload(file.filename, file_bytes)
    if meta.status == "error":
        # Still return 200 with error status so the UI can show a friendly
        # per-file error instead of failing the whole batch upload.
        return meta
    return meta


@router.delete("/{document_id}", response_model=DeleteResponse)
async def delete_document(document_id: str) -> DeleteResponse:
    deleted = document_service.delete_document(document_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Document not found.")
    return DeleteResponse(id=document_id, deleted=True)


@router.post("/{document_id}/summary", response_model=SummaryResponse)
async def summarize_document(document_id: str) -> SummaryResponse:
    meta = document_service.get_document(document_id)
    if meta is None:
        raise HTTPException(status_code=404, detail="Document not found.")
    if meta.status != "ready":
        raise HTTPException(status_code=400, detail="Document is not ready yet.")

    try:
        summary = await document_service.summarize_document(document_id)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return SummaryResponse(document_id=document_id, summary=summary)
