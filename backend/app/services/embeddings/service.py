import logging
from typing import Dict, Any, List, Optional
from app.core.supabase import get_admin_supabase_client
from app.services.embeddings import get_embedding_provider, EmbeddingProvider

logger = logging.getLogger("prism.embeddings.service")


class EmbeddingService:
    """Service to manage generating and updating chunk embeddings in Supabase."""

    def __init__(self, provider: Optional[EmbeddingProvider] = None):
        self.provider = provider or get_embedding_provider()
        self.client = get_admin_supabase_client()

    def embed_document_chunks(
        self,
        document_id: str,
        user_id: Optional[str] = None,
        force: bool = False,
    ) -> Dict[str, Any]:
        """Generate and store embeddings for chunks belonging to a document.
        
        Args:
            document_id: Target document ID.
            user_id: Optional user ID filter for authorization.
            force: If True, regenerates embeddings even if already present.
            
        Returns:
            Dict with statistics (total_chunks, embedded_chunks, skipped_chunks).
        """
        query = self.client.table("document_chunks").select("id, chunk_index, content, embedding").eq("document_id", document_id)
        if user_id:
            query = query.eq("user_id", user_id)

        res = query.execute()
        chunks: List[Dict[str, Any]] = res.data or []

        if not chunks:
            logger.info("No chunks found for document %s", document_id)
            return {"total_chunks": 0, "embedded_chunks": 0, "skipped_chunks": 0}

        to_embed: List[Dict[str, Any]] = []
        skipped_count = 0

        for c in chunks:
            content = (c.get("content") or "").strip()
            if not content:
                skipped_count += 1
                continue

            if not force and c.get("embedding") is not None:
                skipped_count += 1
                continue

            to_embed.append(c)

        if not to_embed:
            logger.info("All chunks already have embeddings for document %s", document_id)
            return {
                "total_chunks": len(chunks),
                "embedded_chunks": 0,
                "skipped_chunks": skipped_count,
            }

        logger.info("Embedding %d chunks for document %s", len(to_embed), document_id)
        texts = [c["content"] for c in to_embed]
        vectors = self.provider.embed_texts(texts)

        # Batch update embeddings in document_chunks
        for chunk, vec in zip(to_embed, vectors):
            try:
                self.client.table("document_chunks").update({
                    "embedding": vec
                }).eq("id", chunk["id"]).execute()
            except Exception as exc:
                logger.error("Failed to update embedding for chunk %s: %s", chunk["id"], exc)

        return {
            "total_chunks": len(chunks),
            "embedded_chunks": len(to_embed),
            "skipped_chunks": skipped_count,
        }
