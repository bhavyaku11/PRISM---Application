# PRISM Android — Production Documentation

PRISM is an AI-powered Health Insurance Companion for Indian policyholders. This directory contains the complete Flutter mobile application for Android.

---

## 1. Environment & Requirements

- **Flutter SDK**: `>= 3.10.0` (Dart SDK `>= 3.0.0 < 4.0.0`)
- **Android Target SDK**: `34` (Android 14)
- **Android Minimum SDK**: `21` (Android 5.0 Lollipop)
- **Java / Gradle**: Java 17, Gradle 9.x with Kotlin DSL (`build.gradle.kts`)
- **Supported Architectures**: `arm64-v8a`, `armeabi-v7a`, `x86_64`

---

## 2. Architecture & Data Flow

```text
PRISM Mobile (Android / Flutter)
   │
   ├──► Supabase Cloud
   │     ├─► Supabase Auth (JWT sessions, refresh tokens)
   │     ├─► PostgreSQL RLS (profiles, policies, claims, documents, notifications)
   │     └─► Private Storage Bucket (`policy-documents`)
   │
   └──► FastAPI Backend (REST via ApiClient with Bearer token)
         ├─► Document extraction & processing
         ├─► Vector similarity search & embeddings
         └─► Server-Side Groq AI (Server-only LLM reasoning, no mobile keys)
```

---

## 3. Setup & Environment Configuration

### Public Supabase Configuration
Client-safe anonymous keys are defined in `lib/core/config/app_config.dart`. They may be overridden at compile time:
```bash
--dart-define=SUPABASE_URL=https://your-project.supabase.co \
--dart-define=SUPABASE_ANON_KEY=sb_publishable_...
```

### FastAPI Backend URL Resolution
`AppConfig.apiBaseUrl` dynamically selects the optimal endpoint:
1. **Command-line override**: Any `--dart-define=API_BASE_URL=https://...` provided at build time takes top priority.
2. **Release builds (`kReleaseMode`)**: Automatically defaults to the deployed production Railway service (`https://prism-backend-production.up.railway.app`).
3. **Debug builds**: Automatically defaults to `http://10.0.2.2:8000` (Android emulator loopback to localhost).

---

## 4. Local Development

```bash
# 1. Fetch dependencies
flutter pub get

# 2. Run static analysis
flutter analyze

# 3. Run all unit and widget tests
flutter test

# 4. Run on Android emulator or connected device
flutter run
```

---

## 5. Build Commands

### Debug APK
```bash
flutter build apk --debug
```
Output: `build/app/outputs/flutter-apk/app-debug.apk`

### Production Release App Bundle (AAB for Google Play)
```bash
flutter build appbundle --release
```
Output: `build/app/outputs/bundle/release/app-release.aab`

---

## 6. Release Signing Configuration

Release signing is configured in `android/app/build.gradle.kts` via a git-ignored `key.properties` file located in `android/key.properties`:

```properties
storePassword=your_keystore_password
keyPassword=your_key_password
keyAlias=prism_upload_key
storeFile=/path/to/prism-upload-keystore.jks
```

### Generating a New Upload Keystore
```bash
keytool -genkey -v -keystore ~/prism-upload-keystore.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias prism_upload_key
```

> [!NOTE]
> If `key.properties` is omitted, the build gracefully falls back to debug signing so that developer builds and CI environments can compile without errors.

---

## 7. App Identity & Versioning

- **Application ID**: `com.prism.app.prism_mobile`
- **Application Name**: `PRISM`
- **Version Name**: `1.0.0`
- **Version Code**: `1` (derived from `pubspec.yaml`: `version: 1.0.0+1`)

---

## 8. Android Permissions

Defined in `android/app/src/main/AndroidManifest.xml`:
- `android.permission.INTERNET`: Required for Supabase authentication, database synchronization, and FastAPI backend requests.
- `android.permission.CAMERA` (optional hardware feature): Requested at runtime only when the user chooses "Scan with Camera" to photograph physical policy pages.
- **Storage**: PRISM uses Android Storage Access Framework (`file_picker`) and does not request broad external storage permissions.

---

## 9. Main Application Routes

- `/splash`: Cold-launch splash screen with animated auth state routing.
- `/login`: Email and password authentication with validation.
- `/signup`: New user registration.
- `/dashboard`: Unified dashboard with policy summary, claim alerts, and quick actions.
- `/policies`: Comprehensive list of user policies with status filtering.
- `/policies/add`: Upload policy PDF or scan physical pages via camera.
- `/policies/:id`: Deep policy analysis (overview, coverage, waiting periods, room rent, exclusions, full text).
- `/policies/:id/processing`: Live document processing polling with animated progress.
- `/ask`: Grounded policy Q&A with citations, source clauses, and refusal state handling.
- `/claims`: Claims center showing active preparation dossiers and readiness scores.
- `/claims/:id`: 5-step claim preparation workspace (Understand, Documents, Policy Evidence, Prepare/Review, Tracking).
- `/notifications`: In-app notification center with category filters, unread tracking, and deep navigation.
- `/profile`: Authenticated user profile information and validated profile updates.
- `/settings`: Theme appearance toggle (System, Light, Dark), privacy disclosures, and safe sign-out.

---

## 10. Security & Privacy Guarantees

1. **Zero Client Secrets**: No Supabase `service_role` key, database passwords, or Groq API keys are bundled into the Android application.
2. **Server-Enforced RLS**: All Supabase queries enforce user ownership via PostgreSQL Row-Level Security.
3. **Private Document Storage**: All insurance documents and claim receipts are stored in the private bucket `policy-documents`.
4. **No Direct Third-Party AI Calls**: Mobile requests communicate strictly with PRISM's FastAPI backend; client devices never directly call Groq.
5. **No Medical / Claim Decision Claims**: PRISM is an informational companion that organizes and explains policy clauses; it explicitly disclaims insurer representation or approval guarantees.

---

## 11. Google Play Store Release Steps

1. Build release bundle: `flutter build appbundle --release`
2. Log into the Google Play Console.
3. Create new release under **Production** (or **Closed Testing**).
4. Upload `build/app/outputs/bundle/release/app-release.aab`.
5. Upload store listing assets (512x512 app icon, feature graphic, screenshots).
6. Complete Data Safety questionnaire using the disclosures documented in `docs/PLAY_STORE_METADATA.md`.
7. Review and submit release for Google verification.
