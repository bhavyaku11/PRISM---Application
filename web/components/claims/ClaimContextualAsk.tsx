'use client'

import React, { useState } from 'react';
import type { Claim } from '@/types/claim';
import type { Policy } from '@/types/policy';

interface Citation {
  page_number: number;
  section_title: string;
  excerpt: string;
}

interface Source {
  chunk_id: string;
  page_number: number;
  section_title: string;
  similarity: number;
}

interface ClaimContextualAskProps {
  claim: Claim;
  policy: Policy | null;
}

const CONTEXTUAL_PROMPTS = [
  'What documents does my policy require for reimbursement claims?',
  'What is the room rent limit and ICU capping for this hospitalization?',
  'Are there waiting periods or specific exclusions applicable to this admission?',
  'What is the notice timeline to intimate the insurer after hospital entry?',
];

export function ClaimContextualAsk({ claim, policy }: ClaimContextualAskProps) {
  const [question, setQuestion] = useState<string>('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [confidence, setConfidence] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAsk = async (queryText?: string) => {
    const q = (queryText || question).trim();
    if (!q || isLoading || !claim.policy_id) return;

    setIsLoading(true);
    setErrorMessage(null);
    setAnswer(null);
    setCitations([]);
    setSources([]);

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          policy_id: claim.policy_id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Could not retrieve an answer from PRISM.');
        return;
      }

      setAnswer(data.answer || 'No answer generated.');
      setCitations(data.citations || []);
      setSources(data.sources || []);
      setConfidence(data.confidence || 'medium');
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Network error connecting to Ask PRISM.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
      {/* HEADER */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider text-[#4F8CFF] bg-blue-50 dark:bg-blue-950/40 border border-blue-200/50 dark:border-blue-900/50 mb-1">
            Grounded Policy Intelligence
          </div>
          <h3 className="text-sm font-bold text-[#0B1220] dark:text-[#F6F8FB]">
            Ask PRISM About This Claim
          </h3>
          <p className="text-xs text-[#667085] dark:text-slate-400 mt-0.5">
            Ask specific questions regarding coverage, room rent limits, or timelines for this hospitalization.
          </p>
        </div>

        <span className="hidden sm:inline-block px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          Scope: {policy?.policy_name || 'Current Policy'}
        </span>
      </div>

      {/* QUICK CONTEXTUAL CHIPS */}
      <div>
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
          Recommended Questions for this Claim
        </span>
        <div className="flex flex-wrap gap-1.5">
          {CONTEXTUAL_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setQuestion(prompt);
                handleAsk(prompt);
              }}
              disabled={isLoading}
              className="text-left px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-[#4F8CFF]/60 hover:text-[#4F8CFF] dark:hover:text-[#4F8CFF] transition-all disabled:opacity-50"
            >
              &ldquo;{prompt}&rdquo;
            </button>
          ))}
        </div>
      </div>

      {/* INPUT BAR */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk();
        }}
        className="flex items-center gap-2"
      >
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={`Ask anything about ${policy?.policy_name || 'your policy'} for this claim...`}
          disabled={isLoading}
          className="flex-1 h-10 px-4 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[#0B1220] dark:text-[#F6F8FB] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]/50"
        />
        <button
          type="submit"
          disabled={isLoading || !question.trim()}
          className="h-10 px-5 rounded-xl text-xs font-medium text-white bg-[#0B1220] hover:bg-[#162A46] dark:bg-[#4F8CFF] dark:hover:bg-[#3d7ae8] transition-colors disabled:opacity-50 flex items-center gap-1.5"
        >
          {isLoading ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <span>Ask &rarr;</span>
          )}
        </button>
      </form>

      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300">
          {errorMessage}
        </div>
      )}

      {/* ANSWER PRESENTATION */}
      {answer && (
        <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-bold text-[#0B1220] dark:text-[#F6F8FB]">
                PRISM Policy Answer
              </span>
            </div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              Confidence: {confidence}
            </span>
          </div>

          <div className="text-slate-800 dark:text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
            {answer}
          </div>

          {/* CITATIONS */}
          {citations.length > 0 && (
            <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800/60 space-y-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                Evidence Citations ({citations.length})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {citations.map((c, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-[11px]"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-[#4F8CFF]">
                        Page {c.page_number}
                      </span>
                      <span className="text-slate-400 text-[10px] truncate max-w-[120px]">
                        {c.section_title}
                      </span>
                    </div>
                    {c.excerpt && (
                      <p className="text-slate-600 dark:text-slate-300 italic line-clamp-2">
                        &ldquo;{c.excerpt}&rdquo;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RETRIEVED SOURCES IF NO FORMAL CITATIONS */}
          {citations.length === 0 && sources.length > 0 && (
            <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800/60 text-[11px] text-slate-500">
              <span>Retrieved context from {sources.length} policy section(s).</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
