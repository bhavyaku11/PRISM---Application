from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """PRISM Backend Configuration Settings.
    
    Reads from environment variables or .env file.
    """
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Core Application Settings
    ENVIRONMENT: str = "development"
    APP_NAME: str = "PRISM Backend"
    APP_VERSION: str = "0.1.0"
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # CORS Settings
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    # Supabase Settings
    SUPABASE_URL: str | None = None
    SUPABASE_ANON_KEY: str | None = None
    SUPABASE_SERVICE_ROLE_KEY: str | None = None
    NEXT_PUBLIC_SUPABASE_URL: str | None = None
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: str | None = None

    # Storage & Processing Limits
    STORAGE_BUCKET_NAME: str = "policy-documents"
    MAX_PDF_SIZE_BYTES: int = 25 * 1024 * 1024  # 25 MB
    MAX_PDF_PAGES: int = 150  # Hard ceiling on extracted PDF pages to prevent DoS/decompression attacks
    RATE_LIMIT_PER_MINUTE: int = 30  # Max requests per minute on expensive endpoints
    CHUNK_TARGET_WORDS: int = 700
    CHUNK_MIN_WORDS: int = 400
    CHUNK_MAX_WORDS: int = 1000
    CHUNK_OVERLAP_WORDS: int = 80

    # Embedding & Retrieval Settings (Step 9)
    EMBEDDING_MODEL_NAME: str = "BAAI/bge-small-en-v1.5"
    EMBEDDING_DIMENSION: int = 384
    RETRIEVAL_DEFAULT_TOP_K: int = 5
    RETRIEVAL_MAX_TOP_K: int = 20
    HYBRID_RETRIEVAL_ALPHA: float = 0.70  # 0.70 vector similarity + 0.30 lexical/keyword match

    # AI Provider Settings (Groq default for Step 10 migration)
    AI_PROVIDER: str = "groq"
    GROQ_API_KEY: str | None = None
    GROQ_MODEL: str = "openai/gpt-oss-120b"
    GROQ_BASE_URL: str = "https://api.groq.com/openai/v1"
    GROQ_TIMEOUT_SECONDS: float = 30.0

    # Inactive / Optional xAI Settings
    XAI_API_KEY: str | None = None
    GROK_API_KEY: str | None = None
    XAI_MODEL: str = "grok-2-latest"
    XAI_BASE_URL: str = "https://api.x.ai/v1"
    XAI_TIMEOUT_SECONDS: float = 30.0
    RETRIEVAL_MIN_CONFIDENCE_THRESHOLD: float = 0.40  # Minimum similarity threshold for sufficient evidence

    @property
    def effective_groq_api_key(self) -> str | None:
        """Resolve effective Groq API key."""
        return self.GROQ_API_KEY

    @property
    def effective_xai_api_key(self) -> str | None:
        """Resolve effective xAI / Grok API key."""
        return self.XAI_API_KEY or self.GROK_API_KEY

    @property
    def cors_origins(self) -> List[str]:
        """Parse comma-separated allowed origins into a clean list."""
        if not self.ALLOWED_ORIGINS:
            return ["http://localhost:3000"]
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    @property
    def effective_supabase_url(self) -> str:
        """Resolve the effective Supabase project URL."""
        return (
            self.SUPABASE_URL
            or self.NEXT_PUBLIC_SUPABASE_URL
            or "https://jyfxxudarzedrebnrykt.supabase.co"
        )

    @property
    def effective_supabase_anon_key(self) -> str:
        """Resolve the effective Supabase client/anon/publishable key."""
        return (
            self.SUPABASE_ANON_KEY
            or self.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
            or "sb_publishable_g9Qdf3nXknlgS_LqK9EQTA_tItn-dmQ"
        )


settings = Settings()
