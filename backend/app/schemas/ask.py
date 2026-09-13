from typing import List, Optional
from pydantic import BaseModel, Field


class AskRequest(BaseModel):
    """Payload for submitting a policy question to Ask PRISM."""
    question: str = Field(..., min_length=1, max_length=1000, description="User's insurance policy question.")
    policy_id: Optional[str] = Field(None, description="Optional UUID to restrict retrieval to a specific policy.")
    document_id: Optional[str] = Field(None, description="Optional UUID to restrict retrieval to a specific document.")
    conversation_id: Optional[str] = Field(None, description="Optional conversation UUID to continue a multi-turn thread.")


class CitationItem(BaseModel):
    """Citation referencing the exact source location in the policy document."""
    chunk_id: str
    document_id: Optional[str] = None
    policy_id: Optional[str] = None
    page_number: Optional[int] = None
    section_title: Optional[str] = None


class SourceItem(BaseModel):
    """Source policy chunk used as evidence for the answer."""
    chunk_id: str
    document_id: Optional[str] = None
    policy_id: Optional[str] = None
    page_number: Optional[int] = None
    section_title: Optional[str] = None
    content: Optional[str] = None
    similarity: Optional[float] = None


class AskResponse(BaseModel):
    """Grounded AI answer response with citations and evidence."""
    answer: str
    grounded: bool
    confidence: str  # "high" | "medium" | "low"
    conversation_id: str
    message_id: str
    citations: List[CitationItem] = Field(default_factory=list)
    sources: List[SourceItem] = Field(default_factory=list)
