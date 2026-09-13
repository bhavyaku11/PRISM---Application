# PRISM

AI Insurance Companion

## What is PRISM?

PRISM helps users understand their health-insurance policies, explore coverage information, ask grounded questions about their policy, organize documents, and prepare for claims.

Indian health insurance contracts are often dense, multi-page legal documents filled with conditional clauses, sub-limits, waiting periods, and deductibles. PRISM serves as an intelligent companion that parses policy wordings, indexes coverage clauses, and provides verified, citation-backed answers whenever policyholders have questions or need to prepare for hospital admission.

---

## Core capabilities

- **Policy management**: Centralized digital vault for health insurance policies, insurer details, sum insured, and renewal timelines.
- **Policy document processing**: Server-side PDF extraction (PyMuPDF) and structure detection for schedules, Customer Information Sheets (CIS), and terms.
- **Grounded Ask PRISM**: Natural language Q&A strictly grounded in the user's uploaded policy documents.
- **Policy evidence and citations**: Every answer references exact policy section titles and page numbers for transparent self-verification.
- **Claims preparation**: Structured checklists for cashless pre-authorization, planned hospitalization, and reimbursement filings.
- **Claim document organization**: Upload and associate discharge summaries, hospital bills, pharmacy receipts, and diagnostic reports.
- **Notifications**: Automated alerts for policy renewals and claim document readiness.
- **Android application**: Native mobile experience with camera-based physical document scanning and session persistence.

---

## Architecture

PRISM is organized around a unified, privacy-conscious cloud architecture:

```
Flutter Android (Mobile) / Next.js (Web)
                ↓
         FastAPI Backend
                ↓
    Supabase (Auth / DB / Storage)
                ↓
       Document Processing
                ↓
Embeddings (BAAI/bge-small-en-v1.5) / Retrieval (pgvector)
                ↓
        Groq (LLM Inference)
```

- **Client Layer**:
  - **Flutter Android**: Native mobile app supporting offline session persistence, camera document scanning, and dark/light appearance.
  - **Next.js Web**: Desktop and tablet responsive interface built with TypeScript, Tailwind CSS, and App Router.
- **API & Business Logic**:
  - **FastAPI**: Containerized Python service orchestrating text extraction, vector embedding, retrieval, and LLM reasoning.
- **Data & Security**:
  - **Supabase**: PostgreSQL database with Row-Level Security (RLS) enforcing tenant isolation (`auth.uid() = user_id`), pgvector similarity search, and private storage buckets.
- **AI & Retrieval**:
  - **SentenceTransformers**: Local vector embedding computation (384 dimensions).
  - **Groq Cloud API**: Server-side inference for natural language response generation using retrieved clause excerpts.

*(Note: Client applications communicate strictly via public anonymous tokens and authenticated JWTs. Administrative service-role keys and database passwords are never bundled in client builds).*

---

## Android

PRISM for Android is distributed directly as an APK package outside Google Play for testing and independent distribution.

### How to Download & Install

1. Visit the verified GitHub Release:  
   **Release Page**: [PRISM v1.0.0 Release](https://github.com/bhavyaku11/PRISM---Application/releases/tag/v1.0.0)  
   **Direct APK Download**: [Download PRISM-v1.0.0-Android.apk](https://github.com/bhavyaku11/PRISM---Application/releases/download/v1.0.0/PRISM-v1.0.0-Android.apk)
2. On your Android device (Android 7.0 / API 24 or newer), open the downloaded APK file.
3. If prompted, allow installation from your browser or file manager (standard for direct APK distribution outside Google Play).
4. Launch PRISM and sign in or create an account to begin.

### Build Specifications

- **Package ID**: `com.prism.app.prism_mobile`
- **Version**: `1.0.0` (Build `1`)
- **Package Format**: Universal Release APK
- **Signing**: APK Signature Scheme v2 (Release Keystore)
- **Target OS**: Android 7.0 – Android 16 (API 24 to API 36)

---

## Directory Structure

```
PRISM/
├── backend/            # FastAPI service, Groq integration, pgvector RAG
│   ├── app/            # API routes, extraction, chunking, AI services
│   └── tests/          # Pytest integration and unit test suite
├── web/                # Next.js web application (App Router, Tailwind CSS)
│   ├── app/            # Next.js routes (landing, /privacy, /terms, /delete-account)
│   └── components/     # UI components and layouts
├── mobile/             # Flutter Android application
│   ├── lib/            # Feature-first Dart codebase
│   └── test/           # Widget & unit test suite (121 tests)
└── docs/               # Architecture specifications & database migrations
```

---

## Disclaimer

PRISM provides informational and decision-support functionality.

PRISM does **not**:
- guarantee insurance claim approval, reimbursement amounts, or dispute outcomes
- provide medical diagnosis, clinical evaluations, or healthcare advice
- provide formal legal advice or legal representation
- replace your official insurance policy schedule, insurer, or TPA
- directly submit or file insurance claims on your behalf

All claim decisions and contractual interpretations remain the sole and exclusive jurisdiction of your licensed insurance company and designated Third-Party Administrator (TPA).

---

## License

Proprietary — All Rights Reserved.

