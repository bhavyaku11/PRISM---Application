import React from 'react';
import Link from 'next/link';
import { PrismLogo } from '@/components/ui/PrismLogo';

export const metadata = {
  title: 'Delete Account & Data — PRISM',
  description: 'Request account and personal data deletion for PRISM AI Insurance Companion',
};

export default function DeleteAccountPage() {
  return (
    <div className="min-h-screen bg-[#F6F8FB] dark:bg-[#0B1220] text-[#111827] dark:text-[#F6F8FB]">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#0B1220]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <PrismLogo />
          <Link
            href="/"
            className="text-xs font-medium text-[#4F8CFF] hover:underline"
          >
            &larr; Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-[#162A46] rounded-2xl p-8 sm:p-12 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-6 mb-8">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-500">
              Account Control
            </span>
            <h1 className="text-3xl font-bold mt-2 text-[#0B1220] dark:text-white">
              Delete PRISM Account &amp; Personal Data
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              Data Subject Rights &amp; Permanent Erasure Procedure
            </p>
          </div>

          <div className="space-y-6 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            <p>
              PRISM users have the right to request the permanent deletion of their account and all associated personal records stored within our systems.
            </p>

            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-[#0B1220] dark:text-white mb-2">
                What data will be permanently deleted:
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li>Your authenticated account identity and profile details in Supabase Auth and database tables.</li>
                <li>All uploaded insurance policy documents, extracted clauses, and vector embeddings.</li>
                <li>All claim preparation records, hospital details, and attached supporting documents.</li>
                <li>All Q&amp;A chat histories, notifications, and settings preferences.</li>
              </ul>
            </div>

            <h2 className="text-lg font-bold text-[#0B1220] dark:text-white pt-4">
              How to Request Account &amp; Data Deletion:
            </h2>

            <div className="space-y-4">
              <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl">
                <h4 className="font-semibold text-sm text-[#0B1220] dark:text-white">
                  Step 1: Immediate In-App Document Deletion (Self-Service)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  You can immediately delete any individual policy, document, or claim file directly inside the PRISM web app or mobile app. Deleting an item removes the database record, extracted text chunks, vector embeddings, and storage file immediately.
                </p>
              </div>

              <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl">
                <h4 className="font-semibold text-sm text-[#0B1220] dark:text-white">
                  Step 2: Complete Account Closure &amp; Identity Erasure Request
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  To permanently delete your entire user account and all associated data, send an email request from your registered account email address to:
                </p>
                <div className="mt-2 p-3 bg-slate-100 dark:bg-slate-950 font-mono text-xs rounded-lg text-slate-800 dark:text-slate-200">
                  To: [PRISM support email — owner must configure]<br />
                  Subject: PRISM Account Deletion Request<br />
                  Body: Please permanently delete my PRISM user account and all associated policies, claims, documents, and conversations.
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 space-y-2">
              <p>
                <strong>Identity Verification &amp; Processing:</strong> For security, we verify that the deletion request originates from the verified account holder. Upon confirmation, an administrator permanently removes your user record and purges all associated cloud storage files and database records.
              </p>
              <p>
                <em>Note: Formal processing timeframe/SLA is subject to administrative policy configuration by the product owner prior to public launch.</em>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

