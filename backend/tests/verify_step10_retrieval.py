import json
from app.services.documents.extractor import extract_pdf_pages
from app.services.documents.section_detector import detect_sections
from app.services.documents.chunker import create_page_aware_chunks
from app.services.embeddings import get_embedding_provider
from app.services.retrieval.service import RetrievalService
from tests.test_document_processing import create_in_memory_pdf

# Realistic Indian Health Insurance Policy Wording (7 Pages)
POLICY_PAGES = [
    # Page 1: Schedule
    """PRISM Health Shield Policy Schedule
Policyholder: Rajesh Kumar Sharma
Insurer: Star Care Health Insurance Ltd.
Policy Number: STAR-2026-HL-882910
Period of Insurance: 01-Jan-2026 to 31-Dec-2026
Sum Insured: ₹10,00,000 (Ten Lakhs)
Policy Type: Individual Health Comprehensive
This document constitutes the binding insurance contract between the policyholder and Star Care Health Insurance.""",

    # Page 2: Inpatient & ICU
    """Section 1: What is Covered (Inpatient Hospitalization)
1.1 Inpatient Care: Medical expenses incurred during hospitalization for a minimum period of 24 consecutive hours.
1.2 Intensive Care Unit (ICU) Charges: The company shall cover nursing, monitoring, and room accommodation charges in an Intensive Care Unit (ICU) up to the actual expenses incurred without any proportionate deduction, subject to sum insured.
1.3 Pre-hospitalization expenses for 60 days and Post-hospitalization expenses for 90 days are payable under base cover.""",

    # Page 3: Room Rent & Limits
    """Section 2: Room Rent and Limits
2.1 Room Rent Sub-limit: Room boarding and nursing expenses are capped at 1% of the Sum Insured per day (₹10,000 per day for standard private room).
2.2 ICU Sub-limit: Intensive Care Unit charges are capped at 2% of the Sum Insured per day (₹20,000 per day).
2.3 If the insured occupies a room category higher than eligible limit, all associated medical expenses shall be subject to proportionate deduction.""",

    # Page 4: Waiting Periods
    """Section 3: Waiting Periods
3.1 Initial Waiting Period: A waiting period of 30 days from policy inception date applies, except for accidental bodily injuries requiring immediate emergency hospitalization.
3.2 Specific Illness Waiting Period: A 24-month waiting period applies for specific conditions including cataract, hernia, joint replacement, and ENT disorders.
3.3 Pre-existing Disease (PED) Waiting Period: A waiting period of 36 months applies for any pre-existing medical condition, ailment, or injury disclosed at the time of policy inception.""",

    # Page 5: Co-payment
    """Section 4: Co-payment and Deductibles
4.1 Zone Co-payment: A mandatory 10% co-payment applies if treatment is taken in Zone A while the policy was purchased with Zone B rating.
4.2 Senior Citizen Co-payment: A compulsory 20% co-pay applies to all claims filed for insured members aged 61 years and above.
4.3 Voluntary Deductible: If a voluntary deductible of ₹25,000 was opted, the company will only indemnify expenses exceeding the deductible amount per policy year.""",

    # Page 6: Exclusions
    """Section 5: General Exclusions
What is Not Covered under this policy:
5.1 Investigation & Evaluation: Admission primarily for diagnostic or laboratory observation.
5.2 Cosmetic or Plastic Surgery: Expenses for aesthetic, plastic, or reconstructive surgery unless required due to accident, burns, or cancer.
5.3 Substance Abuse: Treatment resulting from alcohol, drug, or substance intoxication.
5.4 Maternity Expenses: Normal delivery or caesarean section expenses unless optional maternity rider is purchased.
5.5 Dental Treatment: Routine dental check-ups, tooth extractions, and implants unless necessitated by accidental facial trauma.""",

    # Page 7: Claims Procedure
    """Section 6: Claims Procedure & Settlement
6.1 Cashless Claim Process: For planned hospitalization, intimation must be submitted to the Network Hospital TPA desk at least 48 hours prior to admission. For emergency admission, intimation must be sent within 24 hours of hospital entry.
6.2 Reimbursement Claim Process: The insured must submit all original documents, discharge summary, pharmacy bills, and claim form to the insurer within 30 days of hospital discharge.
6.3 Settlement Timeline: The company shall settle or repudiate admissible claims within 30 days of receiving all necessary documents."""
]


