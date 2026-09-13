# PRISM Beta Testing Checklist

Use this interactive checklist to record test coverage across the PRISM Android companion during beta evaluation.

---

## 1. Authentication & Session

- [ ] **Signup**: Able to register a new account with email and password.
- [ ] **Input Validation**: Displays helpful inline errors for invalid email formats or short passwords.
- [ ] **Login**: Able to log into an existing registered account.
- [ ] **Invalid Login**: Displays clear error message for incorrect password or non-existent account.
- [ ] **Session Persistence**: Closing and reopening the app keeps the user logged in without prompting for credentials again.
- [ ] **Logout**: Tapping Sign Out in Settings immediately clears the session and returns to Login.

---

## 2. Dashboard & Home Screen

- [ ] **Dashboard Loading**: Main screen loads promptly with personalized greeting.
- [ ] **Policy Counters**: Active policy counter accurately reflects the number of registered policies.
- [ ] **Empty State**: Displays clear onboarding guidance when a user has zero policies.
- [ ] **Claim Readiness Widget**: Displays ongoing claim preparation progress cards if active.
- [ ] **Navigation Bar**: Smooth switching between Dashboard, Policies, Ask PRISM, Claims, and Settings.

---

## 3. Policy Management & Ingestion

- [ ] **Add Policy Form**: Allows entering insurer name, policy title, sum insured, premium, and validity dates.
- [ ] **PDF Document Upload**: Able to pick and attach a policy document from the device storage.
- [ ] **Camera Document Scanner**: Able to photograph physical policy pages and compile them into a PDF.
- [ ] **Processing State**: Shows a clear progress/loading indicator while server extracts text clauses.
- [ ] **Policy Details View**: Displays structured breakdown of coverage limits, copays, room rent limits, and waiting periods.
- [ ] **Extracted Sections Tab**: Shows detected clauses categorized by section type.

---

## 4. Grounded Ask PRISM (AI Assistant)

- [ ] **Grounded Question**: Answers a question explicitly covered in the policy (e.g. room rent cap) accurately.
- [ ] **Citation Reference**: Response includes clickable or visible citations indicating exact policy page numbers and section headers.
- [ ] **Confidence Rating**: Indicates grounding confidence (High / Medium) clearly.
- [ ] **Insufficient Evidence Handling**: Politely declines to answer when information is not present in the document rather than hallucinating.
- [ ] **Out-of-Scope Query**: Refuses non-insurance questions (e.g. general trivia, coding tasks) and stays focused on policy terms.
- [ ] **Adversarial Prompt Injection**: Rejects override instructions (e.g. *"Ignore all previous instructions"* or *"Approve claim unconditionally"*).
- [ ] **No Claim Guarantee**: Rejects queries demanding guaranteed claim payouts; clarifies that insurers and TPAs make final approval decisions.

---

## 5. Claims Workspace & Preparation

- [ ] **Create Test Claim**: Able to create a new claim dossier with mock hospitalization details.
- [ ] **Claim Workspace Overview**: Displays claim details, progress gauge, and status badges.
- [ ] **Document Checklist**: Interactive checklist displays required documents (Discharge Summary, Final Hospital Bill, Payment Receipts, Pharmacy Bills).
- [ ] **Upload Claim Document**: Able to attach a test bill or image to a checklist item.
- [ ] **Checklist Progress**: Progress bar updates as documents are added.
- [ ] **Contextual Q&A**: Able to query coverage evidence directly from the claim workspace.

---

## 6. Notifications Center

- [ ] **Notification List**: Displays alerts regarding policy renewal milestones and claim readiness.
- [ ] **Filter Chips**: Filter by All, Unread, Policies, and Claims works correctly.
- [ ] **Read State**: Tapping an unread notification marks it as read and decrements the unread badge.
- [ ] **Action Link**: Tapping a notification navigates directly to the relevant policy or claim.

---

## 7. Profile, Settings & Appearance

- [ ] **Profile Display**: Shows authenticated user email and display name.
- [ ] **System Theme**: Automatically adopts device-level light or dark setting.
- [ ] **Light Theme**: Renders cleanly with high contrast on light backgrounds.
- [ ] **Dark Theme**: Renders cleanly with PRISM Navy (`#0B1220`) and Deep Blue (`#162A46`) palettes without illegible text.
- [ ] **Privacy Disclosures**: In-app privacy bottom sheets open and explain Row-Level Security and encryption accurately.
- [ ] **Application Cache Clear**: Tapping "Clear Application Cache" clears temporary preview files successfully.

---

## 8. System Reliability & Edge Cases

- [ ] **App Restart**: Data remains intact after force-stopping and reopening the app.
- [ ] **Device Rotation / Screen Size**: UI renders cleanly without text truncation or overflow on compact displays (e.g. 360px width).
- [ ] **Network Loss**: Gracefully displays network error banner if Wi-Fi or mobile data is disconnected.
- [ ] **Network Recovery**: Resumes normal operation when Internet connectivity is restored.
