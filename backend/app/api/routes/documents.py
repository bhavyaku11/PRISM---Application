import logging
from fastapi import APIRouter, Depends, HTTPException, status
from app.api.deps import get_current_user, AuthenticatedUser
from app.core.rate_limit import rate_limit_dependency
from app.schemas.documents import ProcessDocumentResponse, DocumentStatusResponse
from app.services.documents.processor import (
    DocumentProcessor,
    DocumentNotFoundError,
    DocumentProcessingError,
)

logger = logging.getLogger("prism.api.documents")
router = APIRouter(prefix="/api/documents", tags=["documents"])


@router.post(
    "/{document_id}/process",
    response_model=ProcessDocumentResponse,
    status_code=status.HTTP_200_OK,
    summary="Process an uploaded policy PDF",
    description=(
        "Downloads the private PDF, validates, extracts text page-by-page, detects basic "
        "sections, creates page-aware chunks, and saves to the database."
    ),
)
async def process_document(
    document_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    _: None = Depends(rate_limit_dependency),
) -> ProcessDocumentResponse:
    """Process an uploaded document for the authenticated user."""
    logger.info(
        "Received document processing request for doc_id=%s, user_id=%s",
        document_id,
        current_user.id,
    )

    processor = DocumentProcessor(
        user_id=current_user.id,
        user_token=current_user.token,
    )

    try:
        result = processor.process(document_id=document_id)
        return ProcessDocumentResponse(
            document_id=result["document_id"],
            status=result["status"],
            page_count=result["page_count"],
            pages_with_text=result["pages_with_text"],
            pages_without_text=result["pages_without_text"],
            chunks_created=result["chunks_created"],
            sections_detected=result["sections_detected"],
            message="Document processing completed successfully.",
        )
    except DocumentNotFoundError:
        # Ownership-safe response: return 404 whether non-existent or owned by someone else
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        )
    except DocumentProcessingError as exc:
        logger.warning("Document processing error for %s: %s", document_id, exc)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        )
    except Exception as exc:
        logger.exception("Unexpected server error processing document %s", document_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while processing the document.",
        )


@router.get(
    "/{document_id}/status",
    response_model=DocumentStatusResponse,
    summary="Get document processing status",
)
async def get_document_status(
    document_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> DocumentStatusResponse:
    """Check the current processing status of a document."""
    processor = DocumentProcessor(
        user_id=current_user.id,
        user_token=current_user.token,
    )
    try:
        doc = processor.get_document_for_processing(document_id)
        return DocumentStatusResponse(
            document_id=doc["id"],
            policy_id=doc.get("policy_id", ""),
            processing_status=doc.get("processing_status", "pending"),
            processing_error=doc.get("processing_error"),
            page_count=doc.get("page_count"),
            metadata=doc.get("metadata"),
        )
    except DocumentNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        )
