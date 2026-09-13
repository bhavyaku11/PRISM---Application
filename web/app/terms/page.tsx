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
              PRISM Terms of Service
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              Last Updated: September 13, 2026 &middot; Version 1.1.0
            </p>
          </div>

          {/* Primary Disclaimers Banner */}
          <div className="mb-8 p-5 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 space-y-2">
            <p className="font-bold uppercase tracking-wider">
              Essential Product Disclaimer
            </p>
            <p className="leading-relaxed">
              &quot;PRISM helps you understand information contained in your insurance documents. It does not replace your policy, insurer, insurance advisor, doctor, or lawyer.&quot;
            </p>
            <p className="leading-relaxed">
              PRISM is an informational companion and document organizer. It is not an insurer, broker, agent, Third-Party Administrator (TPA), hospital, or law firm. PRISM does not provide medical diagnosis, medical treatment, formal legal advice, or financial advice, and does not guarantee insurance claim approval.
            </p>
          </div>

          {/* Table of Contents */}
          <nav aria-label="Terms of Service Sections" className="mb-10 p-5 bg-slate-50 dark:bg-[#0B1220]/50 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Table of Contents
            </h2>
            <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-[#4F8CFF]">
              <li><a href="#section-1" className="hover:underline">1. Acceptance of Terms</a></li>
              <li><a href="#section-2" className="hover:underline">2. Description of PRISM</a></li>
              <li><a href="#section-3" className="hover:underline">3. Informational Nature of the Service</a></li>
              <li><a href="#section-4" className="hover:underline">4. User Responsibilities</a></li>
              <li><a href="#section-5" className="hover:underline">5. Insurance Information &amp; Policy Primacy</a></li>
              <li><a href="#section-6" className="hover:underline">6. AI-Generated Content &amp; Limitations</a></li>
              <li><a href="#section-7" className="hover:underline">7. No Medical Advice</a></li>
              <li><a href="#section-8" className="hover:underline">8. No Legal Advice</a></li>
              <li><a href="#section-9" className="hover:underline">9. No Claim Guarantee</a></li>
              <li><a href="#section-10" className="hover:underline">10. Uploaded Documents &amp; User Content</a></li>
              <li><a href="#section-11" className="hover:underline">11. Acceptable Use</a></li>
              <li><a href="#section-12" className="hover:underline">12. Intellectual Property</a></li>
              <li><a href="#section-13" className="hover:underline">13. Service Availability &amp; Modifications</a></li>
              <li><a href="#section-14" className="hover:underline">14. Limitation of Liability</a></li>
              <li><a href="#section-15" className="hover:underline">15. Changes to Terms</a></li>
              <li><a href="#section-16" className="hover:underline">16. Contact Information</a></li>
            </ol>
          </nav>

          <div className="space-y-10 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {/* 1. Acceptance */}
            <section id="section-1" className="pt-2">
              <h2 className="text-lg font-bold text-[#0B1220] dark:text-white mb-3">
                1. Acceptance of Terms
              </h2>
              <p>
                By creating an account, accessing, or using the PRISM web application, Android mobile application, or associated services (collectively, &quot;PRISM&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;) and our Privacy Policy. If you do not agree to these Terms, you must not access or use PRISM.
              </p>
              <p className="mt-2 text-xs text-slate-500">
                You represent and warrant that you are at least 18 years of age and possess the legal authority to enter into these Terms.
              </p>
            </section>

            {/* 2. Description of PRISM */}
            <section id="section-2" className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-[#0B1220] dark:text-white mb-3">
                2. Description of PRISM
              </h2>
              <p>
                PRISM is an AI-assisted insurance companion designed to help Indian health-insurance policyholders:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Digitally store and organize health insurance policy schedules and claim documents.</li>
                <li>Extract text from uploaded policies into searchable sections and clause breakdowns.</li>
                <li>Submit questions regarding coverage, room rent limits, copays, waiting periods, and exclusions.</li>
                <li>Receive AI-synthesized responses with citations pointing to specific sections of their uploaded policy.</li>
                <li>Assemble pre-claim document readiness checklists for cashless hospitalization or reimbursement submissions.</li>
              </ul>
            </section>

            {/* 3. Informational Nature of the Service */}
            <section id="section-3" className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-[#0B1220] dark:text-white mb-3">
                3. Informational Nature of the Service
              </h2>
              <p>
                PRISM is strictly a decision-support and document management tool.
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>PRISM is NOT an insurance company, insurer, reinsurer, or underwriter.</li>
                <li>PRISM is NOT an insurance broker, Corporate Agent, web aggregator, or licensed intermediary under the Insurance Regulatory and Development Authority of India (IRDAI).</li>
                <li>PRISM does NOT sell, solicit, negotiate, underwrite, or bind insurance coverage.</li>
                <li>PRISM does NOT collect insurance premiums or administer insurance policies on behalf of insurers.</li>
                <li>PRISM is NOT a Third-Party Administrator (TPA) and does not adjudicate, evaluate, approve, or settle insurance claims.</li>
              </ul>
            </section>

            {/* 4. User Responsibilities */}
            <section id="section-4" className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-[#0B1220] dark:text-white mb-3">
                4. User Responsibilities
              </h2>
              <p>When using PRISM, you agree to:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Provide accurate account registration information and maintain the security of your password and credentials.</li>
                <li>Only upload policy documents, medical records, and bills that you own or are lawfully authorized to manage on behalf of an insured family member.</li>
                <li>Ensure uploaded PDF files and photographed pages are legible and complete.</li>
                <li>Independently verify all coverage terms and claim requirements directly with your insurer or TPA before making financial commitments or medical decisions.</li>
                <li>Immediately notify us if you suspect unauthorized access to your PRISM account.</li>
              </ul>
            </section>

            {/* 5. Insurance Information & Policy Primacy */}
            <section id="section-5" className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-[#0B1220] dark:text-white mb-3">
                5. Insurance Information &amp; Policy Primacy
              </h2>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                <p className="font-semibold text-[#0B1220] dark:text-white">
                  The Official Policy Contract Governs Exclusively:
                </p>
                <p>
                  Any summary, score, extracted clause, or answer generated by PRISM is intended solely to facilitate your personal review. The original, official insurance policy contract issued by your insurance company—including all policy schedules, endorsements, exclusions, deductibles, sub-limits, waiting period conditions, and definitions—remains the sole legally binding agreement between you and your insurer.
                </p>
                <p>
                  In any instance of conflict, discrepancy, or ambiguity between PRISM&apos;s output and the official policy wording, the official policy document and the insurer&apos;s contractual interpretation shall strictly govern.
                </p>
              </div>
            </section>

            {/* 6. AI-Generated Content & Limitations */}
            <section id="section-6" className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-[#0B1220] dark:text-white mb-3">
                6. AI-Generated Content &amp; Limitations
              </h2>
              <p>
                PRISM uses automated natural language processing and Retrieval-Augmented Generation (RAG) to parse policy documents and respond to queries. You acknowledge and accept that:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1.5">
                <li>
                  <strong>Possibility of Errors:</strong> Artificial intelligence models may generate incomplete, imprecise, or inaccurate responses, or misinterpret complex conditional clauses and sub-limits.
                </li>
                <li>
                  <strong>Document Dependency:</strong> PRISM&apos;s analysis depends strictly on the specific pages and text quality of documents you upload. If an endorsement, schedule amendment, or rider is missing from your upload, PRISM cannot account for it.
                </li>
                <li>
                  <strong>Verification Obligation:</strong> You must always inspect the cited policy page and verbatim excerpt provided in PRISM to verify that the answer accurately reflects your official contract.
                </li>
              </ul>
            </section>

            {/* 7. No Medical Advice */}
            <section id="section-7" className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-[#0B1220] dark:text-white mb-3">
                7. No Medical Advice
              </h2>
              <div className="p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs text-slate-700 dark:text-slate-300 space-y-2">
                <p className="font-semibold text-[#0B1220] dark:text-white">
                  PRISM IS NOT A HEALTHCARE PROVIDER:
                </p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>PRISM is NOT a doctor, physician, hospital, clinic, or telemedicine provider.</li>
                  <li>PRISM does NOT provide medical diagnosis, clinical evaluations, treatment suggestions, or medical triage.</li>
                  <li>While PRISM processes medical terminology (e.g. disease names, procedures, treatments) as written in your policy and bills, it does so purely for insurance document classification.</li>
                  <li>Never disregard professional medical advice or delay seeking emergency medical treatment based on information found in PRISM. Always consult a qualified medical professional for health concerns.</li>
                </ul>
              </div>
            </section>

            {/* 8. No Legal Advice */}
            <section id="section-8" className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-[#0B1220] dark:text-white mb-3">
                8. No Legal Advice
              </h2>
              <p>
                PRISM does NOT provide legal advice, dispute counsel, or legal representation. Any discussion of policy definitions, grievance timelines, regulatory references (such as IRDAI rules), or consumer rights is provided solely for educational and informational context. If you require legal advice or assistance with a disputed claim or insurance litigation, consult an advocate or qualified legal professional.
              </p>
            </section>

            {/* 9. No Claim Guarantee */}
            <section id="section-9" className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-[#0B1220] dark:text-white mb-3">
                9. No Claim Guarantee
              </h2>
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 space-y-2">
                <p className="font-semibold">
                  NO PROMISE OF CLAIM APPROVAL OR PAYMENT:
                </p>
                <p>
                  &quot;PRISM helps you organize claim information and identify relevant policy evidence. It does not determine whether an insurer will approve or pay a claim.&quot;
                </p>
                <p>
                  Claim admissibility, cashless pre-authorization, reimbursement amounts, deductions, co-payments, and claim denials are decided exclusively by your insurance company and their designated Third-Party Administrator (TPA). PRISM has no authority over claim decisions and makes no representation that any claim will be accepted, settled, or paid.
                </p>
              </div>
            </section>

            {/* 10. Uploaded Documents & User Content */}
            <section id="section-10" className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-[#0B1220] dark:text-white mb-3">
                10. Uploaded Documents &amp; User Content
              </h2>
              <p>
                You retain all ownership rights in the policy documents, claim files, and text you upload to PRISM.
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>You grant PRISM a limited, non-exclusive license to host, parse, index, chunk, and process your uploaded content solely to deliver the service to you.</li>
                <li>You agree not to upload content that contains malicious code, infringes third-party intellectual property rights, or violates applicable privacy laws.</li>
                <li>You may delete your uploaded files at any time through the application interface.</li>
              </ul>
            </section>

            {/* 11. Acceptable Use */}
            <section id="section-11" className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-[#0B1220] dark:text-white mb-3">
                11. Acceptable Use
              </h2>
              <p>You agree not to engage in any of the following prohibited activities:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Using PRISM for fraudulent insurance filings or misrepresenting medical or financial documents.</li>
                <li>Attempting to bypass database row-level security, tenant isolation, or authentication controls.</li>
                <li>Reverse engineering, decompiling, or disassembling the PRISM backend, mobile app, or APIs.</li>
                <li>Submitting adversarial prompt injection attacks or malicious payloads into the AI Q&amp;A system.</li>
                <li>Using automated scraping, crawling, or denial-of-service techniques against PRISM infrastructure.</li>
              </ul>
            </section>

            {/* 12. Intellectual Property */}
            <section id="section-12" className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-[#0B1220] dark:text-white mb-3">
                12. Intellectual Property
              </h2>
              <p>
                All software, user interface designs, logos, graphics, algorithms, and documentation associated with PRISM (excluding user-uploaded documents) are the intellectual property of PRISM and its creators. We grant you a personal, non-transferable, revocable license to use PRISM for your personal, non-commercial insurance management.
              </p>
            </section>

            {/* 13. Service Availability & Modifications */}
            <section id="section-13" className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-[#0B1220] dark:text-white mb-3">
                13. Service Availability &amp; Modifications
              </h2>
              <p>
                We endeavor to maintain reliable service, but PRISM is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. We do not guarantee that access will be uninterrupted, error-free, or continuously available. We reserve the right to modify, suspend, or discontinue any feature of PRISM at our discretion with reasonable notice when feasible.
              </p>
            </section>

            {/* 14. Limitation of Liability */}
            <section id="section-14" className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-[#0B1220] dark:text-white mb-3">
                14. Limitation of Liability
              </h2>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                <p className="font-semibold text-[#0B1220] dark:text-white uppercase">
                  Limitation of Damages:
                </p>
                <p>
                  To the maximum extent permitted under applicable law, PRISM, its developers, operators, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits, data, or coverage, arising out of or related to:
                </p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Any claim denial, claim reduction, or delayed claim decision by an insurance company or TPA.</li>
                  <li>Any reliance placed on AI-generated summaries, policy scores, or citations.</li>
                  <li>Failure to meet insurer notification deadlines, claim submission windows, or pre-authorization rules.</li>
                  <li>Any temporary unavailability, data loss, or system interruption.</li>
                </ul>
                <p>
                  Your sole remedy in the event of dissatisfaction with PRISM is to discontinue use of the service.
                </p>
              </div>
            </section>

            {/* 15. Changes to Terms */}
            <section id="section-15" className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-[#0B1220] dark:text-white mb-3">
                15. Changes to Terms
              </h2>
              <p>
                We may revise these Terms from time to time. When changes occur, we will update the &quot;Last Updated&quot; date and version indicator at the top of this document. Continued use of PRISM after revised Terms are posted constitutes your acceptance of the revised Terms.
              </p>
            </section>

            {/* 16. Contact Information */}
            <section id="section-16" className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-[#0B1220] dark:text-white mb-3">
                16. Contact Information
              </h2>
              <p>
                For questions regarding these Terms of Service, please contact:
              </p>
              <div className="mt-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                <div className="font-semibold text-[#0B1220] dark:text-white">PRISM Operations &amp; Support</div>
                <div>
                  Email: <span className="text-slate-500 font-mono">[PRISM support email — owner must configure]</span>
                </div>
                <div className="text-slate-500 mt-1">
                  <em>Note: Official operational and legal entity contact details will be designated by the product owner prior to public distribution.</em>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

