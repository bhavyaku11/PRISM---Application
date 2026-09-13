import logging
import re
from typing import List, Optional
from dataclasses import dataclass, field
import fitz  # PyMuPDF

logger = logging.getLogger("prism.extractor")


@dataclass
class ExtractedPage:
    """Represents text and metadata extracted from a single PDF page."""
    page_number: int  # Strictly 1-based (Page 1, 2, ...)
    text: str
    has_text: bool
    word_count: int
    char_count: int


@dataclass
class ExtractedDocument:
    """Represents the complete extracted document content and page breakdown."""
    page_count: int
    pages: List[ExtractedPage] = field(default_factory=list)
    pages_with_text: int = 0
    pages_without_text: int = 0
    full_text: str = ""


class PDFExtractionError(Exception):
    """Raised when PDF extraction or parsing fails."""
    pass


def clean_page_text(raw_text: str) -> str:
    """Perform conservative text cleaning on extracted page text.
    
    Allowed:
    - Normalizes excessive horizontal whitespace.
    - Normalizes multiple consecutive blank lines.
    - Rejoins words hyphenated across line breaks.
    - Strips non-printable control characters.
    
    Prohibited:
    - No summarization, paraphrasing, or rewriting of policy wording.
    """
    if not raw_text:
        return ""

    # Remove non-printable control characters while preserving newline & tab
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", raw_text)

    # Rejoin words split by a hyphen at end of line: e.g. "hospi-\ntal" -> "hospital"
    text = re.sub(r"(\b[a-zA-Z]{2,})-\n\s*([a-zA-Z]{2,}\b)", r"\1\2", text)

    # Normalize horizontal spaces and tabs per line
    lines: List[str] = []
    for line in text.splitlines():
        cleaned_line = re.sub(r"[ \t]+", " ", line).strip()
        lines.append(cleaned_line)

    cleaned_text = "\n".join(lines)

    # Normalize excessive vertical spacing (max 2 consecutive newlines)
    cleaned_text = re.sub(r"\n{3,}", "\n\n", cleaned_text)

    return cleaned_text.strip()


def extract_pdf_pages(pdf_bytes: bytes) -> ExtractedDocument:
    """Extract page-aware text from PDF bytes using PyMuPDF (fitz).
    
    Args:
        pdf_bytes: Raw bytes of the uploaded PDF file.
        
    Returns:
        ExtractedDocument with page-by-page text, 1-based numbering, and statistics.
        
    Raises:
        PDFExtractionError: If bytes are not a valid PDF or document cannot be parsed.
    """
    if not pdf_bytes or len(pdf_bytes) < 10:
        raise PDFExtractionError("The provided file is empty or too small to be a valid PDF.")

    # Validate PDF signature header
    if not pdf_bytes.startswith(b"%PDF-"):
        raise PDFExtractionError("Uploaded file does not have a valid PDF header signature.")

    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    except Exception as exc:
        logger.error("PyMuPDF failed to open document: %s", exc)
        raise PDFExtractionError(f"Uploaded file could not be read as a valid PDF: {exc}") from exc

    try:
        page_count = len(doc)
        if page_count == 0:
            raise PDFExtractionError("The PDF document contains 0 pages.")

        from app.core.config import settings
        if page_count > settings.MAX_PDF_PAGES:
            raise PDFExtractionError(
                f"PDF exceeds the maximum allowed limit of {settings.MAX_PDF_PAGES} pages (found {page_count} pages)."
            )

        pages: List[ExtractedPage] = []
        pages_with_text = 0
        pages_without_text = 0
        full_text_parts: List[str] = []

        for page_idx in range(page_count):
            # 1-based page numbering (Page 1, 2, 3...)
            page_num = page_idx + 1

            try:
                page = doc[page_idx]
                raw_text = page.get_text("text") or ""
            except Exception as page_exc:
                logger.warning("Error reading page %d: %s", page_num, page_exc)
                raw_text = ""

            cleaned = clean_page_text(raw_text)
            words = cleaned.split()
            word_count = len(words)
            char_count = len(cleaned)
            has_text = word_count >= 3  # Minimum 3 words to consider meaningful text

            if has_text:
                pages_with_text += 1
                full_text_parts.append(f"--- Page {page_num} ---\n{cleaned}")
            else:
                pages_without_text += 1
                full_text_parts.append(f"--- Page {page_num} (No extractable text) ---")

            pages.append(
                ExtractedPage(
                    page_number=page_num,
                    text=cleaned,
                    has_text=has_text,
                    word_count=word_count,
                    char_count=char_count,
                )
            )

        full_extracted_text = "\n\n".join(full_text_parts)

        return ExtractedDocument(
            page_count=page_count,
            pages=pages,
            pages_with_text=pages_with_text,
            pages_without_text=pages_without_text,
            full_text=full_extracted_text,
        )

    finally:
        try:
            doc.close()
        except Exception:
            pass
