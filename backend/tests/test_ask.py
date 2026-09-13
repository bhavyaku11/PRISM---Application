from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.api.deps import get_current_user, AuthenticatedUser
from app.services.ai.base import AIProvider
from app.services.ai.ask_service import AskService, INSUFFICIENT_EVIDENCE_ANSWER
from app.services.ai.grok_provider import GrokProvider
from app.services.retrieval.service import RetrievalService


class MockTestAIProvider(AIProvider):
    """Deterministic mock provider for tests."""

    def __init__(self, canned_response=None):
        self.canned = canned_response or {
            "answer": "Intensive Care Unit (ICU) charges are covered up to ₹20,000 per day or 2% of the Sum Insured.",
            "grounded": True,
            "confidence": "high",
            "citations": [
                {"chunk_id": "chunk_icu_1", "page_number": 2, "section_title": "ICU Benefits"},
                {"chunk_id": "chunk_fake_fabricated_999", "page_number": 99, "section_title": "Fake Section"},
            ],
        }

    @property
    def model_name(self) -> str:
        return "mock-grok-test"

    @property
    def provider_name(self) -> str:
        return "mock_ai"

    def generate_answer(self, prompt: str, system_instruction: str, history=None, temperature=0.1):
        if callable(self.canned):
            return self.canned(prompt, history)
        return self.canned


# ============================================================
# TEST 1 & 2: API Endpoint Authentication & Input Validation
# ============================================================

def test_ask_endpoint_requires_auth():
    """Verify POST /api/ask rejects unauthenticated calls with 401."""
    client = TestClient(app)
    res = client.post("/api/ask", json={"question": "Does my policy cover ICU?"})
    assert res.status_code == 401
    assert "token is required" in res.json()["detail"].lower()


def test_ask_endpoint_empty_question():
    """Verify POST /api/ask rejects empty questions with 400."""
    client = TestClient(app)
    mock_user = AuthenticatedUser(
        user_data={"id": "usr_test_01", "email": "test@prism.in", "role": "authenticated"},
        token="valid_token",
    )
    app.dependency_overrides[get_current_user] = lambda: mock_user

    try:
        res = client.post("/api/ask", json={"question": "   \n\t  "})
        assert res.status_code == 400
        assert "cannot be empty" in res.json()["detail"].lower()
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_ask_endpoint_question_too_long():
    """Verify questions exceeding 1000 characters are rejected with 400."""
    client = TestClient(app)
    mock_user = AuthenticatedUser(
        user_data={"id": "usr_test_01", "email": "test@prism.in", "role": "authenticated"},
        token="valid_token",
    )
    app.dependency_overrides[get_current_user] = lambda: mock_user

    try:
        long_q = "Does my policy cover " + "a" * 1050
        res = client.post("/api/ask", json={"question": long_q})
        assert res.status_code == 400 or res.status_code == 422
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ============================================================
# TEST 3 & 4: Evidence Sufficiency & Fast Refusal
# ============================================================

def test_insufficient_evidence_zero_chunks():
    """When retrieval returns 0 chunks, service returns refusal without calling Grok."""
    mock_retrieval = MagicMock(spec=RetrievalService)
    mock_retrieval.retrieve_relevant_chunks.return_value = []

    mock_ai = MagicMock(spec=AIProvider)

    service = AskService(retrieval_service=mock_retrieval, ai_provider=mock_ai)
    service.client = MagicMock()
    service.client.table.return_value.insert.return_value.execute.return_value = MagicMock(data=[{"id": "msg_1"}])
    service.client.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock(data=[])

    res = service.ask(user_id="usr_01", question="What is the claim settlement ratio?")

    assert res["grounded"] is False
    assert res["confidence"] == "low"
    assert res["citations"] == []
    assert INSUFFICIENT_EVIDENCE_ANSWER in res["answer"]
    # Verify AI provider was NEVER called
    mock_ai.generate_answer.assert_not_called()


def test_insufficient_evidence_low_similarity():
    """When retrieval returns only chunks below confidence threshold (<0.40), returns refusal."""
    mock_retrieval = MagicMock(spec=RetrievalService)
    mock_retrieval.retrieve_relevant_chunks.return_value = [
        {
            "chunk_id": "c_unrelated",
            "document_id": "doc_1",
            "policy_id": "pol_1",
            "page_number": 1,
            "section_title": "Preamble",
            "content": "This policy schedule outlines basic party names.",
            "similarity": 0.22,  # Far below 0.40 threshold
        }
    ]

    mock_ai = MagicMock(spec=AIProvider)

    service = AskService(retrieval_service=mock_retrieval, ai_provider=mock_ai)
    service.client = MagicMock()
    service.client.table.return_value.insert.return_value.execute.return_value = MagicMock(data=[{"id": "msg_1"}])
    service.client.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock(data=[])

    res = service.ask(user_id="usr_01", question="Does my policy cover dental cosmetic surgery?")

    assert res["grounded"] is False
    assert res["confidence"] == "low"
    assert res["citations"] == []
    assert INSUFFICIENT_EVIDENCE_ANSWER in res["answer"]
    mock_ai.generate_answer.assert_not_called()


