import json
import logging
import re
from typing import List, Dict, Any, Optional
import httpx

from app.core.config import settings
from app.services.ai.base import AIProvider

logger = logging.getLogger("prism.ai.grok")


class GrokProvider(AIProvider):
    """xAI Grok LLM client using the official xAI Chat Completions API."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        base_url: Optional[str] = None,
        timeout: Optional[float] = None,
    ):
        self._api_key = api_key or settings.effective_xai_api_key
        self._model = model or settings.XAI_MODEL
        self._base_url = (base_url or settings.XAI_BASE_URL).rstrip("/")
        self._timeout = timeout or settings.XAI_TIMEOUT_SECONDS

    @property
    def model_name(self) -> str:
        return self._model

    @property
    def provider_name(self) -> str:
        return "xai_grok"

    def is_configured(self) -> bool:
        """Check whether a valid API key is present."""
        return bool(self._api_key and self._api_key.strip())

    def generate_answer(
        self,
        prompt: str,
        system_instruction: str,
        history: Optional[List[Dict[str, str]]] = None,
        temperature: float = 0.1,
    ) -> Dict[str, Any]:
        """Generate structured grounded answer using Grok."""
        if not self.is_configured():
            raise ValueError("xAI / Grok API key is not configured. Please set XAI_API_KEY in the environment.")

        # Build message history
        messages: List[Dict[str, str]] = [
            {"role": "system", "content": system_instruction}
        ]

        if history:
            for turn in history:
                role = turn.get("role")
                content = turn.get("content")
                if role in ("user", "assistant") and content:
                    messages.append({"role": role, "content": content})

        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self._model,
            "messages": messages,
            "temperature": max(0.0, min(1.0, temperature)),
            "response_format": {"type": "json_object"},
        }

        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }

        url = f"{self._base_url}/chat/completions"
        logger.info("Calling xAI Grok API: model=%s, messages_count=%d", self._model, len(messages))

        try:
            with httpx.Client(timeout=self._timeout) as client:
                response = client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()

            choices = data.get("choices") or []
            if not choices:
                raise ValueError("Empty choices list returned from xAI Grok API.")

            raw_text = choices[0].get("message", {}).get("content", "")
            return self._parse_json_response(raw_text)

        except httpx.HTTPStatusError as http_err:
            status_code = http_err.response.status_code
            logger.error("xAI Grok API HTTP error: status=%d, detail=%s", status_code, http_err.response.text[:200])
            if status_code == 401:
                raise ValueError("xAI API authentication failed. Please verify your XAI_API_KEY.") from http_err
            elif status_code == 429:
                raise RuntimeError("xAI API rate limit reached. Please retry in a few moments.") from http_err
            elif status_code in (502, 503, 504):
                raise RuntimeError("xAI service is currently unavailable. Please try again later.") from http_err
            raise RuntimeError(f"xAI API error (HTTP {status_code}).") from http_err

        except httpx.RequestError as req_err:
            logger.error("xAI Grok connection error: %s", req_err)
            raise RuntimeError(f"Failed to connect to xAI Grok API: {req_err}") from req_err

    def _parse_json_response(self, text: str) -> Dict[str, Any]:
        """Clean and parse JSON from model output."""
        cleaned = text.strip()
        # Strip markdown fences if present
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
            cleaned = re.sub(r"\s*```$", "", cleaned)
            cleaned = cleaned.strip()

        try:
            data = json.loads(cleaned)
            if not isinstance(data, dict):
                raise ValueError("Parsed JSON is not an object.")

            answer = data.get("answer", "").strip()
            grounded = bool(data.get("grounded", False))
            confidence = str(data.get("confidence", "low")).lower()
            if confidence not in ("high", "medium", "low"):
                confidence = "medium"

            citations = data.get("citations", [])
            if not isinstance(citations, list):
                citations = []

            return {
                "answer": answer,
                "grounded": grounded,
                "confidence": confidence,
                "citations": citations,
            }
        except json.JSONDecodeError as json_err:
            logger.warning("Failed to parse JSON response from Grok: %s. Output: %s", json_err, text[:200])
            # Fallback to returning raw text as answer
            return {
                "answer": cleaned,
                "grounded": False,
                "confidence": "low",
                "citations": [],
            }
