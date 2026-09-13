import logging
import re
from typing import List, Optional, Tuple, Dict, Any
from dataclasses import dataclass, field
from app.services.documents.extractor import ExtractedPage

logger = logging.getLogger("prism.section_detector")

# Deterministic heading patterns for insurance documents
SECTION_PATTERNS: List[Tuple[str, re.Pattern]] = [
    (
        "exclusions",
        re.compile(
            r"^(?:(?:section|part|clause|annexure)\s*[\dA-Z\.\-]*\s*[:\-–]?\s*)?"
            r"(?:what is not covered|exclusions|general exclusions|permanent exclusions|"
            r"specific exclusions|standard exclusions|non-covered items)\b",
            re.IGNORECASE,
        ),
    ),
    (
        "waiting_period",
        re.compile(
            r"^(?:(?:section|part|clause|annexure)\s*[\dA-Z\.\-]*\s*[:\-–]?\s*)?"
            r"(?:waiting periods?|initial waiting period|pre-existing (?:diseases?|conditions?)\s*waiting period|"
            r"specific (?:illness|disease)\s*waiting period|moratorium period)\b",
            re.IGNORECASE,
        ),
    ),
    (
        "copayment",
        re.compile(
            r"^(?:(?:section|part|clause|annexure)\s*[\dA-Z\.\-]*\s*[:\-–]?\s*)?"
            r"(?:co-?payments?|co-?pay(?:ment)? clause|mandatory co-?pay|voluntary co-?pay|cost sharing)\b",
            re.IGNORECASE,
        ),
    ),
    (
        "deductible",
        re.compile(
            r"^(?:(?:section|part|clause|annexure)\s*[\dA-Z\.\-]*\s*[:\-–]?\s*)?"
            r"(?:deductibles?|voluntary deductible|compulsory deductible|annual aggregate deductible)\b",
            re.IGNORECASE,
        ),
    ),
    (
        "limits",
        re.compile(
            r"^(?:(?:section|part|clause|annexure)\s*[\dA-Z\.\-]*\s*[:\-–]?\s*)?"
            r"(?:(?:room rent|icu|treatment|internal|hospitalization)\s*)?(?:sub-?limits?|capping|limits of (?:indemnity|coverage|liability)|room rent limit|icu limit)\b",
            re.IGNORECASE,
        ),
    ),
    (
        "claims",
        re.compile(
            r"^(?:(?:section|part|clause|annexure)\s*[\dA-Z\.\-]*\s*[:\-–]?\s*)?"
            r"(?:claims? procedure|claim process|how to (?:claim|file a claim)|claims? settlement|"
            r"cashless (?:facility|claim|process)|reimbursement (?:claim|procedure)|grievance redressal)\b",
            re.IGNORECASE,
        ),
    ),
    (
        "coverage",
        re.compile(
            r"^(?:(?:section|part|clause|annexure)\s*[\dA-Z\.\-]*\s*[:\-–]?\s*)?"
            r"(?:what is covered|benefits|coverage|scope of cover(?:age)?|base cover(?:age)?|"
            r"insured events|inpatient hospitalization|day care treatments?|pre and post hospitalization)\b",
            re.IGNORECASE,
        ),
    ),
    (
        "conditions",
        re.compile(
            r"^(?:(?:section|part|clause|annexure)\s*[\dA-Z\.\-]*\s*[:\-–]?\s*)?"
            r"(?:general conditions|standard terms and conditions|terms and conditions|"
            r"policy terms|duty of disclosure|cancellation|renewal terms|portability and migration)\b",
            re.IGNORECASE,
        ),
    ),
]


@dataclass
class DetectedSection:
    """Represents a classified policy section with page bounds."""
    section_type: str  # coverage, exclusions, waiting_period, copayment, deductible, limits, claims, conditions, general, other
    title: str
    content: str
    page_start: int
    page_end: int
    confidence: Optional[float] = 0.85
    metadata: Dict[str, Any] = field(default_factory=dict)


def classify_heading_line(line: str) -> Optional[Tuple[str, str]]:
    """Check if a line matches a known policy section heading.
    
    Returns (section_type, matched_title) or None.
    """
    clean_line = line.strip()
    if not clean_line or len(clean_line) > 100:
        return None

    # Check against known regex patterns
    for sec_type, pattern in SECTION_PATTERNS:
        if pattern.search(clean_line):
            return sec_type, clean_line

    return None


def detect_sections(pages: List[ExtractedPage]) -> List[DetectedSection]:
    """Perform deterministic section detection across extracted pages.
    
    If sections cannot be reliably identified, falls back conservatively to 'general'.
    Never invents sections or uses false confidence.
    """
    if not pages:
        return []

    sections: List[DetectedSection] = []
    
    current_type = "general"
    current_title = "General Policy Information"
    current_content_lines: List[str] = []
    page_start = 1
    current_page = 1
    has_explicit_heading = False

    for page in pages:
        current_page = page.page_number
        if not page.has_text:
            continue

        lines = page.text.splitlines()
        for line in lines:
            line_str = line.strip()
            if not line_str:
                if current_content_lines:
                    current_content_lines.append("")
                continue

            heading_match = classify_heading_line(line_str)
            if heading_match:
                # If we have accumulated content for the previous section, save it
                content_text = "\n".join(current_content_lines).strip()
                if content_text:
                    confidence = 0.85 if has_explicit_heading else 0.50
                    sections.append(
                        DetectedSection(
                            section_type=current_type,
                            title=current_title,
                            content=content_text,
                            page_start=page_start,
                            page_end=current_page,
                            confidence=confidence,
                            metadata={"detection_method": "deterministic_heading_pattern"},
                        )
                    )

                # Start the newly matched section
                current_type, current_title = heading_match
                current_content_lines = [line_str]
                page_start = current_page
                has_explicit_heading = True
            else:
                current_content_lines.append(line_str)

    # Save the final accumulated section
    content_text = "\n".join(current_content_lines).strip()
    if content_text:
        confidence = 0.85 if has_explicit_heading else 0.50
        sections.append(
            DetectedSection(
                section_type=current_type,
                title=current_title,
                content=content_text,
                page_start=page_start,
                page_end=current_page,
                confidence=confidence,
                metadata={"detection_method": "deterministic_heading_pattern"},
            )
        )

    # If no sections were identified at all, create a single 'general' section
    if not sections:
        all_text = "\n\n".join([p.text for p in pages if p.has_text]).strip()
        if all_text:
            sections.append(
                DetectedSection(
                    section_type="general",
                    title="General Policy Document",
                    content=all_text,
                    page_start=pages[0].page_number,
                    page_end=pages[-1].page_number,
                    confidence=0.50,
                    metadata={"detection_method": "fallback_general"},
                )
            )

    return sections
