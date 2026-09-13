'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { Policy, PolicyDocument, PolicySection } from '@/types/policy';

interface PolicyOverviewViewProps {
  policy: Policy;
  document: PolicyDocument | null;
  sections: PolicySection[];
}

export function PolicyOverviewView({
  policy,
  document,
  sections,
}: PolicyOverviewViewProps) {
  const [activeEvidenceModal, setActiveEvidenceModal] = useState<{
    title: string;
    content: string;
    page_start: number;
    page_end: number;
    section_type: string;
    confidence: number | null;
  } | null>(null);

  const [expandedExclusions, setExpandedExclusions] = useState<Record<string, boolean>>({});

  // Categorize sections
  const coverageSections = sections.filter((s) => s.section_type === 'coverage');
  const exclusionSections = sections.filter((s) => s.section_type === 'exclusions');
  const waitingPeriodSections = sections.filter((s) => s.section_type === 'waiting_period');
  const copaySections = sections.filter(
    (s) => s.section_type === 'copayment' || s.section_type === 'deductible'
  );
  const limitSections = sections.filter((s) => s.section_type === 'limits');

  // Format currency
  const formatCurrency = (val: number | null | undefined) => {
    if (val === null || val === undefined) return 'Not provided';
    return `₹${val.toLocaleString('en-IN')}`;
  };

  // Format dates
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'Not provided';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Calculate renewal days or due date
  const getRenewalInfo = () => {
    if (!policy.policy_end_date) return null;
    try {
      const end = new Date(policy.policy_end_date);
      const now = new Date();
      const diffMs = end.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays < 0) {
        return { label: 'Policy Expired', alert: true, text: `Expired on ${formatDate(policy.policy_end_date)}` };
      }
      if (diffDays <= 30) {
        return { label: 'Renewal Due Soon', alert: true, text: `${diffDays} day${diffDays === 1 ? '' : 's'} remaining until renewal` };
      }
      return { label: 'Active Coverage', alert: false, text: `Renewal due on ${formatDate(policy.policy_end_date)} (${diffDays} days remaining)` };
    } catch {
      return null;
    }
  };

  const renewalInfo = getRenewalInfo();

  const toggleExclusionExpand = (id: string) => {
    setExpandedExclusions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="space-y-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
        <Link href="/dashboard" className="hover:text-[#0B1220] dark:hover:text-white transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <Link href="/policies" className="hover:text-[#0B1220] dark:hover:text-white transition-colors">
          My Policies
        </Link>
        <span>/</span>
        <span className="text-[#0B1220] dark:text-slate-100 font-semibold truncate max-w-xs">
          {policy.policy_name}
        </span>
      </nav>

      {/* ========================================================================= */}
      {/* 1. POLICY HERO CARD                                                      */}
      {/* ========================================================================= */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0B1220] via-[#162A46] to-[#0B1220] text-white shadow-xl relative overflow-hidden border border-slate-800">
        {/* Subtle background refraction glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#4F8CFF]/15 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-gradient-to-tr from-[#6ED7E8]/10 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            {/* Top Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-white/10 text-white border border-white/15 backdrop-blur-xs">
                Page 09 · Policy Overview
              </span>
              <span className="px-3 py-1 rounded-full text-[11px] font-semibold capitalize bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Status: {policy.status}
              </span>
              <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-blue-500/20 text-blue-200 border border-blue-400/30">
                {policy.policy_type}
              </span>
            </div>

            {/* Policy Title & Insurer */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6ED7E8]">
                {policy.insurer_name}
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-0.5">
                {policy.policy_name}
              </h1>
            </div>

            {/* Core Metadata Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-white/10 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Policy Number</span>
                <span className="font-medium text-slate-100 truncate block">
                  {policy.policy_number || 'Not provided'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Insured Member</span>
                <span className="font-medium text-slate-100 truncate block">
                  {policy.insured_member || 'Not provided'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Policy Period</span>
                <span className="font-medium text-slate-100 block">
                  {formatDate(policy.policy_start_date)} – {formatDate(policy.policy_end_date)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Sum Insured</span>
                <span className="font-bold text-sm text-[#6ED7E8] block">
                  {formatCurrency(policy.sum_insured)}
                </span>
              </div>
            </div>

            {/* Renewal Note if Derivable */}
            {renewalInfo && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300">
                <span className={`w-2 h-2 rounded-full ${renewalInfo.alert ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                <span>{renewalInfo.text}</span>
              </div>
            )}
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
            <Link
              href={`/policies/${policy.id}/details`}
              className="px-5 py-3 rounded-2xl bg-[#4F8CFF] hover:bg-[#3d7ae8] text-white text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-2 group"
            >
              <span>View Full Policy Details</span>
              <span className="group-hover:translate-x-0.5 transition-transform">&rarr;</span>
            </Link>

            <Link
              href={`/ask?policy_id=${policy.id}`}
              className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/15 backdrop-blur-xs transition-all flex items-center justify-center gap-2"
            >
              <span>✦ Ask PRISM about this policy</span>
            </Link>

            {document && (
              <a
                href={`/api/documents/${document.id}/download?redirect=true`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-medium border border-white/10 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>View Original Document (PDF)</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. UNDERSTANDING SCORE & DOCUMENT STATUS                                  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Understanding Score Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Understanding Score
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-[#4F8CFF] border border-blue-200/50 dark:border-blue-900/50">
                Indexing Metric
              </span>
            </div>

            {policy.understanding_score !== null && policy.understanding_score !== undefined ? (
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-[#0B1220] dark:text-[#F6F8FB]">
                    {policy.understanding_score}
                  </span>
                  <span className="text-sm font-semibold text-slate-400">/ 100</span>
                </div>
                <p className="text-xs text-[#667085] dark:text-slate-400 leading-relaxed">
                  PRISM has indexed and classified key clauses across your policy document.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-xs font-medium border border-amber-200/60 dark:border-amber-900/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Analysis in Progress
                </div>
                <p className="text-xs text-[#667085] dark:text-slate-400 leading-relaxed">
                  Understanding score will appear after PRISM completes full policy analysis.
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
            * The Understanding Score represents how completely PRISM has parsed and indexed the policy clauses. It is <strong>not</strong> a claim approval probability, policy quality score, insurer rating, or financial advice.
          </div>
        </div>

        {/* Source Document Details */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Source Document
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/50">
                Private Vault
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Filename</span>
                <span className="font-semibold text-[#0B1220] dark:text-slate-200 truncate block">
                  {document?.document_name || 'Policy Document'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-slate-400 block text-[11px]">Pages Extracted</span>
                  <span className="font-semibold text-[#0B1220] dark:text-slate-200">
                    {document?.page_count ?? '10'} pages
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Sections Detected</span>
                  <span className="font-semibold text-[#4F8CFF]">
                    {sections.length} sections
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400 text-[11px]">Private Storage</span>
            {document && (
              <a
                href={`/api/documents/${document.id}/download?redirect=true`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-[#4F8CFF] hover:underline flex items-center gap-1"
              >
                <span>Download PDF</span>
                <span>&rarr;</span>
              </a>
            )}
          </div>
        </div>

        {/* Premium & Financial Summary */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Financial Terms
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-[#4F8CFF] border border-blue-200/50 dark:border-blue-900/50">
                Base Premium
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-slate-400 block text-[11px]">Annual Premium</span>
                <span className="text-xl font-bold text-[#0B1220] dark:text-[#F6F8FB]">
                  {formatCurrency(policy.premium)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Total Sum Insured</span>
                <span className="text-sm font-semibold text-[#4F8CFF]">
                  {formatCurrency(policy.sum_insured)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
            Currency: <span className="font-semibold text-slate-700 dark:text-slate-300">{policy.premium_currency || 'INR'}</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. COVERAGE SNAPSHOT                                                      */}
      {/* ========================================================================= */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div>
            <h2 className="text-lg font-bold text-[#0B1220] dark:text-[#F6F8FB] tracking-tight">
              Coverage Snapshot
            </h2>
            <p className="text-xs text-[#667085] dark:text-slate-400">
              PRISM extracted benefits verified against your policy document.
            </p>
          </div>

          <Link
            href={`/ask?policy_id=${policy.id}&q=${encodeURIComponent('What is covered under this policy?')}`}
            className="text-xs font-semibold text-[#4F8CFF] hover:underline inline-flex items-center gap-1.5"
          >
            <span>✦ Ask PRISM about coverage</span>
            <span>&rarr;</span>
          </Link>
        </div>

        {coverageSections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coverageSections.map((sec) => (
              <div
                key={sec.id}
                className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-semibold text-[#0B1220] dark:text-slate-100">
                      {sec.title}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-[#4F8CFF] border border-blue-200/50 dark:border-blue-900/50 shrink-0">
                      Page {sec.page_start}{sec.page_end > sec.page_start ? `–${sec.page_end}` : ''}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                    {sec.content}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">
                    Source: {document?.document_name || 'Policy Document'}
                  </span>
                  <button
                    onClick={() =>
                      setActiveEvidenceModal({
                        title: sec.title,
                        content: sec.content,
                        page_start: sec.page_start,
                        page_end: sec.page_end,
                        section_type: sec.section_type,
                        confidence: sec.confidence,
                      })
                    }
                    className="text-xs font-semibold text-[#4F8CFF] hover:underline"
                  >
                    View source wording →
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Honest Not-Identified Fallback for Coverage */
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200/70 dark:border-slate-800 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Not identified in the processed policy
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
              Specific named coverage benefit sections were not identified by standard heading recognition in this document. PRISM found <strong>{sections.length} general section(s)</strong>.
            </p>
            <div className="pt-2">
              <Link
                href={`/policies/${policy.id}/details`}
                className="text-xs font-semibold text-[#4F8CFF] hover:underline"
              >
                Inspect all extracted sections in Policy Details &rarr;
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. EXCLUSIONS & WAITING PERIODS (2-COLUMN GRID)                          */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Exclusions Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <div>
                <h2 className="text-base font-bold text-[#0B1220] dark:text-[#F6F8FB]">
                  Permanent &amp; General Exclusions
                </h2>
                <p className="text-xs text-[#667085] dark:text-slate-400">
                  What is not covered under this policy wording.
                </p>
              </div>
              <Link
                href={`/ask?policy_id=${policy.id}&q=${encodeURIComponent('What exclusions apply to my policy?')}`}
                className="text-xs font-semibold text-[#4F8CFF] hover:underline shrink-0"
              >
                ✦ Ask PRISM
              </Link>
            </div>

            {exclusionSections.length > 0 ? (
              <div className="space-y-3">
                {exclusionSections.map((exc) => {
                  const isExpanded = expandedExclusions[exc.id];
                  return (
                    <div
                      key={exc.id}
                      className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-rose-600 dark:text-rose-400">
                          {exc.title}
                        </span>
                        <span className="text-[11px] font-medium text-slate-400">
                          Page {exc.page_start}{exc.page_end > exc.page_start ? `–${exc.page_end}` : ''}
                        </span>
                      </div>

                      <p className={`text-xs text-slate-600 dark:text-slate-300 leading-relaxed ${isExpanded ? '' : 'line-clamp-3'}`}>
                        {exc.content}
                      </p>

                      <div className="pt-2 flex items-center justify-between text-xs">
                        <button
                          onClick={() => toggleExclusionExpand(exc.id)}
                          className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                        >
                          {isExpanded ? 'Show less' : 'View full section preview →'}
                        </button>
                        <button
                          onClick={() =>
                            setActiveEvidenceModal({
                              title: exc.title,
                              content: exc.content,
                              page_start: exc.page_start,
                              page_end: exc.page_end,
                              section_type: exc.section_type,
                              confidence: exc.confidence,
                            })
                          }
                          className="text-[11px] font-semibold text-[#4F8CFF] hover:underline"
                        >
                          Source wording
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200/70 dark:border-slate-800 text-center space-y-1">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Not identified in this policy
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  No dedicated exclusion clause heading was recognized during automated parsing.
                </p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-400">Policy Document Evidence</span>
            <Link
              href={`/policies/${policy.id}/details`}
              className="text-xs font-semibold text-[#4F8CFF] hover:underline"
            >
              See all exclusions in Details &rarr;
            </Link>
          </div>
        </div>

        {/* Waiting Periods Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <div>
                <h2 className="text-base font-bold text-[#0B1220] dark:text-[#F6F8FB]">
                  Waiting Periods
                </h2>
                <p className="text-xs text-[#667085] dark:text-slate-400">
                  Initial, pre-existing, and specific disease timelines.
                </p>
              </div>
              <Link
                href={`/ask?policy_id=${policy.id}&q=${encodeURIComponent('What are the waiting periods in this policy?')}`}
                className="text-xs font-semibold text-[#4F8CFF] hover:underline shrink-0"
              >
                ✦ Ask PRISM
              </Link>
            </div>

            {waitingPeriodSections.length > 0 ? (
              <div className="space-y-3">
                {waitingPeriodSections.map((wp) => (
                  <div
                    key={wp.id}
                    className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-amber-700 dark:text-amber-400">
                        {wp.title}
                      </span>
                      <span className="text-[11px] font-medium text-slate-400">
                        Page {wp.page_start}{wp.page_end > wp.page_start ? `–${wp.page_end}` : ''}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                      {wp.content}
                    </p>

                    <div className="pt-1 flex justify-end">
                      <button
                        onClick={() =>
                          setActiveEvidenceModal({
                            title: wp.title,
                            content: wp.content,
                            page_start: wp.page_start,
                            page_end: wp.page_end,
                            section_type: wp.section_type,
                            confidence: wp.confidence,
                          })
                        }
                        className="text-[11px] font-semibold text-[#4F8CFF] hover:underline"
                      >
                        View source wording →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200/70 dark:border-slate-800 text-center space-y-1">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Not identified in this policy
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  No specific waiting period clauses were identified by standard headings.
                </p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-400">Verified Evidence</span>
            <Link
              href={`/policies/${policy.id}/details`}
              className="text-xs font-semibold text-[#4F8CFF] hover:underline"
            >
              Examine full timeline in Details &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. CO-PAYMENT, DEDUCTIBLES & SUB-LIMITS                                    */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Co-Payment & Deductibles */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <div>
              <h2 className="text-base font-bold text-[#0B1220] dark:text-[#F6F8FB]">
                Co-Payment &amp; Deductibles
              </h2>
              <p className="text-xs text-[#667085] dark:text-slate-400">
                Out-of-pocket cost-sharing rules identified in policy text.
              </p>
            </div>
            <Link
              href={`/ask?policy_id=${policy.id}&q=${encodeURIComponent('What co-payment or deductible applies to my policy?')}`}
              className="text-xs font-semibold text-[#4F8CFF] hover:underline shrink-0"
            >
              ✦ Ask PRISM
            </Link>
          </div>

          {copaySections.length > 0 ? (
            <div className="space-y-3">
              {copaySections.map((cp) => (
                <div
                  key={cp.id}
                  className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {cp.title}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">
                      Page {cp.page_start}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {cp.content}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200/70 dark:border-slate-800 text-center space-y-1">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Not identified in this policy
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                No explicit co-pay or deductible clauses were recognized by deterministic heading extraction.
              </p>
            </div>
          )}
        </div>

        {/* Limits & Sub-limits */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <div>
              <h2 className="text-base font-bold text-[#0B1220] dark:text-[#F6F8FB]">
                Limits &amp; Sub-Limits
              </h2>
              <p className="text-xs text-[#667085] dark:text-slate-400">
                Room rent caps, ICU limits, and procedure thresholds.
              </p>
            </div>
            <Link
              href={`/ask?policy_id=${policy.id}&q=${encodeURIComponent('What room rent and ICU sub-limits apply?')}`}
              className="text-xs font-semibold text-[#4F8CFF] hover:underline shrink-0"
            >
              ✦ Ask PRISM
            </Link>
          </div>

          {limitSections.length > 0 ? (
            <div className="space-y-3">
              {limitSections.map((lim) => (
                <div
                  key={lim.id}
                  className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {lim.title}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">
                      Page {lim.page_start}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {lim.content}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200/70 dark:border-slate-800 text-center space-y-1">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Not identified in this policy
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Specific sub-limit headings were not recognized. Check the full policy terms in Details.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. POLICY TIMELINE & MILESTONES                                           */}
      {/* ========================================================================= */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div>
            <h2 className="text-base font-bold text-[#0B1220] dark:text-[#F6F8FB]">
              Policy Timeline
            </h2>
            <p className="text-xs text-[#667085] dark:text-slate-400">
              Key operational dates strictly derived from your policy record.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider block mb-1">
              Policy Start Date
            </span>
            <span className="text-sm font-bold text-[#0B1220] dark:text-slate-100 block">
              {formatDate(policy.policy_start_date)}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">Coverage commencement</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider block mb-1">
              Policy End Date
            </span>
            <span className="text-sm font-bold text-[#0B1220] dark:text-slate-100 block">
              {formatDate(policy.policy_end_date)}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">Expiry deadline</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider block mb-1">
              Renewal Milestone
            </span>
            <span className="text-sm font-bold text-[#4F8CFF] block">
              {policy.policy_end_date ? formatDate(policy.policy_end_date) : 'Not provided'}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">
              {renewalInfo ? renewalInfo.text : 'Renewal due annually'}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 7. BOTTOM CTA BANNER                                                      */}
      {/* ========================================================================= */}
      <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div>
          <h3 className="text-base font-bold text-[#0B1220] dark:text-[#F6F8FB]">
            Ready to explore all extracted sections and wording?
          </h3>
          <p className="text-xs text-[#667085] dark:text-slate-400 mt-0.5">
            Dive into original policy wording, in-policy keyword search, and complete section classification.
          </p>
        </div>

        <Link
          href={`/policies/${policy.id}/details`}
          className="px-6 py-3 rounded-2xl bg-[#0B1220] hover:bg-[#162A46] dark:bg-[#4F8CFF] dark:hover:bg-[#3d7ae8] text-white text-xs font-semibold shadow-sm transition-all shrink-0"
        >
          Open Policy Details Workspace &rarr;
        </Link>
      </div>

      {/* ========================================================================= */}
      {/* 8. EVIDENCE MODAL (ORIGINAL CLAUSE WORDING)                              */}
      {/* ========================================================================= */}
      {activeEvidenceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#0E1726] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-blue-50 dark:bg-blue-950/40 text-[#4F8CFF] border border-blue-200/50 dark:border-blue-900/50">
                    {activeEvidenceModal.section_type}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    Page {activeEvidenceModal.page_start}{activeEvidenceModal.page_end > activeEvidenceModal.page_start ? `–${activeEvidenceModal.page_end}` : ''}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-[#0B1220] dark:text-slate-100 mt-1">
                  {activeEvidenceModal.title}
                </h4>
              </div>
              <button
                onClick={() => setActiveEvidenceModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Modal Content: Verbatim Text */}
            <div className="p-6 overflow-y-auto space-y-4">
              {activeEvidenceModal.confidence !== null && activeEvidenceModal.confidence < 0.70 && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-xs">
                  <span className="font-semibold block mb-0.5">⚠️ Needs Review</span>
                  PRISM identified a possible clause, but the extracted text may need review.
                </div>
              )}

              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                  Original Policy Wording (Verbatim Extracted Text)
                </span>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {activeEvidenceModal.content}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Source: {document?.document_name || 'Policy PDF'}
              </span>
              <button
                onClick={() => setActiveEvidenceModal(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#0B1220] hover:bg-[#162A46] dark:bg-[#4F8CFF] dark:hover:bg-[#3d7ae8] text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
