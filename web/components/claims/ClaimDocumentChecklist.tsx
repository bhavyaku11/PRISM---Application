'use client'

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Claim, ClaimDocument } from '@/types/claim';
import { STANDARD_CLAIM_REQUIREMENTS, calculatePreparationProgress } from '@/types/claim';
import type { PolicyDocument } from '@/types/policy';

interface ClaimDocumentChecklistProps {
  claim: Claim;
  claimDocuments: ClaimDocument[];
  allUserDocuments: PolicyDocument[];
  onUpdated?: () => void;
}

function generateClaimStoragePath(
  userId: string,
  policyId: string,
  claimId: string,
  originalFilename: string
): string {
  const safeName = originalFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${userId}/${policyId}/claims/${claimId}/${timestamp}_${randomSuffix}_${safeName}`;
}

export function ClaimDocumentChecklist({
  claim,
  claimDocuments,
  allUserDocuments,
  onUpdated,
}: ClaimDocumentChecklistProps) {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeReqIdForUpload, setActiveReqIdForUpload] = useState<string | null>(null);
  const [activeReqIdForLink, setActiveReqIdForLink] = useState<string | null>(null);
  const [selectedExistingDocId, setSelectedExistingDocId] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isLinking, setIsLinking] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Helper to check if a requirement has a matched document
  // We match either by note prefix or by linked documents
  const getAttachedDocsForReq = (reqId: string): ClaimDocument[] => {
    return claimDocuments.filter((cd) => cd.notes?.includes(reqId) || false);
  };

  // Remaining documents not explicitly tagged to a requirement
  const getGeneralAttachedDocs = (): ClaimDocument[] => {
    const taggedIds = new Set(
      STANDARD_CLAIM_REQUIREMENTS.map((r) => r.id)
    );
    return claimDocuments.filter((cd) => {
      const hasTag = Array.from(taggedIds).some((tid) => cd.notes?.includes(tid));
      return !hasTag;
    });
  };

  // Recalculate progress and save to Supabase
  const updateClaimProgress = async (newDocCount: number) => {
    try {
      const updatedProgress = calculatePreparationProgress(
        claim,
        newDocCount,
        true,
        Boolean(claim.notes)
      );

      await supabase
        .from('claims')
        .update({
          preparation_progress: updatedProgress,
          updated_at: new Date().toISOString(),
        })
        .eq('id', claim.id);
    } catch {
      // Non-critical background progress sync
    }
  };

  // Link an existing vault document
  const handleLinkExisting = async (reqId?: string) => {
    if (!selectedExistingDocId) return;
    setIsLinking(true);
    setErrorMessage(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setErrorMessage('Session expired. Please sign in again.');
        setIsLinking(false);
        return;
      }

      const noteText = reqId ? `Requirement: [${reqId}]` : 'Claim Attachment';

      const { error } = await supabase.from('claim_documents').insert({
        user_id: user.id,
        claim_id: claim.id,
        document_id: selectedExistingDocId,
        notes: noteText,
      });

      if (error) {
        setErrorMessage(error.message || 'Could not link document.');
        setIsLinking(false);
        return;
      }

      await updateClaimProgress(claimDocuments.length + 1);
      setActiveReqIdForLink(null);
      setSelectedExistingDocId('');
      if (onUpdated) onUpdated();
      router.refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error linking document.');
    } finally {
      setIsLinking(false);
    }
  };

  // Upload a new document PDF/image
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setErrorMessage('Session expired. Please sign in again.');
        setIsUploading(false);
        return;
      }

      // 1. Upload to private Supabase storage
      const storagePath = generateClaimStoragePath(user.id, claim.policy_id, claim.id, file.name);

      const { error: uploadErr } = await supabase.storage
        .from('policy-documents')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || 'application/pdf',
        });

      if (uploadErr) {
        setErrorMessage(`Storage upload failed: ${uploadErr.message}`);
        setIsUploading(false);
        return;
      }

      // 2. Insert into documents table
      const { data: newDoc, error: docErr } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          policy_id: claim.policy_id,
          document_name: file.name,
          document_type: 'claim_attachment',
          storage_path: storagePath,
          mime_type: file.type || 'application/pdf',
          file_size: file.size,
          processing_status: 'processed',
          metadata: {
            claim_id: claim.id,
            uploaded_for_requirement: activeReqIdForUpload || 'general',
            original_filename: file.name,
            uploaded_at: new Date().toISOString(),
          },
        })
        .select()
        .single();

      if (docErr || !newDoc) {
        setErrorMessage(docErr?.message || 'Failed to record document in vault.');
        setIsUploading(false);
        return;
      }

      // 3. Link into claim_documents
      const noteTag = activeReqIdForUpload
        ? `Requirement: [${activeReqIdForUpload}]`
        : 'Claim Attachment';

      const { error: linkErr } = await supabase.from('claim_documents').insert({
        user_id: user.id,
        claim_id: claim.id,
        document_id: newDoc.id,
        notes: noteTag,
      });

      if (linkErr) {
        setErrorMessage(linkErr.message || 'Failed to link document to claim.');
        setIsUploading(false);
        return;
      }

      await updateClaimProgress(claimDocuments.length + 1);
      setActiveReqIdForUpload(null);
      if (onUpdated) onUpdated();
      router.refresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to upload document.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Remove / unlink document from claim
  const handleRemoveClaimDoc = async (claimDocId: string) => {
    try {
      await supabase.from('claim_documents').delete().eq('id', claimDocId);
      await updateClaimProgress(Math.max(0, claimDocuments.length - 1));
      if (onUpdated) onUpdated();
      router.refresh();
    } catch {
      setErrorMessage('Could not remove document attachment.');
    }
  };

  const totalAttachedCount = claimDocuments.length;

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
      {/* Hidden File Input for Direct Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
      />

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider text-[#4F8CFF] bg-blue-50 dark:bg-blue-950/40 border border-blue-200/50 dark:border-blue-900/50 mb-1">
            Pre-Submission Checklist
          </div>
          <h3 className="text-sm font-bold text-[#0B1220] dark:text-[#F6F8FB]">
            Claim Documents & Verification Checklist
          </h3>
          <p className="text-xs text-[#667085] dark:text-slate-400 mt-0.5">
            Assemble the official hospital and clinical papers required by Indian health insurers for claim settlement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveReqIdForUpload(null);
              fileInputRef.current?.click();
            }}
            disabled={isUploading}
            className="h-8 px-3 text-xs font-medium rounded-lg text-white bg-[#0B1220] dark:bg-[#4F8CFF] hover:opacity-90 transition-opacity inline-flex items-center gap-1.5"
          >
            {isUploading ? (
              <span>Uploading...</span>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span>+ Upload File</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* DISCLAIMER NOTICE */}
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80 text-[11px] text-[#667085] dark:text-slate-400 flex items-start gap-2">
        <svg className="w-4 h-4 text-[#4F8CFF] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="leading-relaxed">
          <strong>Preparation Guide:</strong> Requirements shown below reflect standard IRDAI and hospital TPA claims practice in India. Verify your insurer’s specific Customer Information Sheet for any additional non-standard riders.
        </span>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300">
          {errorMessage}
        </div>
      )}

      {/* REQUIREMENTS LIST */}
      <div className="space-y-3">
        {STANDARD_CLAIM_REQUIREMENTS.map((req) => {
          const attached = getAttachedDocsForReq(req.id);
          const isAdded = attached.length > 0;
          const statusText = isAdded
            ? 'Added'
            : req.isMandatory
            ? 'Required'
            : 'Missing';

          return (
            <div
              key={req.id}
              className={`p-4 rounded-xl border transition-all text-xs ${
                isAdded
                  ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/40'
                  : 'bg-white dark:bg-[#0E1726] border-slate-200/80 dark:border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                        isAdded
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : req.isMandatory
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/60'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {statusText}
                    </span>

                    <h4 className="font-semibold text-[#0B1220] dark:text-[#F6F8FB]">
                      {req.title}
                    </h4>

                    {req.isMandatory && (
                      <span className="text-[10px] font-medium text-rose-500">
                        * Mandatory for Settlement
                      </span>
                    )}
                  </div>

                  <p className="text-[#667085] dark:text-slate-400 text-xs leading-relaxed max-w-2xl">
                    {req.description}
                  </p>
                </div>

                {/* Requirement Actions */}
                <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                  {/* Upload specifically for this requirement */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveReqIdForUpload(req.id);
                      fileInputRef.current?.click();
                    }}
                    disabled={isUploading}
                    className="px-2.5 py-1 text-[11px] font-medium rounded-lg border border-slate-200 dark:border-slate-800 text-[#0B1220] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Upload File
                  </button>

                  {/* Link from existing Vault Documents */}
                  {allUserDocuments.length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setActiveReqIdForLink(
                          activeReqIdForLink === req.id ? null : req.id
                        )
                      }
                      className="px-2.5 py-1 text-[11px] font-medium rounded-lg border border-slate-200 dark:border-slate-800 text-[#4F8CFF] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      {activeReqIdForLink === req.id ? 'Cancel' : 'Link Vault Doc'}
                    </button>
                  )}
                </div>
              </div>

              {/* Inline Link Picker */}
              {activeReqIdForLink === req.id && (
                <div className="mt-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center gap-2">
                  <select
                    value={selectedExistingDocId}
                    onChange={(e) => setSelectedExistingDocId(e.target.value)}
                    className="flex-1 h-8 px-2.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#0B1220] dark:text-slate-200"
                  >
                    <option value="">-- Choose document from vault --</option>
                    {allUserDocuments.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.document_name} ({doc.document_type || 'PDF'})
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => handleLinkExisting(req.id)}
                    disabled={!selectedExistingDocId || isLinking}
                    className="h-8 px-3 rounded-lg text-xs font-medium text-white bg-[#0B1220] dark:bg-[#4F8CFF] disabled:opacity-50"
                  >
                    {isLinking ? 'Linking...' : 'Attach'}
                  </button>
                </div>
              )}

              {/* Display Attached Documents for this Requirement */}
              {attached.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/60 space-y-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                    Attached Files ({attached.length})
                  </span>
                  {attached.map((cd) => (
                    <div
                      key={cd.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-[11px]"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="font-medium text-[#0B1220] dark:text-[#F6F8FB] truncate">
                          {cd.documents?.document_name || 'Attached Document'}
                        </span>
                        <span className="text-slate-400 text-[10px]">
                          ({cd.documents?.file_size ? `${(cd.documents.file_size / 1024).toFixed(1)} KB` : 'Attached'})
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveClaimDoc(cd.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        title="Remove attachment from claim"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ADDITIONAL GENERAL ATTACHMENTS */}
      {getGeneralAttachedDocs().length > 0 && (
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
          <h4 className="text-xs font-bold text-[#0B1220] dark:text-[#F6F8FB]">
            Additional Claim Documents ({getGeneralAttachedDocs().length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {getGeneralAttachedDocs().map((cd) => (
              <div
                key={cd.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800"
              >
                <div className="truncate pr-2">
                  <span className="font-medium text-[#0B1220] dark:text-slate-200 block truncate">
                    {cd.documents?.document_name || 'Document File'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {cd.documents?.file_size ? `${(cd.documents.file_size / 1024).toFixed(1)} KB` : 'Uploaded'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveClaimDoc(cd.id)}
                  className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUMMARY FOOTER */}
      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
        <span className="text-[#667085] dark:text-slate-400">
          Total Documents Prepared for Claim:
        </span>
        <span className="font-bold text-[#0B1220] dark:text-[#F6F8FB]">
          {totalAttachedCount} {totalAttachedCount === 1 ? 'file' : 'files'}
        </span>
      </div>
    </div>
  );
}
