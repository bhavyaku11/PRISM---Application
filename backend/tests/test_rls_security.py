from unittest.mock import MagicMock, patch, call
import pytest
from app.services.documents.processor import (
    DocumentProcessor,
    DocumentNotFoundError,
    DocumentProcessingError,
)
from app.services.documents.chunker import DocumentChunk
from app.services.documents.section_detector import DetectedSection
from tests.test_document_processing import create_in_memory_pdf


def test_processor_uses_user_token_and_db_client():
    """Verify DocumentProcessor routes all DB writes through the user-authenticated client with Bearer token."""
    user_jwt = "header.payload.signature"
    processor = DocumentProcessor(user_id="user_alice_123", user_token=user_jwt)

    # Client must be user client, and db_client must resolve to client (not unauthenticated admin)
    assert processor.user_token == user_jwt
    assert processor.user_id == "user_alice_123"
    assert processor.db_client == processor.client


def test_chunk_persistence_strictly_enforces_user_id():
    """Verify every chunk row inserted into document_chunks carries user_id == authenticated_user_id."""
    processor = DocumentProcessor(user_id="user_alice_123", user_token="jwt_alice")

    mock_db = MagicMock()
    mock_table = MagicMock()
    mock_db.table.return_value = mock_table
    processor.client = mock_db

    chunks = [
        DocumentChunk(
            chunk_index=0,
            content="Coverage: Inpatient hospitalization is covered.",
            page_number=1,
            section_title="Coverage",
            token_count=10,
            metadata={"test": 1},
            embedding=[0.05] * 384,
        ),
        DocumentChunk(
            chunk_index=1,
            content="Exclusions: Cosmetic treatments are excluded.",
            page_number=2,
            section_title="Exclusions",
            token_count=10,
            metadata={"test": 2},
            embedding=[0.02] * 384,
        ),
    ]

    section_id_map = {"Coverage": "sec_cov_1", "Exclusions": "sec_ex_2"}

    processor._persist_chunks(
        document_id="doc_xyz_456",
        policy_id="pol_xyz_789",
        chunks=chunks,
        section_id_map=section_id_map,
    )

    # Verify insert was called on document_chunks
    mock_db.table.assert_called_with("document_chunks")
    inserted_batch = mock_table.insert.call_args[0][0]

    assert len(inserted_batch) == 2
    for chunk_row in inserted_batch:
        # Mandatory invariant: user_id must match authenticated user
        assert chunk_row["user_id"] == "user_alice_123"
        assert chunk_row["document_id"] == "doc_xyz_456"
        assert chunk_row["policy_id"] == "pol_xyz_789"
        assert chunk_row["content"] is not None
        assert chunk_row["page_number"] in [1, 2]
        assert len(chunk_row["embedding"]) == 384


def test_section_persistence_strictly_enforces_user_id():
    """Verify every section row inserted into policy_sections carries user_id == authenticated_user_id."""
    processor = DocumentProcessor(user_id="user_alice_123", user_token="jwt_alice")

    mock_db = MagicMock()
    mock_table = MagicMock()
    mock_db.table.return_value = mock_table
    mock_table.insert.return_value.execute.return_value = MagicMock(
        data=[{"id": "sec_1", "title": "Coverage"}]
    )
    processor.client = mock_db

    sections = [
        DetectedSection(
            title="Coverage",
            section_type="coverage",
            page_start=1,
            page_end=3,
            content="Section content",
            confidence=0.95,
        )
    ]

    processor._persist_sections(
        document_id="doc_xyz_456",
        policy_id="pol_xyz_789",
        sections=sections,
    )

    mock_db.table.assert_called_with("policy_sections")
    inserted_sections = mock_table.insert.call_args[0][0]
    assert len(inserted_sections) == 1
    assert inserted_sections[0]["user_id"] == "user_alice_123"
    assert inserted_sections[0]["policy_id"] == "pol_xyz_789"
    assert inserted_sections[0]["document_id"] == "doc_xyz_456"


