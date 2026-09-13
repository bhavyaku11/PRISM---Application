import json
import logging
import re
from typing import List, Dict, Any, Optional, Union
import numpy as np

from app.core.config import settings
from app.core.supabase import get_supabase_client, get_admin_supabase_client
from app.services.embeddings import get_embedding_provider, EmbeddingProvider

logger = logging.getLogger("prism.retrieval")

# Common English stop words to ignore during lexical term matching
STOP_WORDS = {
    "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
    "in", "on", "at", "to", "for", "with", "by", "about", "against",
    "of", "and", "or", "but", "if", "then", "so", "what", "which",
    "who", "whom", "this", "that", "these", "those", "am", "have", "has",
    "had", "do", "does", "did", "can", "could", "will", "would", "shall",
    "should", "my", "your", "his", "her", "its", "our", "their", "any",
}

# High-importance insurance keywords that warrant boosted lexical weight
INSURANCE_KEYWORDS = {
    "icu", "room", "rent", "limit", "sublimit", "capping", "waiting",
    "period", "exclusion", "excluded", "copay", "copayment", "deductible",
    "claim", "cashless", "reimbursement", "hospital", "hospitalization",
    "pre-existing", "ped", "surgery", "daycare", "maternity", "ayush",
    "ambulance", "restoration", "renewal", "grace", "coverage", "covered",
}


# Domain synonyms and inflectional variants for insurance terminology
SYNONYM_MAP = {
    "excluded": ["exclusion", "exclusions", "exclude", "not covered"],
    "exclusion": ["excluded", "exclude", "not covered", "exclusions"],
    "exclusions": ["excluded", "exclude", "not covered", "exclusion"],
    "cover": ["covered", "coverage", "inpatient", "payable"],
    "covered": ["cover", "coverage", "payable", "inpatient"],
    "coverage": ["cover", "covered", "payable"],
    "copay": ["copayment", "co-pay", "co-payment"],
    "copayment": ["copay", "co-pay", "co-payment"],
    "icu": ["intensive care unit", "intensive care"],
    "limit": ["limits", "sublimit", "sub-limit", "capped", "capping"],
    "limits": ["limit", "sublimit", "sub-limit", "capped", "capping"],
    "rent": ["room rent", "boarding"],
    "waiting": ["wait period", "waiting period"],
    "ped": ["pre-existing", "preexisting", "prior condition"],
    "claim": ["claims", "cashless", "reimbursement", "settlement"],
    "claims": ["claim", "cashless", "reimbursement", "settlement"],
}


def compute_lexical_score(query: str, content: str, section_title: Optional[str] = None) -> float:
    """Compute a normalized lexical match score in [0, 1] between query and passage."""
    query_tokens = [
        t.lower() for t in re.findall(r"\b[\w%]+(?:\.[\w]+)*\b", query)
        if t.lower() not in STOP_WORDS and len(t) > 1
    ]

    if not query_tokens:
        return 0.0

    content_lower = content.lower()
    title_lower = (section_title or "").lower()

    total_weight = 0.0
    matched_weight = 0.0

    for token in query_tokens:
        # Boost weight for domain keywords and numerical/percentage tokens
        weight = 2.0 if (token in INSURANCE_KEYWORDS or any(c.isdigit() for c in token) or "%" in token) else 1.0
        total_weight += weight

        variants = [token] + SYNONYM_MAP.get(token, [])

        in_title = any(v in title_lower for v in variants)
        in_content = any(v in content_lower for v in variants)

        if in_title:
            matched_weight += weight * 1.0  # Title match carries maximum weight
        elif in_content:
            matched_weight += weight * 0.7  # Body text match

    if total_weight == 0:
        return 0.0

    return min(1.0, matched_weight / total_weight)


def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """Compute cosine similarity between two vector lists."""
    if not vec_a or not vec_b:
        return 0.0
    a = np.array(vec_a, dtype=np.float32)
    b = np.array(vec_b, dtype=np.float32)

    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)

    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0

    dot = np.dot(a, b)
    return float(dot / (norm_a * norm_b))


def _parse_embedding(raw: Any) -> Optional[List[float]]:
    """Normalise a pgvector value from Supabase into a Python list[float].

    Supabase's REST/PostgREST client can return a pgvector column as:
      - A Python list of floats  → already correct, return as-is.
      - A JSON string            → e.g. '[-0.075, 0.042, ...]', parse with json.loads.
      - A numpy array            → convert via .tolist().
      - None / empty             → return None to signal missing embedding.
    """
    if raw is None:
        return None
    if isinstance(raw, list):
        return [float(x) for x in raw]
    if isinstance(raw, np.ndarray):
        return raw.tolist()
    if isinstance(raw, str):
        raw = raw.strip()
        if not raw:
            return None
        try:
            parsed = json.loads(raw)
            return [float(x) for x in parsed]
        except (json.JSONDecodeError, ValueError, TypeError) as exc:
            logger.warning("Failed to parse embedding string: %s", exc)
            return None
    # Fallback: try coercing iterable
    try:
        return [float(x) for x in raw]
    except (TypeError, ValueError):
        return None


