"""
PDF parsing and chunking.

Uses PyMuPDF (fitz) to extract text page-by-page, then splits each
page into overlapping chunks so we can cite an accurate page number
for every retrieved passage later on.
"""
from __future__ import annotations

from dataclasses import dataclass

import fitz  # PyMuPDF

from app.core.config import get_settings

settings = get_settings()


@dataclass
class TextChunk:
    text: str
    page_number: int  # 1-indexed, human friendly
    chunk_index: int  # position within the document


@dataclass
class ExtractedImage:
    page_number: int
    image_bytes: bytes
    mime_type: str
    is_full_page_render: bool = False  # True for scanned pages rendered whole


def extract_pages(pdf_path: str) -> list[tuple[int, str]]:
    """Return a list of (page_number, page_text) tuples for a PDF file."""
    pages: list[tuple[int, str]] = []
    with fitz.open(pdf_path) as doc:
        for i, page in enumerate(doc):
            text = page.get_text("text").strip()
            if text:
                pages.append((i + 1, text))
    return pages


def get_page_count(pdf_path: str) -> int:
    with fitz.open(pdf_path) as doc:
        return doc.page_count


def _split_text(text: str, chunk_size: int, overlap: int) -> list[str]:
    """
    Simple, dependency-free sliding-window splitter operating on
    characters but snapping to sentence/word boundaries where possible.
    """
    if len(text) <= chunk_size:
        return [text]

    chunks: list[str] = []
    start = 0
    text_len = len(text)

    while start < text_len:
        end = min(start + chunk_size, text_len)

        # Try to end on a sentence boundary, falling back to a space.
        if end < text_len:
            boundary = text.rfind(". ", start, end)
            if boundary == -1 or boundary < start + int(chunk_size * 0.5):
                boundary = text.rfind(" ", start, end)
            if boundary != -1 and boundary > start:
                end = boundary + 1

        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        if end >= text_len:
            break
        start = max(end - overlap, start + 1)

    return chunks


def chunk_pdf(pdf_path: str) -> list[TextChunk]:
    """Extract and chunk a PDF, preserving page numbers per chunk."""
    pages = extract_pages(pdf_path)
    chunks: list[TextChunk] = []
    idx = 0
    for page_number, page_text in pages:
        for piece in _split_text(page_text, settings.chunk_size, settings.chunk_overlap):
            chunks.append(TextChunk(text=piece, page_number=page_number, chunk_index=idx))
            idx += 1
    return chunks


def _normalize_to_png(raw_bytes: bytes) -> bytes:
    """Re-encode arbitrary embedded image data (jpx, tiff, cmyk jpeg, ...) to
    plain PNG so it's guaranteed to be a type Gemini's vision input accepts."""
    pix = fitz.Pixmap(raw_bytes)
    if pix.n - pix.alpha >= 4:  # CMYK or similar -> convert to RGB first
        pix = fitz.Pixmap(fitz.csRGB, pix)
    return pix.tobytes("png")


def extract_images(pdf_path: str) -> list[ExtractedImage]:
    """
    Pull out embedded images worth describing (charts, diagrams, photos),
    skipping tiny icons/rules. Pages with no extractable text at all
    (typically scanned pages) are rendered whole as a single image instead,
    so Gemini Vision can describe/transcribe their content.

    Capped at `settings.max_images_per_document` to bound API cost/latency
    on image-heavy PDFs; embedded images are prioritized over full-page
    renders when both are present.
    """
    if not settings.enable_image_analysis:
        return []

    images: list[ExtractedImage] = []
    embedded: list[ExtractedImage] = []
    rendered: list[ExtractedImage] = []
    min_px = settings.min_image_size_px

    with fitz.open(pdf_path) as doc:
        for page_index, page in enumerate(doc):
            page_number = page_index + 1
            has_text = bool(page.get_text("text").strip())

            if has_text:
                for img in page.get_images(full=True):
                    xref = img[0]
                    try:
                        base = doc.extract_image(xref)
                    except Exception:  # noqa: BLE001 - skip unreadable image streams
                        continue
                    if base["width"] < min_px or base["height"] < min_px:
                        continue
                    ext = base["ext"].lower()
                    if ext in ("png", "jpeg", "jpg", "webp"):
                        mime = "image/jpeg" if ext == "jpg" else f"image/{ext}"
                        data = base["image"]
                    else:
                        try:
                            data = _normalize_to_png(base["image"])
                        except Exception:  # noqa: BLE001 - skip formats we can't normalize
                            continue
                        mime = "image/png"
                    embedded.append(
                        ExtractedImage(page_number=page_number, image_bytes=data, mime_type=mime)
                    )
            else:
                # Likely a scanned page: no text layer, render the whole
                # page as one image so Vision can still make it searchable.
                pix = page.get_pixmap(dpi=150)
                rendered.append(
                    ExtractedImage(
                        page_number=page_number,
                        image_bytes=pix.tobytes("png"),
                        mime_type="image/png",
                        is_full_page_render=True,
                    )
                )

    images = (embedded + rendered)[: settings.max_images_per_document]
    return images