def test_user_cannot_access_or_process_another_users_document():
    """Verify User A cannot access or process User B's document (cross-user isolation)."""
    processor_alice = DocumentProcessor(user_id="user_alice", user_token="jwt_alice")

    # Mock query returning no rows (as Supabase RLS does when query user_id != auth.uid())
    mock_db = MagicMock()
    mock_query = MagicMock()
    mock_query.select.return_value = mock_query
    mock_query.eq.return_value = mock_query
    mock_query.execute.return_value = MagicMock(data=[])
    mock_db.from_.return_value = mock_query
    processor_alice.client = mock_db

    with pytest.raises(DocumentNotFoundError):
        processor_alice.get_document_for_processing("doc_owned_by_bob")


def test_reprocessing_idempotently_cleans_up_prior_records():
    """Verify reprocessing safely removes existing chunks & sections scoped to user before inserting new ones."""
    processor = DocumentProcessor(user_id="user_alice_123", user_token="jwt_alice")

    mock_db = MagicMock()
    mock_chunks_delete = MagicMock()
    mock_sections_delete = MagicMock()

    def mock_table(name):
        tbl = MagicMock()
        if name == "document_chunks":
            tbl.delete.return_value.eq.return_value.eq.return_value = mock_chunks_delete
        elif name == "policy_sections":
            tbl.delete.return_value.eq.return_value.eq.return_value = mock_sections_delete
        return tbl

    mock_db.table.side_effect = mock_table
    processor.client = mock_db

    processor._cleanup_existing_records("doc_xyz_456")

    # Verify document_chunks and policy_sections were deleted with document_id and user_id filters
    mock_chunks_delete.execute.assert_called_once()
    mock_sections_delete.execute.assert_called_once()


def test_retry_processing_flow_complete():
    """Verify the complete processing retry flow executes cleanup, extraction, and persistence."""
    processor = DocumentProcessor(user_id="user_alice_123", user_token="jwt_alice")

    pdf_bytes = create_in_memory_pdf([
        "Coverage\nHospitalization covered up to ₹5,00,000.",
        "Exclusions\nPre-existing conditions excluded for 36 months.",
    ])

    doc_record = {
        "id": "doc_retry_1",
        "user_id": "user_alice_123",
        "policy_id": "pol_retry_1",
        "document_name": "HealthShield.pdf",
        "storage_path": "user_alice_123/pol_retry_1/HealthShield.pdf",
        "mime_type": "application/pdf",
        "file_size": len(pdf_bytes),
        "processing_status": "failed",
        "metadata": {},
    }

    mock_db = MagicMock()
    processor.client = mock_db

    with patch.object(processor, "get_document_for_processing", return_value=doc_record), \
         patch.object(processor, "download_pdf_bytes", return_value=pdf_bytes), \
         patch.object(processor, "set_status_processing") as mock_set_processing, \
         patch.object(processor, "_cleanup_existing_records") as mock_cleanup, \
         patch.object(processor, "_persist_sections", return_value={"Coverage": "s1", "Exclusions": "s2"}) as mock_sections, \
         patch.object(processor, "_persist_chunks") as mock_chunks:

        result = processor.process("doc_retry_1")

        assert result["status"] == "processed"
        assert result["page_count"] == 2
        assert result["chunks_created"] >= 2
        assert result["sections_detected"] >= 2

        # 1. Status marked as processing
        mock_set_processing.assert_called_once_with("doc_retry_1", "pol_retry_1")
        # 2. Pre-existing partial chunks/sections deleted before re-insert
        mock_cleanup.assert_called_once_with("doc_retry_1")
        # 3. New sections and chunks persisted
        mock_sections.assert_called_once()
        mock_chunks.assert_called_once()


