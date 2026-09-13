# PRISM — Production Deployment Guide

This document outlines the complete procedure for deploying PRISM to production across **Vercel** (Frontend), **Railway** (Backend), and **Supabase** (Database, Auth, Storage, Vector Search), with AI powered by **Groq**.

---

## 1. Production Architecture

```text
               +--------------------------------------------------+
               |                  Browser / Client                 |
               +--------------------------------------------------+
                                        |
                 HTTPS Requests         | (SSR / Client API Calls)
                                        v
               +--------------------------------------------------+
               |             Vercel: Next.js + TypeScript         |
               |       (Page Rendering, Edge Proxy, Route Handlers)|
               +--------------------------------------------------+
                        |                                |
       Direct Auth / DB |               Backend API Proxy| (Server-to-Server Bearer)
                        v                                v
+------------------------------------+   +------------------------------------+
|         Supabase Cloud             |   |         Railway: Python + FastAPI  |
| - PostgreSQL (Row-Level Security)  |<--| - PyMuPDF Text Extraction          |
| - Auth (JWT validation)            |   | - Hybrid Retrieval & pgvector      |
| - Private Storage (policy-documents)   | - In-Memory Sliding-Window Rate Limit |
| - pgvector (BAAI/bge-small-en-v1.5)|   +------------------------------------+
+------------------------------------+                     |
                                                           | AI Inference (Server-only)
                                                           v
                                         +------------------------------------+
                                         |               Groq API             |
                                         | (openai/gpt-oss-120b / llama-3.3)  |
                                         +------------------------------------+
```

> [!IMPORTANT]
> **Zero Client Secret Exposure**: The browser interacts only with Next.js and Supabase Auth. Browser clients never communicate directly with Groq or call the FastAPI backend without validated Supabase Bearer credentials.

---

## 2. Environment Variables Specification

### Frontend (Vercel) Environment Variables
Set in **Vercel Project Settings → Environment Variables**:

| Variable Name | Type | Scope | Description | Example / Target Value |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Browser & Server | Supabase project endpoint | `https://your-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public | Browser & Server | Supabase client publishable / anon key | `sb_publishable_...` |
| `FASTAPI_BACKEND_URL` | Secret / Config | Server-side Only | Public URL of deployed Railway FastAPI service | `https://prism-backend-production.up.railway.app` |

---

### Backend (Railway) Environment Variables
Set in **Railway Service Variables**:

| Variable Name | Type | Scope | Description | Example / Target Value |
|---|---|---|---|---|
| `ENVIRONMENT` | Config | Server | Application environment mode | `production` |
| `PORT` | Config | Server | Listening port (injected automatically by Railway) | `8000` |
| `HOST` | Config | Server | Server host interface | `0.0.0.0` |
| `ALLOWED_ORIGINS` | Config | Server | Comma-separated list of allowed frontend origins (no wildcards) | `https://your-prism-app.vercel.app` |
| `SUPABASE_URL` | Config | Server | Supabase project endpoint | `https://your-project.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Server-side Only | Supabase Service Role Key (administrative operations) | *Keep Secret* |
| `GROQ_API_KEY` | Secret | Server-side Only | Groq Cloud API authorization key | *Keep Secret* |
| `GROQ_MODEL` | Config | Server | Target LLM model identifier | `openai/gpt-oss-120b` |
| `GROQ_BASE_URL` | Config | Server | Groq API base URL | `https://api.groq.com/openai/v1` |
| `RATE_LIMIT_PER_MINUTE` | Config | Server | Maximum API requests allowed per caller per minute | `30` |

---

## 3. Step-by-Step Deployment Procedure

### Phase A: Supabase Configuration

