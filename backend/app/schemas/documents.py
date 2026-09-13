from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class ProcessDocumentResponse(BaseModel):
    """Response payload for document processing execution."""
    document_id: str
    status: str = Field(..., description="Document processing status ('processed', 'failed', etc.)")
    page_count: int = Field(..., description="Total pages in the PDF document")
    pages_with_text: int = Field(..., description="Pages containing extractable text")
    pages_without_text: int = Field(..., description="Pages without extractable text (e.g., scanned/image-only)")
    chunks_created: int = Field(..., description="Total page-aware chunks generated and stored")
    sections_detected: int = Field(default=0, description="Total policy sections identified")
    message: Optional[str] = Field(default=None, description="Optional informational message")


class DocumentStatusResponse(BaseModel):
    """Status check response for a document."""
    document_id: str
    policy_id: str
    processing_status: str
    processing_error: Optional[str] = None
    page_count: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None


class ExtractedPageInfo(BaseModel):
    """Metadata about an extracted page."""
    page_number: int
    has_text: bool
    word_count: int
    char_count: int
