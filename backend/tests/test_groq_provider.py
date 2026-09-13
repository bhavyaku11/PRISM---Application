import json
from unittest.mock import MagicMock, patch
import httpx
import pytest

from app.core.config import settings
from app.services.ai.base import AIProvider
from app.services.ai.groq_provider import GroqProvider
from app.services.ai.ask_service import AskService, INSUFFICIENT_EVIDENCE_ANSWER
from app.services.retrieval.service import RetrievalService


# ============================================================
# 1. Initialization & Configuration Tests
# ============================================================

def test_groq_provider_initialization_defaults():
    """Verify GroqProvider initializes with configured or default settings."""
    provider = GroqProvider(api_key="gsk_test_key_1234567890")
    assert provider.provider_name == "groq"
    assert provider.model_name == settings.GROQ_MODEL
    assert provider.is_configured() is True
    assert provider._base_url == settings.GROQ_BASE_URL.rstrip("/")


def test_groq_provider_missing_api_key():
    """Verify GroqProvider raises ValueError when unconfigured."""
    provider = GroqProvider(api_key="")
    assert provider.is_configured() is False

    with pytest.raises(ValueError, match="Groq API key is not configured"):
        provider.generate_answer(
            prompt="What is my coverage?",
            system_instruction="You are PRISM.",
        )


# ============================================================
# 2. Response Generation & JSON Parsing Tests
# ============================================================

def test_groq_provider_successful_json_parsing():
    """Verify GroqProvider successfully sends prompt and parses structured JSON."""
    provider = GroqProvider(api_key="gsk_test_key_1234567890")

    mock_response_payload = {
        "choices": [
            {
                "message": {
                    "content": json.dumps({
                        "answer": "Waiting period for pre-existing diseases is 36 months.",
                        "grounded": True,
                        "confidence": "high",
                        "citations": [
                            {"chunk_id": "chunk_4", "page_number": 4, "section_title": "Section 3: Waiting Periods"}
                        ],
                    })
                }
            }
        ]
    }

    mock_resp = MagicMock(spec=httpx.Response)
    mock_resp.status_code = 200
    mock_resp.json.return_value = mock_response_payload
    mock_resp.raise_for_status = MagicMock()

    with patch("httpx.Client.post", return_value=mock_resp) as mock_post:
        result = provider.generate_answer(
            prompt="What is the waiting period?",
            system_instruction="You are PRISM AI.",
        )

        assert mock_post.called
        call_args = mock_post.call_args
        assert call_args[0][0] == f"{settings.GROQ_BASE_URL.rstrip('/')}/chat/completions"
        assert "Authorization" in call_args[1]["headers"]
        assert call_args[1]["json"]["model"] == settings.GROQ_MODEL

        assert result["answer"] == "Waiting period for pre-existing diseases is 36 months."
        assert result["grounded"] is True
        assert result["confidence"] == "high"
        assert len(result["citations"]) == 1
        assert result["citations"][0]["page_number"] == 4


def test_groq_provider_markdown_fences_json_parsing():
    """Verify GroqProvider strips markdown fences around JSON output."""
    provider = GroqProvider(api_key="gsk_test_key_1234567890")

    fenced_content = """```json
{
  "answer": "ICU accommodation is covered up to actual expenses without proportionate deduction.",
  "grounded": true,
  "confidence": "high",
  "citations": [
    {"chunk_id": "chunk_2", "page_number": 2, "section_title": "Section 1: What is Covered"}
  ]
}
```"""

    mock_resp = MagicMock(spec=httpx.Response)
    mock_resp.status_code = 200
    mock_resp.json.return_value = {"choices": [{"message": {"content": fenced_content}}]}
    mock_resp.raise_for_status = MagicMock()

    with patch("httpx.Client.post", return_value=mock_resp):
        result = provider.generate_answer(
            prompt="Is ICU covered?",
            system_instruction="You are PRISM AI.",
        )
        assert "ICU accommodation is covered" in result["answer"]
        assert result["grounded"] is True
        assert result["confidence"] == "high"


def test_groq_provider_malformed_json_fallback():
    """Verify GroqProvider handles malformed JSON without raising raw crashes."""
    provider = GroqProvider(api_key="gsk_test_key_1234567890")

    # Pure prose without JSON
    plain_text = "According to Section 3 of your policy, the waiting period is 36 months for pre-existing illnesses."
    mock_resp = MagicMock(spec=httpx.Response)
    mock_resp.status_code = 200
    mock_resp.json.return_value = {"choices": [{"message": {"content": plain_text}}]}
    mock_resp.raise_for_status = MagicMock()

    with patch("httpx.Client.post", return_value=mock_resp):
        result = provider.generate_answer(
            prompt="What is the waiting period?",
            system_instruction="You are PRISM AI.",
        )
        assert result["answer"] == plain_text
        assert result["grounded"] is True


def test_groq_provider_empty_response():
    """Verify GroqProvider raises ValueError on empty choices or content."""
    provider = GroqProvider(api_key="gsk_test_key_1234567890")

    mock_resp = MagicMock(spec=httpx.Response)
    mock_resp.status_code = 200
    mock_resp.json.return_value = {"choices": []}
    mock_resp.raise_for_status = MagicMock()

    with patch("httpx.Client.post", return_value=mock_resp):
        with pytest.raises(ValueError, match="Empty choices list"):
            provider.generate_answer("Hello", "System")


# ============================================================
# 3. HTTP Error Classification Tests
# ============================================================

