import React from 'react';
import Link from 'next/link';
import { PrismLogo } from '@/components/ui/PrismLogo';

export const metadata = {
  title: 'Terms of Service — PRISM',
  description: 'Terms of Service and Product Disclaimers for PRISM AI Insurance Companion',
};

export default function TermsOfServicePage() {
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
              Terms & Conditions
            </span>
            <h1 className="text-3xl font-bold mt-2 text-[#0B1220] dark:text-white">
              PRISM Terms of Service
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              Last Updated: September 13, 2026 &middot; Version 1.0.0
            </p>
          </div>

          <div className="space-y-8 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            <section>
              <h2 className="text-lg font-bold text-[#0B1220] dark:text-white mb-3">
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing or using the PRISM web application, Android application, or related API services (collectively, &quot;PRISM&quot;), you agree to be bound by these Terms of Service. If you do not agree, please do not use the service.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0B1220] dark:text-white mb-3">
                2. Scope of Service & Explicit Disclaimer
              </h2>
              <p>
                PRISM is an informational companion and document management tool developed for Indian health-insurance policyholders.
              </p>
              <div className="mt-3 p-4 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 space-y-2">
                <p>
                  <strong>CRITICAL PRODUCT BOUNDARIES:</strong>
                </p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>PRISM is NOT an insurance company, insurance broker, corporate agent, or licensed intermediary under IRDAI.</li>
                  <li>PRISM does NOT underwrite policies, issue coverage, or collect insurance premiums.</li>
                  <li>PRISM is NOT a Third-Party Administrator (TPA) and does NOT process, approve, deny, or settle insurance claims.</li>
                  <li>PRISM does NOT guarantee claim approval, reimbursement amounts, or dispute outcomes.</li>
                  <li>PRISM does NOT provide licensed legal advice, financial advice, or medical diagnosis.</li>
                </ul>
              </div>
              <p className="mt-3">
                All decisions regarding coverage interpretation, admissibility, and claim settlements rest exclusively with your insurer and designated TPA in accordance with the official policy wordings and regulatory guidelines.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0B1220] dark:text-white mb-3">
                3. User Responsibilities & Document Accuracy
              </h2>
              <p>
                You are responsible for ensuring that all documents uploaded to PRISM are legitimate copies of policies or claim records you have the lawful right to access. You acknowledge that AI extraction depends on the legibility and completeness of your uploaded documents. PRISM provides verbatim citations to assist you in reviewing your own contract, but you must consult your official policy documents for definitive terms.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0B1220] dark:text-white mb-3">
                4. Intellectual Property & License
              </h2>
              <p>
                PRISM and its design, branding, software, and AI workflows are the proprietary property of PRISM. We grant you a revocable, non-exclusive, non-transferable personal license to use the app for personal, non-commercial health insurance management.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0B1220] dark:text-white mb-3">
                5. Limitation of Liability
              </h2>
              <p>
                To the maximum extent permitted by law, PRISM and its creators shall not be liable for any indirect, incidental, or consequential damages resulting from any claim denial, delay in filing, or reliance on AI-generated summaries. Always verify critical medical or financial matters directly with your healthcare provider and insurance company.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0B1220] dark:text-white mb-3">
                6. Contact & Support
              </h2>
              <p>
                For inquiries regarding these Terms:
              </p>
              <p className="mt-2 font-medium">
                PRISM Legal & Operations Team<br />
                Email: <a href="mailto:support@prism.app" className="text-[#4F8CFF]">support@prism.app</a>
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
