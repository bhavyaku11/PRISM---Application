'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import type { Policy, PolicyDocument } from '@/types/policy';

interface PolicyProcessingViewProps {
  policy: Policy;
  document: PolicyDocument | null;
}

interface ProcessingResultMetrics {
  page_count: number;
  pages_with_text: number;
  pages_without_text: number;
  chunks_created: number;
  sections_detected: number;
}

export function PolicyProcessingView({
  policy,
  document,
}: PolicyProcessingViewProps) {
  const [processingStatus, setProcessingStatus] = useState<string>(
    document?.processing_status || 'pending'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(
    document?.processing_error || null
  );
  const [metrics, setMetrics] = useState<ProcessingResultMetrics | null>(() => {
    if (document?.processing_status === 'processed' && document.metadata) {
      const meta = document.metadata as Record<string, unknown>;
      return {
        page_count: (meta.page_count as number) || document.page_count || 0,
        pages_with_text: (meta.pages_with_text as number) || 0,
        pages_without_text: (meta.pages_without_text as number) || 0,
        chunks_created: (meta.chunks_created as number) || 0,
        sections_detected: (meta.sections_detected as number) || 0,
      };
    }
    return null;
  });

  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const hasTriggeredRef = useRef<boolean>(false);

  const formatBytes = (bytes?: number): string => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (isoString?: string): string => {
    if (!isoString) return 'Just now';
    try {
      return new Date(isoString).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Just now';
    }
  };

  const documentId = document?.id;

  const triggerProcessing = useCallback(async () => {
    if (!documentId) return;

    setProcessingStatus('processing');
    setErrorMessage(null);
    setIsRetrying(true);

    try {
      const res = await fetch(`/api/documents/${documentId}/process`, {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        setProcessingStatus('failed');
        setErrorMessage(
          data.error || 'Document processing failed. Please try again.'
        );
        return;
      }

      setProcessingStatus('processed');
      setMetrics({
        page_count: data.page_count || 0,
        pages_with_text: data.pages_with_text || 0,
        pages_without_text: data.pages_without_text || 0,
        chunks_created: data.chunks_created || 0,
        sections_detected: data.sections_detected || 0,
      });
    } catch (err) {
      setProcessingStatus('failed');
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Could not connect to document processing engine.'
      );
    } finally {
      setIsRetrying(false);
    }
  }, [documentId]);

  useEffect(() => {
    if (
      documentId &&
      (document?.processing_status === 'pending' ||
        document?.processing_status === 'processing') &&
      !hasTriggeredRef.current
    ) {
      hasTriggeredRef.current = true;
      triggerProcessing();
    }
  }, [documentId, document?.processing_status, triggerProcessing]);

  // Derive dynamic step statuses
  const isComplete = processingStatus === 'processed';
  const isFailed = processingStatus === 'failed';
  const isProcessing = processingStatus === 'processing';

  const steps = [
    {
      label: 'PDF Uploaded to Private Storage',
      description: 'Encrypted and stored in user-scoped bucket',
      status: 'complete',
    },
    {
      label: 'Policy & Document Records Created',
      description: 'Indexed in Supabase PostgreSQL with RLS',
      status: 'complete',
    },
    {
      label: 'Page-Aware Extraction & Section Detection',
      description: isComplete
        ? `PyMuPDF parsed ${metrics?.page_count || document?.page_count || ''} pages · ${metrics?.sections_detected || 0} sections identified`
        : isFailed
        ? 'Extraction could not be completed'
        : isProcessing
        ? 'Extracting text and identifying insurance clauses...'
        : 'Scheduled for processing',
      status: isComplete ? 'complete' : isFailed ? 'failed' : isProcessing ? 'active' : 'upcoming',
    },
    {
      label: 'Page-Aware Chunking & Vault Storage',
      description: isComplete
        ? `${metrics?.chunks_created || 0} page-aware chunks stored in document_chunks`
        : isProcessing
        ? 'Generating chunks (~500–1000 words) with page citations...'
        : 'Waiting for text extraction',
      status: isComplete ? 'complete' : isProcessing ? 'active' : 'upcoming',
    },
    {
      label: 'PRISM Evidence Retrieval & Analysis',
      description: 'Scheduled for Slice 5: PRISM RAG Pipeline',
      status: 'upcoming',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Status Header */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-slate-800 shadow-sm text-center">
        {/* Status Icon */}
        <div className="mx-auto mb-4">
          {isComplete && (
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/60 dark:border-emerald-900/50 shadow-sm">
              <svg
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          )}

          {isProcessing && (
            <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-[#4F8CFF] flex items-center justify-center border border-blue-200/60 dark:border-blue-900/50 shadow-sm">
              <span className="w-7 h-7 border-3 border-blue-200 border-t-[#4F8CFF] rounded-full animate-spin" />
            </div>
          )}

          {isFailed && (
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200/60 dark:border-rose-900/50 shadow-sm">
              <svg
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          )}

          {!isComplete && !isProcessing && !isFailed && (
            <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-[#4F8CFF] flex items-center justify-center border border-blue-100 dark:border-blue-900/50 shadow-sm">
              <svg
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.75}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Badge */}
        <div className="mb-2">
          {isComplete && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider border border-emerald-200/60 dark:border-emerald-900/50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Document Processed &amp; Indexed
            </span>
          )}
          {isProcessing && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-[#4F8CFF] text-xs font-semibold uppercase tracking-wider border border-blue-200/60 dark:border-blue-900/50">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4F8CFF] animate-ping" />
              Processing Policy Document
            </span>
          )}
          {isFailed && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 text-xs font-semibold uppercase tracking-wider border border-rose-200/60 dark:border-rose-900/50">
              Processing Failed
            </span>
          )}
          {!isComplete && !isProcessing && !isFailed && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider">
              Preparing Document
            </span>
          )}
        </div>

        {/* Title & Description */}
        <h1 className="text-xl sm:text-2xl font-bold text-[#0B1220] dark:text-[#F6F8FB] tracking-tight">
          {isComplete && 'Your policy is ready for PRISM.'}
          {isProcessing && 'Extracting text and clauses...'}
          {isFailed && 'Could not process document.'}
          {!isComplete && !isProcessing && !isFailed && 'Preparing your policy document...'}
        </h1>

        <p className="mt-2 text-sm text-[#667085] dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
          {isComplete &&
            'PyMuPDF has completed page-by-page text extraction and structured chunking. Your document is ready for evidence retrieval.'}
          {isProcessing &&
            'PRISM is securely downloading the PDF from your private vault, preserving page citations, and generating page-aware text chunks.'}
          {isFailed &&
            (errorMessage ||
              'We were unable to extract text from this PDF. Please check the file and try again.')}
          {!isComplete &&
            !isProcessing &&
            !isFailed &&
            'Your policy document is queued for page-aware extraction.'}
        </p>

        {/* Retry Button if Failed */}
        {isFailed && (
          <div className="mt-5">
            <button
              onClick={triggerProcessing}
              disabled={isRetrying}
              className="h-10 px-5 inline-flex items-center justify-center gap-2 font-medium text-xs rounded-xl text-white bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-700 transition-colors shadow-sm disabled:opacity-60"
            >
              {isRetrying ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Retry Document Processing
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Real Extraction Metrics Card (Shown when processed) */}
      {isComplete && metrics && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0E1726] border border-emerald-200/70 dark:border-emerald-900/50 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-100/60 dark:border-emerald-950/50">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Extraction &amp; Chunking Results
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/50">
              Status: Active
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
              <div className="text-2xl font-bold text-[#0B1220] dark:text-[#F6F8FB]">
                {metrics.page_count}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                Total Pages
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {metrics.pages_with_text}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                Pages with Text
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
              <div className="text-2xl font-bold text-[#4F8CFF]">
                {metrics.sections_detected}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                Sections Detected
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
              <div className="text-2xl font-bold text-[#0B1220] dark:text-[#F6F8FB]">
                {metrics.chunks_created}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                Page Chunks
              </div>
            </div>
          </div>

          {metrics.pages_without_text > 0 && (
            <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-200/50 dark:border-amber-900/40">
              Note: {metrics.pages_without_text} page(s) contained scans or no extractable text. They will be queued for OCR processing in a future update.
            </p>
          )}
        </div>
      )}

      {/* Uploaded Record Summary */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Uploaded Policy Details
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Document: {processingStatus}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5">Policy Name</span>
            <span className="font-semibold text-sm text-[#0B1220] dark:text-[#F6F8FB]">
              {policy.policy_name}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Insurance Company</span>
            <span className="font-semibold text-sm text-[#0B1220] dark:text-[#F6F8FB]">
              {policy.insurer_name}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Policy Number</span>
            <span className="font-medium text-[#0B1220] dark:text-slate-200">
              {policy.policy_number || 'Not provided'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Policy Type</span>
            <span className="font-medium text-[#0B1220] dark:text-slate-200">
              {policy.policy_type}
            </span>
          </div>

          {policy.sum_insured && (
            <div>
              <span className="text-slate-400 block mb-0.5">Sum Insured</span>
              <span className="font-medium text-[#0B1220] dark:text-slate-200">
                ₹{policy.sum_insured.toLocaleString('en-IN')}
              </span>
            </div>
          )}

          {policy.premium && (
            <div>
              <span className="text-slate-400 block mb-0.5">Annual Premium</span>
              <span className="font-medium text-[#0B1220] dark:text-slate-200">
                ₹{policy.premium.toLocaleString('en-IN')}
              </span>
            </div>
          )}

          <div>
            <span className="text-slate-400 block mb-0.5">Document Name</span>
            <span className="font-medium text-[#0B1220] dark:text-slate-200 truncate block">
              {document?.document_name || 'Policy.pdf'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">File Size</span>
            <span className="font-medium text-[#0B1220] dark:text-slate-200">
              {formatBytes(document?.file_size)}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Upload Time</span>
            <span className="font-medium text-[#0B1220] dark:text-slate-200">
              {formatDate(policy.created_at)}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Pipeline Status</span>
            <span className="font-medium text-[#0B1220] dark:text-slate-200 capitalize">
              {processingStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Pipeline Status Breakdown */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          PRISM Ingestion Pipeline
        </h2>

        <div className="space-y-3">
          {steps.map((stepItem, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3.5 p-3 rounded-xl bg-slate-50/60 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80"
            >
              <div className="mt-0.5">
                {stepItem.status === 'complete' && (
                  <span className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold border border-emerald-200/80 dark:border-emerald-900/60">
                    ✓
                  </span>
                )}
                {stepItem.status === 'active' && (
                  <span className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#4F8CFF] flex items-center justify-center text-xs font-bold border border-blue-200/80 dark:border-blue-900/60">
                    <span className="w-2 h-2 rounded-full bg-[#4F8CFF] animate-ping" />
                  </span>
                )}
                {stepItem.status === 'failed' && (
                  <span className="w-5 h-5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center text-xs font-bold border border-rose-200/80 dark:border-rose-900/60">
                    ✕
                  </span>
                )}
                {stepItem.status === 'upcoming' && (
                  <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 flex items-center justify-center text-xs font-medium">
                    {idx + 1}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#0B1220] dark:text-[#F6F8FB]">
                  {stepItem.label}
                </p>
                <p className="text-[11px] text-[#667085] dark:text-slate-400 mt-0.5">
                  {stepItem.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-xs text-[#0B1220] dark:text-slate-300 leading-relaxed">
          <p className="font-semibold text-[#4F8CFF] mb-1">
            Real Pipeline Roadmap
          </p>
          PRISM does not fabricate mock analysis or artificial understanding scores. Document text extraction and page-aware chunking are now active. RAG queries and semantic claim verification will be unlocked in <strong>Slice 5</strong>.
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto h-11 px-5 inline-flex items-center justify-center font-medium text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[#0B1220] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs"
          >
            &larr; Back to Dashboard
          </Link>
          <Link
            href="/add-policy"
            className="w-full sm:w-auto h-11 px-5 inline-flex items-center justify-center font-medium text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[#0B1220] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs"
          >
            + Add Another Policy
          </Link>
        </div>

        {isComplete && (
          <Link
            href={`/policies/${policy.id}`}
            className="w-full sm:w-auto h-11 px-6 inline-flex items-center justify-center font-semibold text-xs rounded-xl text-white bg-[#0B1220] hover:bg-[#162A46] dark:bg-[#4F8CFF] dark:hover:bg-[#3d7ae8] transition-colors shadow-sm gap-1.5"
          >
            <span>View Policy Overview</span>
            <span>&rarr;</span>
          </Link>
        )}
      </div>
    </div>
  );
}