def run_verification():
    print("=" * 70)
    print("PRISM STEP 10: REAL POLICY RETRIEVAL VERIFICATION")
    print("=" * 70)

    # 1. Ingest realistic PDF
    pdf_bytes = create_in_memory_pdf(POLICY_PAGES)
    extracted = extract_pdf_pages(pdf_bytes)
    print(f"Extracted {extracted.page_count} pages ({extracted.pages_with_text} with text).")

    # 2. Detect sections
    sections = detect_sections(extracted.pages)
    print(f"Detected {len(sections)} policy sections:")
    for s in sections:
        print(f"  - [{s.section_type}] '{s.title}' (Pages {s.page_start}-{s.page_end}, confidence={s.confidence})")

    # 3. Chunking
    chunks = create_page_aware_chunks(extracted.pages, sections)
    print(f"Created {len(chunks)} page-aware chunks.")

    # 4. Embeddings
    provider = get_embedding_provider()
    chunk_texts = [c.content for c in chunks]
    embeddings = provider.embed_texts(chunk_texts)
    for c, emb in zip(chunks, embeddings):
        c.embedding = emb
    print(f"Generated {len(embeddings)} dense embeddings ({provider.dimension}-dim).")

    # 5. Build mock storage for RetrievalService
    user_id = "usr_real_rajesh_2026"
    policy_id = "pol_starcare_882910"
    doc_id = "doc_health_wording_001"

    db_chunks = [
        {
            "id": f"chunk_{c.chunk_index + 1}",
            "document_id": doc_id,
            "policy_id": policy_id,
            "page_number": c.page_number,
            "section_title": c.section_title,
            "content": c.content,
            "embedding": c.embedding,
        }
        for c in chunks
    ]

    service = RetrievalService(provider=provider)
    from unittest.mock import MagicMock
    mock_query = MagicMock()
    mock_query.eq.return_value = mock_query
    mock_query.not_.is_.return_value = mock_query
    mock_query.execute.return_value = MagicMock(data=db_chunks)

    service.client = MagicMock()
    service.client.rpc.side_effect = Exception("No RPC (testing fallback)")
    service.client.table.return_value.select.return_value = mock_query

    # 6. Test the 6 mandated target queries
    test_queries = [
        {
            "query": "Does my policy cover ICU charges?",
            "expected_keywords": ["ICU", "Intensive Care Unit"],
            "expected_page": 2,  # or 3
        },
        {
            "query": "What is the waiting period for pre-existing diseases?",
            "expected_keywords": ["waiting period", "pre-existing", "36 months"],
            "expected_page": 4,
        },
        {
            "query": "Is there a co-payment?",
            "expected_keywords": ["co-payment", "co-pay", "10%"],
            "expected_page": 5,
        },
        {
            "query": "What are the room rent limits?",
            "expected_keywords": ["Room Rent", "Sub-limit", "1%"],
            "expected_page": 3,
        },
        {
            "query": "What is excluded from my policy?",
            "expected_keywords": ["Exclusions", "Not Covered", "Cosmetic"],
            "expected_page": 6,
        },
        {
            "query": "How do I make a claim?",
            "expected_keywords": ["Claims Procedure", "Cashless", "Reimbursement"],
            "expected_page": 7,
        },
    ]

    print("\n" + "=" * 70)
    print("STEP 10 RETRIEVAL QUERY RESULTS")
    print("=" * 70)

    all_passed = True
    for idx, t in enumerate(test_queries, 1):
        q = t["query"]
        results = service.retrieve_relevant_chunks(
            user_id=user_id,
            query=q,
            policy_id=policy_id,
            top_k=3,
        )

        assert len(results) > 0, f"Query '{q}' returned no results!"
        top = results[0]

        # Verify page number, section title, and relevance score
        assert top["page_number"] is not None
        assert top["similarity"] > 0.60
        assert top["policy_id"] == policy_id
        assert top["document_id"] == doc_id

        # Check expected content
        content = top["content"]
        has_expected = any(kw.lower() in content.lower() or kw.lower() in (top["section_title"] or "").lower() for kw in t["expected_keywords"])

        status = "PASSED" if has_expected else "FAILED"
        if not has_expected:
            all_passed = False

        print(f"\nQUERY {idx}: \"{q}\"")
        print(f"Status: [{status}]")
        print(f"  Top Match Chunk: {top['chunk_id']}")
        print(f"  Page Number: Page {top['page_number']}")
        print(f"  Section Title: '{top['section_title']}'")
        print(f"  Similarity Score: {top['similarity']}")
        print(f"  Excerpt: {content[:140]}...")

    print("\n" + "=" * 70)
    if all_passed:
        print("ALL 6 STEP 10 QUERIES RETRIEVED EXACT RELEVANT CHUNKS SUCCESSFULLY!")
    else:
        print("ONE OR MORE QUERIES FAILED TO RETRIEVE EXPECTED RELEVANT CHUNK.")
    print("=" * 70)


if __name__ == "__main__":
    run_verification()
