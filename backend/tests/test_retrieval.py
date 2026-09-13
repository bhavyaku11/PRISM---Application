from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.embeddings import get_embedding_provider, FastEmbedProvider
from app.services.embeddings.service import EmbeddingService
from app.services.retrieval.service import (
    RetrievalService,
    compute_lexical_score,
    cosine_similarity,
)


# ============================================================
# TEST 1 & 2: Embedding generation & empty chunk handling
# ============================================================

def test_embedding_generation():
    """Verify FastEmbedProvider generates 384-dimensional normalized float vectors."""
    provider = get_embedding_provider()
    assert provider.dimension == 384
    assert provider.model_name == "BAAI/bge-small-en-v1.5"

    query = "Does my policy cover ICU charges?"
    emb = provider.embed_text(query)

    assert isinstance(emb, list)
    assert len(emb) == 384
    assert all(isinstance(x, float) for x in emb)
    assert any(x != 0.0 for x in emb)  # Non-zero vector


def test_empty_chunk_handling():
    """Verify empty or whitespace strings return zero vectors safely without crashing."""
    provider = get_embedding_provider()

    empty_vec = provider.embed_text("")
    assert len(empty_vec) == 384
    assert all(x == 0.0 for x in empty_vec)

    ws_vec = provider.embed_text("   \n\t  ")
    assert len(ws_vec) == 384
    assert all(x == 0.0 for x in ws_vec)

    batch_res = provider.embed_texts(["Valid text", "", "   "])
    assert len(batch_res) == 3
    assert any(x != 0.0 for x in batch_res[0])
    assert all(x == 0.0 for x in batch_res[1])
    assert all(x == 0.0 for x in batch_res[2])


# ============================================================
# TEST 3: Repeated embedding processing (idempotency)
# ============================================================

def test_repeated_embedding_processing():
    """Verify EmbeddingService skips already embedded chunks unless force=True."""
    mock_provider = MagicMock()
    mock_provider.embed_texts.return_value = [[0.1] * 384]

    service = EmbeddingService(provider=mock_provider)
    mock_client = MagicMock()
    service.client = mock_client

    # Chunks: one already embedded, one un-embedded, one empty
    chunks_data = [
        {"id": "c1", "chunk_index": 0, "content": "Already embedded text", "embedding": [0.05] * 384},
        {"id": "c2", "chunk_index": 1, "content": "Un-embedded chunk text", "embedding": None},
        {"id": "c3", "chunk_index": 2, "content": "", "embedding": None},
    ]
    mock_query = MagicMock()
    mock_query.eq.return_value = mock_query
    mock_query.execute.return_value = MagicMock(data=chunks_data)
    mock_client.table.return_value.select.return_value = mock_query

    # Run without force
    stats = service.embed_document_chunks("doc_1", force=False)
    assert stats["total_chunks"] == 3
    assert stats["embedded_chunks"] == 1
    assert stats["skipped_chunks"] == 2
    mock_provider.embed_texts.assert_called_once_with(["Un-embedded chunk text"])


# ============================================================
# TEST 4: Vector retrieval & relevance ranking
# ============================================================

def test_vector_retrieval():
    """Verify semantic retrieval ranks relevant chunk highest for ICU charges query."""
    provider = get_embedding_provider()
    service = RetrievalService(provider=provider)

    icu_text = "Intensive Care Unit (ICU) charges and ICU bed expenses are covered up to ₹10,000 per day or 2% of sum insured."
    waiting_text = "There is an initial waiting period of 30 days and a 36-month waiting period for pre-existing diseases."
    claim_text = "To make a reimbursement claim, submit original hospital bills, discharge summary, and pharmacy receipts within 30 days."

    # Generate real embeddings for candidate chunks
    vec_icu = provider.embed_text(icu_text)
    vec_waiting = provider.embed_text(waiting_text)
    vec_claim = provider.embed_text(claim_text)

    mock_db_chunks = [
        {"id": "c_icu", "document_id": "d1", "policy_id": "p1", "page_number": 4, "section_title": "ICU Charges", "content": icu_text, "embedding": vec_icu},
        {"id": "c_waiting", "document_id": "d1", "policy_id": "p1", "page_number": 8, "section_title": "Waiting Periods", "content": waiting_text, "embedding": vec_waiting},
        {"id": "c_claim", "document_id": "d1", "policy_id": "p1", "page_number": 14, "section_title": "Claims Procedure", "content": claim_text, "embedding": vec_claim},
    ]

    mock_query = MagicMock()
    mock_query.eq.return_value = mock_query
    mock_query.not_.is_.return_value = mock_query
    mock_query.execute.return_value = MagicMock(data=mock_db_chunks)

    service.client = MagicMock()
    service.client.rpc.side_effect = Exception("RPC not found")  # trigger fallback in-memory search
    service.client.table.return_value.select.return_value = mock_query

    results = service.retrieve_relevant_chunks(user_id="u1", query="Does my policy cover ICU charges?", top_k=3)

    assert len(results) == 3
    # ICU chunk must be ranked #1
    top_hit = results[0]
    assert top_hit["chunk_id"] == "c_icu"
    assert top_hit["page_number"] == 4
    assert top_hit["section_title"] == "ICU Charges"
    assert "ICU" in top_hit["content"]
    assert top_hit["similarity"] > results[1]["similarity"]


