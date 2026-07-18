"""
Thin wrapper around the Google Gemini API for:
  1. Generating embeddings (used to build/query the FAISS index)
  2. Streaming chat completions (used for the RAG answer + summaries)

Uses Google's `google-genai` SDK. Gemini's free tier covers both the
chat model (`gemini-3.5-flash`) and the embeddings model
(`gemini-embedding-2`), so no paid provider is required.
"""
from __future__ import annotations

import asyncio
from collections.abc import AsyncGenerator

from google import genai
from google.genai import types

from app.core.config import get_settings

settings = get_settings()

_client: genai.Client | None = None

# gemini-embedding-2 supports configurable output dimensions (up to 3072).
# 768 keeps FAISS storage compact while preserving strong retrieval quality.
# vector_store.py's EMBEDDING_DIM must match this value.
EMBEDDING_DIMENSION = 768


def get_client() -> genai.Client:
    global _client
    if _client is None:
        if not settings.gemini_api_key:
            raise RuntimeError(
                "GEMINI_API_KEY is not set. Add it to your .env file before "
                "uploading documents or chatting."
            )
        _client = genai.Client(api_key=settings.gemini_api_key)
    return _client


async def embed_texts(texts: list[str], is_query: bool = False) -> list[list[float]]:
    """
    Embed a batch of strings. Returns one vector per input string, in order.

    Two things specific to `gemini-embedding-2` (as opposed to the older
    `gemini-embedding-2`) matter here:

    1. Passing multiple strings directly in `contents` produces ONE
       aggregated embedding, not one per string. To get separate,
       per-chunk vectors (required for our FAISS index), each string must
       be wrapped in its own `types.Content`.
    2. `task_type` is no longer a request parameter — Google now recommends
       baking the task into the text itself via a prefix, which measurably
       improves retrieval quality for asymmetric search (query vs. document).
    """
    if not texts:
        return []
    client = get_client()
    batch_size = 96
    vectors: list[list[float]] = []
    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]
        prefixed = [
            f"task: search result | query: {t}" if is_query else f"title: none | text: {t}"
            for t in batch
        ]
        contents = [types.Content(parts=[types.Part(text=t)]) for t in prefixed]
        response = await client.aio.models.embed_content(
            model=settings.embedding_model,
            contents=contents,
            config=types.EmbedContentConfig(output_dimensionality=EMBEDDING_DIMENSION),
        )
        vectors.extend([item.values for item in response.embeddings])
    return vectors


SYSTEM_PROMPT = """You are a precise, helpful research assistant embedded in a \
document chat application. Answer the user's question using ONLY the provided \
context excerpts from their uploaded PDFs.

Rules:
- If the answer is not contained in the context, say so plainly instead of guessing.
- Be concise and well-structured. Use markdown (short paragraphs, bullet points) where helpful.
- Do not fabricate page numbers, document names, or facts not present in the context.
- When you use a piece of context, write naturally; citations are attached separately \
by the application, so do not manually invent a citation format.
"""


def build_context_block(chunks: list[dict]) -> str:
    """Turn retrieved chunks into a numbered context block for the prompt."""
    lines = []
    for i, c in enumerate(chunks, start=1):
        lines.append(
            f"[Excerpt {i} | {c['filename']} | page {c['page_number']}]\n{c['text']}"
        )
    return "\n\n".join(lines)


def _to_gemini_contents(history: list[dict], user_turn: str) -> list[types.Content]:
    """
    Convert our internal {role, content} history (role: 'user' | 'assistant')
    into Gemini's Content list (role: 'user' | 'model'). The system prompt is
    passed separately via GenerateContentConfig.system_instruction, not as a
    turn in this list.
    """
    contents: list[types.Content] = []
    for turn in history[-6:]:
        role = "model" if turn["role"] == "assistant" else "user"
        contents.append(types.Content(role=role, parts=[types.Part(text=turn["content"])]))
    contents.append(types.Content(role="user", parts=[types.Part(text=user_turn)]))
    return contents


async def stream_chat_answer(
    question: str,
    context_chunks: list[dict],
    history: list[dict],
) -> AsyncGenerator[str, None]:
    """Yield answer tokens as they arrive from the LLM (SSE-friendly)."""
    client = get_client()

    context_block = build_context_block(context_chunks) if context_chunks else "(no relevant excerpts found)"
    user_turn = f"Context excerpts:\n\n{context_block}\n\nQuestion: {question}"

    contents = _to_gemini_contents(history, user_turn)

    stream = await client.aio.models.generate_content_stream(
        model=settings.chat_model,
        contents=contents,
        config=types.GenerateContentConfig(system_instruction=SYSTEM_PROMPT),
    )
    async for chunk in stream:
        if chunk.text:
            yield chunk.text


async def generate_summary(document_text: str, filename: str) -> str:
    """Generate a concise, non-streamed summary for a whole document."""
    client = get_client()
    # Guard against extremely long docs blowing the context window.
    truncated = document_text[:24000]
    response = await client.aio.models.generate_content(
        model=settings.chat_model,
        contents=[
            types.Content(
                role="user",
                parts=[types.Part(text=f"Summarize the document '{filename}':\n\n{truncated}")],
            )
        ],
        config=types.GenerateContentConfig(
            system_instruction=(
                "You write concise, well-structured document summaries in markdown. "
                "Include: a 2-3 sentence overview, then 3-6 key bullet points."
            ),
        ),
    )
    return response.text or ""


IMAGE_DESCRIPTION_PROMPT = """Describe this image from a PDF page in 2-4 plain-language \
sentences, written so it can be searched and cited alongside the document's text.

- If it's a chart or graph: state what it shows and call out the key numbers/trends visible.
- If it's a diagram: explain what it depicts and how the parts relate.
- If it's a photo: describe the relevant subject matter factually.
- If it's a full scanned page: transcribe the visible text as accurately as you can.

Be factual and specific. Do not say "this image shows" — just describe the content directly."""


async def describe_image(image_bytes: bytes, mime_type: str) -> str:
    """Ask Gemini's vision-capable chat model to describe/transcribe one image."""
    client = get_client()
    response = await client.aio.models.generate_content(
        model=settings.chat_model,
        contents=[
            types.Content(
                role="user",
                parts=[
                    types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                    types.Part(text=IMAGE_DESCRIPTION_PROMPT),
                ],
            )
        ],
    )
    return (response.text or "").strip()


async def describe_images(images: list[tuple[bytes, str]]) -> list[str]:
    """
    Describe a batch of images concurrently (bounded, to stay well within
    rate limits). Returns descriptions in the same order as the input;
    a failed individual image yields an empty string rather than failing
    the whole batch, so one bad image doesn't block the rest of the upload.
    """
    if not images:
        return []
    semaphore = asyncio.Semaphore(4)

    async def _describe_one(data: bytes, mime: str) -> str:
        async with semaphore:
            try:
                return await describe_image(data, mime)
            except Exception:  # noqa: BLE001 - one bad image shouldn't fail the upload
                return ""

    return await asyncio.gather(*(_describe_one(data, mime) for data, mime in images))
