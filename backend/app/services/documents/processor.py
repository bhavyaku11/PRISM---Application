import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from app.core.config import settings
from app.core.supabase import get_supabase_client, get_admin_supabase_client
from app.services.documents.extractor import (
    extract_pdf_pages,
    PDFExtractionError,
    ExtractedDocument,
)
from app.services.documents.section_detector import detect_sections, DetectedSection
from app.services.documents.chunker import create_page_aware_chunks, DocumentChunk
from app.services.embeddings import get_embedding_provider

logger = logging.getLogger("prism.processor")


class DocumentNotFoundError(Exception):
    """Raised when a document is not found or does not belong to the user."""
    pass


class DocumentProcessingError(Exception):
    """Raised when an error occurs during document processing."""
    pass


class DocumentProcessor:
    """Orchestrates secure download, validation, extraction, section detection,

    chunking, and database persistence for policy documents.
    """

    def __init__(self, user_id: str, user_token: Optional[str] = None):
        self.user_id = user_id
        self.user_token = user_token
        # Primary user-scoped client carrying Bearer JWT for strict RLS compliance
        self.client = get_supabase_client(token=user_token)
        self.admin_client = get_admin_supabase_client()

    @property
    def db_client(self):
        """Return the user-authenticated client for RLS operations, or service-role client if configured."""
        if self.user_token:
            return self.client
        if settings.SUPABASE_SERVICE_ROLE_KEY:
            return self.admin_client
        return self.client

    def get_document_for_processing(self, document_id: str) -> Dict[str, Any]:
        """Fetch and verify document ownership."""
        # Query document ensuring user ownership
        query = (
            self.client.from_("documents")
            .select("id, user_id, policy_id, document_name, storage_path, mime_type, file_size, processing_status, metadata")
            .eq("id", document_id)
            .eq("user_id", self.user_id)
        )
        res = query.execute()

        if not res.data or len(res.data) == 0:
            logger.warning(
                "Document %s not found or unauthorized for user %s",
                document_id,
                self.user_id,
            )
            raise DocumentNotFoundError("Document not found or access unauthorized.")

        return res.data[0]

    def download_pdf_bytes(self, storage_path: str) -> bytes:
        """Download document bytes from the private Supabase Storage bucket."""
        bucket_name = settings.STORAGE_BUCKET_NAME
        logger.info("Downloading file from storage bucket '%s': %s", bucket_name, storage_path)

        try:
            # Download using user-authenticated client for RLS-compliant storage access
            storage_bucket = self.client.storage.from_(bucket_name)
            pdf_bytes = storage_bucket.download(storage_path)
            if (not pdf_bytes or len(pdf_bytes) == 0) and settings.SUPABASE_SERVICE_ROLE_KEY:
                logger.info("Retrying storage download with service-role admin client for %s", storage_path)
                pdf_bytes = self.admin_client.storage.from_(bucket_name).download(storage_path)
        except Exception as exc:
            logger.error("Failed to download PDF from storage: %s", exc)
            raise DocumentProcessingError(
                f"Could not retrieve document from secure storage: {exc}"
            ) from exc

        if not pdf_bytes:
            raise DocumentProcessingError("Downloaded document file is empty.")

        if len(pdf_bytes) > settings.MAX_PDF_SIZE_BYTES:
            max_mb = settings.MAX_PDF_SIZE_BYTES / (1024 * 1024)
            raise DocumentProcessingError(
                f"Document file size exceeds the maximum allowed limit of {max_mb:.0f} MB."
            )

        return pdf_bytes

    def set_status_processing(self, document_id: str, policy_id: Optional[str]) -> None:
        """Update document and policy status to 'processing'."""
        try:
            self.db_client.table("documents").update({
                "processing_status": "processing",
                "processing_error": None,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }).eq("id", document_id).eq("user_id", self.user_id).execute()

            if policy_id:
                self.db_client.table("policies").update({
                    "status": "processing",
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }).eq("id", policy_id).eq("user_id", self.user_id).execute()
        except Exception as exc:
            logger.warning("Failed to mark document as processing: %s", exc)

    def set_status_failed(self, document_id: str, error_message: str) -> None:
        """Update document status to 'failed' with safe error message."""
        try:
            safe_error = error_message[:500] if error_message else "Processing failed."
            self.db_client.table("documents").update({
                "processing_status": "failed",
                "processing_error": safe_error,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }).eq("id", document_id).eq("user_id", self.user_id).execute()
        except Exception as exc:
            logger.error("Failed to update document error status: %s", exc)

    def process(self, document_id: str) -> Dict[str, Any]:
        """Execute the end-to-end document processing pipeline.
        
        Returns:
            Dict containing processing metrics (pages, chunks, sections, status).
        """
        # 1. Verify existence & ownership
        doc_record = self.get_document_for_processing(document_id)
        policy_id = doc_record.get("policy_id")
        storage_path = doc_record.get("storage_path")

        if not storage_path:
            self.set_status_failed(document_id, "Document storage path is missing.")
            raise DocumentProcessingError("Document storage path is missing.")

        # 2. Transition status to 'processing'
        self.set_status_processing(document_id, policy_id)

        try:
            # 3. Download PDF bytes from private storage
            pdf_bytes = self.download_pdf_bytes(storage_path)

            # 4. PyMuPDF page-aware extraction
            extracted = extract_pdf_pages(pdf_bytes)
            logger.info(
                "Document %s: extracted %d pages (%d with text, %d without text)",
                document_id,
                extracted.page_count,
                extracted.pages_with_text,
                extracted.pages_without_text,
            )

            # 5. Deterministic section detection
            detected_sections = detect_sections(extracted.pages)
            logger.info(
                "Document %s: detected %d sections",
                document_id,
                len(detected_sections),
            )

            # 6. Page-aware chunking
            chunks = create_page_aware_chunks(
                pages=extracted.pages,
                sections=detected_sections,
                target_words=settings.CHUNK_TARGET_WORDS,
                overlap_words=settings.CHUNK_OVERLAP_WORDS,
            )
            logger.info(
                "Document %s: generated %d page-aware chunks",
                document_id,
                len(chunks),
            )

            # 6.5 Generate dense vector embeddings for valid chunks (Step 9)
            embedding_provider = get_embedding_provider()
            if chunks:
                try:
                    chunk_texts = [c.content for c in chunks]
                    embeddings = embedding_provider.embed_texts(chunk_texts)
                    for c, emb in zip(chunks, embeddings):
                        c.embedding = emb
                    logger.info(
                        "Document %s: successfully generated %d embeddings (%d-dim)",
                        document_id,
                        len(embeddings),
                        embedding_provider.dimension,
                    )
                except Exception as emb_exc:
                    logger.warning(
                        "Embedding generation warning for document %s: %s",
                        document_id,
                        emb_exc,
                    )

            # 7. Idempotent persistence: safely delete existing chunks and sections
            self._cleanup_existing_records(document_id)

            # 8. Persist policy sections
            section_id_map = self._persist_sections(
                document_id=document_id,
                policy_id=policy_id,
                sections=detected_sections,
            )

            # 9. Persist document chunks (with embeddings)
            self._persist_chunks(
                document_id=document_id,
                policy_id=policy_id,
                chunks=chunks,
                section_id_map=section_id_map,
            )

            # 10. Update document record to 'processed'
            existing_meta = doc_record.get("metadata") or {}
            updated_meta = {
                **existing_meta,
                "page_count": extracted.page_count,
                "pages_with_text": extracted.pages_with_text,
                "pages_without_text": extracted.pages_without_text,
                "chunks_created": len(chunks),
                "sections_detected": len(detected_sections),
                "embeddings_generated": True,
                "embedding_model": embedding_provider.model_name,
                "embedding_dimension": embedding_provider.dimension,
                "processed_at": datetime.now(timezone.utc).isoformat(),
            }

            self.db_client.table("documents").update({
                "processing_status": "processed",
                "processing_error": None,
                "page_count": extracted.page_count,
                "extracted_text": extracted.full_text,
                "metadata": updated_meta,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }).eq("id", document_id).eq("user_id", self.user_id).execute()

            # 11. Update policy status to 'active'
            if policy_id:
                self.db_client.table("policies").update({
                    "status": "active",
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }).eq("id", policy_id).eq("user_id", self.user_id).execute()

            return {
                "document_id": document_id,
                "status": "processed",
                "page_count": extracted.page_count,
                "pages_with_text": extracted.pages_with_text,
                "pages_without_text": extracted.pages_without_text,
                "chunks_created": len(chunks),
                "sections_detected": len(detected_sections),
            }

        except PDFExtractionError as exc:
            logger.error("PDF Extraction error on document %s: %s", document_id, exc)
            err_msg = "Uploaded file could not be read as a valid PDF."
            self.set_status_failed(document_id, err_msg)
            raise DocumentProcessingError(err_msg) from exc

        except Exception as exc:
            logger.exception("Unexpected error processing document %s: %s", document_id, exc)
            err_msg = str(exc)
            self.set_status_failed(document_id, err_msg)
            raise DocumentProcessingError(f"Document processing failed: {err_msg}") from exc

    def _cleanup_existing_records(self, document_id: str) -> None:
        """Idempotently remove any prior chunks and sections for this document."""
        try:
            self.db_client.table("document_chunks").delete().eq("document_id", document_id).eq("user_id", self.user_id).execute()
            self.db_client.table("policy_sections").delete().eq("document_id", document_id).eq("user_id", self.user_id).execute()
            logger.info("Cleared pre-existing chunks and sections for document %s (user %s)", document_id, self.user_id)
        except Exception as exc:
            logger.warning("Error during record cleanup for document %s: %s", document_id, exc)

    def _persist_sections(
        self,
        document_id: str,
        policy_id: Optional[str],
        sections: List[DetectedSection],
    ) -> Dict[str, str]:
        """Insert detected sections into public.policy_sections and return title-to-id mapping."""
        if not sections or not policy_id:
            return {}

        section_rows = []
        for s in sections:
            section_rows.append({
                "user_id": self.user_id,
                "policy_id": policy_id,
                "document_id": document_id,
                "section_type": s.section_type,
                "title": s.title,
                "content": s.content,
                "page_start": s.page_start,
                "page_end": s.page_end,
                "confidence": s.confidence,
                "metadata": s.metadata,
            })

        try:
            res = self.db_client.table("policy_sections").insert(section_rows).execute()
            section_id_map: Dict[str, str] = {}
            if res.data:
                for row in res.data:
                    title = row.get("title")
                    row_id = row.get("id")
                    if title and row_id:
                        section_id_map[title] = row_id
            return section_id_map
        except Exception as exc:
            logger.error("Failed to insert policy_sections for document %s: %s", document_id, exc)
            raise DocumentProcessingError(f"Failed to persist policy sections: {exc}") from exc

    def _persist_chunks(
        self,
        document_id: str,
        policy_id: Optional[str],
        chunks: List[DocumentChunk],
        section_id_map: Dict[str, str],
    ) -> None:
        """Insert page-aware chunks into public.document_chunks."""
        if not chunks:
            return

        chunk_rows = []
        for c in chunks:
            sec_id = section_id_map.get(c.section_title) if c.section_title else None
            chunk_rows.append({
                "user_id": self.user_id,
                "document_id": document_id,
                "policy_id": policy_id,
                "section_id": sec_id,
                "chunk_index": c.chunk_index,
                "content": c.content,
                "page_number": c.page_number,
                "section_title": c.section_title,
                "token_count": c.token_count,
                "embedding": c.embedding,  # Fixed 384-dimensional vector
                "metadata": c.metadata,
            })

        # Batch insert in chunks of 50 to prevent payload size issues
        batch_size = 50
        for i in range(0, len(chunk_rows), batch_size):
            batch = chunk_rows[i : i + batch_size]
            try:
                self.db_client.table("document_chunks").insert(batch).execute()
            except Exception as exc:
                logger.error(
                    "Failed to insert chunk batch %d-%d for document %s: %s",
                    i,
                    i + len(batch),
                    document_id,
                    exc,
                )
                raise DocumentProcessingError(f"Failed to persist document chunks: {exc}") from exc
