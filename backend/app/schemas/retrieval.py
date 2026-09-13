from typing import Optional, List
from pydantic import BaseModel, Field


class RetrievalRequest(BaseModel):
    """Request payload for policy chunk retrieval."""
    query: str = Field(..., min_length=1, description="Question or search query string.")
    policy_id: Optional[str] = Field(default=None, description="Optional policy ID filter.")
    document_id: Optional[str] = Field(default=None, description="Optional document ID filter.")
    top_k: int = Field(default=5, ge=1, le=20, description="Maximum number of relevant chunks to retrieve.")


class RetrievalResultItem(BaseModel):
    """A single retrieved evidence chunk."""
    chunk_id: Optional[str] = Field(default=None, description="ID of the document_chunks record.")
    document_id: Optional[str] = Field(default=None, description="Associated document ID.")
    policy_id: Optional[str] = Field(default=None, description="Associated policy ID.")
    page_number: Optional[int] = Field(default=None, description="1-based page number where chunk appears.")
    section_title: Optional[str] = Field(default=None, description="Associated section title.")
    content: str = Field(..., description="Text content of the chunk.")
    similarity: float = Field(..., description="Combined relevance/similarity score (0.0 to 1.0).")


class RetrievalResponse(BaseModel):
    """Response payload containing retrieved chunks for a user query."""
    query: str
    results: List[RetrievalResultItem]
    total_results: int
