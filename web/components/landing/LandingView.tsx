'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PrismLogo } from '@/components/ui/PrismLogo';
import {
  IconFileText,
  IconSparkles,
  IconClipboardCheck,
  IconFolderOpen,
  IconShieldAlert,
  IconShieldCheck,
  IconDownload,
  IconExternalLink,
  IconArrowRight,
  IconCheckCircle,
  IconInfo,
  IconClock,
  IconBookOpen,
} from '@/components/ui/icons';
import type { Profile } from '@/types/auth';

interface LandingViewProps {
  userEmail?: string | null;
  profile?: Profile | null;
}

const GITHUB_REPO_URL = 'https://github.com/bhavyaku11/PRISM---Application';
const GITHUB_RELEASE_URL = 'https://github.com/bhavyaku11/PRISM---Application/releases/tag/v1.0.0';
const GITHUB_APK_DOWNLOAD_URL =
  'https://github.com/bhavyaku11/PRISM---Application/releases/download/v1.0.0/PRISM-v1.0.0-Android.apk';

export function LandingView({ userEmail }: LandingViewProps) {
  return (
    <div className="flex-1 flex flex-col bg-[#F6F8FB] dark:bg-[#0B1220] text-[#111827] dark:text-[#F6F8FB] transition-colors selection:bg-[#4F8CFF]/20 selection:text-[#0B1220] dark:selection:text-[#6ED7E8]">
      {/* ============================================================ */}
      {/* 1. HERO SECTION                                              */}
      {/* ============================================================ */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 overflow-hidden">
        {/* Subtle geometric prism glow in background */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 pointer-events-none opacity-40 dark:opacity-25"
          aria-hidden="true"
        >
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-[#162A46]/20 via-[#4F8CFF]/15 to-[#6ED7E8]/20 blur-3xl rounded-full" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            {/* Eyebrow badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/50 text-[#4F8CFF] text-xs font-semibold tracking-wider uppercase mb-6 shadow-xs backdrop-blur-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4F8CFF] animate-pulse" />
              <span>PRISM</span>
              <span className="text-slate-300 dark:text-slate-700">&middot;</span>
              <span className="text-slate-700 dark:text-slate-300 font-medium">AI Insurance Companion</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#0B1220] dark:text-white leading-[1.15]">
              Understand your insurance{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#162A46] via-[#4F8CFF] to-[#6ED7E8] dark:from-[#4F8CFF] dark:to-[#6ED7E8]">
                before you need it.
              </span>
            </h1>

            {/* Core Message & Subtitle */}
            <p className="mt-6 text-lg sm:text-xl font-medium text-[#162A46] dark:text-slate-200 leading-snug">
              Understand your policy. Find what matters. Be better prepared when you need to make a claim.
            </p>

            <p className="mt-4 text-sm sm:text-base text-[#667085] dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              PRISM helps you understand your health-insurance policy, find important coverage details, ask grounded
              questions, and prepare for claims.
            </p>

            {/* Call To Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <a
                href="#download"
                className="w-full sm:w-auto h-12 px-7 inline-flex items-center justify-center gap-2.5 font-medium text-sm rounded-xl text-white bg-[#0B1220] hover:bg-[#162A46] dark:bg-[#4F8CFF] dark:hover:bg-[#3d7ae8] transition-all shadow-sm active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]/50"
              >
                <IconDownload size={18} />
                <span>Download PRISM for Android</span>
                <span className="text-xs py-0.5 px-1.5 rounded-md bg-white/20 dark:bg-white/25 font-mono">v1.0.0</span>
              </a>

              {userEmail ? (
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto h-12 px-7 inline-flex items-center justify-center gap-2 font-medium text-sm rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/40 text-[#4F8CFF] dark:text-[#6ED7E8] hover:bg-blue-100/70 dark:hover:bg-blue-950/70 transition-colors shadow-xs"
                >
                  <span>Go to your workspace</span>
                  <IconArrowRight size={16} />
                </Link>
              ) : (
                <a
                  href="#features"
                  className="w-full sm:w-auto h-12 px-7 inline-flex items-center justify-center gap-2 font-medium text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[#0B1220] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
                >
                  <span>Explore PRISM</span>
                  <IconArrowRight size={16} />
                </a>
              )}
            </div>

            {/* Key Quality Pillars */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[#667085] dark:text-slate-400 font-medium">
              <span className="inline-flex items-center gap-1.5">
                <IconShieldCheck size={15} className="text-[#4F8CFF]" />
                100% Policy Grounded
              </span>
              <span className="text-slate-300 dark:text-slate-700">&bull;</span>
              <span className="inline-flex items-center gap-1.5">
                <IconCheckCircle size={15} className="text-[#6ED7E8]" />
                Exact Clause Citations
              </span>
              <span className="text-slate-300 dark:text-slate-700">&bull;</span>
              <span className="inline-flex items-center gap-1.5">
                <IconClipboardCheck size={15} className="text-[#4F8CFF]" />
                Pre-Claim Checklists
              </span>
            </div>
          </div>

          {/* ============================================================ */}
          {/* 2. PRODUCT VISUAL SHOWCASE                                   */}
          {/* ============================================================ */}
          <div className="mt-14 sm:mt-20 max-w-5xl mx-auto">
            <div className="relative rounded-3xl p-4 sm:p-8 bg-gradient-to-b from-white/90 to-slate-50/70 dark:from-slate-900/80 dark:to-[#0E1726]/90 border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none backdrop-blur-md">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Left Showcase Side: Real Android Phone Frame */}
                <div className="lg:col-span-5 flex justify-center">
                  <div className="relative w-64 sm:w-72 rounded-[42px] p-3 bg-[#0B1220] shadow-2xl border-4 border-slate-700/60 dark:border-slate-800 ring-1 ring-white/10">
                    {/* Speaker notch / camera bar */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-4 bg-[#0B1220] rounded-full z-20 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-800 ring-1 ring-slate-700" />
                    </div>

                    {/* Physical screenshot display */}
                    <div className="relative rounded-[32px] overflow-hidden bg-slate-900 aspect-[9/16] shadow-inner">
                      <Image
                        src="/screenshots/android_dashboard.png"
                        alt="PRISM Android Mobile Dashboard running on physical device"
                        width={600}
                        height={1067}
                        className="w-full h-full object-cover object-top"
                        priority
                      />
                    </div>
                  </div>
                </div>

                {/* Right Showcase Side: Interactive Real PRISM UI Breakdown */}
                <div className="lg:col-span-7 space-y-4 text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#4F8CFF] text-xs font-semibold uppercase tracking-wider">
                    <span>Live Architecture</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-[#0B1220] dark:text-white">
                    Clarity at your fingertips, backed by verified wording.
                  </h3>
                  <p className="text-sm text-[#667085] dark:text-slate-300 leading-relaxed">
                    PRISM processes multi-page policy wordings, indexes coverage limits into structured sections, and
                    provides evidence cards whenever you have questions.
                  </p>

                  {/* UI Feature Preview Cards */}
                  <div className="space-y-3 pt-2">
                    {/* Feature 1: Structured Coverage */}
                    <div className="p-3.5 rounded-xl bg-white dark:bg-[#162A46]/50 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#4F8CFF] shrink-0 mt-0.5">
                        <IconFileText size={18} />
                      </div>
                      <div className="text-xs">
                        <div className="font-semibold text-[#0B1220] dark:text-white">
                          Structured Policy Extraction
                        </div>
                        <div className="text-[#667085] dark:text-slate-400 mt-0.5">
                          Instantly reads sum insured, room rent limits, copay requirements, and deductibles without
                          hunting through 60-page PDF documents.
                        </div>
                      </div>
                    </div>

                    {/* Feature 2: Evidence-backed Grounded Answers */}
                    <div className="p-3.5 rounded-xl bg-white dark:bg-[#162A46]/50 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-[#007481] dark:text-[#6ED7E8] shrink-0 mt-0.5">
                        <IconSparkles size={18} />
                      </div>
                      <div className="text-xs">
                        <div className="font-semibold text-[#0B1220] dark:text-white">
                          Grounded Policy Evidence & Citations
                        </div>
                        <div className="text-[#667085] dark:text-slate-400 mt-0.5">
                          Every answer includes the specific policy section and page citation. If evidence is
                          insufficient, PRISM clearly tells you rather than hallucinating.
                        </div>
                      </div>
                    </div>

                    {/* Feature 3: Claim Readiness */}
                    <div className="p-3.5 rounded-xl bg-white dark:bg-[#162A46]/50 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                        <IconClipboardCheck size={18} />
                      </div>
                      <div className="text-xs">
                        <div className="font-semibold text-[#0B1220] dark:text-white">
                          Pre-Claim Organization Workspace
                        </div>
                        <div className="text-[#667085] dark:text-slate-400 mt-0.5">
                          Interactive document checklists for cashless hospital admission, pre-authorization, and
                          reimbursement filings.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. CORE FEATURES SECTION                                     */}
      {/* ============================================================ */}
      <section id="features" className="py-16 sm:py-24 border-t border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#4F8CFF] block mb-2">
              Designed For Policyholders
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B1220] dark:text-white tracking-tight">
              Everything you need to navigate your policy with confidence.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#667085] dark:text-slate-300">
              Only authentic capabilities that actually exist in PRISM today.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Feature 1: Understand Your Policy */}
            <div className="rounded-2xl p-6 bg-white dark:bg-[#162A46]/40 border border-slate-200/80 dark:border-slate-800 hover:border-[#4F8CFF]/50 transition-colors shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#4F8CFF] flex items-center justify-center mb-4">
                  <IconFileText size={20} />
                </div>
                <h3 className="text-base font-bold text-[#0B1220] dark:text-white mb-2">
                  Understand Your Policy
                </h3>
                <p className="text-xs text-[#667085] dark:text-slate-300 leading-relaxed">
                  Turn complex policy documents into information that is easier to understand. Review core terms,
                  coverage limits, room rent caps, copays, and exclusions in plain language.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-[11px] font-medium text-[#4F8CFF] flex items-center gap-1.5">
                <IconCheckCircle size={14} />
                <span>PDF parsing & section structure</span>
              </div>
            </div>

            {/* Feature 2: Ask PRISM */}
            <div className="rounded-2xl p-6 bg-white dark:bg-[#162A46]/40 border border-slate-200/80 dark:border-slate-800 hover:border-[#4F8CFF]/50 transition-colors shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-[#007481] dark:text-[#6ED7E8] flex items-center justify-center mb-4">
                  <IconSparkles size={20} />
                </div>
                <h3 className="text-base font-bold text-[#0B1220] dark:text-white mb-2">
                  Ask PRISM
                </h3>
                <p className="text-xs text-[#667085] dark:text-slate-300 leading-relaxed">
                  Ask questions about your policy and receive answers grounded in the uploaded policy evidence. Every
                  response references exact clauses so you can verify the terms yourself.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-[11px] font-medium text-[#007481] dark:text-[#6ED7E8] flex items-center gap-1.5">
                <IconCheckCircle size={14} />
                <span>Zero hallucination guardrails</span>
              </div>
            </div>

            {/* Feature 3: Prepare for Claims */}
            <div className="rounded-2xl p-6 bg-white dark:bg-[#162A46]/40 border border-slate-200/80 dark:border-slate-800 hover:border-[#4F8CFF]/50 transition-colors shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                  <IconClipboardCheck size={20} />
                </div>
                <h3 className="text-base font-bold text-[#0B1220] dark:text-white mb-2">
                  Prepare for Claims
                </h3>
                <p className="text-xs text-[#667085] dark:text-slate-300 leading-relaxed">
                  Organize claim information, documents, and relevant policy evidence before filing. Build clear
                  checklists for discharge summaries, diagnostic reports, and medical bills.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <IconCheckCircle size={14} />
                <span>Cashless & reimbursement guidance</span>
              </div>
            </div>

            {/* Feature 4: Keep Your Documents Organized */}
            <div className="rounded-2xl p-6 bg-white dark:bg-[#162A46]/40 border border-slate-200/80 dark:border-slate-800 hover:border-[#4F8CFF]/50 transition-colors shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
                  <IconFolderOpen size={20} />
                </div>
                <h3 className="text-base font-bold text-[#0B1220] dark:text-white mb-2">
                  Keep Your Documents Organized
                </h3>
                <p className="text-xs text-[#667085] dark:text-slate-300 leading-relaxed">
                  Keep policies and supporting documents organized in one place. Store multi-year policy documents,
                  endorsements, and claim receipts securely with instant access.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-[11px] font-medium text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                <IconCheckCircle size={14} />
                <span>Private user policy vault</span>
              </div>
            </div>

            {/* Feature 5: Know What Needs Attention */}
            <div className="rounded-2xl p-6 bg-white dark:bg-[#162A46]/40 border border-slate-200/80 dark:border-slate-800 hover:border-[#4F8CFF]/50 transition-colors shadow-xs flex flex-col justify-between md:col-span-2 lg:col-span-2">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                  <IconClock size={20} />
                </div>
                <h3 className="text-base font-bold text-[#0B1220] dark:text-white mb-2">
                  Know What Needs Attention
                </h3>
                <p className="text-xs text-[#667085] dark:text-slate-300 leading-relaxed">
                  Surface important policy information such as waiting periods for pre-existing diseases (PED), specific
                  illness waiting periods, restoration rules, room rent sub-limits, and renewal-related information.
                  Never be caught by surprise when seeking hospital authorization.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-[11px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <IconCheckCircle size={14} />
                <span>Transparent coverage rules & limits</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. HOW PRISM WORKS                                           */}
      {/* ============================================================ */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-white/70 dark:bg-[#0E1726]/50 border-t border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#4F8CFF] block mb-2">
              Simple 4-Step Process
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B1220] dark:text-white tracking-tight">
              How PRISM Works
            </h2>
            <p className="mt-3 text-sm text-[#667085] dark:text-slate-300">
              Clear document ingestion and grounded exploration designed for everyday policyholders.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* Step 1 */}
            <div className="relative p-6 rounded-2xl bg-white dark:bg-[#162A46]/60 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-3xl font-extrabold font-mono text-slate-300 dark:text-slate-700 block mb-3">
                01
              </span>
              <h3 className="text-sm font-bold text-[#0B1220] dark:text-white mb-2">
                Add your policy
              </h3>
              <p className="text-xs text-[#667085] dark:text-slate-400 leading-relaxed">
                Upload your official policy wording PDF via web, or scan pages directly with the Android camera.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative p-6 rounded-2xl bg-white dark:bg-[#162A46]/60 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-3xl font-extrabold font-mono text-slate-300 dark:text-slate-700 block mb-3">
                02
              </span>
              <h3 className="text-sm font-bold text-[#0B1220] dark:text-white mb-2">
                Let PRISM process it
              </h3>
              <p className="text-xs text-[#667085] dark:text-slate-400 leading-relaxed">
                Text is securely extracted, structured into searchable clauses, and indexed into private vector sections.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative p-6 rounded-2xl bg-white dark:bg-[#162A46]/60 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-3xl font-extrabold font-mono text-slate-300 dark:text-slate-700 block mb-3">
                03
              </span>
              <h3 className="text-sm font-bold text-[#0B1220] dark:text-white mb-2">
                Ask questions & explore coverage
              </h3>
              <p className="text-xs text-[#667085] dark:text-slate-400 leading-relaxed">
                Query day-care procedures, waiting periods, room rents, or deductibles and inspect cited policy clauses.
              </p>
            </div>

            {/* Step 4 */}
            <div className="relative p-6 rounded-2xl bg-white dark:bg-[#162A46]/60 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-3xl font-extrabold font-mono text-slate-300 dark:text-slate-700 block mb-3">
                04
              </span>
              <h3 className="text-sm font-bold text-[#0B1220] dark:text-white mb-2">
                Prepare when you need to use it
              </h3>
              <p className="text-xs text-[#667085] dark:text-slate-400 leading-relaxed">
                Generate pre-claim checklists, track required bills, and organize evidence before hospital admission.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. TRUST & SAFETY SECTION                                    */}
      {/* ============================================================ */}
      <section id="trust" className="py-16 sm:py-24 border-t border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl p-6 sm:p-10 bg-white dark:bg-[#162A46]/40 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#4F8CFF] flex items-center justify-center">
                <IconShieldCheck size={22} />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#4F8CFF] block">
                  Product Boundaries & Ethics
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-[#0B1220] dark:text-white">
                  Transparent By Design
                </h2>
              </div>
            </div>

            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
              PRISM is built to help users understand their health insurance policy terms and organize documents for
              smoother claim preparation. We believe in strict truthfulness and realistic expectations.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* What PRISM Is */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
                  <IconCheckCircle size={15} />
                  <span>What PRISM Is</span>
                </div>
                <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
                  <li>&bull; An informational decision-support companion</li>
                  <li>&bull; A structured policy clause reader and search tool</li>
                  <li>&bull; A claim documentation organizer and readiness checklist</li>
                  <li>&bull; A tool citing exact page numbers from your uploaded document</li>
                </ul>
              </div>

              {/* What PRISM Does Not Do */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60">
                <div className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 mb-2 flex items-center gap-1.5">
                  <IconShieldAlert size={15} />
                  <span>What PRISM Does Not Do</span>
                </div>
                <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
                  <li>&bull; Does not guarantee claim approval or payouts</li>
                  <li>&bull; Does not provide medical diagnoses or healthcare advice</li>
                  <li>&bull; Does not provide formal legal advice or litigation representation</li>
                  <li>&bull; Does not directly submit claims or act as an insurance broker</li>
                </ul>
              </div>
            </div>

            {/* Technical boundaries notice */}
            <div className="mt-6 p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/50 flex items-start gap-3">
              <IconInfo size={18} className="text-[#4F8CFF] shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <strong>Data Handling:</strong> Policy documents and questions are isolated using PostgreSQL Row Level
                Security (RLS). AI inference operates ephemerally via server-side retrieval-augmented generation without
                using your personal claims data for public foundation model training.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 6. ANDROID DOWNLOAD SECTION                                  */}
      {/* ============================================================ */}
      <section id="download" className="py-16 sm:py-24 bg-gradient-to-b from-white/40 to-slate-100/80 dark:from-[#0B1220] dark:to-[#0E1726] border-t border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/50 text-[#4F8CFF] text-xs font-semibold uppercase tracking-wider mb-4">
            <IconDownload size={14} />
            <span>Mobile Distribution</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B1220] dark:text-white tracking-tight">
            PRISM for Android
          </h2>
          <p className="mt-2 text-base text-[#667085] dark:text-slate-300">
            Take your insurance companion with you.
          </p>

          {/* Download Box */}
          <div className="mt-8 rounded-3xl p-6 sm:p-10 bg-white dark:bg-[#162A46]/60 border border-slate-200 dark:border-slate-800 shadow-md max-w-2xl mx-auto text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="text-lg font-bold text-[#0B1220] dark:text-white flex items-center gap-2">
                  <span>PRISM Android Release APK</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-semibold">
                    v1.0.0
                  </span>
                </div>
                <p className="text-xs text-[#667085] dark:text-slate-400 mt-1">
                  Universal release package &middot; Direct APK distribution
                </p>
              </div>

              {/* Direct Download Button */}
              <a
                href={GITHUB_APK_DOWNLOAD_URL}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-medium text-sm text-white bg-[#4F8CFF] hover:bg-[#3d7ae8] transition-all shadow-sm active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]/50 shrink-0"
              >
                <IconDownload size={18} />
                <span>Download PRISM APK</span>
              </a>
            </div>

            {/* Specifications Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-b border-slate-200 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Version</span>
                <span className="font-semibold text-[#0B1220] dark:text-white font-mono">1.0.0+1</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">APK Size</span>
                <span className="font-semibold text-[#0B1220] dark:text-white font-mono">~57.9 MB</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Target Android</span>
                <span className="font-semibold text-[#0B1220] dark:text-white">Android 7.0 – 16</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Signing Status</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <IconCheckCircle size={13} />
                  Release v2
                </span>
              </div>
            </div>

            {/* Installation Guidance Note */}
            <div className="mt-6 text-xs text-[#667085] dark:text-slate-400 space-y-2 leading-relaxed">
              <p className="font-medium text-[#0B1220] dark:text-slate-200">
                Installation Instructions:
              </p>
              <p>
                Android APK. You may need to allow installation from your browser/file manager when installing an APK
                outside Google Play. This is standard for direct APK installations.
              </p>
              <p className="text-[11px] text-slate-500">
                <em>Note: PRISM is distributed via direct APK release and is not currently published on Google Play.</em>
              </p>

              <div className="pt-2 flex items-center gap-4">
                <a
                  href={GITHUB_RELEASE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-[#4F8CFF] hover:underline inline-flex items-center gap-1"
                >
                  <span>View GitHub Release & Checksums</span>
                  <IconExternalLink size={13} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 7. GITHUB REPOSITORY LINK SECTION                             */}
      {/* ============================================================ */}
      <section className="py-12 border-t border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-[#162A46]/30 border border-slate-200 dark:border-slate-800 shadow-xs w-full">
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0">
                <IconBookOpen size={20} />
              </div>
              <div>
                <div className="text-sm font-bold text-[#0B1220] dark:text-white">
                  Open Source Architecture & Monorepo
                </div>
                <div className="text-xs text-[#667085] dark:text-slate-400">
                  Inspect the FastAPI backend, Next.js web application, and Flutter mobile client on GitHub.
                </div>
              </div>
            </div>

            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#0B1220] dark:text-white border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5 shrink-0"
            >
              <span>View PRISM on GitHub</span>
              <IconExternalLink size={14} />
            </a>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 8. FOOTER                                                    */}
      {/* ============================================================ */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1220] py-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand column */}
            <div className="md:col-span-2 space-y-3">
              <PrismLogo size="md" href="/" />
              <p className="text-xs text-[#667085] dark:text-slate-400 max-w-sm leading-relaxed">
                PRISM is an AI Insurance Companion designed to help users understand their health-insurance policies,
                explore coverage limits, and prepare for claims with verified evidence.
              </p>
            </div>

            {/* Product navigation links */}
            <div>
              <div className="font-semibold text-xs uppercase tracking-wider text-[#0B1220] dark:text-slate-200 mb-3">
                Product
              </div>
              <ul className="space-y-2">
                <li>
                  <a href="#features" className="hover:text-[#4F8CFF] transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-[#4F8CFF] transition-colors">
                    How it works
                  </a>
                </li>
                <li>
                  <a href="#trust" className="hover:text-[#4F8CFF] transition-colors">
                    Trust & Safety
                  </a>
                </li>
                <li>
                  <a href="#download" className="hover:text-[#4F8CFF] transition-colors">
                    Android APK Download
                  </a>
                </li>
                <li>
                  <a
                    href={GITHUB_REPO_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#4F8CFF] transition-colors inline-flex items-center gap-1"
                  >
                    <span>GitHub</span>
                    <IconExternalLink size={11} />
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal and compliance links */}
            <div>
              <div className="font-semibold text-xs uppercase tracking-wider text-[#0B1220] dark:text-slate-200 mb-3">
                Legal & Privacy
              </div>
              <ul className="space-y-2">
                <li>
                  <Link href="/privacy" className="hover:text-[#4F8CFF] transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-[#4F8CFF] transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/delete-account" className="hover:text-rose-500 transition-colors">
                    Delete Account
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Legal Notice Bar */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <span className="text-[11px] text-slate-400">
              &copy; {new Date().getFullYear()} PRISM. All rights reserved.
            </span>
            <span className="text-[11px] text-slate-400 max-w-xl text-center sm:text-right">
              Informational companion &middot; Not an insurer, licensed insurance seller, healthcare provider, or legal
              authority.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
