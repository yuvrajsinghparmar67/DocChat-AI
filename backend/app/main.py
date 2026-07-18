"""
AI Document Chat — FastAPI backend entrypoint.

Run locally with:
    uvicorn app.main:app --reload --port 8000
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.routers import chat, documents

settings = get_settings()

app = FastAPI(
    title="AI Document Chat API",
    description="RAG backend for chatting with uploaded PDFs, with FAISS retrieval and streaming answers.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents.router)
app.include_router(chat.router)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Ensure the frontend always receives clean JSON errors, never a raw 500 HTML page."""
    return JSONResponse(status_code=500, content={"detail": f"Internal server error: {exc}"})


@app.get("/api/health")
async def health_check() -> dict:
    return {"status": "ok"}
