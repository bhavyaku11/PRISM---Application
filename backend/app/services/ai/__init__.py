from typing import Optional
from app.core.config import settings
from app.services.ai.base import AIProvider
from app.services.ai.groq_provider import GroqProvider
from app.services.ai.grok_provider import GrokProvider

_global_ai_provider: Optional[AIProvider] = None


def get_ai_provider() -> AIProvider:
    """Get or create singleton AI provider (Groq by default for Step 10)."""
    global _global_ai_provider
    if _global_ai_provider is None:
        provider_type = (settings.AI_PROVIDER or "groq").lower().strip()
        if provider_type in ("grok", "xai"):
            _global_ai_provider = GrokProvider()
        else:
            _global_ai_provider = GroqProvider()
    return _global_ai_provider


def set_ai_provider(provider: AIProvider) -> None:
    """Override the active AI provider (useful for testing and dependency injection)."""
    global _global_ai_provider
    _global_ai_provider = provider


__all__ = [
    "AIProvider",
    "GroqProvider",
    "GrokProvider",
    "get_ai_provider",
    "set_ai_provider",
]
