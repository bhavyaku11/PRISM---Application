'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Policy } from '@/types/policy';
import type {
  ComparisonRow,
  PolicyComparisonResult,
  PolicyComparisonValue,
} from '@/types/comparison';
import {
  IconSlidersHorizontal,
  IconShield,
  IconSparkles,
  IconCheckCircle,
  IconAlertTriangle,
  IconInfo,
  IconEye,
  IconX,
  IconClock,
  IconHeartPulse,
  IconReceipt,
  IconFileText,
  IconBookOpen,
  IconLayoutDashboard,
  IconCopy,
  IconCheck,
  IconBot,
} from '@/components/ui/icons';

interface PolicyComparisonViewProps {
  userPolicies: Policy[];
  selectedPolicyA: Policy;
  selectedPolicyB: Policy;
  comparisonResult: PolicyComparisonResult;
  isProcessingA: boolean;
  isProcessingB: boolean;
}

interface EvidenceDrawerState {
  isOpen: boolean;
  policyName: string;
  insurerName: string;
  featureLabel: string;
  pageNumber: number | null;
  sectionTitle: string | null;
  documentName: string | null;
  excerpt: string | null;
  statedValue: string;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  overview: <IconLayoutDashboard size={16} />,
  coverage: <IconHeartPulse size={16} />,
  waiting_periods: <IconClock size={16} />,
  cost_sharing: <IconReceipt size={16} />,
  limits: <IconShield size={16} />,
  exclusions: <IconAlertTriangle size={16} />,
  claims: <IconFileText size={16} />,
};

