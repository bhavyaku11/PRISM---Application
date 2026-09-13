# PRISM Android — Google Play Store Listing & Compliance

---

## 1. Store Listing Metadata

- **App Name**: PRISM: AI Insurance Companion
- **Short Description** (Max 80 chars):
  Understand your health insurance policy & prepare claims before you need them.
- **Category**: Medical / Finance / Productivity
- **Content Rating**: Everyone (3+)
- **Contact Email**: `support@prism.app`
- **Default Language**: English (India) - `en-IN`

---

## 2. Full Description (Max 4,000 chars)

```text
PRISM is your intelligent health insurance companion designed specifically for Indian policyholders. 

Indian health insurance policies are filled with complex clauses, waiting periods, room-rent sub-limits, co-payments, and exclusions that are difficult to understand during a medical emergency. PRISM helps you demystify your policy wording, organize claim documents, and ask grounded questions about your coverage.

KEY FEATURES:

1. COMPREHENSIVE POLICY ANALYSIS
Upload your official health insurance policy PDF or photograph physical documents. PRISM extracts and structures key terms, sum insured, deductibles, no-claim bonus (NCB), waiting periods, and room rent limits.

2. GROUNDED AI QUESTIONS & ANSWERS
Ask specific questions about your coverage, such as "Is robotic knee surgery covered?", "What is the waiting period for hypertension?", or "Are post-hospitalization medicines covered?". PRISM provides direct answers grounded in your actual policy document with exact page citations.

3. CLAIMS PREPARATION WORKSPACE
Be organized before filing a reimbursement or cashless claim. Track mandatory documents (Discharge Summary, Final Itemized Bill, Payment Receipts, Diagnostic Reports), check completeness, and review relevant policy clauses to avoid avoidable rejections.

4. RENEWAL & EXPIRY INTELLIGENCE
Stay informed about upcoming policy expirations, renewal timelines, and claim document checklists with deterministic in-app reminders.

5. ZERO PRIVACY COMPROMISES
Your insurance documents and medical records are stored in private, isolated vaults protected by PostgreSQL Row-Level Security (RLS) and encrypted in transit (TLS 1.3) and at rest (AES-256). PRISM does not sell your data or use your personal health records to train third-party public AI models.

IMPORTANT DISCLAIMER:
PRISM is an informational companion tool designed to help policyholders understand their contracts. PRISM is not an insurer, insurance broker, Third-Party Administrator (TPA), or legal authority. PRISM does not sell insurance, process payments, or guarantee claim approvals or settlement amounts. Final claim decisions rest entirely with your insurance company and designated TPA in accordance with your official policy terms and IRDAI regulations.
```

---

## 3. Play Store Data Safety Questionnaire

| Category | Data Type | Collected? | Shared? | Purpose | Ephemeral? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Personal Info** | Name, Email address, Phone number | Yes | No | Account management & authentication | No |
| **Financial Info** | Insurance policy sum insured, premium, claim expenses | Yes | No | Policy analysis & claim preparation dossier | No |
| **Health Info** | Hospitalization dates, diagnoses in claim dossiers | Yes | No | Claim document organization (User-initiated only) | No |
| **Messages** | Q&A conversations with AI Companion | Yes | No | Answering policy queries with document citations | No |
| **Photos and Videos** | Camera photos of policy documents | Yes | No | Compiling into PDF for policy document extraction | No |
| **Files and Docs** | Policy PDFs, hospital bills, discharge summaries | Yes | No | Document extraction and claim dossier checklist | No |

### Security Practices
- **Data Encrypted in Transit**: Yes (TLS 1.3 / HTTPS).
- **Data Encrypted at Rest**: Yes (AES-256 via Supabase).
- **User Can Request Deletion**: Yes (via account settings / privacy support).
- **Row-Level Security**: Server-enforced per user ID.

---

## 4. Android Permissions Justifications

### 1. `android.permission.INTERNET`
- **Purpose**: Required to authenticate users with Supabase, retrieve policies and claims, and communicate with the FastAPI analysis backend.

### 2. `android.permission.CAMERA`
- **Purpose**: Required only when the user explicitly chooses "Scan with Camera" to photograph physical insurance policy pages.
- **Access Timing**: Requested at runtime on-demand; never accessed in the background.

---

## 5. Recommended Store Screenshots (Phone: 1080 × 2400)

1. **Dashboard**: "All Your Health Policies in One Clear View"
2. **Policy Details**: "Coverage, Exclusions & Room Rent Demystified"
3. **Ask PRISM**: "Grounded Q&A with Exact Policy Citations"
4. **Claims Center**: "Organize Claim Documents & Review Evidence"
5. **Claim Preparation**: "Mandatory Checklist & Readiness Score"
6. **Notifications**: "Stay Informed on Policy Expiry & Claim Deadlines"
7. **Security & Privacy**: "Private Vaults, End-to-End Encryption, Zero LLM Training"
