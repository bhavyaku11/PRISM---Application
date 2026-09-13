import logging
from typing import List, Optional
from fastembed import TextEmbedding
import numpy as np

from app.core.config import settings
from app.services.embeddings.base import EmbeddingProvider

logger = logging.getLogger("prism.embeddings.fastembed")


class FastEmbedProvider(EmbeddingProvider):
    """FastEmbed (ONNX Runtime) embedding provider.
    
    Defaults to BAAI/bge-small-en-v1.5 producing 384-dimensional normalized vectors.
    Operates locally with sub-100ms CPU latency and zero external network/quota dependencies.
    """

    def __init__(self, model_name: Optional[str] = None):
        self._model_name = model_name or settings.EMBEDDING_MODEL_NAME
        self._dimension = settings.EMBEDDING_DIMENSION
        logger.info("Initializing FastEmbed provider with model: %s", self._model_name)
        self._model = TextEmbedding(model_name=self._model_name)

    @property
    def dimension(self) -> int:
        return self._dimension

    @property
    def model_name(self) -> str:
        return self._model_name

    def embed_text(self, text: str) -> List[float]:
        """Generate vector embedding for a single text string."""
        clean_text = text.strip() if text else ""
        if not clean_text:
            return [0.0] * self._dimension

        # embed returns an iterator of numpy ndarrays
        result = list(self._model.embed([clean_text]))
        if not result:
            return [0.0] * self._dimension

        vec = result[0]
        # Ensure float list
        return vec.tolist() if isinstance(vec, np.ndarray) else [float(x) for x in vec]

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """Generate vector embeddings for a list of texts in batch."""
        if not texts:
            return []

        clean_texts = [t.strip() if t and t.strip() else "" for t in texts]
        
        # Identify indices of non-empty texts to batch efficiently
        valid_indices = [i for i, t in enumerate(clean_texts) if t]
        valid_texts = [clean_texts[i] for i in valid_indices]

        output: List[List[float]] = [[0.0] * self._dimension for _ in range(len(texts))]

        if valid_texts:
            embeddings_iter = self._model.embed(valid_texts)
            for idx, emb in zip(valid_indices, embeddings_iter):
                output[idx] = emb.tolist() if isinstance(emb, np.ndarray) else [float(x) for x in emb]

        return output