1. **Verify Database Extensions & Migrations**:
   - In the Supabase SQL Editor, verify that `vector` extension is active:
     ```sql
     CREATE EXTENSION IF NOT EXISTS vector;
     ```
   - Execute [`docs/migrations/01_pgvector_setup.sql`](file:///Users/bhavyakumar/Documents/Antigravity/PRISM/PRISM/docs/migrations/01_pgvector_setup.sql) to create `match_document_chunks` RPC.
   - Execute [`docs/migrations/02_rls_policies.sql`](file:///Users/bhavyakumar/Documents/Antigravity/PRISM/PRISM/docs/migrations/02_rls_policies.sql) to enforce strict Row-Level Security on `policies`, `documents`, `policy_sections`, and `document_chunks`.

2. **Storage Bucket Hardening**:
   - Ensure bucket `policy-documents` exists.
   - Verify the bucket is **Private** (Public access disabled).
   - Verify RLS policies on `storage.objects` ensure users can read/write/delete only paths starting with their own `auth.uid()`.

3. **Supabase Auth URL Configuration**:
   - Go to **Authentication → URL Configuration**.
   - Set **Site URL**: `https://your-prism-app.vercel.app` (or custom domain).
   - In **Redirect URLs**, add:
     - `https://your-prism-app.vercel.app/**`
     - `http://localhost:3000/**` (for local development)

---

### Phase B: Railway Backend Deployment

1. **Create Service on Railway**:
   - In Railway, create a new project and select **Deploy from GitHub repo**.
   - Set the **Root Directory** to `/backend`.
2. **Configure Build & Start Settings**:
   - Railway will detect `backend/railway.toml` and `backend/Dockerfile` automatically.
   - Build command: Dockerfile build.
   - Healthcheck Path: `/health`.
3. **Add Environment Variables**:
   - Input the required variables from the Backend table above.
4. **Deploy & Verify Domain**:
   - Click **Generate Domain** under Networking (e.g. `prism-backend-production.up.railway.app`).
   - Test health check:
     ```bash
     curl -s https://prism-backend-production.up.railway.app/health
     # Expected response: {"status":"ok"}
     ```

---

### Phase C: Vercel Frontend Deployment

1. **Import Project into Vercel**:
   - In Vercel, click **Add New → Project** and import the GitHub repository.
   - Set **Root Directory** to `web`.
   - Framework Preset: **Next.js** (automatically detected).
2. **Set Environment Variables**:
   - Add `NEXT_PUBLIC_SUPABASE_URL`.
   - Add `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
   - Add `FASTAPI_BACKEND_URL` pointing to your deployed Railway domain (e.g. `https://prism-backend-production.up.railway.app`).
3. **Deploy & Bind Custom Domain**:
   - Click **Deploy**.
   - Once deployment completes, navigate to **Settings → Domains** to attach your custom production domain if applicable.
   - Update `ALLOWED_ORIGINS` in Railway with the final Vercel domain!

---

## 4. Production Health Checks & Smoke Test Checklist

Execute these checks against the live production URLs:

- [ ] **Backend Health Endpoint**: `GET https://<railway-domain>/health` returns `{"status":"ok"}`.
- [ ] **Root Health Endpoint**: `GET https://<railway-domain>/` returns operational metadata (no internal credentials).
- [ ] **API Documentation Concealment**: `GET https://<railway-domain>/docs` returns 404 in production mode.
- [ ] **User Signup / Signin**: Authenticate a new user via Supabase Auth on the Vercel app.
- [ ] **Session Refresh**: Refresh dashboard; verify edge proxy maintains session state.
- [ ] **Policy Upload**: Upload a clean health insurance policy PDF to private storage.
- [ ] **Document Processing**: Monitor processing view; confirm chunking, section extraction, and embedding completion.
- [ ] **Ask PRISM**: Submit policy inquiry; verify response is grounded, citations link to real chunks, and Groq keys remain hidden.
- [ ] **Scenario Analysis & Comparison**: Run multi-policy comparison and scenario calculations.
- [ ] **Claim Workspace & Evidence**: Create claim, attach document, and inspect evidence mapping.
- [ ] **Tenant Isolation (Cross-User Test)**: Log in as User B; verify that User A's policy, claim, documents, and notifications cannot be accessed via UI or direct UUID API requests.

---

## 5. Rollback Procedures

### Vercel Instant Rollback
1. Open the Vercel Dashboard → **Deployments**.
2. Locate the previous stable deployment.
3. Click the three dots menu `...` → **Instant Rollback**.
4. Traffic is immediately redirected to the selected build artifact without rebuild delay.

### Railway Rollback
1. Open the Railway Dashboard → Target Service → **Deployments**.
2. Select the prior functional deployment.
3. Click **Rollback** to reactivate the earlier container image.
