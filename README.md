# DocChat — AI Document Chat (RAG)

Chat with your PDFs. Upload one or more documents, ask questions in plain
English, and get streaming, cited answers grounded in the actual page
content — powered by a FastAPI + FAISS retrieval backend and a
React/Tailwind frontend with an Apple-inspired design language.

![status](https://img.shields.io/badge/status-portfolio--ready-0A84FF)

---

## Preview

<p  align="center">
    <img src="Screenshot (197).png" alt="DocChat-AI Preview" width="900/> 
</p>

---

## Features

- 📄 Multi-PDF upload, including drag-and-drop anywhere on the page
- 💬 Streaming AI chat answers (Server-Sent Events)
- 📌 Source citations with exact page numbers for every answer
- 🔍 Semantic search over document chunks via FAISS
- 🧠 One-click AI document summaries
- 🗑️ Delete documents, clear conversation history
- 🌓 Light/dark mode with system preference detection
- 📱 Fully responsive, mobile-friendly layout
- ⚡ Clean, typed API contracts between frontend and backend
- 🛡️ Friendly error states everywhere (upload failures, empty PDFs, network errors)

## Tech Stack

**Frontend:** React (Vite), Tailwind CSS, Framer Motion, Lucide Icons, react-markdown
**Backend:** FastAPI, PyMuPDF, FAISS (`faiss-cpu`), Google Gemini API (`google-genai`)

The backend uses Google's Gemini API for both chat and embeddings — Gemini
has a free tier, so the whole app runs without a paid API key.

---

## Project Structure

```
ai-doc-chat/
├── backend/
│   ├── app/
│   │   ├── core/config.py          # env-based settings
│   │   ├── models/schemas.py       # Pydantic request/response models
│   │   ├── services/
│   │   │   ├── pdf_service.py      # PyMuPDF extraction + chunking
│   │   │   ├── llm_service.py      # embeddings + streaming chat + summaries
│   │   │   ├── vector_store.py     # FAISS index + JSON docstore
│   │   │   └── document_service.py # upload orchestration + metadata
│   │   ├── routers/
│   │   │   ├── documents.py        # upload/list/delete/summarize
│   │   │   └── chat.py             # SSE streaming chat endpoint
│   │   └── main.py                 # FastAPI app entrypoint
│   ├── storage/                    # uploaded PDFs + FAISS index (gitignored)
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/             # Sidebar, TopBar, modals, chat/*
│   │   ├── context/                 # Theme + Documents state
│   │   ├── hooks/                   # useChat, useFileDrop
│   │   ├── lib/api.js               # backend API client + SSE parser
│   │   └── pages/ChatPage.jsx
│   ├── package.json
│   └── .env.example
├── sample-pdfs/                    # two ready-to-use test PDFs
└── README.md
```

---

## Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- A free Gemini API key (see below)

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env and set GEMINI_API_KEY
# Get a free key at https://aistudio.google.com/apikey

uvicorn app.main:app --reload --port 8000
```

The API is now running at `http://localhost:8000`. Visit
`http://localhost:8000/docs` for interactive API docs.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173`. In dev, Vite proxies `/api/*` requests to
the backend on port 8000 — no extra configuration needed.

### 3. Try it out

Upload the sample PDFs in `sample-pdfs/` and ask questions like:

- *"What is the home office stipend amount?"*
- *"What was ARR in Q4 2025 and how much did it grow?"*
- *"Summarize the security requirements"*

Each answer will cite the exact source document and page number.

---

## Configuration Reference

All backend configuration lives in `backend/.env` (see `.env.example`):

| Variable | Description | Default |
|---|---|---|
| `GEMINI_API_KEY` | API key for the Gemini API | — (required) |
| `CHAT_MODEL` | Chat completion model | `gemini-3.5-flash` |
| `EMBEDDING_MODEL` | Embedding model | `gemini-embedding-2` |
| `MAX_UPLOAD_MB` | Max PDF size | `25` |
| `CHUNK_SIZE` / `CHUNK_OVERLAP` | Text chunking parameters | `1000` / `150` |
| `RETRIEVAL_TOP_K` | Chunks retrieved per query | `5` |
| `ENABLE_IMAGE_ANALYSIS` | Describe embedded images/charts/scanned pages via Gemini Vision | `true` |
| `MIN_IMAGE_SIZE_PX` | Skip embedded images smaller than this (icons, rules) | `80` |
| `MAX_IMAGES_PER_DOCUMENT` | Cap on images described per upload (cost/latency) | `15` |
| `FRONTEND_ORIGIN` | Allowed CORS origin | `http://localhost:5173` |

> **Switching embedding models:** the FAISS index dimension is fixed to
> 768 (matching `gemini-embedding-2`'s configured `output_dimensionality`
> in `app/services/llm_service.py`). If you switch models or change that
> dimension, update `EMBEDDING_DIM` in `app/services/vector_store.py` to
> match and delete `backend/storage/vector_db/` to rebuild the index from
> scratch.

---

## How It Works (RAG Pipeline)

1. **Upload** — PDF is saved to disk and registered with `processing` status.
2. **Extract** — PyMuPDF pulls text page-by-page.
3. **Chunk** — Each page is split into ~1000-character overlapping chunks, preserving the page number per chunk.
4. **Embed** — Chunks are batched to the embeddings API.
5. **Index** — Vectors are added to a FAISS `IndexIDMap`, with a parallel JSON docstore mapping vector IDs → `{text, filename, document_id, page_number}`.
6. **Query** — On each chat message, the question is embedded and the FAISS index returns the top-k most similar chunks (optionally scoped to selected documents).
7. **Generate** — Retrieved chunks are assembled into a context block and sent to the chat model, which streams its answer back over Server-Sent Events while the frontend renders tokens live.
8. **Cite** — The retrieved chunks' metadata (filename + page number) are sent to the frontend as a separate SSE event before the answer streams, and rendered as citation cards.

---

## Production Notes

This project is built to be portfolio/demo-ready out of the box. Before
deploying it for real users, consider:

- Swapping the JSON-file metadata/docstore for a real database (Postgres, SQLite) if you need concurrent multi-user access
- Adding authentication/authorization (currently there's no user isolation — all documents are shared globally)
- Rate-limiting the upload and chat endpoints
- Moving file storage to S3/GCS instead of local disk for horizontal scaling
- Adding request size limits and stricter file-type validation at the reverse-proxy layer

---

## License

MIT — free to use in your portfolio or client projects.
