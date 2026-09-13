'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import type { Policy, PolicyDocument, PolicySection } from '@/types/policy';

interface PolicyDetailsViewProps {
  policy: Policy;
  document: PolicyDocument | null;
  sections: PolicySection[];
}

type CategoryTab =
  | 'all'
  | 'coverage'
  | 'exclusions'
  | 'waiting_period'
  | 'copayment'
  | 'limits'
  | 'conditions'
  | 'claims'
  | 'general'
  | 'document';

export function PolicyDetailsView({
  policy,
  document,
  sections,
}: PolicyDetailsViewProps) {
  const [activeTab, setActiveTab] = useState<CategoryTab>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Count items per category
  const counts = useMemo(() => {
    return {
      all: sections.length,
      coverage: sections.filter((s) => s.section_type === 'coverage').length,
      exclusions: sections.filter((s) => s.section_type === 'exclusions').length,
      waiting_period: sections.filter((s) => s.section_type === 'waiting_period').length,
      copayment: sections.filter(
        (s) => s.section_type === 'copayment' || s.section_type === 'deductible'
      ).length,
      limits: sections.filter((s) => s.section_type === 'limits').length,
      conditions: sections.filter((s) => s.section_type === 'conditions').length,
      claims: sections.filter((s) => s.section_type === 'claims').length,
      general: sections.filter(
        (s) => s.section_type === 'general' || s.section_type === 'other'
      ).length,
    };
  }, [sections]);

  // Filter sections by active tab and search query
  const filteredSections = useMemo(() => {
    let list = sections;

    // Filter by tab
    if (activeTab === 'coverage') {
      list = list.filter((s) => s.section_type === 'coverage');
    } else if (activeTab === 'exclusions') {
      list = list.filter((s) => s.section_type === 'exclusions');
    } else if (activeTab === 'waiting_period') {
      list = list.filter((s) => s.section_type === 'waiting_period');
    } else if (activeTab === 'copayment') {
      list = list.filter(
        (s) => s.section_type === 'copayment' || s.section_type === 'deductible'
      );
    } else if (activeTab === 'limits') {
      list = list.filter((s) => s.section_type === 'limits');
    } else if (activeTab === 'conditions') {
      list = list.filter((s) => s.section_type === 'conditions');
    } else if (activeTab === 'claims') {
      list = list.filter((s) => s.section_type === 'claims');
    } else if (activeTab === 'general') {
      list = list.filter(
        (s) => s.section_type === 'general' || s.section_type === 'other'
      );
    }

    // Filter by search query
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.content.toLowerCase().includes(q) ||
          s.section_type.toLowerCase().includes(q)
      );
    }

    return list;
  }, [sections, activeTab, searchQuery]);

  const formatBytes = (bytes?: number | null) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Not recorded';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
        <Link href="/dashboard" className="hover:text-[#0B1220] dark:hover:text-white transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <Link href="/policies" className="hover:text-[#0B1220] dark:hover:text-white transition-colors">
          My Policies
        </Link>
        <span>/</span>
        <Link href={`/policies/${policy.id}`} className="hover:text-[#0B1220] dark:hover:text-white transition-colors truncate max-w-xs">
          {policy.policy_name}
        </Link>
        <span>/</span>
        <span className="text-[#0B1220] dark:text-slate-100 font-semibold">
          Policy Details
        </span>
      </nav>

      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/40 text-[#4F8CFF] border border-blue-200/50 dark:border-blue-900/50">
              Page 10 · Deep-Dive Details Workspace
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/50">
              {policy.status}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0B1220] dark:text-[#F6F8FB] tracking-tight">
            {policy.policy_name}
          </h1>
          <p className="text-xs text-[#667085] dark:text-slate-400 mt-1">
            {policy.insurer_name} &middot; {policy.policy_type} &middot; Insured:{' '}
            <strong>{policy.insured_member || 'Not provided'}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href={`/policies/${policy.id}`}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs"
          >
            &larr; Policy Overview
          </Link>
          <Link
            href={`/ask?policy_id=${policy.id}`}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#0B1220] hover:bg-[#162A46] dark:bg-[#4F8CFF] dark:hover:bg-[#3d7ae8] text-white transition-colors shadow-sm inline-flex items-center gap-1.5"
          >
            <span>✦ Ask PRISM</span>
          </Link>
        </div>
      </div>

      {/* Search Within Policy Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
        <div className="relative flex items-center">
          <svg
            className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search within policy sections, clause wording, exclusions, limits, waiting periods..."
            className="w-full text-xs sm:text-sm pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]/20 focus:border-[#4F8CFF] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
          <span>
            {searchQuery
              ? `Filtered ${filteredSections.length} matching section${filteredSections.length === 1 ? '' : 's'}`
              : `Total ${sections.length} extracted section${sections.length === 1 ? '' : 's'} available`}
          </span>
          <span className="hidden sm:inline">
            Searches strictly within this policy document
          </span>
        </div>
      </div>

      {/* Category Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800 no-scrollbar text-xs">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-2 rounded-xl font-medium whitespace-nowrap transition-colors ${
            activeTab === 'all'
              ? 'bg-[#0B1220] text-white dark:bg-[#4F8CFF]'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          All Sections ({counts.all})
        </button>

        <button
          onClick={() => setActiveTab('coverage')}
          className={`px-3.5 py-2 rounded-xl font-medium whitespace-nowrap transition-colors ${
            activeTab === 'coverage'
              ? 'bg-[#0B1220] text-white dark:bg-[#4F8CFF]'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Coverage &amp; Benefits ({counts.coverage})
        </button>

        <button
          onClick={() => setActiveTab('exclusions')}
          className={`px-3.5 py-2 rounded-xl font-medium whitespace-nowrap transition-colors ${
            activeTab === 'exclusions'
              ? 'bg-[#0B1220] text-white dark:bg-[#4F8CFF]'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Exclusions ({counts.exclusions})
        </button>

        <button
          onClick={() => setActiveTab('waiting_period')}
          className={`px-3.5 py-2 rounded-xl font-medium whitespace-nowrap transition-colors ${
            activeTab === 'waiting_period'
              ? 'bg-[#0B1220] text-white dark:bg-[#4F8CFF]'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Waiting Periods ({counts.waiting_period})
        </button>

        <button
          onClick={() => setActiveTab('copayment')}
          className={`px-3.5 py-2 rounded-xl font-medium whitespace-nowrap transition-colors ${
            activeTab === 'copayment'
              ? 'bg-[#0B1220] text-white dark:bg-[#4F8CFF]'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Co-payment &amp; Deductibles ({counts.copayment})
        </button>

        <button
          onClick={() => setActiveTab('limits')}
          className={`px-3.5 py-2 rounded-xl font-medium whitespace-nowrap transition-colors ${
            activeTab === 'limits'
              ? 'bg-[#0B1220] text-white dark:bg-[#4F8CFF]'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Limits &amp; Sub-limits ({counts.limits})
        </button>

        <button
          onClick={() => setActiveTab('conditions')}
          className={`px-3.5 py-2 rounded-xl font-medium whitespace-nowrap transition-colors ${
            activeTab === 'conditions'
              ? 'bg-[#0B1220] text-white dark:bg-[#4F8CFF]'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Conditions ({counts.conditions})
        </button>

        <button
          onClick={() => setActiveTab('claims')}
          className={`px-3.5 py-2 rounded-xl font-medium whitespace-nowrap transition-colors ${
            activeTab === 'claims'
              ? 'bg-[#0B1220] text-white dark:bg-[#4F8CFF]'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Claims ({counts.claims})
        </button>

        <button
          onClick={() => setActiveTab('general')}
          className={`px-3.5 py-2 rounded-xl font-medium whitespace-nowrap transition-colors ${
            activeTab === 'general'
              ? 'bg-[#0B1220] text-white dark:bg-[#4F8CFF]'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          General &amp; Other ({counts.general})
        </button>

        <button
          onClick={() => setActiveTab('document')}
          className={`px-3.5 py-2 rounded-xl font-medium whitespace-nowrap transition-colors ${
            activeTab === 'document'
              ? 'bg-[#0B1220] text-white dark:bg-[#4F8CFF]'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Document Files
        </button>
      </div>

      {/* Main Content Area */}
      {activeTab === 'document' ? (
        /* Document Files View */
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
            <div>
              <h2 className="text-base font-bold text-[#0B1220] dark:text-[#F6F8FB]">
                Underlying Policy Document
              </h2>
              <p className="text-xs text-[#667085] dark:text-slate-400">
                Uploaded PDF securely stored in your private insurance vault.
              </p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/50">
              Private Vault
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800">
              <span className="text-slate-400 block text-[11px] mb-1">File Name</span>
              <span className="font-semibold text-sm text-[#0B1220] dark:text-slate-100 break-all">
                {document?.document_name || 'Policy Document.pdf'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800">
              <span className="text-slate-400 block text-[11px] mb-1">File Size &amp; Type</span>
              <span className="font-semibold text-sm text-[#0B1220] dark:text-slate-100">
                {formatBytes(document?.file_size)} &middot; {document?.mime_type || 'application/pdf'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800">
              <span className="text-slate-400 block text-[11px] mb-1">Pages Processed</span>
              <span className="font-semibold text-sm text-[#0B1220] dark:text-slate-100">
                {document?.page_count ?? '10'} pages
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800">
              <span className="text-slate-400 block text-[11px] mb-1">Uploaded Date</span>
              <span className="font-semibold text-sm text-[#0B1220] dark:text-slate-100">
                {formatDate(document?.created_at)}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/40 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            <p className="font-semibold text-[#4F8CFF] mb-1">
              Private Storage Guarantee
            </p>
            This document is stored in an encrypted, user-scoped private Supabase Storage bucket. Downloads use temporary signed access URLs that expire after 5 minutes. No public URLs or credentials are ever exposed.
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Policy ID: <code className="font-mono text-[10px]">{policy.id}</code>
            </span>
            {document && (
              <a
                href={`/api/documents/${document.id}/download?redirect=true`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-xl bg-[#0B1220] hover:bg-[#162A46] dark:bg-[#4F8CFF] dark:hover:bg-[#3d7ae8] text-white text-xs font-semibold shadow-sm transition-all inline-flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Download Original PDF</span>
              </a>
            )}
          </div>
        </div>
      ) : filteredSections.length === 0 ? (
        /* Empty / No Results State */
        <div className="p-12 rounded-3xl bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center text-lg">
            🔍
          </div>
          <h3 className="text-base font-semibold text-[#0B1220] dark:text-[#F6F8FB]">
            {searchQuery
              ? 'No matching policy section found.'
              : 'No sections identified in this category.'}
          </h3>
          <p className="text-xs text-[#667085] dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            {searchQuery
              ? `We searched all extracted clauses for "${searchQuery}" but found no exact matches.`
              : 'This policy document did not contain a standard clause heading for this category during processing.'}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs font-semibold text-[#4F8CFF] hover:underline pt-1"
            >
              Clear search filter
            </button>
          )}
        </div>
      ) : (
        /* Sections List */
        <div className="space-y-6">
          {filteredSections.map((sec, idx) => {
            const isLowConfidence = sec.confidence !== null && sec.confidence < 0.70;

            return (
              <div
                key={sec.id || idx}
                id={`section-${sec.id}`}
                className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5 transition-all hover:border-[#4F8CFF]/40"
              >
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/40 text-[#4F8CFF] border border-blue-200/50 dark:border-blue-900/50">
                      {sec.section_type}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      Page {sec.page_start}{sec.page_end > sec.page_start ? `–${sec.page_end}` : ''}
                    </span>
                    {isLowConfidence && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/50">
                        ⚠️ Needs review
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-400">
                    Source: {document?.document_name || 'Policy PDF'}
                  </span>
                </div>

                {/* Section Title */}
                <div>
                  <h3 className="text-lg font-bold text-[#0B1220] dark:text-[#F6F8FB] tracking-tight">
                    {sec.title}
                  </h3>
                  <p className="text-xs text-[#667085] dark:text-slate-400 mt-0.5">
                    PRISM classified this section under{' '}
                    <strong className="text-slate-700 dark:text-slate-300">{sec.section_type}</strong>{' '}
                    spanning pages {sec.page_start} through {sec.page_end}.
                  </p>
                </div>

                {/* Low Confidence Warning */}
                {isLowConfidence && (
                  <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300 space-y-0.5">
                    <p className="font-semibold">⚠️ Low Confidence Extraction</p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400">
                      PRISM identified a possible clause, but the extracted text may need review. Verify against the original document.
                    </p>
                  </div>
                )}

                {/* Original Policy Wording Block (Verbatim text) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Original Policy Wording (Verbatim Text)
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Pages {sec.page_start}–{sec.page_end}
                    </span>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                    {sec.content}
                  </div>
                </div>

                {/* Action Footer */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-400">
                    Traceable to PDF Page {sec.page_start}
                  </span>

                  <Link
                    href={`/ask?policy_id=${policy.id}&q=${encodeURIComponent(`What does the policy state about "${sec.title}"?`)}`}
                    className="px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#4F8CFF] hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200/60 dark:border-blue-900/60 text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
                  >
                    <span>✦ Ask PRISM about this section</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
