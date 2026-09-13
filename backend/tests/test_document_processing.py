import pytest
import fitz  # PyMuPDF
from fastapi.testclient import TestClient

from app.main import app
from app.services.documents.extractor import (
    extract_pdf_pages,
    clean_page_text,
    PDFExtractionError,
)
from app.services.documents.section_detector import (
    detect_sections,
    classify_heading_line,
)
from app.services.documents.chunker import (
    create_page_aware_chunks,
    split_dense_text,
)


def create_in_memory_pdf(pages_content: list[str]) -> bytes:
    """Helper to construct an in-memory PDF with specified text on each page."""
    doc = fitz.open()
    for text in pages_content:
        page = doc.new_page()
        if text.strip():
            # Use insert_textbox with small font to allow large dense text to fit on canvas
            page.insert_textbox(fitz.Rect(20, 20, 580, 800), text, fontsize=6)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


# ============================================================
# TEST 1 & 2: Valid text-based PDF & Multi-page page numbers
# ============================================================

def test_extract_valid_multipage_pdf():
    """Verify multi-page PDF extracts text with strictly 1-based page numbers."""
    page_texts = [
        "This is the first page of the policy schedule. It details the policyholder name and policy period.",
        "This is the second page. It contains standard terms and conditions for medical coverage.",
        "This is the third page. Inclusions and benefits are outlined here in full detail.",
    ]
    pdf_bytes = create_in_memory_pdf(page_texts)

    extracted = extract_pdf_pages(pdf_bytes)

    assert extracted.page_count == 3
    assert extracted.pages_with_text == 3
    assert extracted.pages_without_text == 0
    assert len(extracted.pages) == 3

    # Check 1-based page numbering
    for idx, p in enumerate(extracted.pages):
        assert p.page_number == idx + 1
        assert p.has_text is True
        assert p.word_count > 5
        assert p.char_count > 20

    assert "first page" in extracted.pages[0].text
    assert "second page" in extracted.pages[1].text
    assert "third page" in extracted.pages[2].text
    assert "--- Page 1 ---" in extracted.full_text
    assert "--- Page 2 ---" in extracted.full_text
    assert "--- Page 3 ---" in extracted.full_text


# ============================================================
# TEST 3: Basic section detection with headings
# ============================================================

def test_section_detector_identifies_headings():
    """Verify deterministic section classification for standard insurance headings."""
    assert classify_heading_line("Section 1: Coverage and Benefits")[0] == "coverage"
    assert classify_heading_line("What is Covered under this Policy")[0] == "coverage"
    assert classify_heading_line("General Exclusions")[0] == "exclusions"
    assert classify_heading_line("What is Not Covered")[0] == "exclusions"
    assert classify_heading_line("Waiting Periods Clause")[0] == "waiting_period"
    assert classify_heading_line("Specific Illness Waiting Period")[0] == "waiting_period"
    assert classify_heading_line("Co-payment")[0] == "copayment"
    assert classify_heading_line("Compulsory Deductible")[0] == "deductible"
    assert classify_heading_line("Room Rent Sub-limits")[0] == "limits"
    assert classify_heading_line("Claims Procedure & Cashless Process")[0] == "claims"
    assert classify_heading_line("General Conditions")[0] == "conditions"
    # Ambiguous or non-heading text
    assert classify_heading_line("The patient was admitted to hospital on Monday morning.") is None


def test_section_detection_on_pages():
    """Verify section detector builds sections across extracted pages."""
    p1_text = "General Policy Information\nThis document describes your health insurance cover."
    p2_text = "What is Covered\nInpatient hospitalization expenses are covered up to sum insured."
    p3_text = "Exclusions\nCosmetic surgery, dental treatments, and self-inflicted injuries are excluded."

    pdf_bytes = create_in_memory_pdf([p1_text, p2_text, p3_text])
    extracted = extract_pdf_pages(pdf_bytes)
    sections = detect_sections(extracted.pages)

    assert len(sections) >= 2
    section_types = [s.section_type for s in sections]
    assert "coverage" in section_types
    assert "exclusions" in section_types

    coverage_sec = next(s for s in sections if s.section_type == "coverage")
    assert coverage_sec.confidence == 0.85
    assert coverage_sec.page_start <= coverage_sec.page_end


