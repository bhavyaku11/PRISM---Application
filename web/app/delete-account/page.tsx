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
              Delete PRISM Account & Personal Data
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              Google Play Compliance &amp; Data Subject Rights
            </p>
          </div>

          <div className="space-y-6 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            <p>
              In accordance with Google Play developer policies and applicable personal data protection laws, PRISM users have the right to request the permanent deletion of their account and all associated personal records.
            </p>

            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-[#0B1220] dark:text-white mb-2">
                What data will be permanently deleted:
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li>Your authenticated account identity and profile details.</li>
                <li>All uploaded insurance policy documents, extracted clauses, and vector embeddings.</li>
                <li>All claim preparation records, hospital bills, and attached claim documents.</li>
                <li>All Q&amp;A chat histories, notifications, and settings preferences.</li>
              </ul>
            </div>

            <h2 className="text-lg font-bold text-[#0B1220] dark:text-white pt-4">
              How to Request Account &amp; Data Deletion:
            </h2>

            <div className="space-y-4">
              <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl">
                <h4 className="font-semibold text-sm text-[#0B1220] dark:text-white">
                  Option 1: In-App Settings (Mobile / Web)
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Navigate to <strong>Settings &rarr; Data Controls &rarr; Account &amp; Data Deletion</strong> in either the PRISM mobile app or web dashboard to view your data retention settings and initiate an erasure ticket.
                </p>
              </div>

              <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl">
                <h4 className="font-semibold text-sm text-[#0B1220] dark:text-white">
                  Option 2: Direct Email Request
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Send an email from your registered PRISM account email address to:
                </p>
                <div className="mt-2 p-3 bg-slate-100 dark:bg-slate-950 font-mono text-xs rounded-lg text-slate-800 dark:text-slate-200">
                  To: privacy@prism.app<br />
                  Subject: Account &amp; Data Deletion Request<br />
                  Body: Please permanently delete my PRISM account and all associated policy documents and claims.
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 space-y-2">
              <p>
                <strong>Verification &amp; SLA:</strong> For security, we verify that the request originates from the verified account owner. Once verified, all cloud records in PostgreSQL and Supabase Storage are permanently purged within <strong>30 calendar days</strong>.
              </p>
              <p>
                Questions? Contact our Data Protection Officer at{' '}
                <a href="mailto:privacy@prism.app" className="text-[#4F8CFF] underline">
                  privacy@prism.app
                </a>.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
