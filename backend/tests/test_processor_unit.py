from unittest.mock import MagicMock, patch
import pytest

from app.services.documents.processor import (
    DocumentProcessor,
    DocumentNotFoundError,
    DocumentProcessingError,
)
from tests.test_document_processing import create_in_memory_pdf


def test_document_processor_ownership_rejection():
    """Verify DocumentProcessor raises DocumentNotFoundError if user does not own document."""
    processor = DocumentProcessor(user_id="user_alice", user_token="token_alice")
    
    # Mock client response returning empty data (as RLS would do when user does not own row)
    mock_query = MagicMock()
    mock_query.eq.return_value = mock_query
    mock_query.execute.return_value = MagicMock(data=[])
    
    mock_table = MagicMock()
    mock_table.select.return_value = mock_query
    with patch.object(processor.client, "from_", return_value=mock_table):
        with pytest.raises(DocumentNotFoundError):
            processor.get_document_for_processing("doc_of_bob")


def test_document_processor_idempotent_reprocessing():
    """Verify reprocessing a document cleans up old chunks and sections before inserting new ones."""
    processor = DocumentProcessor(user_id="user_123", user_token="token_123")

    pdf_bytes = create_in_memory_pdf([
        "Section: Coverage\nInpatient hospitalization is covered up to sum insured.",
        "Section: Exclusions\nCosmetic surgery is excluded.",
    ])

    doc_record = {
        "id": "doc_abc",
        "user_id": "user_123",
        "policy_id": "pol_xyz",
        "document_name": "TestPolicy.pdf",
        "storage_path": "user_123/pol_xyz/TestPolicy.pdf",
        "mime_type": "application/pdf",
        "file_size": len(pdf_bytes),
        "processing_status": "pending",
        "metadata": {},
    }

    # Mock DB operations
    mock_admin = MagicMock()
    processor.admin_client = mock_admin
    processor.client = MagicMock()

    with patch.object(processor, "get_document_for_processing", return_value=doc_record), \
         patch.object(processor, "download_pdf_bytes", return_value=pdf_bytes), \
         patch.object(processor, "set_status_processing") as mock_set_processing, \
         patch.object(processor, "_cleanup_existing_records") as mock_cleanup, \
         patch.object(processor, "_persist_sections", return_value={"Coverage": "sec_1", "Exclusions": "sec_2"}), \
         patch.object(processor, "_persist_chunks") as mock_persist_chunks:

        result = processor.process("doc_abc")

        assert result["status"] == "processed"
        assert result["page_count"] == 2
        assert result["pages_with_text"] == 2
        assert result["chunks_created"] >= 2
        assert result["sections_detected"] >= 2

        # Verify cleanup was called before inserting new records
        mock_cleanup.assert_called_once_with("doc_abc")
        # Verify chunks and sections were persisted
        mock_persist_chunks.assert_called_once()
        # Verify status transitioned to processing first
        mock_set_processing.assert_called_once_with("doc_abc", "pol_xyz")


def test_document_processor_failure_handling():
    """Verify processing failure sets document status to failed with safe error."""
    processor = DocumentProcessor(user_id="user_123", user_token="token_123")

    doc_record = {
        "id": "doc_fail",
        "user_id": "user_123",
        "policy_id": "pol_fail",
        "storage_path": "user_123/pol_fail/invalid.pdf",
    }

    with patch.object(processor, "get_document_for_processing", return_value=doc_record), \
         patch.object(processor, "download_pdf_bytes", return_value=b"NOT A VALID PDF"), \
         patch.object(processor, "set_status_processing"), \
         patch.object(processor, "set_status_failed") as mock_set_failed:

        with pytest.raises(DocumentProcessingError) as exc_info:
            processor.process("doc_fail")

        assert "could not be read as a valid PDF" in str(exc_info.value)
        mock_set_failed.assert_called_once()
