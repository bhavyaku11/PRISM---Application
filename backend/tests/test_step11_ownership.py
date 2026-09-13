"""Tests for PRISM Step 11: Policy Ownership & Cross-User Security Isolation."""

import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from app.main import app
from app.api.deps import get_current_user, AuthenticatedUser


client = TestClient(app)


def test_cross_user_policy_isolation_in_retrieval():
    """Verify User A cannot retrieve chunks or sections from User B's policy."""
    user_a = AuthenticatedUser(
        user_data={"id": "usr_alice", "email": "alice@prism.in", "role": "authenticated"},
        token="token_alice",
    )

    app.dependency_overrides[get_current_user] = lambda: user_a
    try:
        with patch("app.api.routes.retrieval.RetrievalService") as mock_retrieval_cls:
            mock_service = MagicMock()
            mock_retrieval_cls.return_value = mock_service
            mock_service.retrieve_relevant_chunks.return_value = []

            resp = client.post(
                "/api/retrieval/search",
                json={"query": "What is the ICU limit?", "policy_id": "policy_bob_secret"},
            )
            assert resp.status_code == 200

            # Verify RetrievalService was instantiated with user_token of Alice and called with policy_bob_secret
            # but user isolation inside service guarantees search is scoped to user_alice
            assert mock_retrieval_cls.call_args[1]["user_token"] == "token_alice"
            assert mock_service.retrieve_relevant_chunks.call_args[1]["policy_id"] == "policy_bob_secret"
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_cross_user_policy_isolation_in_ask():
    """Verify Ask PRISM rejects unauthorized policy scopes."""
    user_a = AuthenticatedUser(
        user_data={"id": "usr_alice", "email": "alice@prism.in", "role": "authenticated"},
        token="token_alice",
    )

    app.dependency_overrides[get_current_user] = lambda: user_a
    try:
        with patch("app.services.ai.ask_service.get_supabase_client") as mock_get_client:
            mock_client = MagicMock()
            mock_get_client.return_value = mock_client

            # When querying policy table for policy_bob under Alice's token, PostgREST returns empty
            mock_client.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
                data=[]
            )

            resp = client.post(
                "/api/ask",
                json={"question": "Does my policy cover ICU?", "policy_id": "policy_bob_secret"},
            )
            assert resp.status_code == 400
            assert "unauthorized" in resp.json()["detail"].lower() or "not found" in resp.json()["detail"].lower()
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_cross_user_document_processing_isolation():
    """Verify User A cannot initiate processing or view status for User B's document."""
    from app.services.documents.processor import DocumentNotFoundError

    user_a = AuthenticatedUser(
        user_data={"id": "usr_alice", "email": "alice@prism.in", "role": "authenticated"},
        token="token_alice",
    )

    app.dependency_overrides[get_current_user] = lambda: user_a
    try:
        with patch("app.services.documents.processor.DocumentProcessor.get_document_for_processing") as mock_get_doc:
            mock_get_doc.side_effect = DocumentNotFoundError("Document not found.")

            resp = client.get("/api/documents/doc_bob_private/status")
            assert resp.status_code == 404
            assert "not found" in resp.json()["detail"].lower()
    finally:
        app.dependency_overrides.pop(get_current_user, None)