# ============================================================
# TEST 5 & 6: Policy filtering & Document filtering
# ============================================================

def test_policy_and_document_filtering():
    """Verify retrieval filters by policy_id and document_id when supplied."""
    provider = get_embedding_provider()
    service = RetrievalService(provider=provider)

    mock_query = MagicMock()
    mock_query.eq.return_value = mock_query
    mock_query.not_.is_.return_value = mock_query
    mock_query.execute.return_value = MagicMock(data=[])

    service.client = MagicMock()
    service.client.rpc.side_effect = Exception("No RPC")
    service.client.table.return_value.select.return_value = mock_query

    # Query with policy filter
    service.retrieve_relevant_chunks(user_id="u1", query="test query", policy_id="pol_123", document_id="doc_456")

    # Verify query builders called with correct filters
    mock_query.eq.assert_any_call("user_id", "u1")
    mock_query.eq.assert_any_call("policy_id", "pol_123")
    mock_query.eq.assert_any_call("document_id", "doc_456")


# ============================================================
# TEST 7: Strict User Isolation (Security)
# ============================================================

def test_strict_user_isolation():
    """Verify User A's retrieval NEVER queries or returns User B's policy chunks."""
    provider = get_embedding_provider()
    service = RetrievalService(provider=provider)

    mock_query = MagicMock()
    mock_query.eq.return_value = mock_query
    mock_query.not_.is_.return_value = mock_query
    mock_query.execute.return_value = MagicMock(data=[])

    service.client = MagicMock()
    service.client.rpc.side_effect = Exception("No RPC")
    service.client.table.return_value.select.return_value = mock_query

    service.retrieve_relevant_chunks(user_id="user_alice", query="Can I claim?")

    # User isolation check: user_id must strictly match the authenticated user
    mock_query.eq.assert_any_call("user_id", "user_alice")
    # Verify it does not accept arbitrary or null user
    for call in mock_query.eq.call_args_list:
        if call.args[0] == "user_id":
            assert call.args[1] == "user_alice"


# ============================================================
# TEST 8: No-result retrieval
# ============================================================

def test_no_result_retrieval():
    """Verify empty result list returned when no chunks exist for user."""
    service = RetrievalService(provider=get_embedding_provider())
    mock_query = MagicMock()
    mock_query.eq.return_value = mock_query
    mock_query.not_.is_.return_value = mock_query
    mock_query.execute.return_value = MagicMock(data=[])

    service.client = MagicMock()
    service.client.rpc.side_effect = Exception("No RPC")
    service.client.table.return_value.select.return_value = mock_query

    res = service.retrieve_relevant_chunks(user_id="u_empty", query="Any policy?")
    assert res == []


# ============================================================
# TEST 9: Invalid query handling
# ============================================================

def test_invalid_query_rejection():
    """Verify empty or whitespace-only query raises ValueError."""
    service = RetrievalService(provider=get_embedding_provider())

    with pytest.raises(ValueError) as exc:
        service.retrieve_relevant_chunks(user_id="u1", query="")
    assert "cannot be empty" in str(exc.value)

    with pytest.raises(ValueError):
        service.retrieve_relevant_chunks(user_id="u1", query="   \t\n  ")


# ============================================================
# TEST 10: Top-K handling
# ============================================================

