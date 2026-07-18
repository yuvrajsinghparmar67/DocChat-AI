"""
Chat endpoint: retrieves relevant chunks via FAISS, then streams the
LLM's answer back to the client over Server-Sent Events (SSE).

SSE event stream shape (each line is `data: <json>\\n\\n`):
  {"type": "sources", "sources": [SourceCitation, ...]}
  {"type": "token", "content": "..."}          (repeated)
  {"type": "done"}
  {"type": "error", "message": "..."}
"""
from __future__ import annotations

import json

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.core.config import get_settings
from app.models.schemas import ChatRequest
from app.services import document_service, llm_service
from app.services.vector_store import get_vector_store

router = APIRouter(prefix="/api/chat", tags=["chat"])
settings = get_settings()


def _sse(payload: dict) -> str:
    return f"data: {json.dumps(payload)}\n\n"


@router.post("/stream")
async def chat_stream(request: ChatRequest):
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    ready_docs = [d for d in document_service.list_documents() if d.status == "ready"]
    if not ready_docs:
        raise HTTPException(
            status_code=400,
            detail="No ready documents to search. Upload a PDF first and wait for it to finish processing.",
        )

    target_ids = request.document_ids or [d.id for d in ready_docs]

    async def event_generator():
        try:
            [query_embedding] = await llm_service.embed_texts([request.message], is_query=True)
            matches = get_vector_store().search(
                query_embedding=query_embedding,
                top_k=settings.retrieval_top_k,
                document_ids=target_ids,
            )

            sources = [
                {
                    "document_id": m["document_id"],
                    "filename": m["filename"],
                    "page_number": m["page_number"],
                    "snippet": (m["text"][:220] + "…") if len(m["text"]) > 220 else m["text"],
                    "relevance_score": round(m["relevance_score"], 4),
                }
                for m in matches
            ]
            yield _sse({"type": "sources", "sources": sources})

            history = [h.model_dump() for h in request.history]
            async for token in llm_service.stream_chat_answer(
                question=request.message,
                context_chunks=matches,
                history=history,
            ):
                yield _sse({"type": "token", "content": token})

            yield _sse({"type": "done"})
        except Exception as exc:  # noqa: BLE001 - convert to an SSE error event
            yield _sse({"type": "error", "message": str(exc)})

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