class RetrievalService:
    """Retrieval service for insurance policy evidence chunks.
    
    Provides vector similarity search and hybrid lexical re-ranking
    strictly scoped to the authenticated user.
    """

    def __init__(
        self,
        provider: Optional[EmbeddingProvider] = None,
        user_token: Optional[str] = None,
    ):
        self.provider = provider or get_embedding_provider()
        self.user_token = user_token
        self.client = get_supabase_client(token=user_token)

    def retrieve_relevant_chunks(
        self,
        user_id: str,
        query: str,
        policy_id: Optional[str] = None,
        document_id: Optional[str] = None,
        top_k: int = 5,
        min_score: float = 0.0,
    ) -> List[Dict[str, Any]]:
        """Retrieve and rank the most relevant chunks for a user query.
        
        Args:
            user_id: ID of the authenticated user (MANDATORY for user isolation).
            query: User's question or search query string.
            policy_id: Optional filter for a specific policy.
            document_id: Optional filter for a specific document.
            top_k: Maximum number of results to return (1-20).
            min_score: Minimum combined similarity threshold.
            
        Returns:
            List of ranked chunk dictionaries matching the PRISM specification.
        """
        clean_query = query.strip() if query else ""
        if not clean_query:
            raise ValueError("Query string cannot be empty.")

        # Clamp top_k to sensible range
        k = max(1, min(top_k, settings.RETRIEVAL_MAX_TOP_K))

        # 1. Generate query embedding using the same model
        query_vector = self.provider.embed_text(clean_query)

        # 2. Execute retrieval (try RPC first, fallback to in-memory vectorized search)
        chunks = self._fetch_user_chunks(
            user_id=user_id,
            query_vector=query_vector,
            policy_id=policy_id,
            document_id=document_id,
            fetch_limit=k * 4,  # Fetch wider set for hybrid re-ranking
        )

        if not chunks:
            logger.info("No candidate chunks found for user %s with query: '%s'", user_id, clean_query)
            return []

        # 3. Hybrid re-ranking: combine dense vector similarity with lexical matching
        alpha = settings.HYBRID_RETRIEVAL_ALPHA  # 0.70 vector + 0.30 lexical
        ranked_results: List[Dict[str, Any]] = []

        for c in chunks:
            vec_sim = float(c.get("vector_similarity", 0.0))
            # Ensure vector similarity is normalized in [0, 1] (cosine similarity is in [-1, 1])
            norm_vec_sim = max(0.0, min(1.0, (vec_sim + 1.0) / 2.0 if vec_sim < 0 else vec_sim))

            lex_score = compute_lexical_score(
                query=clean_query,
                content=c.get("content", ""),
                section_title=c.get("section_title"),
            )

            # Combined hybrid score
            hybrid_score = (alpha * norm_vec_sim) + ((1.0 - alpha) * lex_score)

            if hybrid_score >= min_score:
                ranked_results.append({
                    "chunk_id": c.get("id"),
                    "document_id": c.get("document_id"),
                    "policy_id": c.get("policy_id"),
                    "page_number": c.get("page_number"),
                    "section_title": c.get("section_title"),
                    "content": c.get("content"),
                    "similarity": round(hybrid_score, 4),
                })

        # 4. Sort descending by similarity
        ranked_results.sort(key=lambda x: x["similarity"], reverse=True)

        return ranked_results[:k]

    def _fetch_user_chunks(
        self,
        user_id: str,
        query_vector: List[float],
        policy_id: Optional[str] = None,
        document_id: Optional[str] = None,
        fetch_limit: int = 20,
    ) -> List[Dict[str, Any]]:
        """Fetch candidate chunks scoped to user, attempting RPC first then falling back."""
        # Attempt 1: Call match_document_chunks RPC if created in Supabase
        try:
            rpc_params = {
                "query_embedding": query_vector,
                "match_count": fetch_limit,
                "match_threshold": 0.0,
                "filter_user_id": user_id,
                "filter_policy_id": policy_id,
                "filter_document_id": document_id,
            }
            res = self.client.rpc("match_document_chunks", rpc_params).execute()
            if res.data:
                # Rename RPC returned 'similarity' to 'vector_similarity'
                return [
                    {
                        "id": row.get("id"),
                        "document_id": row.get("document_id"),
                        "policy_id": row.get("policy_id"),
                        "page_number": row.get("page_number"),
                        "section_title": row.get("section_title"),
                        "content": row.get("content"),
                        "vector_similarity": float(row.get("similarity", 0.0)),
                    }
                    for row in res.data
                ]
        except Exception as rpc_exc:
            logger.debug("Database RPC match_document_chunks unavailable or failed: %s", rpc_exc)

        # Attempt 2: Fallback vectorized search over user's chunks
        # Strict user isolation: ALWAYS filtered by user_id
        query = (
            self.client.table("document_chunks")
            .select("id, document_id, policy_id, page_number, section_title, content, embedding")
            .eq("user_id", user_id)
            .not_.is_("embedding", "null")
        )

        if policy_id:
            query = query.eq("policy_id", policy_id)
        if document_id:
            query = query.eq("document_id", document_id)

        res = query.execute()
        raw_chunks: List[Dict[str, Any]] = res.data or []

        scored_candidates: List[Dict[str, Any]] = []
        for row in raw_chunks:
            raw_emb = row.get("embedding")
            chunk_embedding = _parse_embedding(raw_emb)
            if not chunk_embedding:
                continue

            sim = cosine_similarity(query_vector, chunk_embedding)
            scored_candidates.append({
                "id": row.get("id"),
                "document_id": row.get("document_id"),
                "policy_id": row.get("policy_id"),
                "page_number": row.get("page_number"),
                "section_title": row.get("section_title"),
                "content": row.get("content"),
                "vector_similarity": sim,
            })

        # Pre-sort by vector similarity
        scored_candidates.sort(key=lambda x: x["vector_similarity"], reverse=True)
        return scored_candidates[:fetch_limit]
