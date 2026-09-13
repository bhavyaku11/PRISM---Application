import json
import logging
import re
from typing import List, Dict, Any, Optional
import httpx

from app.core.config import settings
from app.services.ai.base import AIProvider

logger = logging.getLogger("prism.ai.groq")


class GroqProvider(AIProvider):
    """Groq LLM client using the official Groq OpenAI-compatible Chat Completions API."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        base_url: Optional[str] = None,
        timeout: Optional[float] = None,
    ):
        self._api_key = api_key if api_key is not None else settings.effective_groq_api_key
        self._model = model or settings.GROQ_MODEL
        self._base_url = (base_url or settings.GROQ_BASE_URL).rstrip("/")
        self._timeout = timeout or settings.GROQ_TIMEOUT_SECONDS

    @property
    def model_name(self) -> str:
        return self._model

    @property
    def provider_name(self) -> str:
        return "groq"

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
        """Generate structured grounded answer using Groq."""
        if not self.is_configured():
            raise ValueError("Groq API key is not configured. Please set GROQ_API_KEY in the environment.")

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
        logger.info("Calling Groq API: model=%s, messages_count=%d", self._model, len(messages))

        try:
            with httpx.Client(timeout=self._timeout) as client:
                response = client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()

            choices = data.get("choices") or []
            if not choices:
                raise ValueError("Empty choices list returned from Groq API.")

            raw_text = choices[0].get("message", {}).get("content", "")
            if not raw_text or not raw_text.strip():
                raise ValueError("Empty message content returned from Groq API.")

            return self._parse_json_response(raw_text)

        except httpx.HTTPStatusError as http_err:
            status_code = http_err.response.status_code
            logger.error("Groq API HTTP error: status=%d, detail=%s", status_code, http_err.response.text[:200])
            if status_code == 401:
                raise ValueError("Groq API authentication failed. Please verify your GROQ_API_KEY.") from http_err
            elif status_code == 429:
                raise RuntimeError("Groq API rate limit reached. Please retry in a few moments.") from http_err
            elif status_code in (502, 503, 504):
                raise RuntimeError("Groq service is currently unavailable. Please try again later.") from http_err
            raise RuntimeError(f"Groq API error (HTTP {status_code}).") from http_err

        except httpx.RequestError as req_err:
            logger.error("Groq connection error: %s", req_err)
            raise RuntimeError(f"Failed to connect to Groq API: {req_err}") from req_err

    def _parse_json_response(self, text: str) -> Dict[str, Any]:
        """Clean and parse JSON from model output."""
        cleaned = text.strip()
        # Strip markdown fences if present
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
            cleaned = re.sub(r"\s*```$", "", cleaned)
            cleaned = cleaned.strip()

        # Extract JSON substring if surrounded by other text
        if not (cleaned.startswith("{") and cleaned.endswith("}")):
            json_match = re.search(r"(\{.*\})", cleaned, re.DOTALL)
            if json_match:
                cleaned = json_match.group(1).strip()

        try:
            data = json.loads(cleaned)
            if not isinstance(data, dict):
                raise ValueError("Parsed JSON is not an object.")

            answer_val = data.get("answer", "")
            if isinstance(answer_val, dict):
                # Handle cases where model nests answers under sub-keys
                if "greeting" in answer_val and len(answer_val) == 1:
                    answer_str = str(answer_val["greeting"])
                else:
                    answer_str = json.dumps(answer_val)
            else:
                answer_str = str(answer_val)

            grounded_val = data.get("grounded")
            if grounded_val is None:
                grounded_val = True if "couldn't find enough information" not in answer_str.lower() else False

            confidence_val = data.get("confidence")
            if not confidence_val or confidence_val not in ("high", "medium", "low"):
                confidence_val = "high" if bool(grounded_val) else "low"

            citations_val = data.get("citations")
            if not isinstance(citations_val, list):
                citations_val = []

            return {
                "answer": answer_str,
                "grounded": bool(grounded_val),
                "confidence": str(confidence_val),
                "citations": citations_val,
            }

        except (json.JSONDecodeError, ValueError) as json_err:
            logger.warning("Groq output JSON parsing fallback triggered: %s | Raw output snippet: %s", json_err, text[:150])
            # Fallback heuristic: Treat text as plain answer if valid sentence, otherwise fail
            if len(text.strip()) > 10 and "{" not in text:
                return {
                    "answer": text.strip(),
                    "grounded": True,
                    "confidence": "medium",
                    "citations": [],
                }
            raise ValueError(f"Could not parse valid JSON from Groq response: {json_err}") from json_err