def test_cleanup_scoped_to_authenticated_user():
    """Verify cleanup query strictly includes .eq('user_id', self.user_id) preventing cross-user deletion."""
    processor = DocumentProcessor(user_id="user_alice", user_token="jwt_alice")

    mock_db = MagicMock()
    mock_chunks_delete = MagicMock()
    mock_sections_delete = MagicMock()

    mock_chunks_eq_doc = MagicMock()
    mock_chunks_eq_doc.eq.return_value = mock_chunks_delete
    mock_chunks_table = MagicMock()
    mock_chunks_table.delete.return_value.eq.return_value = mock_chunks_eq_doc

    mock_sections_eq_doc = MagicMock()
    mock_sections_eq_doc.eq.return_value = mock_sections_delete
    mock_sections_table = MagicMock()
    mock_sections_table.delete.return_value.eq.return_value = mock_sections_eq_doc

    def mock_table(tbl):
        return mock_chunks_table if tbl == "document_chunks" else mock_sections_table

    mock_db.table.side_effect = mock_table
    processor.client = mock_db

    processor._cleanup_existing_records("doc_target_123")

    # Verify that .eq("user_id", "user_alice") was chained on both deletes
    mock_chunks_eq_doc.eq.assert_called_with("user_id", "user_alice")
    mock_sections_eq_doc.eq.assert_called_with("user_id", "user_alice")


def test_real_user_pdf_processing_full_schema_verification():
    """Verify processing the actual user-uploaded health insurance PDF populates all required chunk fields."""
    import os
    pdf_path = "/Users/bhavyakumar/.gemini/antigravity-ide/brain/b622556a-a0e1-4899-9d47-e0e15be32c37/.user_uploaded/media_1789217995225.pdf"
    if not os.path.exists(pdf_path):
        pytest.skip("User-uploaded PDF not present in environment.")

    with open(pdf_path, "rb") as f:
        pdf_bytes = f.read()

    processor = DocumentProcessor(user_id="user_prod_tester", user_token="jwt_prod_tester")

    doc_record = {
        "id": "doc_user_real",
        "user_id": "user_prod_tester",
        "policy_id": "pol_user_real",
        "document_name": "HealthInsurance.pdf",
        "storage_path": "user_prod_tester/pol_user_real/HealthInsurance.pdf",
        "mime_type": "application/pdf",
        "file_size": len(pdf_bytes),
        "processing_status": "pending",
        "metadata": {},
    }

    mock_db = MagicMock()
    mock_table = MagicMock()
    mock_table.insert.return_value.execute.return_value = MagicMock(data=[{"id": "sec_id_1", "title": "General Policy Information"}])
    mock_table.update.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(data=[])
    mock_table.delete.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(data=[])
    mock_db.table.return_value = mock_table
    processor.client = mock_db

    with patch.object(processor, "get_document_for_processing", return_value=doc_record), \
         patch.object(processor, "download_pdf_bytes", return_value=pdf_bytes):

        result = processor.process("doc_user_real")

        assert result["status"] == "processed"
        assert result["page_count"] == 10
        assert result["chunks_created"] == 10

        # Inspect all calls to table("document_chunks").insert()
        chunk_insert_calls = [
            c for c in mock_table.insert.call_args_list
            if isinstance(c[0][0], list) and len(c[0][0]) > 0 and "chunk_index" in c[0][0][0]
        ]
        assert len(chunk_insert_calls) > 0

        all_inserted_chunks = []
        for call in chunk_insert_calls:
            all_inserted_chunks.extend(call[0][0])

        assert len(all_inserted_chunks) == 10

        for idx, chunk in enumerate(all_inserted_chunks):
            assert chunk["user_id"] == "user_prod_tester"
            assert chunk["document_id"] == "doc_user_real"
            assert chunk["policy_id"] == "pol_user_real"
            assert chunk["chunk_index"] == idx
            assert chunk["page_number"] == idx + 1
            assert chunk["section_title"] is not None
            assert len(chunk["content"].strip()) > 0
            assert chunk["embedding"] is not None
            assert len(chunk["embedding"]) == 384

