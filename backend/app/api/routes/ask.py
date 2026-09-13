import logging
import uuid
from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user, AuthenticatedUser
from app.core.rate_limit import rate_limit_dependency
from app.schemas.ask import AskRequest, AskResponse, CitationItem, SourceItem
from app.services.ai.ask_service import AskService

logger = logging.getLogger("prism.api.ask")
router = APIRouter(prefix="/api/ask", tags=["ask"])


@router.post(
    "",
    response_model=AskResponse,
    status_code=status.HTTP_200_OK,
    summary="Ask PRISM a policy question",
    description=(
        "Retrieves relevant policy chunks for the authenticated user, verifies evidence sufficiency, "
        "generates a grounded answer via Grok, validates citations against database chunks, and persists "
        "conversation history."
    ),
)
async def ask_policy_question(
    request: AskRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    _: None = Depends(rate_limit_dependency),
) -> AskResponse:
    """Generate a grounded answer for the authenticated user's question."""
    req_id = str(uuid.uuid4())[:8]
    clean_question = request.question.strip()

    if not clean_question:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question cannot be empty.",
        )

    logger.info(
        "[%s] Ask PRISM request: user_id=%s, policy_id=%s, doc_id=%s, question='%s'",
        req_id,
        current_user.id,
        request.policy_id,
        request.document_id,
        clean_question[:80],
    )

    try:
        service = AskService(user_token=current_user.token)
        result = service.ask(
            user_id=current_user.id,
            question=clean_question,
            policy_id=request.policy_id,
            document_id=request.document_id,
            conversation_id=request.conversation_id,
        )

        citations = [CitationItem(**c) for c in result.get("citations", [])]
        sources = [SourceItem(**s) for s in result.get("sources", [])]

        return AskResponse(
            answer=result["answer"],
            grounded=result["grounded"],
            confidence=result["confidence"],
            conversation_id=result["conversation_id"],
            message_id=result["message_id"],
            citations=citations,
            sources=sources,
        )

    except ValueError as val_err:
        logger.warning("[%s] Validation error in Ask PRISM: %s", req_id, val_err)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err),
        )
    except RuntimeError as run_err:
        logger.error("[%s] AI service runtime error: %s", req_id, run_err)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI generation service is temporarily unavailable. Please try again shortly.",
        )
    except Exception as exc:
        logger.exception("[%s] Unexpected error in Ask PRISM: %s", req_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while processing your question.",
        )
