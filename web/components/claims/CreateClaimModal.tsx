'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Policy } from '@/types/policy';
import type { ClaimType } from '@/types/claim';
import { calculatePreparationProgress } from '@/types/claim';

interface CreateClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  policies: Policy[];
  defaultPolicyId?: string;
}

export function CreateClaimModal({
  isOpen,
  onClose,
  policies,
  defaultPolicyId,
}: CreateClaimModalProps) {
  if (!isOpen) return null;

  return (
    <CreateClaimModalContent
      onClose={onClose}
      policies={policies}
      defaultPolicyId={defaultPolicyId}
    />
  );
}

function CreateClaimModalContent({
  onClose,
  policies,
  defaultPolicyId,
}: Omit<CreateClaimModalProps, 'isOpen'>) {
  const router = useRouter();
  const supabase = createClient();

  const initialPolicy = defaultPolicyId || (policies.length > 0 ? policies[0].id : '');
  const [policyId, setPolicyId] = useState<string>(initialPolicy);
  const [claimName, setClaimName] = useState<string>('');
  const [claimType, setClaimType] = useState<ClaimType>('Hospitalization');
  const [insuredMember, setInsuredMember] = useState<string>(() => {
    const matched = policies.find((p) => p.id === initialPolicy);
    return matched?.insured_member || '';
  });
  const [hospitalName, setHospitalName] = useState<string>('');
  const [admissionDate, setAdmissionDate] = useState<string>('');
  const [dischargeDate, setDischargeDate] = useState<string>('');
  const [estimatedExpense, setEstimatedExpense] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // When policy dropdown changes, optionally prefill insured_member
  const handlePolicyChange = (newPolicyId: string) => {
    setPolicyId(newPolicyId);
    const matched = policies.find((p) => p.id === newPolicyId);
    if (matched?.insured_member && !insuredMember) {
      setInsuredMember(matched.insured_member);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!policyId) {
      setErrorMessage('Please select a health policy for this claim.');
      return;
    }

    if (!claimName.trim()) {
      setErrorMessage('Please enter a descriptive claim name.');
      return;
    }

    setIsSubmitting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setErrorMessage('Your session has expired. Please sign in again.');
        setIsSubmitting(false);
        return;
      }

      const expenseVal = estimatedExpense.trim()
        ? parseFloat(estimatedExpense.replace(/,/g, ''))
        : null;

      const initialProgress = calculatePreparationProgress(
        {
          claim_name: claimName.trim(),
          hospital_name: hospitalName.trim(),
          admission_date: admissionDate || null,
          estimated_expense: expenseVal,
          notes: notes.trim(),
        },
        0,
        false,
        Boolean(notes.trim())
      );

      const { data, error } = await supabase
        .from('claims')
        .insert({
          user_id: user.id,
          policy_id: policyId,
          claim_name: claimName.trim(),
          claim_type: claimType,
          insured_member: insuredMember.trim() || null,
          hospital_name: hospitalName.trim() || null,
          admission_date: admissionDate || null,
          discharge_date: dischargeDate || null,
          estimated_expense: isNaN(expenseVal as number) ? null : expenseVal,
          currency: 'INR',
          status: 'preparing',
          preparation_progress: initialProgress,
          notes: notes.trim() || null,
        })
        .select()
        .single();

      if (error || !data) {
        setErrorMessage(error?.message || 'Could not create claim workspace. Please try again.');
        setIsSubmitting(false);
        return;
      }

      onClose();
      router.push(`/claims/${data.id}`);
      router.refresh();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'An unexpected error occurred while creating claim.'
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider text-[#4F8CFF] bg-blue-50 dark:bg-blue-950/40 border border-blue-200/50 dark:border-blue-900/50 mb-1">
              New Workspace
            </div>
            <h2 id="modal-title" className="text-lg font-bold text-[#0B1220] dark:text-[#F6F8FB]">
              Prepare a Health Claim
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]/50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Disclaimer Note */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800/80 text-[11px] text-[#667085] dark:text-slate-400 flex items-center gap-2.5">
          <svg className="w-4 h-4 text-[#4F8CFF] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>PRISM helps you organize documents & check clauses. It does not submit claims to insurers.</span>
        </div>

        {/* Form Body */}
        {policies.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center mb-3 border border-amber-200/50">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-[#0B1220] dark:text-[#F6F8FB]">
              No Health Policy Found
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              You need at least one health policy indexed in PRISM to create a claim workspace and verify evidence.
            </p>
            <div className="mt-5">
              <Link
                href="/add-policy"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-xl text-white bg-[#0B1220] dark:bg-[#4F8CFF] hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]/50"
              >
                + Add Your Health Policy First
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300">
                {errorMessage}
              </div>
            )}

            {/* Policy Selection */}
            <div>
              <label htmlFor="policy-select" className="block text-xs font-semibold text-[#0B1220] dark:text-[#F6F8FB] mb-1">
                Associated Health Policy <span className="text-rose-500">*</span>
              </label>
              <select
                id="policy-select"
                value={policyId}
                onChange={(e) => handlePolicyChange(e.target.value)}
                required
                className="w-full h-10 px-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[#0B1220] dark:text-[#F6F8FB] focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]/50"
              >
                {policies.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.policy_name} ({p.insurer_name})
                  </option>
                ))}
              </select>
            </div>

            {/* Claim Name & Claim Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="claim-name-input" className="block text-xs font-semibold text-[#0B1220] dark:text-[#F6F8FB] mb-1">
                  Claim Name / Reason <span className="text-rose-500">*</span>
                </label>
                <input
                  id="claim-name-input"
                  type="text"
                  value={claimName}
                  onChange={(e) => setClaimName(e.target.value)}
                  placeholder="e.g., Acute Dengue Hospitalization"
                  required
                  className="w-full h-10 px-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[#0B1220] dark:text-[#F6F8FB] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]/50"
                />
              </div>

              <div>
                <label htmlFor="claim-category-select" className="block text-xs font-semibold text-[#0B1220] dark:text-[#F6F8FB] mb-1">
                  Claim Category
                </label>
                <select
                  id="claim-category-select"
                  value={claimType}
                  onChange={(e) => setClaimType(e.target.value as ClaimType)}
                  className="w-full h-10 px-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[#0B1220] dark:text-[#F6F8FB] focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]/50"
                >
                  <option value="Hospitalization">Inpatient Hospitalization (24h+)</option>
                  <option value="Day Care">Day Care Procedure</option>
                  <option value="Pre/Post Hospitalization">Pre / Post Hospitalization</option>
                  <option value="Other">Other Medical Claim</option>
                </select>
              </div>
            </div>

            {/* Insured Member & Hospital Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="insured-member-input" className="block text-xs font-semibold text-[#0B1220] dark:text-[#F6F8FB] mb-1">
                  Insured Patient Name
                </label>
                <input
                  id="insured-member-input"
                  type="text"
                  value={insuredMember}
                  onChange={(e) => setInsuredMember(e.target.value)}
                  placeholder="e.g., Rajesh Sharma"
                  className="w-full h-10 px-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[#0B1220] dark:text-[#F6F8FB] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]/50"
                />
              </div>

              <div>
                <label htmlFor="hospital-name-input" className="block text-xs font-semibold text-[#0B1220] dark:text-[#F6F8FB] mb-1">
                  Hospital / Clinic Name
                </label>
                <input
                  id="hospital-name-input"
                  type="text"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  placeholder="e.g., Manipal Hospital, Bengaluru"
                  className="w-full h-10 px-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[#0B1220] dark:text-[#F6F8FB] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]/50"
                />
              </div>
            </div>

            {/* Admission Date & Discharge Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="admission-date-input" className="block text-xs font-semibold text-[#0B1220] dark:text-[#F6F8FB] mb-1">
                  Admission Date
                </label>
                <input
                  id="admission-date-input"
                  type="date"
                  value={admissionDate}
                  onChange={(e) => setAdmissionDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[#0B1220] dark:text-[#F6F8FB] focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]/50"
                />
              </div>

              <div>
                <label htmlFor="discharge-date-input" className="block text-xs font-semibold text-[#0B1220] dark:text-[#F6F8FB] mb-1">
                  Discharge Date (Optional)
                </label>
                <input
                  id="discharge-date-input"
                  type="date"
                  value={dischargeDate}
                  onChange={(e) => setDischargeDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[#0B1220] dark:text-[#F6F8FB] focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]/50"
                />
              </div>
            </div>

            {/* Estimated Expense */}
            <div>
              <label htmlFor="estimated-expense-input" className="block text-xs font-semibold text-[#0B1220] dark:text-[#F6F8FB] mb-1">
                Estimated Medical Expense (₹ INR)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs text-slate-400">₹</span>
                <input
                  id="estimated-expense-input"
                  type="text"
                  value={estimatedExpense}
                  onChange={(e) => setEstimatedExpense(e.target.value)}
                  placeholder="e.g., 65,000"
                  className="w-full h-10 pl-8 pr-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[#0B1220] dark:text-[#F6F8FB] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]/50"
                />
              </div>
            </div>

            {/* Preparation Notes */}
            <div>
              <label htmlFor="notes-input" className="block text-xs font-semibold text-[#0B1220] dark:text-[#F6F8FB] mb-1">
                Preparation Notes (Optional)
              </label>
              <textarea
                id="notes-input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Doctor recommendations, planned surgery details, or TPA desk interactions..."
                className="w-full p-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[#0B1220] dark:text-[#F6F8FB] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]/50 resize-none"
              />
            </div>

            {/* Submit & Cancel */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]/50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-medium rounded-xl text-white bg-[#0B1220] hover:bg-[#162A46] dark:bg-[#4F8CFF] dark:hover:bg-[#3d7ae8] transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]/50"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Creating Workspace...</span>
                  </>
                ) : (
                  <span>Create Claim Workspace &rarr;</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
