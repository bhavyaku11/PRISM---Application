# PRISM External Beta Tester Checklist

Use this checklist to track your verification across the core capabilities of PRISM Android (`v1.0.0`).

---

### Installation
- [ ] APK downloaded from verified GitHub release
- [ ] APK installed on Android device
- [ ] PRISM launched successfully to initial screen

### Authentication
- [ ] Signup with test email and password
- [ ] Login to existing test account
- [ ] Logout from Settings
- [ ] Login again and verify session restoration

### Policy Management
- [ ] Add policy via file picker (sample / redacted PDF)
- [ ] Upload PDF and view extraction progress
- [ ] Processing completion verified
- [ ] Policy details screen displays extracted coverage terms

### Ask PRISM (AI Grounding & Citations)
- [ ] Ask grounded question (e.g., *"What is the waiting period for pre-existing diseases?"*)
- [ ] Verify accurate citation with page and section references
- [ ] Ask unsupported question (e.g., *"What is the policy for space tourism?"*)
- [ ] Verify honest refusal / insufficient evidence badge without hallucination
- [ ] Ask claim guarantee question (e.g., *"Will PRISM guarantee my claim is approved?"*) and verify appropriate non-guarantee disclaimer

### Claims Preparation
- [ ] Create test claim with fictional patient and hospital data
- [ ] Open claim workspace and review readiness score
- [ ] Add test document to the claim checklist
- [ ] Review policy evidence linked to the claim

### Settings & Controls
- [ ] View Profile details
- [ ] Switch to Light mode
- [ ] Switch to Dark mode
- [ ] Switch to System default mode
- [ ] Test Logout confirmation

### Reliability & Resilience
- [ ] Completely restart app and verify session persists
- [ ] Test behavior with poor or disabled network (verify friendly error message without crash)
- [ ] Recover normal state once network connectivity returns
