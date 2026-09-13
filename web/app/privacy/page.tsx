import React from 'react';
import Link from 'next/link';
import { PrismLogo } from '@/components/ui/PrismLogo';

export const metadata = {
  title: 'Privacy Policy — PRISM',
  description: 'Privacy Policy and Data Protection Disclosures for PRISM AI Insurance Companion',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#F6F8FB] dark:bg-[#0B1220] text-[#111827] dark:text-[#F6F8FB]">
      {/* Top Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#0B1220]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <PrismLogo />
          <Link
            href="/"
            className="text-xs font-medium text-[#4F8CFF] hover:underline"
          >
            &larr; Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-[#162A46] rounded-2xl p-8 sm:p-12 shadow-sm border border-slate-200 dark:border-slate-800">
          {/* Header Banner */}
          <div className="border-b border-slate-200 dark:border-slate-800 pb-6 mb-8">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#4F8CFF]">
              Legal Documentation
            </span>
            <h1 className="text-3xl font-bold mt-2 text-[#0B1220] dark:text-white">
              PRISM Privacy Policy
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              Last Updated: September 13, 2026 &middot; Version 1.1.0
            </p>
          </div>

          {/* Quick Summary Notice */}
          <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900/60 text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-1.5">
            <p className="font-semibold text-[#0B1220] dark:text-white">
              Key Information at a Glance:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-300">
              <li>
                <strong>Informational companion:</strong> PRISM is an informational tool to help Indian policyholders organize insurance documents and understand policy clauses. PRISM is not an insurer, broker, TPA, medical provider, or law firm.
              </li>
              <li>
                <strong>Private storage &amp; tenant isolation:</strong> Documents are stored in private cloud storage and database rows are protected by PostgreSQL Row-Level Security (RLS) tied to authenticated user IDs.
              </li>
              <li>
                <strong>AI inference:</strong> Questions are processed by backend AI models using text retrieved from your uploaded policy. AI responses may contain errors and must be independently verified with your official policy schedule and insurer.
              </li>
              <li>
                <strong>No claim guarantees:</strong> PRISM assists with document organization and clause reference; it does not adjudicate, submit, approve, or guarantee insurance claims.
              </li>
            </ul>
          </div>

          {/* Table of Contents */}
          <nav aria-label="Privacy Policy Sections" className="mb-10 p-5 bg-slate-50 dark:bg-[#0B1220]/50 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Table of Contents
            </h2>
            <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-[#4F8CFF]">
              <li><a href="#section-1" className="hover:underline">1. Introduction</a></li>
              <li><a href="#section-2" className="hover:underline">2. Information We Collect</a></li>
              <li><a href="#section-3" className="hover:underline">3. How We Use Information</a></li>
              <li><a href="#section-4" className="hover:underline">4. Insurance Documents</a></li>
              <li><a href="#section-5" className="hover:underline">5. AI Processing Disclosure</a></li>
              <li><a href="#section-6" className="hover:underline">6. How We Protect Information</a></li>
              <li><a href="#section-7" className="hover:underline">7. Data Storage &amp; Infrastructure</a></li>
              <li><a href="#section-8" className="hover:underline">8. Data Retention</a></li>
              <li><a href="#section-9" className="hover:underline">9. Third-Party Services</a></li>
              <li><a href="#section-10" className="hover:underline">10. Authentication</a></li>
              <li><a href="#section-11" className="hover:underline">11. User Controls &amp; Data Rights</a></li>
              <li><a href="#section-12" className="hover:underline">12. Account Deletion</a></li>
              <li><a href="#section-13" className="hover:underline">13. Children&apos;s Privacy</a></li>
              <li><a href="#section-14" className="hover:underline">14. Changes to This Policy</a></li>
              <li><a href="#section-15" className="hover:underline">15. Contact Information</a></li>
            </ol>
          </nav>

          <div className="space-y-10 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {/* 1. Introduction */}
            <section id="section-1" className="pt-2">
              <h2 className="text-lg font-bold text-[#0B1220] dark:text-white mb-3">
                1. Introduction
              </h2>
              <p>
                PRISM (&quot;the Application,&quot; &quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) provides an AI-assisted insurance companion designed to help Indian health-insurance policyholders organize policy documents, understand complex coverage wording, and prepare documentation checklists for medical claims.
              </p>
              <p className="mt-2">
                We respect your personal privacy and the sensitivity of health insurance and medical paperwork. This Privacy Policy describes the categories of personal, policy, and technical data collected when using the PRISM web application and mobile application, how that data is processed and stored, and the controls available to you.
              </p>
              <p className="mt-2 text-xs text-slate-500">
                <strong>Important note:</strong> PRISM is an informational software tool. PRISM is not an insurance company, insurance broker, Corporate Agent, Third-Party Administrator (TPA), or healthcare provider.
              </p>
            </section>

            {/* 2. Information We Collect */}
            <section id="section-2" className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-[#0B1220] dark:text-white mb-3">
                2. Information We Collect
              </h2>
              <p>
                We only collect and process information necessary to deliver the features implemented within PRISM:
              </p>
              <div className="mt-4 space-y-4">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800/70">
                  <h3 className="font-semibold text-xs text-[#0B1220] dark:text-white uppercase tracking-wider mb-1.5">
                    A. Account Information
                  </h3>
                  <ul className="list-disc pl-5 text-xs space-y-1">
                    <li>Email address (used for Supabase authentication and account identification).</li>
                    <li>Display name / full name (optional profile field).</li>
                    <li>Contact phone number (optional profile field).</li>
                    <li>Date of birth, preferred language, and country (optional profile preferences).</li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800/70">
                  <h3 className="font-semibold text-xs text-[#0B1220] dark:text-white uppercase tracking-wider mb-1.5">
                    B. Insurance Policy Information
                  </h3>
                  <ul className="list-disc pl-5 text-xs space-y-1">
                    <li>Policy metadata: policy name, insurer name, policy number, policy type, insured member name.</li>
                    <li>Coverage terms: sum insured amount, premium amount, policy start and end dates.</li>
                    <li>Policy rules: room rent limits, co-payment percentages, waiting periods, deductibles, and sub-limits.</li>
                    <li>Uploaded documents: official policy schedule PDFs, Customer Information Sheets (CIS), and policy wording documents.</li>
                    <li>Extracted clauses: text sections and vector embeddings extracted from policy documents to enable search and Q&amp;A.</li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800/70">
                  <h3 className="font-semibold text-xs text-[#0B1220] dark:text-white uppercase tracking-wider mb-1.5">
                    C. Claim Preparation Records
                  </h3>
                  <ul className="list-disc pl-5 text-xs space-y-1">
                    <li>Claim metadata: claim title/type (Hospitalization, Day Care, Pre/Post-Hospitalization), insured patient name, hospital name.</li>
                    <li>Dates &amp; expenses: estimated admission date, discharge date, estimated expense amount, and currency.</li>
                    <li>Preparation status: checklist completion progress and user notes.</li>
                    <li>Claim documents: supporting files organized by the user (such as discharge summaries, bills, diagnostic reports, and payment receipts).</li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800/70">
                  <h3 className="font-semibold text-xs text-[#0B1220] dark:text-white uppercase tracking-wider mb-1.5">
                    D. AI Interaction Data
                  </h3>
                  <ul className="list-disc pl-5 text-xs space-y-1">
                    <li>Questions submitted by the user regarding policy coverage.</li>
                    <li>AI-generated answers, grounding indicators, confidence ratings, and chunk citations.</li>
                    <li>Conversation thread identifiers and timestamps.</li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800/70">
                  <h3 className="font-semibold text-xs text-[#0B1220] dark:text-white uppercase tracking-wider mb-1.5">
                    E. Device, Camera &amp; Technical Information
                  </h3>
                  <ul className="list-disc pl-5 text-xs space-y-1">
                    <li>
                      <strong>Camera usage (Mobile):</strong> Requested at runtime strictly when the user selects &quot;Scan with Camera&quot; in the mobile app. Captured page images are compiled locally into a PDF file and uploaded to the user&apos;s private document vault. The camera is not accessed in the background or for any other purpose.
                    </li>
                    <li>
                      <strong>Cookies &amp; Local Storage:</strong> Web authentication utilizes first-party session cookies managed by Supabase Auth (`@supabase/ssr`). Mobile uses local key-value storage (`SharedPreferences`) exclusively to persist the user&apos;s selected appearance theme (Light, Dark, or System). No third-party advertising or cross-site tracking cookies are used.
                    </li>
                    <li>
                      <strong>Server logs:</strong> Backend server operations log standard request metadata (HTTP method, endpoint path, status code, execution latency, and error traces) for system maintenance and debugging. We do not operate external advertising or tracking analytics SDKs.
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 3. How We Use Information */}
            <section id="section-3" className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-[#0B1220] dark:text-white mb-3">
                3. How We Use Information
              </h2>
              <p>We process the information collected exclusively for the following operational purposes:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1.5">
                <li>Extracting text and section structures from uploaded insurance documents using server-side document parsers.</li>
                <li>Generating vector embeddings of policy sections to enable accurate semantic clause retrieval.</li>
                <li>Providing grounded answers with verbatim section and page citations in response to user queries.</li>
                <li>Assisting users in organizing document checklists before submitting cashless or reimbursement claims to their insurer or TPA.</li>
                <li>Displaying in-app notifications regarding policy milestones (such as renewal dates or missing claim documents).</li>
                <li>Maintaining authenticated user sessions and securing access to private records.</li>
              </ul>
              <p className="mt-2 text-xs text-slate-500">
                We do not sell your personal data, policy information, or medical records to third parties, advertisers, or insurance brokers.
              </p>
            </section>

            {/* 4. Insurance Documents */}
            <section id="section-4" className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-[#0B1220] dark:text-white mb-3">
                4. Insurance Documents
              </h2>
              <p>
                When you upload an insurance document (PDF) or photograph policy pages via the mobile camera, the file is stored in a private Supabase Storage bucket (`policy-documents`).
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Direct public URLs are strictly disabled; files can only be downloaded or previewed via short-lived signed URLs generated for the authenticated account owner.</li>
                <li>Text content is extracted server-side using PyMuPDF (`fitz`), parsed into structured policy sections, and split into chunks with page number references.</li>
                <li>When you delete a document or policy in the application, the underlying storage file and associated database chunks are removed from the active system.</li>
              </ul>
            </section>

            {/* 5. AI Processing Disclosure */}
            <section id="section-5" className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-[#0B1220] dark:text-white mb-3">
                5. AI Processing Disclosure
              </h2>
              <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 space-y-2">
                <p className="font-semibold">
                  PLEASE READ THIS AI PROCESSING DISCLOSURE CAREFULLY:
                </p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>
                    PRISM uses artificial intelligence (AI) and Retrieval-Augmented Generation (RAG) to help users navigate and interpret text in their uploaded policy documents.
                  </li>
                  <li>
                    When you ask a question in &quot;Ask PRISM&quot;, our backend retrieves the most relevant text chunks from your policy and submits them along with your question to our server-side LLM provider (Groq Cloud API) to synthesize an answer.
                  </li>
                  <li>
                    <strong>AI responses may be incomplete, inaccurate, or outdated.</strong> Complex policy endorsements, sub-limits, state-specific rules, and exclusions may not always be correctly interpreted by automated models.
                  </li>
                  <li>
                    <strong>AI responses do not constitute insurance advice, medical advice, or legal advice.</strong> They are provided solely for personal informational reference.
                  </li>
                  <li>
                    <strong>PRISM does not guarantee claim outcomes.</strong> Insurers and Third-Party Administrators (TPAs) evaluate claims strictly according to official policy contracts, medical necessity, and regulatory guidelines.
                  </li>
                  <li>
                    You must always review your official policy schedule, consult your insurer or licensed insurance advisor, and verify critical information before making healthcare or financial decisions.
                  </li>
                </ul>
              </div>
            </section>

            {/* 6. How We Protect Information */}
            <section id="section-6" className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-[#0B1220] dark:text-white mb-3">
                6. How We Protect Information
              </h2>
              <p>
                We apply technical and architectural controls confirmed by the PRISM codebase to protect user data:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1.5">
                <li>
                  <strong>Authenticated Access:</strong> Every API endpoint and database interaction requires a valid JSON Web Token (JWT) issued by Supabase Auth upon successful login.
                </li>
                <li>
                  <strong>PostgreSQL Row-Level Security (RLS):</strong> Database tables (`policies`, `documents`, `policy_sections`, `document_chunks`, `claims`, `claim_documents`, `notifications`, `conversations`, `messages`, and `profiles`) enforce database-level row isolation via `auth.uid() = user_id`. Users cannot query, view, or modify records belonging to other users.
                </li>
                <li>
                  <strong>Private Storage Access:</strong> Uploaded policy PDFs and claim attachments are housed in private Supabase Storage buckets with strict access policies.
                </li>
                <li>
                  <strong>Encrypted Transmission:</strong> All web and mobile communications with the backend API and database operate over encrypted HTTPS/TLS connections.
                </li>
              </ul>
              <p className="mt-2 text-xs text-slate-500">
                While we implement industry-standard safeguards, no Internet transmission or cloud storage system is 100% immune from security vulnerabilities. We encourage users to use strong, unique passwords.
              </p>
            </section>

            {/* 7. Data Storage & Infrastructure */}
            <section id="section-7" className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-[#0B1220] dark:text-white mb-3">
                7. Data Storage &amp; Infrastructure
              </h2>
              <p>
                PRISM utilizes cloud infrastructure providers to host and operate the platform:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>
                  <strong>Database &amp; Storage:</strong> Hosted on Supabase (managed PostgreSQL with the pgvector extension for embedding searches, and Supabase Storage for uploaded PDF files).
                </li>
                <li>
                  <strong>Backend Services:</strong> Hosted on Railway (containerized FastAPI service handling document extraction, vector indexing, and AI query orchestration).
                </li>
                <li>
                  <strong>Web Frontend:</strong> Hosted on Vercel (Next.js web application serving the user interface).
                </li>
              </ul>
            </section>

            {/* 8. Data Retention */}
            <section id="section-8" className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-[#0B1220] dark:text-white mb-3">
                8. Data Retention
              </h2>
              <p>
                In the current implementation of PRISM, data is retained for as long as your account remains active, unless you manually delete items within the application or request account closure.
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>
                  <strong>User-initiated deletion:</strong> When you delete a policy, claim, or document inside the app, the associated record, extracted sections, document chunks, and storage files are immediately removed from active database tables.
                </li>
                <li>
                  <strong>Automated expiration:</strong> PRISM does not currently operate an automated time-based background purging schedule (e.g. automatic deletion after X months).
                </li>
                <li>
                  <strong>Formal retention policy:</strong> A standardized data retention schedule is subject to administrative review by the product owner in accordance with applicable legal and operational requirements.
                </li>
              </ul>
            </section>

            {/* 9. Third-Party Services */}
            <section id="section-9" className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-[#0B1220] dark:text-white mb-3">
                9. Third-Party Services
              </h2>
              <p>
                PRISM integrates with third-party service providers strictly to perform core system functions:
              </p>
              <div className="mt-3 space-y-3 text-xs">
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="font-semibold text-[#0B1220] dark:text-white">Supabase Inc.</div>
                  <div className="text-slate-600 dark:text-slate-400 mt-0.5">
                    Provides user authentication, PostgreSQL relational database hosting, pgvector similarity indexing, and private object storage.
                  </div>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="font-semibold text-[#0B1220] dark:text-white">Groq Inc.</div>
                  <div className="text-slate-600 dark:text-slate-400 mt-0.5">
                    Provides cloud-based LLM inference API used server-side by FastAPI to answer user questions based on retrieved policy text chunks. Requests are made via API and handled ephemerally. (Data processing and retention terms remain subject to Groq&apos;s standard commercial API policies and product owner verification).
                  </div>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="font-semibold text-[#0B1220] dark:text-white">Railway Corp.</div>
                  <div className="text-slate-600 dark:text-slate-400 mt-0.5">
                    Provides cloud container infrastructure hosting the Python FastAPI backend service.
                  </div>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="font-semibold text-[#0B1220] dark:text-white">Vercel Inc.</div>
                  <div className="text-slate-600 dark:text-slate-400 mt-0.5">
                    Provides cloud hosting and content delivery for the Next.js web application.
                  </div>
                </div>
              </div>
            </section>

            {/* 10. Authentication */}
            <section id="section-10" className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-[#0B1220] dark:text-white mb-3">
                10. Authentication
              </h2>
              <p>
                User accounts in PRISM are authenticated via Supabase Auth using email address and password credentials.
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Passwords are securely salted and hashed by Supabase Auth; PRISM does not store plain-text passwords.</li>
                <li>Successful login returns an authentication token (JWT) used to authenticate API requests and validate database permissions.</li>
                <li>You may sign out at any time from the web navigation bar or mobile settings screen to terminate the active local session.</li>
              </ul>
            </section>

            {/* 11. User Controls & Data Rights */}
            <section id="section-11" className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-[#0B1220] dark:text-white mb-3">
                11. User Controls &amp; Data Rights
              </h2>
              <p>
                You have active controls within PRISM to manage your personal and policy information:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1.5">
                <li>
                  <strong>View and inspect:</strong> Review all uploaded policies, extracted sections, claim dossiers, and Q&amp;A history at any time.
                </li>
                <li>
                  <strong>Edit:</strong> Update policy names, dates, amounts, and claim progress details directly in the interface.
                </li>
                <li>
                  <strong>Delete individual items:</strong> Delete specific documents, policies, or claim files. Deletion removes the row and associated chunks from the active database.
                </li>
                <li>
                  <strong>Local cache clearing (Mobile):</strong> Clear locally cached document preview files at any time via mobile Settings.
                </li>
              </ul>
            </section>

            {/* 12. Account Deletion */}
            <section id="section-12" className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-[#0B1220] dark:text-white mb-3">
                12. Account Deletion
              </h2>
              <p>
                Users have the right to request the permanent deletion of their account and all associated personal data.
              </p>
              <div className="mt-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                <p className="font-semibold text-[#0B1220] dark:text-white">
                  Available Account Deletion Process:
                </p>
                <p>
                  While individual documents and policies can be deleted directly in-app, complete account-level erasure (removal of the user authentication record from Supabase Auth and cascading purge of all user data) is currently initiated via a verified deletion request.
                </p>
                <p>
                  To request complete account deletion, visit our{' '}
                  <Link href="/delete-account" className="text-[#4F8CFF] underline">
                    Account Deletion page
                  </Link>{' '}
                  or send an email from your registered account address to{' '}
                  <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[11px]">
                    [PRISM support email — owner must configure]
                  </code>
                  . Upon receipt and identity confirmation, an administrator permanently deletes the account and all associated data.
                </p>
              </div>
            </section>

            {/* 13. Children's Privacy */}
            <section id="section-13" className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-[#0B1220] dark:text-white mb-3">
                13. Children&apos;s Privacy
              </h2>
              <p>
                PRISM is designed solely for adult policyholders (aged 18 and older) who manage health insurance contracts. We do not knowingly collect personal data from children under the age of 18. If a parent or guardian discovers that a child has created an account without parental consent, please contact us so that we may promptly remove the account and associated records.
              </p>
            </section>

            {/* 14. Changes to This Policy */}
            <section id="section-14" className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-[#0B1220] dark:text-white mb-3">
                14. Changes to This Policy
              </h2>
              <p>
                We may revise this Privacy Policy periodically to reflect enhancements in PRISM&apos;s capabilities, infrastructure changes, or regulatory developments. When updates are published, the &quot;Last Updated&quot; date and version indicator at the top of this page will be revised accordingly. Continued use of PRISM after an updated policy is posted signifies your review and acknowledgment of the changes.
              </p>
            </section>

            {/* 15. Contact Information */}
            <section id="section-15" className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-[#0B1220] dark:text-white mb-3">
                15. Contact Information
              </h2>
              <p>
                If you have questions regarding this Privacy Policy, your data rights, or data handling practices in PRISM, please reach out to our team:
              </p>
              <div className="mt-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                <div className="font-semibold text-[#0B1220] dark:text-white">PRISM Support &amp; Privacy Contact</div>
                <div>
                  Email: <span className="text-slate-500 font-mono">[PRISM support email — owner must configure]</span>
                </div>
                <div className="text-slate-500 mt-1">
                  <em>Note: Official support email address and entity contact details will be designated by the product owner prior to public distribution.</em>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