def test_groq_provider_http_401_authentication_error():
    """Verify HTTP 401 raises sanitized ValueError without secret leakage."""
    provider = GroqProvider(api_key="gsk_invalid_test_key")

    mock_req = MagicMock(spec=httpx.Request)
    mock_resp = MagicMock(spec=httpx.Response)
    mock_resp.status_code = 401
    mock_resp.text = '{"error": {"message": "Invalid API Key"}}'

    error = httpx.HTTPStatusError("401 Unauthorized", request=mock_req, response=mock_resp)

    with patch("httpx.Client.post", side_effect=error):
        with pytest.raises(ValueError, match="Groq API authentication failed"):
            provider.generate_answer("Question", "System")


def test_groq_provider_http_429_rate_limit_error():
    """Verify HTTP 429 raises user-friendly RuntimeError."""
    provider = GroqProvider(api_key="gsk_valid_key")

    mock_req = MagicMock(spec=httpx.Request)
    mock_resp = MagicMock(spec=httpx.Response)
    mock_resp.status_code = 429
    mock_resp.text = '{"error": {"message": "Rate limit exceeded"}}'

    error = httpx.HTTPStatusError("429 Too Many Requests", request=mock_req, response=mock_resp)

    with patch("httpx.Client.post", side_effect=error):
        with pytest.raises(RuntimeError, match="rate limit reached"):
            provider.generate_answer("Question", "System")


def test_groq_provider_http_503_unavailable_error():
    """Verify HTTP 503 raises user-friendly RuntimeError."""
    provider = GroqProvider(api_key="gsk_valid_key")

    mock_req = MagicMock(spec=httpx.Request)
    mock_resp = MagicMock(spec=httpx.Response)
    mock_resp.status_code = 503
    mock_resp.text = 'Service Unavailable'

    error = httpx.HTTPStatusError("503 Service Unavailable", request=mock_req, response=mock_resp)

    with patch("httpx.Client.post", side_effect=error):
        with pytest.raises(RuntimeError, match="service is currently unavailable"):
            provider.generate_answer("Question", "System")


# ============================================================
# 4. End-to-End Integration with AskService & Citation Validation
# ============================================================

def test_groq_integration_with_ask_service_and_citation_validation():
    """Verify AskService correctly uses GroqProvider and enforces server-side citation validation."""
    mock_groq = GroqProvider(api_key="gsk_mock_valid_key")

    # Groq returns answer with 1 valid citation and 1 fabricated citation
    canned_llm_output = {
        "answer": "The pre-existing disease waiting period is 36 months.",
        "grounded": True,
        "confidence": "high",
        "citations": [
            {"chunk_id": "chunk_4", "page_number": 4, "section_title": "Section 3: Waiting Periods"},
            {"chunk_id": "chunk_fake_999", "page_number": 99, "section_title": "Fake Wording"},
        ],
    }

    mock_groq.generate_answer = MagicMock(return_value=canned_llm_output)

    # Retrieval service returns authentic chunk 4
    mock_retrieval = MagicMock(spec=RetrievalService)
    mock_retrieval.retrieve_relevant_chunks.return_value = [
        {
            "chunk_id": "chunk_4",
            "document_id": "doc_001",
            "policy_id": "pol_001",
            "page_number": 4,
            "section_title": "Section 3: Waiting Periods",
            "content": "3.3 Pre-existing Disease (PED) Waiting Period: A waiting period of 36 months applies.",
            "similarity": 0.85,
        }
    ]

    ask_service = AskService(retrieval_service=mock_retrieval, ai_provider=mock_groq)
    ask_service.client = MagicMock()
    # Mock ownership verification
    ask_service.client.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"id": "pol_001"}]
    )
    # Mock persistence
    ask_service.client.table.return_value.insert.return_value.execute.return_value = MagicMock(data=[{"id": "msg_001"}])
    ask_service.client.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock(data=[])

    result = ask_service.ask(
        user_id="user_test_01",
        question="What is the waiting period for pre-existing diseases in my policy?",
        policy_id="pol_001",
    )

    assert result["grounded"] is True
    assert result["confidence"] == "high"
    assert "36 months" in result["answer"]

    # Server-side citation validation: fabricated citation MUST BE STRIPPED
    assert len(result["citations"]) == 1
    assert result["citations"][0]["chunk_id"] == "chunk_4"
    assert result["citations"][0]["page_number"] == 4
    assert result["citations"][0]["section_title"] == "Section 3: Waiting Periods"


def test_groq_integration_insufficient_evidence():
    """Verify AskService returns insufficient evidence when retrieval similarity is too low."""
    mock_groq = GroqProvider(api_key="gsk_mock_valid_key")
    mock_groq.generate_answer = MagicMock()

    mock_retrieval = MagicMock(spec=RetrievalService)
    # Return chunks with similarity below threshold
    mock_retrieval.retrieve_relevant_chunks.return_value = [
        {
            "chunk_id": "chunk_x",
            "page_number": 1,
            "content": "Irrelevant text",
            "similarity": 0.15,
        }
    ]

    ask_service = AskService(retrieval_service=mock_retrieval, ai_provider=mock_groq)
    ask_service.client = MagicMock()
    ask_service.client.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"id": "pol_001"}]
    )
    ask_service.client.table.return_value.insert.return_value.execute.return_value = MagicMock(data=[{"id": "msg_001"}])

    result = ask_service.ask(
        user_id="user_test_01",
        question="What is the waiting period for pre-existing diseases?",
        policy_id="pol_001",
    )

    assert result["grounded"] is False
    assert result["confidence"] == "low"
    assert result["answer"] == INSUFFICIENT_EVIDENCE_ANSWER
    # Groq must NOT be called when evidence is insufficient
    assert mock_groq.generate_answer.call_count == 0
