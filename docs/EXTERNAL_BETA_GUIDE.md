# PRISM External Beta

## What is PRISM?

PRISM is an AI Insurance Companion designed to help users understand health-insurance policies, explore policy information, ask grounded questions, organize documents, and prepare for claims.

Indian health insurance contracts can be complex legal documents filled with sub-limits, waiting periods, copayments, and conditional clauses. PRISM extracts structure and text from your policy schedule, indexes clauses, and provides verified, citation-backed answers whenever you have questions or need to prepare for hospital admission.

## Important

This is an early beta release.

Testers may encounter bugs.

PRISM is informational and decision-support software.

It does not:

- guarantee claim approval
- provide medical diagnosis
- provide legal advice
- replace the actual insurance policy
- directly file insurance claims

All claim decisions remain strictly between you, your licensed insurance company, and your designated Third-Party Administrator (TPA).

---

## App & Release Details

- **Application**: PRISM Android
- **Version**: `v1.0.0`
- **Version Code**: `1`
- **Application ID**: `com.prism.app.prism_mobile`
- **GitHub Release**: [PRISM v1.0.0 Release](https://github.com/bhavyaku11/PRISM---Application/releases/tag/v1.0.0)
- **Direct APK Download**: [PRISM-v1.0.0-Android.apk](https://github.com/bhavyaku11/PRISM---Application/releases/download/v1.0.0/PRISM-v1.0.0-Android.apk)

---

## Installation Instructions

1. Open the PRISM GitHub Release:  
   [https://github.com/bhavyaku11/PRISM---Application/releases/tag/v1.0.0](https://github.com/bhavyaku11/PRISM---Application/releases/tag/v1.0.0)
2. Download the Android APK (`PRISM-v1.0.0-Android.apk`).
3. Open the downloaded APK file on your Android device (Android 7.0 / API 24 or newer).
4. If Android asks for permission to install an app from that source, allow the browser or file manager to install it (this is standard Android procedure when installing an app directly outside Google Play).
5. Tap **Install** when prompted.
6. Open **PRISM** from your app drawer.

*(Note: Do not globally disable your Android security settings. Only grant permission to the specific browser or file manager you used to download the file).*

---

## Test Data Guidance

We strongly recommend that testers use:

- a public sample insurance policy
- a sample policy provided for testing
- a redacted policy with sensitive personal identifiers removed

Avoid requesting or uploading highly sensitive personal, medical, or financial information.

> **Privacy Notice**: Please do not upload documents containing information you are not comfortable sharing with a beta application.

Uploaded policy and claim documents are securely transmitted and processed by PRISM's backend services strictly to provide the application's text extraction, search, and Q&A functionality. For full details on data retention and handling, please refer to the official [PRISM Privacy Policy](https://github.com/bhavyaku11/PRISM---Application/blob/main/web/app/privacy/page.tsx).

---

## Test Scenario

Follow this simple end-to-end journey during your test session:

### Step 1 — Account
- Open PRISM and tap **Sign Up** to create a test account (or sign in).
- Verify successful sign-in.
- Go to **Settings** &rarr; tap **Sign Out**.
- Sign back in to verify credentials and session persistence.

### Step 2 — Policy
- From the Dashboard or Policies tab, tap **Add Policy**.
- Upload a health-insurance policy PDF (preferably sample or redacted).
- Observe the processing state.
- Once processed, tap the policy to open **Policy Details**.
- Review the extracted policy name, insurer, sum insured, and coverage highlights.

### Step 3 — Ask PRISM
Navigate to **Ask PRISM** and test the following queries:

1. **Grounded Waiting Period Question**:
   > *"What is the waiting period for pre-existing diseases?"*
   - Verify that PRISM responds with evidence from the policy document.
   - Verify that a page and section citation appears.
2. **Additional Policy Question**:
   - Ask another question whose answer is present in your policy (e.g., room rent limit or ambulance charges).
   - Verify that PRISM provides grounded citations.
3. **Unsupported / Out-of-Scope Question**:
   - Ask a question that cannot be answered from the policy (e.g., *"What is the coverage for space tourism accidents?"*).
   - Verify that PRISM avoids inventing information and acknowledges insufficient evidence with an honest refusal.

### Step 4 — Claims
- Navigate to **Claims** and create a **TEST claim**.
- Use clearly fictional test data:
  - **Patient**: `Test User`
  - **Hospital**: `Test Hospital`
  - **Claim**: `Hospitalization Test`
  - **Estimated expense**: `₹50,000`
- Open the claim workspace, explore the required document checklist, and associate mock evidence.
- *(Do NOT attempt to submit a real claim).*

### Step 5 — Settings
- Open **Settings** from the navigation bar.
- Test appearance switching:
  - **Light mode**
  - **Dark mode**
  - **System mode**
- Review your profile information and data controls.
- Tap **Sign Out** to complete the journey.

---

## Submitting Feedback

After completing your test session, please review the feedback questions in [EXTERNAL_BETA_FEEDBACK.md](file:///Users/bhavyakumar/Documents/Antigravity/PRISM/PRISM/docs/EXTERNAL_BETA_FEEDBACK.md) and track your verification steps with [EXTERNAL_BETA_CHECKLIST.md](file:///Users/bhavyakumar/Documents/Antigravity/PRISM/PRISM/docs/EXTERNAL_BETA_CHECKLIST.md).
