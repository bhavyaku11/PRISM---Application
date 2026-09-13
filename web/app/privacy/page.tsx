import React from 'react';
import Link from 'next/link';
import { PrismLogo } from '@/components/ui/PrismLogo';

export const metadata = {
  title: 'Privacy Policy — PRISM',
  description: 'Privacy Policy and Data Protection Practices for PRISM AI Insurance Companion',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#F6F8FB] dark:bg-[#0B1220] text-[#111827] dark:text-[#F6F8FB]">
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

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-[#162A46] rounded-2xl p-8 sm:p-12 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-6 mb-8">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#4F8CFF]">
              Legal & Compliance
            </span>
            <h1 className="text-3xl font-bold mt-2 text-[#0B1220] dark:text-white">
              PRISM Privacy Policy
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              Last Updated: September 13, 2026 &middot; Version 1.0.0
            </p>
          </div>

          <div className="space-y-8 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            <section>
              <h2 className="text-lg font-bold text-[#0B1220] dark:text-white mb-3">
                1. Overview & Commitment
              </h2>
              <p>
                PRISM (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) operates the PRISM web and mobile applications as an AI Insurance Companion for Indian health-insurance policyholders. We recognize the sensitive nature of health insurance contracts and medical claim documentation. This Privacy Policy discloses our data collection, processing, storage, and retention practices in full transparency.
              </p>
              <div className="mt-3 p-4 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900/60 text-xs">
                <strong>Important Notice:</strong> PRISM is an informational decision-support companion and document organizer. We do not sell insurance, underwrite policies, adjudicate claims, or provide legal or medical advice.
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0B1220] dark:text-white mb-3">
                2. Data We Collect
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Account Information:</strong> When you register, we collect your name, email address, password hash, and optional contact phone number.
                </li>
                <li>
                  <strong>Insurance Policy Documents:</strong> Official policy schedule PDFs and physical document photos you upload for extraction, including insurer name, policy number, sum insured, premium, coverage clauses, waiting periods, room-rent limits, and exclusions.
                </li>
                <li>
                  <strong>Claim Preparation Records:</strong> Hospital name, patient relation, admission and discharge dates, estimated expenses, and attached supporting documents (such as discharge summaries, bills, and payment receipts) organized into claim dossiers.
                </li>
                <li>
                  <strong>AI Conversation History:</strong> Questions you submit regarding your policies and the AI-generated answers, citations, and evidence excerpts.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0B1220] dark:text-white mb-3">
                3. How We Process and Use Your Data
              </h2>
              <p>Your information is processed strictly to deliver PRISM&apos;s core companion capabilities:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Parsing and structuring your policy wording into searchable sections and vector embeddings.</li>
                <li>Retrieving verbatim clause excerpts to answer your specific coverage questions.</li>
                <li>Evaluating document checklist readiness before you file reimbursement or cashless claims.</li>
                <li>Delivering timely reminders regarding policy renewal deadlines and claim document requirements.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0B1220] dark:text-white mb-3">
                4. Third-Party AI Processing & Zero Model Training
              </h2>
              <p>
                PRISM uses a cloud-based architecture. Policy questions and retrieved clause excerpts are sent through our secure FastAPI backend to server-side AI infrastructure (Groq Cloud LLM API) for natural language reasoning and answer synthesis.
              </p>
              <div className="mt-3 p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900/60 text-xs">
                <strong>Zero Training Guarantee:</strong> Your uploaded insurance documents, medical records, and questions are <em>never</em> used to train, retrain, or improve public foundation AI models. Third-party inference requests are governed by commercial zero-retention API agreements.
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0B1220] dark:text-white mb-3">
                5. Storage Security & Row-Level Isolation
              </h2>
              <p>We implement rigorous technical safeguards to secure your data:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>
                  <strong>Row-Level Security (RLS):</strong> Every database query in our PostgreSQL database enforces cryptographic tenant isolation. User A cannot view, query, or modify records belonging to User B.
                </li>
                <li>
                  <strong>Private Storage Vaults:</strong> Uploaded documents are stored in private, isolated Supabase Storage buckets. Direct public URLs are strictly disabled; access requires short-lived signed URLs generated only for authenticated owners.
                </li>
                <li>
                  <strong>Encryption:</strong> All data in transit is encrypted using modern TLS 1.3 protocols. All database records and storage objects are encrypted at rest using AES-256.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0B1220] dark:text-white mb-3">
                6. Data Retention and Account Deletion
              </h2>
              <p>
                You maintain complete ownership of your data. You may delete locally cached documents via the mobile app settings. To request full account and cloud record deletion, visit our{' '}
                <Link href="/delete-account" className="text-[#4F8CFF] underline">
                  Account Deletion Request page
                </Link>{' '}
                or contact our compliance team. All associated policies, claims, documents, and chat records will be permanently erased within 30 days.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0B1220] dark:text-white mb-3">
                7. Contact Information
              </h2>
              <p>
                For questions, privacy inquiries, or regulatory data requests under applicable Indian digital personal data protection laws, please contact:
              </p>
              <p className="mt-2 font-medium">
                PRISM Privacy & Data Protection Office<br />
                Email: <a href="mailto:privacy@prism.app" className="text-[#4F8CFF]">privacy@prism.app</a><br />
                Support: <a href="mailto:support@prism.app" className="text-[#4F8CFF]">support@prism.app</a>
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
