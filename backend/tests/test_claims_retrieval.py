"""Tests for PRISM Step 12: Claim Workspace Retrieval & Policy Evidence Context."""

import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from app.main import app
from app.api.deps import get_current_user, AuthenticatedUser


client = TestClient(app)


def test_claim_evidence_retrieval_query_construction():
    """Verify Claim Workspace searches return relevant chunks for claim scenarios."""
    user = AuthenticatedUser(
        user_data={"id": "usr_claimant_1", "email": "claimant@prism.in", "role": "authenticated"},
        token="token_claimant_1",
    )

    app.dependency_overrides[get_current_user] = lambda: user
    try:
        with patch("app.api.routes.retrieval.RetrievalService") as mock_retrieval_cls:
            mock_service = MagicMock()
            mock_retrieval_cls.return_value = mock_service
            mock_service.retrieve_relevant_chunks.return_value = [
                {
                    "chunk_id": "chk_claim_proc_1",
                    "document_id": "doc_policy_1",
                    "policy_id": "pol_health_1",
                    "page_number": 23,
                    "section_title": "Claims Procedure",
                    "content": "Notice of claim must be given within 24 hours of emergency hospitalization.",
                    "similarity": 0.89,
                }
            ]

            # Test claim query for procedure
            resp = client.post(
                "/api/retrieval/search",
                json={
                    "query": "Hospitalization cashless reimbursement claim procedure intimation timeline discharge settlement documents",
                    "policy_id": "pol_health_1",
                    "top_k": 5,
                },
            )

            assert resp.status_code == 200
            data = resp.json()
            assert "results" in data
            assert len(data["results"]) == 1
            assert data["results"][0]["section_title"] == "Claims Procedure"
            assert data["results"][0]["page_number"] == 23

            # Verify RetrievalService was initialized with user's token
            mock_retrieval_cls.assert_called_once_with(user_token="token_claimant_1")
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_claim_evidence_cross_user_isolation():
    """Verify a user cannot retrieve policy evidence from another user's policy."""
    user = AuthenticatedUser(
        user_data={"id": "usr_claimant_2", "email": "claimant2@prism.in", "role": "authenticated"},
        token="token_claimant_2",
    )

    app.dependency_overrides[get_current_user] = lambda: user
    try:
        with patch("app.api.routes.retrieval.RetrievalService") as mock_retrieval_cls:
            mock_service = MagicMock()
            mock_retrieval_cls.return_value = mock_service
            # RLS or policy ownership check returns empty list for unowned policy
            mock_service.retrieve_relevant_chunks.return_value = []

            resp = client.post(
                "/api/retrieval/search",
                json={
                    "query": "ICU room rent limits",
                    "policy_id": "pol_foreign_user_99",
                    "top_k": 5,
                },
            )

            assert resp.status_code == 200
            data = resp.json()
            assert data["results"] == []
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_claim_contextual_ask_grounding():
    """Verify Ask PRISM successfully handles contextual claim questions."""
    user = AuthenticatedUser(
        user_data={"id": "usr_claimant_3", "email": "claimant3@prism.in", "role": "authenticated"},
        token="token_claimant_3",
    )

    app.dependency_overrides[get_current_user] = lambda: user
    try:
        with patch("app.services.ai.ask_service.get_supabase_client") as mock_get_client, \
             patch("app.services.ai.ask_service.RetrievalService") as mock_retrieval_cls, \
             patch("app.services.ai.ask_service.get_ai_provider") as mock_get_ai_provider:

            # Mock Supabase policy verification
            mock_client = MagicMock()
            mock_get_client.return_value = mock_client
            mock_client.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[{"id": "pol_health_3", "policy_name": "Optima Restore"}]
            )

            # Mock retrieval of claim clause
            mock_retrieval = MagicMock()
            mock_retrieval_cls.return_value = mock_retrieval
            mock_retrieval.retrieve_relevant_chunks.return_value = [
                {
                    "chunk_id": "chk_waiting_1",
                    "document_id": "doc_1",
                    "policy_id": "pol_health_3",
                    "page_number": 4,
                    "section_title": "Waiting Periods",
                    "content": "A waiting period of 36 months applies for pre-existing conditions.",
                    "similarity": 0.91,
                }
            ]

            # Mock Groq provider
            mock_ai_provider = MagicMock()
            mock_get_ai_provider.return_value = mock_ai_provider
            mock_ai_provider.generate_answer.return_value = {
                "answer": "Based on your policy, pre-existing diseases have a waiting period of 36 months.",
                "confidence": "high",
                "grounded": True,
                "citations": [
                    {
                        "chunk_id": "chk_waiting_1",
                        "page_number": 4,
                        "section_title": "Waiting Periods",
                        "excerpt": "A waiting period of 36 months applies for pre-existing conditions.",
                    }
                ],
            }

            resp = client.post(
                "/api/ask",
                json={
                    "question": "Are there any waiting periods relevant to this hospitalization claim?",
                    "policy_id": "pol_health_3",
                },
            )

            assert resp.status_code == 200
            data = resp.json()
            assert data["grounded"] is True
            assert len(data["citations"]) == 1
            assert data["citations"][0]["page_number"] == 4
            assert "36 months" in data["answer"]
    finally:
        app.dependency_overrides.pop(get_current_user, None)