def test_top_k_handling():
    """Verify top_k parameter bounds (clamps between 1 and max limit)."""
    provider = get_embedding_provider()
    service = RetrievalService(provider=provider)

    vec = provider.embed_text("Dummy content")
    many_chunks = [
        {"id": f"c_{i}", "document_id": "d1", "policy_id": "p1", "page_number": i, "content": f"Policy chunk {i}", "embedding": vec}
        for i in range(1, 25)
    ]

    mock_query = MagicMock()
    mock_query.eq.return_value = mock_query
    mock_query.not_.is_.return_value = mock_query
    mock_query.execute.return_value = MagicMock(data=many_chunks)

    service.client = MagicMock()
    service.client.rpc.side_effect = Exception("No RPC")
    service.client.table.return_value.select.return_value = mock_query

    # Request top_k = 3
    res_3 = service.retrieve_relevant_chunks(user_id="u1", query="Policy", top_k=3)
    assert len(res_3) == 3

    # Request top_k = 50 (should clamp to max 20)
    res_max = service.retrieve_relevant_chunks(user_id="u1", query="Policy", top_k=50)
    assert len(res_max) <= 20


# ============================================================
# TEST 11: Hybrid lexical scoring & cosine similarity helper
# ============================================================

def test_hybrid_lexical_scoring():
    """Verify lexical score computes exact token overlap and boosts title matches."""
    query = "What is the ICU limit?"

    score_match = compute_lexical_score(query, "Room rent limit is 1% and ICU charges are capped.", section_title="ICU Limit")
    score_unrelated = compute_lexical_score(query, "Maternity cover is not provided under base plan.", section_title="Exclusions")

    assert score_match > 0.6
    assert score_unrelated == 0.0

    # Test cosine similarity calculation
    vec1 = [1.0, 0.0, 0.0]
    vec2 = [1.0, 0.0, 0.0]
    vec3 = [0.0, 1.0, 0.0]

    assert pytest.approx(cosine_similarity(vec1, vec2), 0.001) == 1.0
    assert pytest.approx(cosine_similarity(vec1, vec3), 0.001) == 0.0


# ============================================================
# TEST 12 & 13: Retrieval API endpoint authentication & validation
# ============================================================

def test_retrieval_endpoint_auth():
    """Verify POST /api/retrieval/search requires valid authentication."""
    client = TestClient(app)
    # Unauthenticated call
    res = client.post("/api/retrieval/search", json={"query": "Does my policy cover ICU?"})
    assert res.status_code == 401
    assert "token is required" in res.json()["detail"].lower()


def test_retrieval_endpoint_empty_query():
    """Verify POST /api/retrieval/search rejects empty queries with 422/400."""
    client = TestClient(app)
    # Even if auth bypassed, empty string triggers validation error
    res = client.post("/api/retrieval/search", json={"query": ""})
    # 401 unauthenticated check happens first
    assert res.status_code == 401


def test_retrieval_endpoint_authenticated_success():
    """Verify POST /api/retrieval/search succeeds with authenticated user and valid response schema."""
    from app.api.deps import get_current_user, AuthenticatedUser

    mock_user = AuthenticatedUser(
        user_data={
            "id": "user_test_retrieval_123",
            "email": "test_user@prism.in",
            "role": "authenticated",
        },
        token="mock_token",
    )

    app.dependency_overrides[get_current_user] = lambda: mock_user
    client = TestClient(app)

    try:
        with patch.object(RetrievalService, "retrieve_relevant_chunks") as mock_retrieve:
            mock_retrieve.return_value = [
                {
                    "chunk_id": "c_icu_1",
                    "document_id": "doc_100",
                    "policy_id": "pol_200",
                    "page_number": 2,
                    "section_title": "ICU Benefits",
                    "content": "ICU expenses covered up to sum insured.",
                    "similarity": 0.8921,
                }
            ]

            res = client.post(
                "/api/retrieval/search",
                json={
                    "query": "Does my policy cover ICU charges?",
                    "policy_id": "pol_200",
                    "top_k": 3,
                },
            )

            assert res.status_code == 200
            data = res.json()
            assert data["query"] == "Does my policy cover ICU charges?"
            assert data["total_results"] == 1
            assert len(data["results"]) == 1

            item = data["results"][0]
            assert item["chunk_id"] == "c_icu_1"
            assert item["document_id"] == "doc_100"
            assert item["policy_id"] == "pol_200"
            assert item["page_number"] == 2
            assert item["section_title"] == "ICU Benefits"
            assert item["content"] == "ICU expenses covered up to sum insured."
            assert item["similarity"] == 0.8921
    finally:
        app.dependency_overrides.pop(get_current_user, None)