export function PolicyComparisonView({
  userPolicies,
  selectedPolicyA,
  selectedPolicyB,
  comparisonResult,
  isProcessingA,
  isProcessingB,
}: PolicyComparisonViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<string>('all');
  const [copied, setCopied] = useState(false);
  const [drawer, setDrawer] = useState<EvidenceDrawerState>({
    isOpen: false,
    policyName: '',
    insurerName: '',
    featureLabel: '',
    pageNumber: null,
    sectionTitle: null,
    documentName: null,
    excerpt: null,
    statedValue: '',
  });

  const handleSelectA = (id: string) => {
    if (id === selectedPolicyB.id) return;
    startTransition(() => {
      router.push(`/compare?policyA=${id}&policyB=${selectedPolicyB.id}`);
    });
  };

  const handleSelectB = (id: string) => {
    if (id === selectedPolicyA.id) return;
    startTransition(() => {
      router.push(`/compare?policyA=${selectedPolicyA.id}&policyB=${id}`);
    });
  };

  const handleSwap = () => {
    startTransition(() => {
      router.push(
        `/compare?policyA=${selectedPolicyB.id}&policyB=${selectedPolicyA.id}`
      );
    });
  };

  const openDrawer = (
    policy: Policy,
    featureLabel: string,
    val: PolicyComparisonValue
  ) => {
    setDrawer({
      isOpen: true,
      policyName: policy.policy_name,
      insurerName: policy.insurer_name,
      featureLabel,
      pageNumber: val.pageNumber ?? null,
      sectionTitle: val.sectionTitle ?? null,
      documentName: val.documentName ?? null,
      excerpt: val.excerpt ?? null,
      statedValue: val.value,
    });
  };

  const closeDrawer = () => {
    setDrawer((prev) => ({ ...prev, isOpen: false }));
  };

  const handleCopyExcerpt = () => {
    if (drawer.excerpt) {
      navigator.clipboard.writeText(drawer.excerpt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatCurrency = (val: number | null | undefined) => {
    if (val === null || val === undefined) return 'Not stated';
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const visibleCategories =
    activeTab === 'all'
      ? comparisonResult.categories
      : comparisonResult.categories.filter((cat) => cat.id === activeTab);

  return (
    <div className="space-y-8 pb-16">
      {/* Page Title & Context Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-[#4F8CFF] text-xs font-semibold uppercase tracking-wider mb-2 border border-blue-200/50 dark:border-blue-900/50">
            Page 15 · Policy Comparison
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0B1220] dark:text-[#F6F8FB] tracking-tight">
            Policy Coverage Comparison
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#667085] dark:text-slate-400 max-w-3xl">
            Side-by-side neutral decision support grounded in extracted policy clauses.
            PRISM presents evidence-backed differences without speculative ratings or purchasing recommendations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/policies"
            className="px-3.5 py-2 text-xs font-medium rounded-xl text-slate-700 dark:text-slate-300 bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors shadow-xs"
          >
            ← Policy Vault
          </Link>
          <Link
            href="/add-policy"
            className="px-3.5 py-2 text-xs font-semibold rounded-xl text-white bg-[#0B1220] hover:bg-[#162A46] dark:bg-[#4F8CFF] dark:hover:bg-[#3d7ae8] transition-colors shadow-xs"
          >
            + Add Policy
          </Link>
        </div>
      </div>

      {/* Policy Selector Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Policy A Selector */}
          <div className="w-full lg:w-5/12">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-[#4F8CFF] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#4F8CFF]" />
                Policy A
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Sum Insured: {formatCurrency(selectedPolicyA.sum_insured)}
              </span>
            </div>
            <div className="relative">
              <select
                aria-label="Select Policy A"
                value={selectedPolicyA.id}
                onChange={(e) => handleSelectA(e.target.value)}
                disabled={isPending}
                className="w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl bg-slate-50 dark:bg-[#162A46]/60 border border-slate-200 dark:border-slate-700 text-[#0B1220] dark:text-[#F6F8FB] focus:outline-hidden focus:ring-2 focus:ring-[#4F8CFF] transition-all disabled:opacity-50"
              >
                {userPolicies.map((p) => (
                  <option
                    key={p.id}
                    value={p.id}
                    disabled={p.id === selectedPolicyB.id}
                  >
                    {p.insurer_name} — {p.policy_name} ({p.policy_type || 'Health'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex flex-col items-center justify-center pt-2 lg:pt-5">
            <button
              type="button"
              onClick={handleSwap}
              disabled={isPending}
              title="Swap Policy A and Policy B"
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#131f33] text-slate-600 dark:text-slate-300 hover:text-[#4F8CFF] dark:hover:text-[#4F8CFF] hover:bg-slate-100 dark:hover:bg-[#182842] transition-colors shadow-xs disabled:opacity-50"
            >
              <IconSlidersHorizontal size={18} />
            </button>
            <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider hidden lg:block">
              Swap
            </span>
          </div>

          {/* Policy B Selector */}
          <div className="w-full lg:w-5/12">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-500" />
                Policy B
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Sum Insured: {formatCurrency(selectedPolicyB.sum_insured)}
              </span>
            </div>
            <div className="relative">
              <select
                aria-label="Select Policy B"
                value={selectedPolicyB.id}
                onChange={(e) => handleSelectB(e.target.value)}
                disabled={isPending}
                className="w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl bg-slate-50 dark:bg-[#162A46]/60 border border-slate-200 dark:border-slate-700 text-[#0B1220] dark:text-[#F6F8FB] focus:outline-hidden focus:ring-2 focus:ring-[#4F8CFF] transition-all disabled:opacity-50"
              >
                {userPolicies.map((p) => (
                  <option
                    key={p.id}
                    value={p.id}
                    disabled={p.id === selectedPolicyA.id}
                  >
                    {p.insurer_name} — {p.policy_name} ({p.policy_type || 'Health'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {isPending && (
          <div className="mt-3 text-center text-xs text-[#4F8CFF] animate-pulse flex items-center justify-center gap-2">
            <IconClock size={14} />
            <span>Updating comparison data...</span>
          </div>
        )}
      </div>

      {/* Processing Status Banner (if either policy is incomplete) */}
      {(isProcessingA || isProcessingB) && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 flex items-start gap-3">
          <IconClock size={20} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-amber-900 dark:text-amber-200">
            <p className="font-semibold">
              {isProcessingA && isProcessingB
                ? 'Both policies are currently being processed.'
                : isProcessingA
                ? `Policy A (${selectedPolicyA.policy_name}) is still being processed.`
                : `Policy B (${selectedPolicyB.policy_name}) is still being processed.`}
            </p>
            <p className="text-amber-700 dark:text-amber-300/80 mt-0.5 text-xs">
              Preliminary document metadata is displayed below. Full clause citations and waiting period details will refresh automatically once document text extraction finishes.
            </p>
          </div>
        </div>
      )}

      {/* Key Differences PRISM Summary Card */}
      <div className="rounded-2xl p-6 sm:p-7 bg-gradient-to-br from-[#0B1220] via-[#101c2c] to-[#162A46] text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#4F8CFF]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-cyan-300 text-xs font-semibold backdrop-blur-md border border-white/10">
              <IconSparkles size={14} />
              Ground-Truth Clause Analysis
            </div>
            <span className="text-xs text-slate-400">
              Traceable to {comparisonResult.evidenceCount.policyA + comparisonResult.evidenceCount.policyB} indexed document clauses
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white mb-3">
            Key Differences
          </h2>

          <div className="space-y-2.5">
            {comparisonResult.keyDifferences.map((diff, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10 text-xs sm:text-sm text-slate-200"
              >
                <div className="p-1 rounded-md bg-[#4F8CFF]/20 text-[#6ED7E8] shrink-0 mt-0.5">
                  <IconCheckCircle size={14} />
                </div>
                <p className="leading-relaxed">{diff}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <IconInfo size={14} className="text-[#6ED7E8] shrink-0" />
              <span>
                Neutral informational decision support. PRISM does not declare a &ldquo;winner&rdquo; or provide binding insurance advice.
              </span>
            </div>
            <Link
              href={`/ask?q=${encodeURIComponent(
                `Compare coverage differences between ${selectedPolicyA.policy_name} and ${selectedPolicyB.policy_name}`
              )}`}
              className="inline-flex items-center gap-1 text-[#6ED7E8] hover:underline shrink-0"
            >
              <IconBot size={13} />
              <span>Ask PRISM about these differences →</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Category Navigation Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 custom-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
            activeTab === 'all'
              ? 'bg-[#0B1220] dark:bg-[#4F8CFF] text-white shadow-xs'
              : 'bg-white dark:bg-[#0E1726] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
        >
          All Categories ({comparisonResult.categories.length})
        </button>
        {comparisonResult.categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveTab(cat.id)}
            className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap inline-flex items-center gap-1.5 transition-colors ${
              activeTab === cat.id
                ? 'bg-[#0B1220] dark:bg-[#4F8CFF] text-white shadow-xs'
                : 'bg-white dark:bg-[#0E1726] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            {CATEGORY_ICONS[cat.id]}
            <span>{cat.title}</span>
            <span className="text-[10px] opacity-60">({cat.rows.length})</span>
          </button>
        ))}
      </div>

      {/* Desktop Comparison Table View (hidden on mobile) */}
      <div className="hidden md:block">
        <div className="rounded-2xl bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 bg-slate-50/80 dark:bg-[#131f33]/90 border-b border-slate-200 dark:border-slate-800 p-4 sticky top-16 z-20 backdrop-blur-md">
            <div className="col-span-4 pr-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Coverage Feature / Provision
              </span>
            </div>
            <div className="col-span-4 px-3 border-l border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#4F8CFF]" />
                <span className="text-xs font-bold text-[#0B1220] dark:text-[#F6F8FB] truncate">
                  {selectedPolicyA.policy_name}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {selectedPolicyA.insurer_name} • {formatCurrency(selectedPolicyA.sum_insured)}
              </p>
            </div>
            <div className="col-span-4 px-3 border-l border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-500" />
                <span className="text-xs font-bold text-[#0B1220] dark:text-[#F6F8FB] truncate">
                  {selectedPolicyB.policy_name}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {selectedPolicyB.insurer_name} • {formatCurrency(selectedPolicyB.sum_insured)}
              </p>
            </div>
          </div>

          {/* Categories & Rows */}
          <div className="divide-y divide-slate-200/70 dark:divide-slate-800">
            {visibleCategories.map((category) => (
              <div key={category.id} className="relative">
                {/* Category Section Header */}
                <div className="bg-slate-100/60 dark:bg-[#162A46]/30 px-5 py-3 border-y border-slate-200/50 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-white dark:bg-[#131f33] text-[#4F8CFF] shadow-xs">
                      {CATEGORY_ICONS[category.id]}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#0B1220] dark:text-[#F6F8FB]">
                        {category.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {category.description}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-slate-400">
                    {category.rows.length} provisions
                  </span>
                </div>

                {/* Rows */}
                <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {category.rows.map((row) => (
                    <DesktopTableRow
                      key={row.id}
                      row={row}
                      policyA={selectedPolicyA}
                      policyB={selectedPolicyB}
                      onOpenEvidenceA={() =>
                        openDrawer(selectedPolicyA, row.label, row.policyA)
                      }
                      onOpenEvidenceB={() =>
                        openDrawer(selectedPolicyB, row.label, row.policyB)
                      }
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Stacked Card View (hidden on desktop) */}
      <div className="md:hidden space-y-6">
        {visibleCategories.map((category) => (
          <div
            key={category.id}
            className="rounded-2xl bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden"
          >
            {/* Category Header */}
            <div className="p-4 bg-slate-50 dark:bg-[#131f33] border-b border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-white dark:bg-[#162A46] text-[#4F8CFF] shadow-xs">
                {CATEGORY_ICONS[category.id]}
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0B1220] dark:text-[#F6F8FB]">
                  {category.title}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {category.description}
                </p>
              </div>
            </div>

            {/* Feature Cards */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800 p-3 space-y-4">
              {category.rows.map((row) => (
                <MobileFeatureCard
                  key={row.id}
                  row={row}
                  policyA={selectedPolicyA}
                  policyB={selectedPolicyB}
                  onOpenEvidenceA={() =>
                    openDrawer(selectedPolicyA, row.label, row.policyA)
                  }
                  onOpenEvidenceB={() =>
                    openDrawer(selectedPolicyB, row.label, row.policyB)
                  }
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Evidence Drawer / Modal */}
      {drawer.isOpen && (
        <div
          role="presentation"
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 transition-opacity"
          onClick={closeDrawer}
        />
      )}

      <aside
        id="policy-evidence-drawer"
        aria-label="Policy Evidence Inspection"
        className={`fixed inset-y-0 right-0 w-full max-w-lg bg-white dark:bg-[#0E1726] border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          drawer.isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-[#131f33]/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#4F8CFF]">
              <IconBookOpen size={18} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#4F8CFF]">
                Policy Evidence Clause
              </span>
              <h3 className="text-sm font-bold text-[#0B1220] dark:text-[#F6F8FB]">
                {drawer.featureLabel}
              </h3>
            </div>
          </div>
          <button
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            onClick={closeDrawer}
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5 custom-scrollbar">
          {/* Policy Context */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#131f33] border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Insurer:</span>
              <span className="font-semibold text-[#0B1220] dark:text-[#F6F8FB]">
                {drawer.insurerName}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs mt-1.5">
              <span className="text-slate-500 dark:text-slate-400">Policy:</span>
              <span className="font-semibold text-[#0B1220] dark:text-[#F6F8FB]">
                {drawer.policyName}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs mt-1.5">
              <span className="text-slate-500 dark:text-slate-400">Extracted Value:</span>
              <span className="font-bold text-[#4F8CFF]">
                {drawer.statedValue}
              </span>
            </div>
          </div>

          {/* Citation Coordinates */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Document Verification Source
            </span>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/30 text-xs">
              <IconFileText size={16} className="text-[#4F8CFF] shrink-0" />
              <div className="truncate">
                <span className="font-semibold text-[#0B1220] dark:text-[#F6F8FB]">
                  {drawer.sectionTitle || 'Policy Provision'}
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {drawer.documentName || 'Policy Document'}
                  {drawer.pageNumber ? ` • Page ${drawer.pageNumber}` : ' • Policy Schedule'}
                </p>
              </div>
            </div>
          </div>

          {/* Verbatim Excerpt */}
          {drawer.excerpt ? (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Verbatim Document Excerpt
                </span>
                <button
                  type="button"
                  onClick={handleCopyExcerpt}
                  className="text-xs text-[#4F8CFF] hover:underline inline-flex items-center gap-1"
                >
                  {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <blockquote className="p-4 rounded-xl bg-slate-900 text-slate-100 dark:bg-black/60 dark:text-slate-200 text-xs font-mono leading-relaxed border border-slate-700/60 overflow-x-auto whitespace-pre-wrap">
                &ldquo;{drawer.excerpt}&rdquo;
              </blockquote>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 text-xs text-slate-500 text-center">
              Extracted from policy configuration schedule. Detailed excerpt text is not indexed for this dimension.
            </div>
          )}

          {/* Neutral Disclaimer */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#131f33] border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2.5">
            <IconInfo size={16} className="text-[#4F8CFF] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Citations are verified against uploaded policy documents and parsed clauses. Please refer to your officially signed insurer policy schedule for legally binding terms.
            </p>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#131f33]/50 flex items-center justify-between gap-3">
          <Link
            href={`/ask?q=${encodeURIComponent(
              `Explain the ${drawer.featureLabel} provision in ${drawer.policyName}`
            )}`}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#0B1220] hover:bg-[#162A46] dark:bg-[#4F8CFF] dark:hover:bg-[#3d7ae8] text-white text-xs font-semibold text-center transition shadow-xs inline-flex items-center justify-center gap-1.5"
          >
            <IconBot size={14} />
            <span>Ask PRISM about this clause</span>
          </Link>
          <button
            type="button"
            onClick={closeDrawer}
            className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Close
          </button>
        </div>
      </aside>
    </div>
  );
}

// ----------------------------------------------------------------------
// Desktop Table Row Component
// ----------------------------------------------------------------------
interface DesktopTableRowProps {
  row: ComparisonRow;
  policyA: Policy;
  policyB: Policy;
  onOpenEvidenceA: () => void;
  onOpenEvidenceB: () => void;
}

function DesktopTableRow({
  row,
  onOpenEvidenceA,
  onOpenEvidenceB,
}: DesktopTableRowProps) {
  return (
    <div className="grid grid-cols-12 p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors items-start">
      {/* Column 1: Feature Label & Difference Indicator */}
      <div className="col-span-4 pr-4">
        <div className="flex items-center gap-2">
          <h4 className="text-xs sm:text-sm font-semibold text-[#0B1220] dark:text-[#F6F8FB]">
            {row.label}
          </h4>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
          {row.description}
        </p>
        <div className="mt-2">
          {row.difference.hasDifference ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-[10px] font-semibold border border-amber-200/60 dark:border-amber-900/40">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Difference identified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-medium">
              <IconCheck size={10} />
              Comparable terms
            </span>
          )}
        </div>
      </div>

      {/* Column 2: Policy A Cell */}
      <div className="col-span-4 px-3 border-l border-slate-200 dark:border-slate-800">
        <CellValueCard
          val={row.policyA}
          accentColor="blue"
          onOpenEvidence={onOpenEvidenceA}
        />
      </div>

      {/* Column 3: Policy B Cell */}
      <div className="col-span-4 px-3 border-l border-slate-200 dark:border-slate-800">
        <CellValueCard
          val={row.policyB}
          accentColor="teal"
          onOpenEvidence={onOpenEvidenceB}
        />
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Mobile Feature Card Component
// ----------------------------------------------------------------------
interface MobileFeatureCardProps {
  row: ComparisonRow;
  policyA: Policy;
  policyB: Policy;
  onOpenEvidenceA: () => void;
  onOpenEvidenceB: () => void;
}

function MobileFeatureCard({
  row,
  policyA,
  policyB,
  onOpenEvidenceA,
  onOpenEvidenceB,
}: MobileFeatureCardProps) {
  return (
    <div className="p-3.5 rounded-xl bg-slate-50/60 dark:bg-[#131f33]/40 border border-slate-200/60 dark:border-slate-800 space-y-3">
      {/* Title & Difference Status */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="text-xs font-bold text-[#0B1220] dark:text-[#F6F8FB]">
            {row.label}
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {row.description}
          </p>
        </div>
        {row.difference.hasDifference ? (
          <span className="shrink-0 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-[10px] font-semibold border border-amber-200/60 dark:border-amber-900/40">
            Difference
          </span>
        ) : (
          <span className="shrink-0 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-medium">
            Same
          </span>
        )}
      </div>

      {/* Policy A Sub-Card */}
      <div className="p-3 rounded-lg bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-slate-800">
        <span className="text-[10px] font-bold text-[#4F8CFF] uppercase tracking-wider block mb-1">
          Policy A: {policyA.policy_name}
        </span>
        <CellValueCard
          val={row.policyA}
          accentColor="blue"
          onOpenEvidence={onOpenEvidenceA}
        />
      </div>

      {/* Policy B Sub-Card */}
      <div className="p-3 rounded-lg bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-slate-800">
        <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider block mb-1">
          Policy B: {policyB.policy_name}
        </span>
        <CellValueCard
          val={row.policyB}
          accentColor="teal"
          onOpenEvidence={onOpenEvidenceB}
        />
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Cell Value & Citation Card Component
// ----------------------------------------------------------------------
interface CellValueCardProps {
  val: PolicyComparisonValue;
  accentColor: 'blue' | 'teal';
  onOpenEvidence: () => void;
}

function CellValueCard({
  val,
  accentColor,
  onOpenEvidence,
}: CellValueCardProps) {
  const isMissing = !val.hasData;

  return (
    <div className="space-y-1.5">
      {/* Stated Value */}
      <div
        className={`text-xs sm:text-sm ${
          isMissing
            ? 'italic text-slate-400 dark:text-slate-500'
            : 'font-semibold text-[#0B1220] dark:text-[#F6F8FB]'
        } leading-snug`}
      >
        {val.value}
      </div>

      {/* Citation or Missing Evidence Tag */}
      {val.hasData ? (
        <div className="flex items-center gap-1.5 pt-0.5">
          <button
            type="button"
            onClick={onOpenEvidence}
            className={`group inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors ${
              accentColor === 'blue'
                ? 'bg-blue-50 dark:bg-blue-950/40 text-[#4F8CFF] hover:bg-blue-100 dark:hover:bg-blue-900/60'
                : 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/60'
            }`}
          >
            <IconEye size={11} className="group-hover:scale-110 transition-transform" />
            <span className="truncate max-w-[150px]">
              {val.pageNumber ? `Page ${val.pageNumber}` : 'Evidence'}
              {val.sectionTitle ? ` • ${val.sectionTitle}` : ''}
            </span>
          </button>
        </div>
      ) : (
        <span className="text-[10px] text-slate-400 block pt-0.5">
          No explicit clause identified
        </span>
      )}
    </div>
  );
}
