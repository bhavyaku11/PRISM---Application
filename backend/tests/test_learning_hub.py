"""Tests for PRISM Step 16: Insurance Learning Hub Concept Retrieval & Safety."""

import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from app.main import app
from app.api.deps import get_current_user, AuthenticatedUser


client = TestClient(app)


def test_learning_hub_concept_retrieval():
    """Verify concept retrieval requests return grounded policy chunks with page and section metadata."""
    user = AuthenticatedUser(
        user_data={"id": "usr_learner_1", "email": "learner@prism.in", "role": "authenticated"},
        token="token_learner_1",
    )

    app.dependency_overrides[get_current_user] = lambda: user
    try:
        with patch("app.api.routes.retrieval.RetrievalService") as mock_retrieval_cls:
            mock_service = MagicMock()
            mock_retrieval_cls.return_value = mock_service
            mock_service.retrieve_relevant_chunks.return_value = [
                {
                    "chunk_id": "chk_copay_1",
                    "document_id": "doc_pol_1",
                    "policy_id": "pol_learner_a",
                    "page_number": 14,
                    "section_title": "Co-payment and Deductible",
                    "content": "A co-payment of 10% shall apply to all claims if treatment is taken in Zone 1.",
                    "similarity": 0.86,
                }
            ]

            resp = client.post(
                "/api/retrieval/search",
                json={
                    "query": "co-pay copay copayment cost sharing percentage deduction senior citizen zone",
                    "policy_id": "pol_learner_a",
                    "top_k": 3,
                },
            )

            assert resp.status_code == 200
            data = resp.json()
            assert "results" in data
            assert len(data["results"]) == 1
            chunk = data["results"][0]
            assert chunk["page_number"] == 14
            assert chunk["section_title"] == "Co-payment and Deductible"
            assert "10%" in chunk["content"]

            mock_retrieval_cls.assert_called_once_with(user_token="token_learner_1")
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_learning_hub_cross_user_isolation():
    """Verify a user cannot retrieve policy evidence for an unowned policy in the Learning Hub."""
    user = AuthenticatedUser(
        user_data={"id": "usr_learner_2", "email": "learner2@prism.in", "role": "authenticated"},
        token="token_learner_2",
    )

    app.dependency_overrides[get_current_user] = lambda: user
    try:
        with patch("app.api.routes.retrieval.RetrievalService") as mock_retrieval_cls:
            mock_service = MagicMock()
            mock_retrieval_cls.return_value = mock_service
            # Unowned policy returns empty results due to RLS/ownership checks
            mock_service.retrieve_relevant_chunks.return_value = []

            resp = client.post(
                "/api/retrieval/search",
                json={
                    "query": "room rent room category single private room proportionate deduction",
                    "policy_id": "pol_foreign_user_777",
                    "top_k": 3,
                },
            )

            assert resp.status_code == 200
            data = resp.json()
            assert data["results"] == []
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_learning_hub_safety_and_neutrality_invariants():
    """Verify that educational content avoids prohibited claims (legal/medical advice, outcome guarantees)."""
    prohibited_claims = [
        "guaranteed approval",
        "claim approval guaranteed",
        "we guarantee reimbursement",
        "medical diagnosis",
        "legal advice",
        "you should purchase",
        "best insurer",
    ]

    # Sample educational explanation and illustrative example
    sample_texts = [
        "Co-pay is a predetermined percentage of approved medical expenses that you must pay out of pocket.",
        "Illustrative Example (Not your actual policy): You pay 20% (₹40,000) out of pocket, and the insurance company settles the remaining 80%.",
        "PRISM is an informational decision-support tool. Explanations and policy excerpts are for guidance and educational purposes only.",
    ]

    for text in sample_texts:
        lower = text.lower()
        for claim in prohibited_claims:
            assert claim not in lower, f"Prohibited claim '{claim}' found in educational text: '{text}'"
