import logging
from fastapi import APIRouter, Depends, HTTPException, status
from app.api.deps import get_current_user, AuthenticatedUser
from app.core.rate_limit import rate_limit_dependency
from app.schemas.retrieval import RetrievalRequest, RetrievalResponse, RetrievalResultItem
from app.services.retrieval.service import RetrievalService

logger = logging.getLogger("prism.api.retrieval")
router = APIRouter(prefix="/api/retrieval", tags=["retrieval"])


@router.post(
    "/search",
    response_model=RetrievalResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve relevant policy chunks for a query",
    description=(
        "Embeds the user query, executes hybrid retrieval (dense vector similarity + lexical scoring), "
        "and returns ranked policy chunks strictly scoped to the authenticated user."
    ),
)
async def search_relevant_chunks(
    request: RetrievalRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    _: None = Depends(rate_limit_dependency),
) -> RetrievalResponse:
    """Retrieve evidence chunks for the authenticated user's question."""
    clean_query = request.query.strip()
    if not clean_query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query string cannot be empty.",
        )

    logger.info(
        "Retrieval request: user_id=%s, query='%s', policy_id=%s, top_k=%d",
        current_user.id,
        clean_query,
        request.policy_id,
        request.top_k,
    )

    try:
        service = RetrievalService(user_token=current_user.token)
        results_data = service.retrieve_relevant_chunks(
            user_id=current_user.id,
            query=clean_query,
            policy_id=request.policy_id,
            document_id=request.document_id,
            top_k=request.top_k,
        )

        items = [RetrievalResultItem(**item) for item in results_data]
        return RetrievalResponse(
            query=clean_query,
            results=items,
            total_results=len(items),
        )
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err),
        )
    except Exception as exc:
        logger.exception("Unexpected error during retrieval: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve relevant policy chunks.",
        )
