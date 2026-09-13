import logging
import re
from typing import List, Optional, Dict, Any
from dataclasses import dataclass, field
from app.services.documents.extractor import ExtractedPage
from app.services.documents.section_detector import DetectedSection

logger = logging.getLogger("prism.chunker")


@dataclass
class DocumentChunk:
    """Represents a page-aware chunk of text suitable for evidence retrieval."""
    chunk_index: int
    content: str
    page_number: int  # 1-based page number
    section_title: Optional[str] = None
    section_type: Optional[str] = None
    section_id: Optional[str] = None
    token_count: int = 0
    embedding: Optional[List[float]] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


def split_text_into_paragraphs(text: str) -> List[str]:
    """Split text into paragraph units preserving coherence."""
    paragraphs = re.split(r"\n\s*\n", text)
    return [p.strip() for p in paragraphs if p.strip()]


def split_dense_text(
    text: str,
    target_words: int = 600,
    overlap_words: int = 70,
) -> List[str]:
    """Split a dense text into coherent chunks of approximately target_words.
    
    Splits on paragraph or sentence boundaries with overlapping words to prevent losing context.
    """
    paragraphs = split_text_into_paragraphs(text)
    if not paragraphs:
        return [text] if text.strip() else []

    # If any paragraph is larger than target_words, split it by sentence boundaries
    units: List[str] = []
    for p in paragraphs:
        if len(p.split()) > target_words:
            sentences = re.split(r"(?<=[.!?])\s+", p)
            units.extend([s.strip() for s in sentences if s.strip()])
        else:
            units.append(p)

    chunks: List[str] = []
    current_units: List[str] = []
    current_word_count = 0

    for unit in units:
        unit_words = len(unit.split())

        # If adding this unit exceeds target words and we already have accumulated content
        if current_word_count + unit_words > target_words and current_units:
            separator = "\n\n" if "\n" in current_units[0] else " "
            chunks.append(separator.join(current_units))

            # Build overlap from the end of the previous chunk
            overlap_units: List[str] = []
            overlap_count = 0
            for prev_u in reversed(current_units):
                u_len = len(prev_u.split())
                overlap_units.insert(0, prev_u)
                overlap_count += u_len
                if overlap_count >= overlap_words:
                    break

            current_units = list(overlap_units)
            current_word_count = sum(len(u.split()) for u in current_units)

        current_units.append(unit)
        current_word_count += unit_words

    if current_units:
        separator = "\n\n" if "\n" in current_units[0] else " "
        chunks.append(separator.join(current_units))

    return chunks


def find_matching_section(
    page_number: int,
    chunk_content: str,
    sections: List[DetectedSection],
) -> tuple[Optional[str], Optional[str]]:
    """Find the best-fitting detected section for this page and chunk content."""
    # First, search for sections that explicitly cover this page
    candidates = [
        s for s in sections
        if s.page_start <= page_number <= s.page_end
    ]

    if not candidates:
        return None, None

    if len(candidates) == 1:
        return candidates[0].title, candidates[0].section_type

    # If multiple sections span this page, check if any section title is present in the chunk
    for s in candidates:
        if s.title.lower() in chunk_content.lower():
            return s.title, s.section_type

    # Default to the most specific candidate or first
    return candidates[0].title, candidates[0].section_type


def create_page_aware_chunks(
    pages: List[ExtractedPage],
    sections: List[DetectedSection],
    target_words: int = 700,
    overlap_words: int = 80,
) -> List[DocumentChunk]:
    """Generate page-aware chunks from extracted pages and detected sections.
    
    Guarantees:
    - Never destroys page boundaries.
    - Page numbering is 1-based.
    - Chunks are ~500–1000 words.
    - Preserves section title and section type associations.
    """
    chunks: List[DocumentChunk] = []
    chunk_idx = 0

    for page in pages:
        if not page.has_text or not page.text.strip():
            continue

        page_words = page.word_count

        # Case 1: Page word count is within normal single chunk bounds (up to ~850 words)
        if page_words <= 850:
            sec_title, sec_type = find_matching_section(page.page_number, page.text, sections)
            chunks.append(
                DocumentChunk(
                    chunk_index=chunk_idx,
                    content=page.text,
                    page_number=page.page_number,
                    section_title=sec_title,
                    section_type=sec_type,
                    token_count=int(page_words * 1.3),  # Approximate BPE tokens
                    metadata={
                        "page_start": page.page_number,
                        "page_end": page.page_number,
                        "source": "policy-document",
                        "extraction_method": "pymupdf",
                        "word_count": page_words,
                    },
                )
            )
            chunk_idx += 1
        else:
            # Case 2: Dense page (>850 words) -> split into overlapping sub-chunks within this page
            sub_chunks = split_dense_text(
                page.text,
                target_words=target_words,
                overlap_words=overlap_words,
            )
            for sub_text in sub_chunks:
                sub_words = len(sub_text.split())
                sec_title, sec_type = find_matching_section(page.page_number, sub_text, sections)
                chunks.append(
                    DocumentChunk(
                        chunk_index=chunk_idx,
                        content=sub_text,
                        page_number=page.page_number,
                        section_title=sec_title,
                        section_type=sec_type,
                        token_count=int(sub_words * 1.3),
                        metadata={
                            "page_start": page.page_number,
                            "page_end": page.page_number,
                            "source": "policy-document",
                            "extraction_method": "pymupdf",
                            "word_count": sub_words,
                        },
                    )
                )
                chunk_idx += 1

    return chunks
