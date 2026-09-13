from typing import Optional
from app.services.embeddings.base import EmbeddingProvider
from app.services.embeddings.fastembed_provider import FastEmbedProvider

_default_provider: Optional[EmbeddingProvider] = None


def get_embedding_provider() -> EmbeddingProvider:
    """Return the configured singleton embedding provider."""
    global _default_provider
    if _default_provider is None:
        _default_provider = FastEmbedProvider()
    return _default_provider


__all__ = ["EmbeddingProvider", "FastEmbedProvider", "get_embedding_provider"]
