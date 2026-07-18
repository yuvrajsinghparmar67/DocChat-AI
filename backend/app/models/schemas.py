"""
Pydantic models shared across routers and services.
These define the exact JSON shape the frontend can rely on.
"""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class DocumentStatus(str, Enum):
    PROCESSING = "processing"
    READY = "ready"
    ERROR = "error"


class DocumentMetadata(BaseModel):
    """Represents a single uploaded PDF and its processing state."""

    id: str
    filename: str
    size_bytes: int
    page_count: int = 0
    chunk_count: int = 0
    status: DocumentStatus = DocumentStatus.PROCESSING
    error_message: Optional[str] = None
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    summary: Optional[str] = None


class DocumentListResponse(BaseModel):
    documents: list[DocumentMetadata]


class DeleteResponse(BaseModel):
    id: str
    deleted: bool


class SourceCitation(BaseModel):
    """A single retrieved chunk cited as evidence for an answer."""

    document_id: str
    filename: str
    page_number: int
    snippet: str
    relevance_score: float


class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    document_ids: Optional[list[str]] = None  # None => search all ready docs
    history: list[ChatMessage] = Field(default_factory=list)


class SummaryRequest(BaseModel):
    document_id: str


class SummaryResponse(BaseModel):
    document_id: str
    summary: str
