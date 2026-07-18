"""
A small, self-contained FAISS vector store.

We deliberately don't use LangChain's FAISS wrapper here: we need
reliable per-document deletion and rich per-chunk metadata (filename,
page number) for citations, which is simplest to control directly
with `faiss.IndexIDMap` + a plain-Python docstore persisted as JSON.

Persistence layout (storage/vector_db/):
  index.faiss   -> the raw FAISS index (IndexIDMap wrapping a flat L2 index)
  docstore.json -> {chunk_id: {text, filename, document_id, page_number}}
  next_id.txt   -> monotonically increasing integer id counter
"""
from __future__ import annotations

import json
import os
import threading
from typing import Optional

import faiss
import numpy as np

from app.core.config import get_settings

settings = get_settings()

_INDEX_PATH = os.path.join(settings.vector_db_dir, "index.faiss")
_DOCSTORE_PATH = os.path.join(settings.vector_db_dir, "docstore.json")
_NEXT_ID_PATH = os.path.join(settings.vector_db_dir, "next_id.txt")

# gemini-embedding-2 is configured (in llm_service.py) to output 768-dim
# vectors. If you switch models or change EMBEDDING_DIMENSION there, delete
# the storage/vector_db directory to rebuild with the new dimension.
EMBEDDING_DIM = 768


class VectorStore:
    """Thread-safe singleton wrapping a FAISS IndexIDMap + JSON docstore."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        os.makedirs(settings.vector_db_dir, exist_ok=True)
        self._index: faiss.IndexIDMap = self._load_index()
        self._docstore: dict[str, dict] = self._load_docstore()
        self._next_id: int = self._load_next_id()

    # --- persistence ---------------------------------------------------

    def _load_index(self) -> faiss.IndexIDMap:
        if os.path.exists(_INDEX_PATH):
            return faiss.read_index(_INDEX_PATH)
        flat = faiss.IndexFlatL2(EMBEDDING_DIM)
        return faiss.IndexIDMap(flat)

    def _load_docstore(self) -> dict[str, dict]:
        if os.path.exists(_DOCSTORE_PATH):
            with open(_DOCSTORE_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        return {}

    def _load_next_id(self) -> int:
        if os.path.exists(_NEXT_ID_PATH):
            with open(_NEXT_ID_PATH, "r", encoding="utf-8") as f:
                return int(f.read().strip() or "0")
        return 0

    def _persist(self) -> None:
        faiss.write_index(self._index, _INDEX_PATH)
        with open(_DOCSTORE_PATH, "w", encoding="utf-8") as f:
            json.dump(self._docstore, f)
        with open(_NEXT_ID_PATH, "w", encoding="utf-8") as f:
            f.write(str(self._next_id))

    # --- mutation --------------------------------------------------------

    def add_chunks(
        self,
        document_id: str,
        filename: str,
        chunks: list[dict],
        embeddings: list[list[float]],
    ) -> None:
        """chunks: list of {text, page_number}. Same order as embeddings."""
        if not chunks:
            return
        with self._lock:
            ids = []
            for chunk in chunks:
                cid = self._next_id
                self._next_id += 1
                ids.append(cid)
                self._docstore[str(cid)] = {
                    "text": chunk["text"],
                    "filename": filename,
                    "document_id": document_id,
                    "page_number": chunk["page_number"],
                }
            vectors = np.array(embeddings, dtype="float32")
            self._index.add_with_ids(vectors, np.array(ids, dtype="int64"))
            self._persist()

    def delete_document(self, document_id: str) -> None:
        with self._lock:
            ids_to_remove = [
                int(cid) for cid, meta in self._docstore.items() if meta["document_id"] == document_id
            ]
            if ids_to_remove:
                self._index.remove_ids(np.array(ids_to_remove, dtype="int64"))
                for cid in ids_to_remove:
                    self._docstore.pop(str(cid), None)
                self._persist()

    # --- query -----------------------------------------------------------

    def search(
        self,
        query_embedding: list[float],
        top_k: int,
        document_ids: Optional[list[str]] = None,
    ) -> list[dict]:
        """
        Returns up to top_k chunks (across all matching docs), each with a
        normalized relevance_score in [0, 1] (higher = more relevant).
        If document_ids is provided, only search within those documents.
        """
        with self._lock:
            if self._index.ntotal == 0:
                return []
            # Over-fetch when filtering by document so we still get top_k
            # relevant results after filtering.
            fetch_k = min(self._index.ntotal, max(top_k * 6, top_k))
            query = np.array([query_embedding], dtype="float32")
            distances, ids = self._index.search(query, fetch_k)

            results = []
            for dist, cid in zip(distances[0], ids[0]):
                if cid == -1:
                    continue
                meta = self._docstore.get(str(cid))
                if meta is None:
                    continue
                if document_ids and meta["document_id"] not in document_ids:
                    continue
                # Convert L2 distance to a friendly 0-1 similarity score.
                score = 1.0 / (1.0 + float(dist))
                results.append({**meta, "relevance_score": score})
                if len(results) >= top_k:
                    break
            return results

    def document_chunk_count(self, document_id: str) -> int:
        with self._lock:
            return sum(1 for meta in self._docstore.values() if meta["document_id"] == document_id)

    def get_document_text(self, document_id: str) -> str:
        """Concatenate all chunk text for a document, in chunk order — used for summaries."""
        with self._lock:
            items = [
                (int(cid), meta) for cid, meta in self._docstore.items() if meta["document_id"] == document_id
            ]
        items.sort(key=lambda pair: pair[0])
        return "\n\n".join(meta["text"] for _, meta in items)


_store: VectorStore | None = None


def get_vector_store() -> VectorStore:
    global _store
    if _store is None:
        _store = VectorStore()
    return _store
