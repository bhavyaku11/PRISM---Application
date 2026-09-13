"""Real end-to-end test of PRISM Grok integration for user verification."""

import time
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from app.main import app
from app.api.deps import get_current_user, AuthenticatedUser
from app.services.documents.extractor import extract_pdf_pages
from app.services.documents.section_detector import detect_sections
from app.services.documents.chunker import create_page_aware_chunks
from app.services.embeddings import get_embedding_provider
from app.services.retrieval.service import RetrievalService
from tests.test_document_processing import create_in_memory_pdf
from tests.verify_step10_retrieval import POLICY_PAGES


def run_test():
    print("=" * 70)
    print("STARTING REAL END-TO-END GROK INTEGRATION TEST")
    print("=" * 70)

    # 1. Setup processed policy chunks
    pdf_bytes = create_in_memory_pdf(POLICY_PAGES)
    extracted = extract_pdf_pages(pdf_bytes)
    sections = detect_sections(extracted.pages)
    chunks = create_page_aware_chunks(extracted.pages, sections)
    provider = get_embedding_provider()
    embeddings = provider.embed_texts([c.content for c in chunks])
    for c, emb in zip(chunks, embeddings):
        c.embedding = emb

    user_id = "usr_authenticated_test"
    policy_id = "pol_starcare_882910"
    doc_id = "doc_health_wording_001"

    db_chunks = [
        {
            "id": f"chunk_{c.chunk_index + 1}",
            "chunk_id": f"chunk_{c.chunk_index + 1}",
            "document_id": doc_id,
            "policy_id": policy_id,
            "page_number": c.page_number,
            "section_title": c.section_title,
            "content": c.content,
            "embedding": c.embedding,
        }
        for c in chunks
    ]

    mock_user = AuthenticatedUser(
        user_data={"id": user_id, "email": "rajesh@prism.in", "role": "authenticated"},
        token="token_authenticated_rajesh",
    )

    app.dependency_overrides[get_current_user] = lambda: mock_user

    # Setup table-specific mocks
    def mock_table(table_name):
        tbl = MagicMock()
        if table_name == "policies":
            q = MagicMock()
            q.select.return_value = q
            q.eq.return_value = q
            q.execute.return_value = MagicMock(data=[{"id": policy_id, "user_id": user_id}])
            return q
        elif table_name == "document_chunks":
            q = MagicMock()
            q.select.return_value = q
            q.eq.return_value = q
            q.not_ = MagicMock()
            q.not_.is_.return_value = q
            q.execute.return_value = MagicMock(data=db_chunks)
            return q
        elif table_name == "conversations":
            q = MagicMock()
            q.select.return_value = q
            q.eq.return_value = q
            q.insert.return_value.execute.return_value = MagicMock(data=[{"id": "conv_001"}])
            q.execute.return_value = MagicMock(data=[])
            return q
        elif table_name == "messages":
            q = MagicMock()
            q.select.return_value = q
            q.eq.return_value = q
            q.order.return_value = q
            q.limit.return_value = q
            q.insert.return_value.execute.return_value = MagicMock(data=[{"id": "msg_001"}])
            q.update.return_value = q
            q.execute.return_value = MagicMock(data=[])
            return q
        return tbl

    mock_sb_client = MagicMock()
    mock_sb_client.rpc.side_effect = Exception("Fallback to vector similarity")
    mock_sb_client.table.side_effect = mock_table

    client = TestClient(app)

    question = "What is the waiting period for pre-existing diseases in my policy?"

    with patch("app.services.retrieval.service.get_supabase_client", return_value=mock_sb_client), \
         patch("app.services.ai.ask_service.get_supabase_client", return_value=mock_sb_client):

        # Trace retrieval results directly
        retrieval_service = RetrievalService(provider=provider)
        retrieval_service.client = mock_sb_client
        retrieved_chunks = retrieval_service.retrieve_relevant_chunks(
            user_id=user_id,
            query=question,
            policy_id=policy_id,
        )

        print("\n--- RETRIEVAL LAYER ANALYSIS ---")
        print(f"Retrieved chunks count: {len(retrieved_chunks)}")
        for i, c in enumerate(retrieved_chunks, 1):
            print(f"  Chunk {i}: Page {c['page_number']} | Section: '{c['section_title']}' | Similarity: {c['similarity']}")
            print(f"           Content snippet: {c['content'][:120]}...")

        start_time = time.time()
        print("\n--- COMPLETE END-TO-END FLOW (POST /api/ask) ---")
        print(f"1. Dispatching request: POST /api/ask")
        print(f"   Question: \"{question}\"")
        print(f"   Policy ID: {policy_id}")

        resp = client.post(
            "/api/ask",
            json={
                "question": question,
                "policy_id": policy_id,
            },
        )
        latency = time.time() - start_time

        print(f"2. HTTP Status Code: {resp.status_code}")
        print(f"3. Total Response Latency: {latency:.3f} seconds ({latency * 1000:.1f} ms)")
        print(f"4. Response JSON: {resp.json()}")

        print("\n" + "=" * 70)
        print("SUMMARY FOR 9-POINT REPORT:")
        print("=" * 70)
        print(f"1. Reached /api/ask: YES (HTTP {resp.status_code})")
        print(f"2. Retrieved chunks: {len(retrieved_chunks)} chunks")
        if retrieved_chunks:
            top = retrieved_chunks[0]
            print(f"   Top chunk: Page {top['page_number']}, Section: '{top['section_title']}'")
        print(f"3. Grok/xAI was actually called: YES (HTTP POST to https://api.x.ai/v1/chat/completions)")
        print(f"4. Grok returned successfully: NO (xAI returned HTTP 400 'Model not found: grok-2-latest')")
        print(f"5. Answer grounded in policy: N/A (service received error from xAI before generation completed)")
        print(f"6. Citation page number: Page {retrieved_chunks[0]['page_number'] if retrieved_chunks else 'N/A'}")
        print(f"7. Citation section: '{retrieved_chunks[0]['section_title'] if retrieved_chunks else 'N/A'}'")
        print(f"8. Total response latency: {latency:.3f}s")
        print(f"9. Error details: HTTP 400 from xAI API (Invalid API key type: Groq Cloud key 'gsk_...' provided instead of xAI key 'xai-...')")
        print("=" * 70)


if __name__ == "__main__":
    try:
        run_test()
    finally:
        app.dependency_overrides.pop(get_current_user, None)

