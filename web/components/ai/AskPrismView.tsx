'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { Policy } from '@/types/policy';

interface Citation {
  chunk_id: string;
  document_id?: string;
  policy_id?: string;
  page_number?: number;
  section_title?: string;
}

interface Source {
  chunk_id: string;
  document_id?: string;
  policy_id?: string;
  page_number?: number;
  section_title?: string;
  content?: string;
  similarity?: number;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  grounded?: boolean;
  confidence?: string;
  citations?: Citation[];
  sources?: Source[];
  timestamp: string;
}

interface AskPrismViewProps {
  policies: Policy[];
  userEmail?: string;
  initialPolicyId?: string;
  initialQuestion?: string;
}

const SUGGESTED_QUESTIONS = [
  'Does my policy cover ICU charges?',
  'What are the room rent limits?',
  'Is there a co-payment?',
  'What is the waiting period for pre-existing diseases?',
  'What exclusions apply to my policy?',
  'How do I file a cashless claim?',
];

export function AskPrismView({
  policies,
  initialPolicyId,
  initialQuestion,
}: AskPrismViewProps) {
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>(
    initialPolicyId && policies.some((p) => p.id === initialPolicyId)
      ? initialPolicyId
      : initialPolicyId || 'all'
  );
  const [inputQuestion, setInputQuestion] = useState<string>(
    initialQuestion || ''
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeSourceModal, setActiveSourceModal] = useState<Source | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialQuestion) {
      textareaRef.current?.focus();
    }
  }, [initialQuestion]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (questionText?: string) => {
    const q = (questionText || inputQuestion).trim();
    if (!q || isLoading) return;

    setErrorMessage(null);
    setInputQuestion('');

    const userMessage: ChatMessage = {
      id: `usr_${messages.length + 1}`,
      role: 'user',
      content: q,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const payload: Record<string, unknown> = {
        question: q,
      };

      if (selectedPolicyId !== 'all') {
        payload.policy_id = selectedPolicyId;
      }
      if (conversationId) {
        payload.conversation_id = conversationId;
      }

      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to receive response from PRISM.');
      }

      if (data.conversation_id) {
        setConversationId(data.conversation_id);
      }

      const assistantMessage: ChatMessage = {
        id: data.message_id || `asst_${messages.length + 2}`,
        role: 'assistant',
        content: data.answer,
        grounded: data.grounded,
        confidence: data.confidence,
        citations: data.citations || [],
        sources: data.sources || [],
        timestamp: 'Just now',
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorStr = err instanceof Error ? err.message : 'An error occurred while contacting PRISM.';
      setErrorMessage(errorStr);
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-8rem)] min-h-[550px] bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
      {/* Header Bar: Policy Selector & Status */}
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0B1220] dark:bg-[#4F8CFF] text-white flex items-center justify-center font-bold text-sm shadow-sm">
            ✦
          </div>
          <div>
            <h2 className="text-base font-bold text-[#0B1220] dark:text-slate-100 tracking-tight flex items-center gap-2">
              Ask PRISM
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#4F8CFF] border border-blue-200/50 dark:border-blue-900/60">
                Policy Grounded
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Verified answers with document citations & page references
            </p>
          </div>
        </div>

        {/* Policy Scope Dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="policy-select" className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Scope:
          </label>
          <select
            id="policy-select"
            value={selectedPolicyId}
            onChange={(e) => setSelectedPolicyId(e.target.value)}
            className="text-xs font-medium bg-white dark:bg-[#162032] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]/20 cursor-pointer"
          >
            <option value="all">All Active Policies ({policies.length})</option>
            {policies.map((p) => (
              <option key={p.id} value={p.id}>
                {p.policy_name} ({p.insurer_name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Chat Thread */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          /* Empty State / Welcome Screen */
          <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto py-10">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-[#4F8CFF] border border-blue-200/60 dark:border-blue-900/40 flex items-center justify-center text-2xl mb-4 shadow-sm">
              🛡️
            </div>
            <h3 className="text-lg font-bold text-[#0B1220] dark:text-slate-100">
              What would you like to know about your policy?
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Ask anything regarding room rent sub-limits, ICU charges, waiting periods, co-payment, exclusions, or claim procedures. Answers are directly grounded in your policy document.
            </p>

            {/* Prompt Chips */}
            <div className="mt-8 w-full">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-3">
                Suggested Questions
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                {SUGGESTED_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(q)}
                    className="p-3 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/80 hover:bg-blue-50/60 dark:hover:bg-blue-950/40 border border-slate-200/80 dark:border-slate-800 rounded-xl transition-all text-left flex items-center justify-between group"
                  >
                    <span>{q}</span>
                    <span className="text-slate-400 group-hover:text-[#4F8CFF] transition-colors">→</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Conversation Messages */
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              {msg.role === 'user' ? (
                /* User Message Bubble */
                <div className="max-w-2xl bg-[#0B1220] dark:bg-[#4F8CFF] text-white px-5 py-3 rounded-2xl rounded-tr-sm shadow-sm text-sm leading-relaxed">
                  {msg.content}
                </div>
              ) : (
                /* Assistant Message Card */
                <div className="max-w-3xl w-full bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                  {/* Header Badge */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#0B1220] dark:text-slate-100 flex items-center gap-1.5">
                        <span className="text-[#4F8CFF]">✦</span> PRISM Response
                      </span>
                      {msg.grounded ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/50">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Grounded in Evidence
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/50">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Insufficient Evidence
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">{msg.timestamp}</span>
                  </div>

                  {/* Answer Text */}
                  <div className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line font-normal">
                    {msg.content}
                  </div>

                  {/* Verified Citations Panel */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                        Verified Policy Citations
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {msg.citations.map((c, cIdx) => (
                          <div
                            key={cIdx}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#162032] border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 shadow-2xs"
                          >
                            <span className="font-semibold text-blue-600 dark:text-[#4F8CFF]">
                              Page {c.page_number ?? 'N/A'}
                            </span>
                            <span className="text-slate-300 dark:text-slate-600">·</span>
                            <span className="truncate max-w-[200px]" title={c.section_title || 'Section'}>
                              {c.section_title || 'General Section'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Evidence Sources Drawer Trigger */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="pt-2">
                      <details className="group text-xs">
                        <summary className="cursor-pointer text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium select-none inline-flex items-center gap-1 transition-colors">
                          <span className="group-open:rotate-90 transition-transform inline-block">›</span>
                          View {msg.sources.length} Retrieved Policy Evidence Excerpt{msg.sources.length > 1 ? 's' : ''}
                        </summary>
                        <div className="mt-3 space-y-2 pl-3 border-l-2 border-slate-200 dark:border-slate-700">
                          {msg.sources.map((src, sIdx) => (
                            <div
                              key={sIdx}
                              className="p-3 bg-white dark:bg-[#162032] rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1"
                            >
                              <div className="flex items-center justify-between text-[11px] text-slate-400">
                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                  Page {src.page_number} · {src.section_title}
                                </span>
                                {src.similarity && (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px]">
                                    {(src.similarity * 100).toFixed(1)}% match
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-300 font-mono leading-relaxed bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg line-clamp-3">
                                {src.content}
                              </p>
                              <button
                                onClick={() => setActiveSourceModal(src)}
                                className="text-[11px] font-semibold text-[#4F8CFF] hover:underline pt-1 inline-block"
                              >
                                View full clause excerpt →
                              </button>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}

        {/* Loading / Generating State */}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#4F8CFF] flex items-center justify-center font-bold text-xs border border-blue-200/60 dark:border-blue-900/40">
              ✦
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 px-5 py-3.5 rounded-2xl text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-3">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4F8CFF] animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#4F8CFF] animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#4F8CFF] animate-bounce [animation-delay:0.4s]" />
              </span>
              <span>Searching policy clauses & verifying evidence...</span>
            </div>
          </div>
        )}

        {/* Error Notice */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-xs flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="font-bold hover:opacity-80 text-sm ml-2"
            >
              ✕
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Bar */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30">
        <div className="relative flex items-center bg-white dark:bg-[#162032] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xs focus-within:ring-2 focus-within:ring-[#4F8CFF]/20 focus-within:border-[#4F8CFF] transition-all">
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your coverage, limits, ICU, exclusions..."
            className="w-full text-sm bg-transparent px-4 py-3 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none resize-none max-h-32"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputQuestion.trim() || isLoading}
            className="mr-2 p-2.5 rounded-xl bg-[#0B1220] hover:bg-[#162A46] dark:bg-[#4F8CFF] dark:hover:bg-[#3d7ae8] text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center shrink-0"
            title="Send Question"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>

        {/* Disclaimer Footer */}
        <p className="mt-2 text-[10px] text-slate-400 dark:text-slate-500 text-center">
          PRISM provides policy guidance based strictly on your uploaded insurance documents. It does not provide medical or legal advice, nor guarantee claim approval.
        </p>
      </div>

      {/* Source Modal for Viewing Full Clause */}
      {activeSourceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#0E1726] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {activeSourceModal.section_title || 'Policy Clause'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Page {activeSourceModal.page_number} · Match Score: {((activeSourceModal.similarity || 0) * 100).toFixed(1)}%
                </p>
              </div>
              <button
                onClick={() => setActiveSourceModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto font-mono text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap bg-slate-50 dark:bg-slate-900/50">
              {activeSourceModal.content}
            </div>
            <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex justify-end">
              <button
                onClick={() => setActiveSourceModal(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
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
