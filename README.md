# PRISM — AI Insurance Companion

> **Intelligent Health Insurance Navigation & Claim Preparation for Indian Policyholders**

PRISM is a comprehensive, production-hardened platform designed to help policyholders understand complex health insurance documents, extract key policy limits and waiting periods, consult an AI assistant grounded strictly in verified policy clauses, and navigate the claim preparation process.

---

## Architecture Overview

```
                          ┌───────────────────────────┐
                          │   Supabase Auth / DB /    │
                          │      Storage / Vectors    │
                          └─────────────┬─────────────┘
                                        │
             ┌──────────────────────────┼──────────────────────────┐
             │                          │                          │
             ▼                          ▼                          ▼
     ┌───────────────┐          ┌───────────────┐          ┌───────────────┐
     │  FastAPI      │◄─────────┤  Next.js      │          │  Flutter      │
     │  Backend      │          │  Web App      │          │  Android App  │
     │  (RAG / Groq) │◄─────────┼───────────────┼──────────┤  (Native UI)  │
     └───────────────┘          └───────────────┘          └───────────────┘
```

The system comprises four tightly integrated components:

1. **`backend/`**: FastAPI high-performance Python service handling PDF parsing (PyMuPDF), document chunking, hybrid vector embeddings, and LLM reasoning via Groq with strict citation grounding.
2. **`web/`**: Next.js (App Router, Tailwind CSS, TypeScript) responsive web dashboard featuring policy vaults, claims workspace, interactive RAG Q&A, and policy comparisons.
3. **`mobile/`**: Flutter Android mobile application providing camera-based policy scanning, native biometric/session persistence, policy details, claims checklist, and push-ready notifications.
4. **`docs/`**: Architecture diagrams, API specifications, and deployment runbooks for Railway and Vercel.

---

## Core Capabilities

- **Policy Document Ingestion**: Upload multi-page insurer policy wordings via PDF or mobile camera capture.
- **RAG-Powered Clause Search**: Ephemeral vector search over policy sections; questions are answered strictly from the uploaded policy text with exact clause citations.
- **Claims Preparation Assistant**: Pre-claim checklists, required documentation tracking, hospital cashless guidance, and preparation timeline support.
- **Zero-Hallucination Guardrails**: When policy wording does not cover a question or evidence is insufficient, PRISM explicitly refuses to guess and flags missing information.
- **Dark & Light Mode Support**: Modern, accessible UI tailored for both desktop browsers and Android mobile devices.

---

## Directory Structure

```
PRISM/
├── backend/            # FastAPI service, Groq integration, pgvector RAG
│   ├── app/            # Application logic (API routes, RAG, core services)
│   ├── tests/          # Comprehensive test suites
│   └── requirements.txt
├── web/                # Next.js 15+ frontend application
│   ├── app/            # App Router pages and API routes
│   ├── components/     # UI components and views
│   └── package.json
├── mobile/             # Flutter Android application
│   ├── lib/            # Flutter source code (Feature-first architecture)
│   ├── android/        # Android native Gradle configuration
│   ├── test/           # Unit and widget test suite (121 tests)
│   └── pubspec.yaml
└── docs/               # System documentation & deployment guides
```

---

## Security & Privacy Highlights

- **Client-Safe Credentials**: Mobile and web clients only hold public Supabase anonymous keys; no administrative `service_role` keys or database credentials are bundled into client code.
- **Ephemeral AI Processing**: Groq LLM inference operates ephemerally; documents are processed for vector indexing without using user data for foundation model training.
- **Signer Verification**: Android release APK is compiled and signed with a dedicated release keystore using APK Signature Scheme v2.

---

## License

Proprietary — All Rights Reserved.