# ============================================================
# TEST 5: Grounded Generation & Strict Citation Validation
# ============================================================

def test_grounded_answer_and_citation_validation():
    """Verify answer generation succeeds and drops fabricated citation chunk IDs."""
    mock_retrieval = MagicMock(spec=RetrievalService)
    mock_retrieval.retrieve_relevant_chunks.return_value = [
        {
            "chunk_id": "chunk_icu_1",
            "document_id": "doc_health_01",
            "policy_id": "pol_star_01",
            "page_number": 2,
            "section_title": "Section 1: Inpatient & ICU Benefits",
            "content": "ICU room and boarding charges are covered up to ₹20,000 per day.",
            "similarity": 0.82,
        },
        {
            "chunk_id": "chunk_room_2",
            "document_id": "doc_health_01",
            "policy_id": "pol_star_01",
            "page_number": 3,
            "section_title": "Section 2: Room Rent Limits",
            "content": "Standard room rent is capped at 1% of Sum Insured.",
            "similarity": 0.75,
        },
    ]

    mock_ai = MockTestAIProvider()

    service = AskService(retrieval_service=mock_retrieval, ai_provider=mock_ai)
    service.client = MagicMock()
    service.client.table.return_value.insert.return_value.execute.return_value = MagicMock(data=[{"id": "msg_asst_100"}])
    service.client.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock(data=[])

    res = service.ask(user_id="usr_01", question="Does my policy cover ICU charges?")

    assert res["grounded"] is True
    assert res["confidence"] == "high"
    assert "ICU" in res["answer"]

    # Citation Validation check:
    # `chunk_fake_fabricated_999` must be completely STRIPPED because it was not in retrieval!
    citations = res["citations"]
    assert len(citations) == 1
    cit = citations[0]
    assert cit["chunk_id"] == "chunk_icu_1"
    # Metadata MUST come from authentic database record, NOT the LLM text
    assert cit["page_number"] == 2
    assert cit["section_title"] == "Section 1: Inpatient & ICU Benefits"
    assert cit["document_id"] == "doc_health_01"
    assert cit["policy_id"] == "pol_star_01"


# ============================================================
# TEST 6: Server-side Citation Fallback
# ============================================================

def test_server_side_citation_fallback():
    """If model generates grounded answer but omits citation array, server attaches top retrieved chunk."""
    mock_retrieval = MagicMock(spec=RetrievalService)
    mock_retrieval.retrieve_relevant_chunks.return_value = [
        {
            "chunk_id": "chunk_waiting_1",
            "document_id": "doc_01",
            "policy_id": "pol_01",
            "page_number": 4,
            "section_title": "Section 3: Waiting Periods",
            "content": "There is a 36-month waiting period for pre-existing ailments.",
            "similarity": 0.85,
        }
    ]

    mock_ai = MockTestAIProvider(
        canned_response={
            "answer": "The policy requires a 36-month waiting period for pre-existing diseases.",
            "grounded": True,
            "confidence": "high",
            "citations": [],  # Model omitted citations
        }
    )

    service = AskService(retrieval_service=mock_retrieval, ai_provider=mock_ai)
    service.client = MagicMock()
    service.client.table.return_value.insert.return_value.execute.return_value = MagicMock(data=[{"id": "msg_1"}])
    service.client.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock(data=[])

    res = service.ask(user_id="usr_01", question="What is the waiting period?")

    assert res["grounded"] is True
    # Server fallback must attach the top retrieved chunk citation
    assert len(res["citations"]) == 1
    assert res["citations"][0]["chunk_id"] == "chunk_waiting_1"
    assert res["citations"][0]["page_number"] == 4


# ============================================================
# TEST 7: Strict User Isolation & Scope Verification
# ============================================================

def test_strict_user_isolation_scope():
    """Verify querying an unauthorized policy raises ValueError without data access."""
    mock_retrieval = MagicMock(spec=RetrievalService)
    mock_ai = MockTestAIProvider()

    service = AskService(retrieval_service=mock_retrieval, ai_provider=mock_ai)
    service.client = MagicMock()

    # Mock policy ownership check returning empty (unauthorized)
    service.client.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(data=[])

    with pytest.raises(ValueError) as exc:
        service.ask(
            user_id="usr_alice",
            question="What are my limits?",
            policy_id="pol_belonging_to_bob_999",
        )

    assert "unauthorized" in str(exc.value).lower() or "not found" in str(exc.value).lower()
    # Retrieval must NEVER be called for unauthorized scope
    mock_retrieval.retrieve_relevant_chunks.assert_not_called()


# ============================================================
# TEST 8: Multi-turn Conversation Continuity
# ============================================================

