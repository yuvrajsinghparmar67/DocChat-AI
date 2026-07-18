"""
Application configuration, loaded from environment variables.

All secrets and environment-specific values live in a `.env` file
(see `.env.example` in the project root). Nothing sensitive is
hard-coded here.
"""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- LLM / Embeddings provider (Google Gemini API, free tier) --------
    gemini_api_key: str = ""
    chat_model: str = "gemini-3.5-flash"
    embedding_model: str = "gemini-embedding-2"

    # --- App behavior -------------------------------------------------
    max_upload_mb: int = 25
    chunk_size: int = 1000
    chunk_overlap: int = 150
    retrieval_top_k: int = 5
    max_docs_per_session: int = 20

    # --- Image analysis (Gemini Vision) --------------------------------
    # Embedded images (charts, diagrams, photos) are described by Gemini's
    # vision-capable chat model and indexed as extra searchable/citable
    # chunks, tagged to the page they came from.
    enable_image_analysis: bool = True
    min_image_size_px: int = 80  # skip tiny icons/bullets/rules
    max_images_per_document: int = 15  # cost/latency guard per upload

    # --- Storage -----------------------------------------------------
    upload_dir: str = "storage/uploads"
    vector_db_dir: str = "storage/vector_db"
    metadata_path: str = "storage/metadata.json"

    # --- CORS ----------------------------------------------------------
    frontend_origin: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    """Cached settings singleton so we parse the .env file only once."""
    return Settings()