# ============================================================
# TEST 4: Page with no extractable text (image / scanned)
# ============================================================

def test_pdf_with_empty_page_continues():
    """Verify empty/scanned pages do not crash processing and are recorded in metadata."""
    # Page 1 has text, Page 2 is blank, Page 3 has text
    page_texts = [
        "Welcome to PRISM. This is an introductory policy overview.",
        "",  # Blank / scanned page with no text
        "Coverage Details. Pre and post hospitalization medical expenses are covered.",
    ]
    pdf_bytes = create_in_memory_pdf(page_texts)

    extracted = extract_pdf_pages(pdf_bytes)

    assert extracted.page_count == 3
    assert extracted.pages_with_text == 2
    assert extracted.pages_without_text == 1
    assert extracted.pages[1].has_text is False
    assert extracted.pages[1].page_number == 2

    # Chunker should only create chunks for pages with text
    sections = detect_sections(extracted.pages)
    chunks = create_page_aware_chunks(extracted.pages, sections)

    assert len(chunks) == 2
    chunk_pages = [c.page_number for c in chunks]
    assert 2 not in chunk_pages  # Blank page has no chunk
    assert 1 in chunk_pages
    assert 3 in chunk_pages


# ============================================================
# TEST 5: Invalid file handling
# ============================================================

def test_invalid_file_fails_safely():
    """Verify corrupt or non-PDF bytes raise PDFExtractionError safely."""
    with pytest.raises(PDFExtractionError) as exc_info:
        extract_pdf_pages(b"NOT A VALID PDF FILE AT ALL")
    assert "valid PDF" in str(exc_info.value)

    with pytest.raises(PDFExtractionError):
        extract_pdf_pages(b"")


# ============================================================
# TEST 6: Text cleaning conservative behavior
# ============================================================

def test_text_cleaning():
    """Verify whitespace normalization and hyphenation rejoining without rewording."""
    dirty = "Inpatient    hospi-\ntalization is covered   with  no  capping.\n\n\n\nTerms apply."
    cleaned = clean_page_text(dirty)

    assert "Inpatient hospitalization is covered with no capping." in cleaned
    assert "Terms apply." in cleaned
    assert "\n\n\n" not in cleaned


# ============================================================
# TEST 7: Chunking preserves page numbers and limits
# ============================================================

def test_chunking_dense_page():
    """Verify dense pages are split into overlapping chunks while retaining page number."""
    # Create ~1200 words on a single page
    long_text = " ".join(["Hospitalization benefits clause paragraph."] * 240)
    pdf_bytes = create_in_memory_pdf([long_text])

    extracted = extract_pdf_pages(pdf_bytes)
    sections = detect_sections(extracted.pages)
    chunks = create_page_aware_chunks(extracted.pages, sections, target_words=500, overlap_words=50)

    assert len(chunks) > 1
    for c in chunks:
        assert c.page_number == 1  # Page boundary strictly maintained
        assert c.token_count > 0
        assert c.metadata["page_start"] == 1
        assert c.metadata["page_end"] == 1
        assert c.metadata["extraction_method"] == "pymupdf"


# ============================================================
# TEST 8: API Route authentication requirement
# ============================================================

def test_process_document_requires_auth():
    """Verify unauthorized requests to POST /api/documents/{id}/process return 401."""
    client = TestClient(app)
    response = client.post("/api/documents/doc-123-abc/process")
    assert response.status_code == 401
    assert "token is required" in response.json()["detail"].lower()


def test_get_document_status_requires_auth():
    """Verify unauthorized requests to GET /api/documents/{id}/status return 401."""
    client = TestClient(app)
    response = client.get("/api/documents/doc-123-abc/status")
    assert response.status_code == 401