def test_conversation_persistence_and_multi_turn():
    """Verify conversation history is passed to Grok while re-retrieving evidence."""
    mock_retrieval = MagicMock(spec=RetrievalService)
    mock_retrieval.retrieve_relevant_chunks.return_value = [
        {
            "chunk_id": "chunk_icu_1",
            "document_id": "doc_1",
            "policy_id": "pol_1",
            "page_number": 2,
            "section_title": "ICU Cover",
            "content": "ICU bed charges are covered.",
            "similarity": 0.81,
        }
    ]

    received_history = []

    def inspect_history(prompt, history):
        nonlocal received_history
        received_history = history or []
        return {
            "answer": "Yes, ICU is included under inpatient coverage.",
            "grounded": True,
            "confidence": "high",
            "citations": [{"chunk_id": "chunk_icu_1"}],
        }

    mock_ai = MockTestAIProvider(canned_response=inspect_history)

    service = AskService(retrieval_service=mock_retrieval, ai_provider=mock_ai)
    service.client = MagicMock()

    # Mock conversation ownership and previous messages
    mock_conv_query = MagicMock()
    mock_conv_query.eq.return_value = mock_conv_query
    mock_conv_query.execute.return_value = MagicMock(data=[{"id": "conv_123"}])

    mock_msg_query = MagicMock()
    mock_msg_query.eq.return_value = mock_msg_query
    mock_msg_query.order.return_value = mock_msg_query
    mock_msg_query.limit.return_value = mock_msg_query
    mock_msg_query.execute.return_value = MagicMock(
        data=[
            {"role": "user", "content": "What is my room rent limit?"},
            {"role": "assistant", "content": "Your room rent is capped at ₹10,000 per day."},
        ]
    )

    def table_router(tbl):
        mock_t = MagicMock()
        if tbl == "conversations":
            mock_t.select.return_value = mock_conv_query
        elif tbl == "messages":
            mock_t.select.return_value = mock_msg_query
            mock_t.insert.return_value.execute.return_value = MagicMock(data=[{"id": "msg_new"}])
        return mock_t

    service.client.table.side_effect = table_router

    # Follow-up question in existing conversation
    res = service.ask(
        user_id="usr_01",
        question="Does that include ICU?",
        conversation_id="conv_123",
    )

    # Verify history was passed to model
    assert len(received_history) == 2
    assert received_history[0]["content"] == "What is my room rent limit?"
    # Verify retrieval was STILL executed for the follow-up
    mock_retrieval.retrieve_relevant_chunks.assert_called_once()
    assert res["grounded"] is True


# ============================================================
# TEST 9: Grok Provider Error Handling
# ============================================================

def test_grok_provider_unconfigured_error():
    """Verify GrokProvider raises ValueError when API key is missing."""
    provider = GrokProvider(api_key=None)
    provider._api_key = None

    with pytest.raises(ValueError) as exc:
        provider.generate_answer("test prompt", "system instructions")

    assert "API key is not configured" in str(exc.value)


# ============================================================
# TEST 10: End-to-end API Route Execution
# ============================================================

def test_ask_api_route_success():
    """Verify POST /api/ask returns formatted response conforming to Pydantic schema."""
    from app.services.ai import set_ai_provider

    mock_user = AuthenticatedUser(
        user_data={"id": "usr_api_test", "email": "test@prism.in", "role": "authenticated"},
        token="valid_token",
    )
    app.dependency_overrides[get_current_user] = lambda: mock_user

    mock_ai = MockTestAIProvider()
    set_ai_provider(mock_ai)

    client = TestClient(app)

    try:
        with patch.object(RetrievalService, "retrieve_relevant_chunks") as mock_retrieval:
            mock_retrieval.return_value = [
                {
                    "chunk_id": "chunk_icu_1",
                    "document_id": "doc_1",
                    "policy_id": "pol_1",
                    "page_number": 2,
                    "section_title": "ICU Benefits",
                    "content": "ICU charges covered up to sum insured.",
                    "similarity": 0.88,
                }
            ]

            mock_client = MagicMock()
            mock_client.table.return_value.insert.return_value.execute.return_value = MagicMock(data=[{"id": "msg_new"}])
            mock_client.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock(data=[])
            with patch("app.services.ai.ask_service.get_supabase_client", return_value=mock_client), \
                 patch("app.services.ai.ask_service.get_admin_supabase_client", return_value=mock_client):

                res = client.post("/api/ask", json={"question": "Does my policy cover ICU charges?"})

                assert res.status_code == 200
                data = res.json()
                assert data["grounded"] is True
                assert data["confidence"] == "high"
                assert "ICU" in data["answer"]
                assert len(data["citations"]) == 1
                assert data["citations"][0]["chunk_id"] == "chunk_icu_1"
                assert data["citations"][0]["page_number"] == 2
                assert len(data["sources"]) == 1
    finally:
        app.dependency_overrides.pop(get_current_user, None)
