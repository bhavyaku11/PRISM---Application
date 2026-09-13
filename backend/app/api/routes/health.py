from fastapi import APIRouter

router = APIRouter(tags=["Health"])


@router.get("/health")
def get_health():
    """Health check endpoint to verify backend operational readiness."""
    return {"status": "ok"}
