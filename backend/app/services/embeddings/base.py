from abc import ABC, abstractmethod
from typing import List


class EmbeddingProvider(ABC):
    """Abstract base class for PRISM embedding providers.
    
    Allows swapping embedding models (FastEmbed, OpenAI, Cohere, etc.)
    without changing chunking, storage, or retrieval code.
    """

    @abstractmethod
    def embed_text(self, text: str) -> List[float]:
        """Generate a dense vector embedding for a single text query or passage."""
        pass

    @abstractmethod
    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """Generate dense vector embeddings for a batch of texts."""
        pass

    @property
    @abstractmethod
    def dimension(self) -> int:
        """Return the fixed vector dimension produced by this model."""
        pass

    @property
    @abstractmethod
    def model_name(self) -> str:
        """Return the identifier of the underlying model."""
        pass
