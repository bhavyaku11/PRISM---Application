'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Claim } from '@/types/claim';
import type { Policy } from '@/types/policy';

interface RetrievalItem {
  chunk_id: string;
  document_id: string;
  policy_id: string;
  page_number: number;
  section_title: string;
  content: string;
  similarity: number;
}

interface ClaimEvidenceSectionProps {
  claim: Claim;
  policy: Policy | null;
  onEvidenceReviewed?: () => void;
}

const PRESET_TOPICS = [
  {
    id: 'general',
    label: 'All Relevant Clauses',
    query: 'hospitalization admission claims procedure waiting period room rent ICU limits exclusions',
  },
  {
    id: 'hospitalization',
    label: 'Hospitalization & Room Rent',
    query: 'inpatient care room rent limit ICU intensive care charges daily sublimit',
  },
  {
    id: 'waiting_exclusions',
    label: 'Waiting Periods & Exclusions',
    query: 'waiting period pre-existing disease PED specific illness general exclusions not covered',
  },
  {
    id: 'procedure',
    label: 'Claims Procedure & Notice',
    query: 'cashless reimbursement claim procedure intimation timeline discharge settlement documents',
  },
  {
    id: 'copay',
    label: 'Deductibles & Co-pay',
    query: 'co-payment deductible voluntary deductible zone copay proportionate deduction',
  },
];

export function ClaimEvidenceSection({
  claim,
  policy,
  onEvidenceReviewed,
}: ClaimEvidenceSectionProps) {
  const [selectedTopic, setSelectedTopic] = useState<string>('general');
  const [evidenceList, setEvidenceList] = useState<RetrievalItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [expandedChunkId, setExpandedChunkId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!claim.policy_id) return;

    const topicConfig = PRESET_TOPICS.find((t) => t.id === selectedTopic) || PRESET_TOPICS[0];
    const contextualQuery = `${claim.claim_type} ${topicConfig.query}`;

    fetch('/api/retrieval/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: contextualQuery,
        policy_id: claim.policy_id,
        top_k: 5,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.results) {
          const items: RetrievalItem[] = data.results || [];
          setEvidenceList(items);
          if (items.length > 0 && onEvidenceReviewed) {
            onEvidenceReviewed();
          }
        } else {
          setErrorMsg(data.error || 'Could not retrieve policy evidence.');
          setEvidenceList([]);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setErrorMsg(
          err instanceof Error
            ? err.message
            : 'Network error retrieving policy evidence.'
        );
        setEvidenceList([]);
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [claim.policy_id, claim.claim_type, selectedTopic, onEvidenceReviewed]);

  const handleTopicChange = (topicId: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    setSelectedTopic(topicId);
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider text-[#4F8CFF] bg-blue-50 dark:bg-blue-950/40 border border-blue-200/50 dark:border-blue-900/50 mb-1">
            Grounded Policy Retrieval
          </div>
          <h3 className="text-sm font-bold text-[#0B1220] dark:text-[#F6F8FB]">
            Relevant Policy Evidence
          </h3>
          <p className="text-xs text-[#667085] dark:text-slate-400 mt-0.5">
            Key sections and clauses from {policy?.policy_name || 'your policy'} that may be relevant to this claim.
          </p>
        </div>

        {policy && (
          <Link
            href={`/policies/${policy.id}/details`}
            className="text-xs font-semibold text-[#4F8CFF] hover:underline flex items-center gap-1 shrink-0 self-start sm:self-auto"
          >
            <span>View Full Policy</span>
            <span>&rarr;</span>
          </Link>
        )}
      </div>

      {/* COMPANION ADVISORY NOTE */}
      <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
        <svg className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span className="leading-relaxed">
          <strong>Important Disclaimers:</strong> These excerpts are surfaced for your preparation. PRISM does not decide or guarantee coverage. The policy terms, conditions, and exclusions are binding between you and your insurer.
        </span>
      </div>

      {/* TOPIC FILTER CHIPS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {PRESET_TOPICS.map((topic) => {
          const isActive = selectedTopic === topic.id;
          return (
            <button
              key={topic.id}
              type="button"
              onClick={() => handleTopicChange(topic.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition-colors border ${
                isActive
                  ? 'bg-[#0B1220] dark:bg-[#4F8CFF] text-white border-transparent shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-900 text-[#667085] dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-[#0B1220] dark:hover:text-slate-200'
              }`}
            >
              {topic.label}
            </button>
          );
        })}
      </div>

      {/* EVIDENCE CARDS LIST */}
      {isLoading ? (
        <div className="p-8 text-center space-y-3">
          <div className="w-6 h-6 border-2 border-[#4F8CFF]/30 border-t-[#4F8CFF] rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#667085] dark:text-slate-400">
            Matching policy clauses to claim context...
          </p>
        </div>
      ) : errorMsg ? (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300">
          {errorMsg}
        </div>
      ) : evidenceList.length === 0 ? (
        <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
          <p className="text-xs text-[#667085] dark:text-slate-400">
            No specific policy clauses matched this topic filter. Try selecting another topic or ask a question below.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {evidenceList.map((item, idx) => {
            const isExpanded = expandedChunkId === item.chunk_id;
            const relevancePct = Math.round((item.similarity || 0) * 100);

            return (
              <div
                key={item.chunk_id || idx}
                className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 hover:border-[#4F8CFF]/40 transition-all text-xs space-y-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-[#4F8CFF] border border-blue-200/50 dark:border-blue-900/50">
                      Page {item.page_number}
                    </span>
                    <h4 className="font-semibold text-[#0B1220] dark:text-[#F6F8FB] line-clamp-1">
                      {item.section_title || 'General Policy Information'}
                    </h4>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 text-[11px] text-[#667085] dark:text-slate-400">
                    <span>Relevance:</span>
                    <span className="font-bold text-[#4F8CFF]">{relevancePct}%</span>
                  </div>
                </div>

                {/* Excerpt */}
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                  {isExpanded ? item.content : `${item.content.slice(0, 240)}...`}
                </p>

                {/* Action Row */}
                <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 italic">
                    Policy wording clause
                  </span>

                  <div className="flex items-center gap-3">
                    {item.content.length > 240 && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedChunkId(isExpanded ? null : item.chunk_id)
                        }
                        className="text-[#4F8CFF] font-medium hover:underline"
                      >
                        {isExpanded ? 'Show less' : 'Read full clause'}
                      </button>
                    )}

                    {policy && (
                      <Link
                        href={`/policies/${policy.id}/details`}
                        className="text-slate-600 dark:text-slate-300 font-medium hover:text-[#4F8CFF] hover:underline"
                      >
                        View in policy &rarr;
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
