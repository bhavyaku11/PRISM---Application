import time
from collections import defaultdict
from typing import Dict, List
from fastapi import Request, HTTPException, status
from app.core.config import settings


class InMemoryRateLimiter:
    """Sliding-window in-memory rate limiter per client key / IP."""

    def __init__(self, requests_per_minute: int = 30):
        self.requests_per_minute = requests_per_minute
        self.window_seconds = 60
        self._history: Dict[str, List[float]] = defaultdict(list)

    def check(self, key: str) -> None:
        now = time.time()
        cutoff = now - self.window_seconds
        # Evict timestamps older than the sliding window
        self._history[key] = [t for t in self._history[key] if t > cutoff]

        if len(self._history[key]) >= self.requests_per_minute:
            retry_after = int(self.window_seconds - (now - self._history[key][0])) + 1
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please wait before submitting more requests.",
                headers={"Retry-After": str(max(1, retry_after))},
            )

        self._history[key].append(now)

    def reset(self) -> None:
        """Clear all in-memory history (primarily for test environments)."""
        self._history.clear()


limiter = InMemoryRateLimiter(requests_per_minute=settings.RATE_LIMIT_PER_MINUTE)


def rate_limit_dependency(request: Request) -> None:
    """FastAPI dependency to rate-limit expensive requests."""
    auth_header = request.headers.get("authorization", "")
    client_ip = request.client.host if request.client else "unknown"
    client_key = auth_header.strip() if auth_header else client_ip
    limiter.check(client_key)
