'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Claim, ClaimType } from '@/types/claim';
import type { Policy } from '@/types/policy';
import { calculatePreparationProgress, formatClaimStatus } from '@/types/claim';

interface ClaimDetailsCardProps {
  claim: Claim;
  policy: Policy | null;
  attachedDocsCount: number;
  onUpdated?: (updatedClaim: Claim) => void;
}

export function ClaimDetailsCard({
  claim,
  policy,
  attachedDocsCount,
  onUpdated,
}: ClaimDetailsCardProps) {
  const router = useRouter();
  const supabase = createClient();

  const [isEditing, setIsEditing] = useState(false);
  const [claimName, setClaimName] = useState(claim.claim_name);
  const [claimType, setClaimType] = useState<ClaimType>(
    (claim.claim_type as ClaimType) || 'Hospitalization'
  );
  const [insuredMember, setInsuredMember] = useState(claim.insured_member || '');
  const [hospitalName, setHospitalName] = useState(claim.hospital_name || '');
  const [admissionDate, setAdmissionDate] = useState(claim.admission_date || '');
  const [dischargeDate, setDischargeDate] = useState(claim.discharge_date || '');
  const [estimatedExpense, setEstimatedExpense] = useState(
    claim.estimated_expense ? claim.estimated_expense.toString() : ''
  );
  const [notes, setNotes] = useState(claim.notes || '');

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!claimName.trim()) {
      setErrorMsg('Claim name cannot be empty.');
      return;
    }

    setIsSaving(true);
    try {
      const expenseVal = estimatedExpense.trim()
        ? parseFloat(estimatedExpense.replace(/,/g, ''))
        : null;

      const updatedProgress = calculatePreparationProgress(
        {
          claim_name: claimName.trim(),
          hospital_name: hospitalName.trim(),
          admission_date: admissionDate || null,
          estimated_expense: expenseVal,
          notes: notes.trim(),
        },
        attachedDocsCount,
        true, // Has reviewed details
        Boolean(notes.trim())
      );

      const { data, error } = await supabase
        .from('claims')
        .update({
          claim_name: claimName.trim(),
          claim_type: claimType,
          insured_member: insuredMember.trim() || null,
          hospital_name: hospitalName.trim() || null,
          admission_date: admissionDate || null,
          discharge_date: dischargeDate || null,
          estimated_expense: isNaN(expenseVal as number) ? null : expenseVal,
          notes: notes.trim() || null,
          preparation_progress: updatedProgress,
          updated_at: new Date().toISOString(),
        })
        .eq('id', claim.id)
        .select()
        .single();

      if (error || !data) {
        setErrorMsg(error?.message || 'Failed to update claim details.');
        setIsSaving(false);
        return;
      }

      setIsEditing(false);
      if (onUpdated) {
        onUpdated(data as Claim);
      }
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error updating claim.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-slate-800 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80 mb-5">
        <div>
          <h3 className="text-sm font-bold text-[#0B1220] dark:text-[#F6F8FB]">
            Claim Details & Intake Information
          </h3>
          <p className="text-xs text-[#667085] dark:text-slate-400 mt-0.5">
            Key medical and hospital admission details recorded for this claim.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="h-8 px-3 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 text-[#0B1220] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>
          <span>Edit Details</span>
        </button>
      </div>

      {/* Grid of Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80">
          <span className="text-[11px] text-slate-400 block mb-1">Health Policy</span>
          <span className="font-semibold text-[#0B1220] dark:text-[#F6F8FB] block truncate">
            {policy ? policy.policy_name : 'Attached Health Policy'}
          </span>
          <span className="text-[10px] text-[#667085] dark:text-slate-400 block truncate mt-0.5">
            {policy?.insurer_name}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80">
          <span className="text-[11px] text-slate-400 block mb-1">Claim Type</span>
          <span className="font-semibold text-[#0B1220] dark:text-[#F6F8FB] block">
            {claim.claim_type}
          </span>
          <span className="text-[10px] text-[#667085] dark:text-slate-400 block mt-0.5">
            Category
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80">
          <span className="text-[11px] text-slate-400 block mb-1">Insured Patient</span>
          <span className="font-semibold text-[#0B1220] dark:text-[#F6F8FB] block truncate">
            {claim.insured_member || 'Policyholder'}
          </span>
          <span className="text-[10px] text-[#667085] dark:text-slate-400 block mt-0.5">
            Covered Member
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80">
          <span className="text-[11px] text-slate-400 block mb-1">Hospital / Center</span>
          <span className="font-semibold text-[#0B1220] dark:text-[#F6F8FB] block truncate">
            {claim.hospital_name || 'Not provided'}
          </span>
          <span className="text-[10px] text-[#667085] dark:text-slate-400 block mt-0.5">
            Admitting Facility
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80">
          <span className="text-[11px] text-slate-400 block mb-1">Admission Date</span>
          <span className="font-semibold text-[#0B1220] dark:text-[#F6F8FB] block">
            {claim.admission_date
              ? new Date(claim.admission_date).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : 'Not specified'}
          </span>
          <span className="text-[10px] text-[#667085] dark:text-slate-400 block mt-0.5">
            Entry Date
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80">
          <span className="text-[11px] text-slate-400 block mb-1">Discharge Date</span>
          <span className="font-semibold text-[#0B1220] dark:text-[#F6F8FB] block">
            {claim.discharge_date
              ? new Date(claim.discharge_date).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : 'Ongoing / Not provided'}
          </span>
          <span className="text-[10px] text-[#667085] dark:text-slate-400 block mt-0.5">
            Exit Date
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80">
          <span className="text-[11px] text-slate-400 block mb-1">Estimated Expense</span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400 block">
            {claim.estimated_expense
              ? `₹${claim.estimated_expense.toLocaleString('en-IN')}`
              : 'Pending estimation'}
          </span>
          <span className="text-[10px] text-[#667085] dark:text-slate-400 block mt-0.5">
            Target Claim Amount
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80">
          <span className="text-[11px] text-slate-400 block mb-1">Status</span>
          <span className="font-semibold text-[#4F8CFF] block">
            {formatClaimStatus(claim.status)}
          </span>
          <span className="text-[10px] text-[#667085] dark:text-slate-400 block mt-0.5">
            Preparation Workflow
          </span>
        </div>
      </div>

      {/* Notes Row if present */}
      {claim.notes && (
        <div className="mt-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 text-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Preparation Notes & Doctor Context
          </span>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {claim.notes}
          </p>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditing && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-[#0E1726] border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-[#0B1220] dark:text-[#F6F8FB]">
                Edit Claim Information
              </h3>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                &times;
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 mb-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">
                  Claim Name
                </label>
                <input
                  type="text"
                  value={claimName}
                  onChange={(e) => setClaimName(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[#0B1220] dark:text-[#F6F8FB]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">
                    Claim Type
                  </label>
                  <select
                    value={claimType}
                    onChange={(e) => setClaimType(e.target.value as ClaimType)}
                    className="w-full h-9 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[#0B1220] dark:text-[#F6F8FB]"
                  >
                    <option value="Hospitalization">Hospitalization</option>
                    <option value="Day Care">Day Care</option>
                    <option value="Pre/Post Hospitalization">Pre/Post Hospitalization</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">
                    Insured Patient
                  </label>
                  <input
                    type="text"
                    value={insuredMember}
                    onChange={(e) => setInsuredMember(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[#0B1220] dark:text-[#F6F8FB]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">
                    Hospital Name
                  </label>
                  <input
                    type="text"
                    value={hospitalName}
                    onChange={(e) => setHospitalName(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[#0B1220] dark:text-[#F6F8FB]"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">
                    Estimated Expense (₹)
                  </label>
                  <input
                    type="text"
                    value={estimatedExpense}
                    onChange={(e) => setEstimatedExpense(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[#0B1220] dark:text-[#F6F8FB]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">
                    Admission Date
                  </label>
                  <input
                    type="date"
                    value={admissionDate}
                    onChange={(e) => setAdmissionDate(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[#0B1220] dark:text-[#F6F8FB]"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">
                    Discharge Date
                  </label>
                  <input
                    type="date"
                    value={dischargeDate}
                    onChange={(e) => setDischargeDate(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[#0B1220] dark:text-[#F6F8FB]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">
                  Preparation Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[#0B1220] dark:text-[#F6F8FB] resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-1.5 rounded-lg text-white bg-[#0B1220] dark:bg-[#4F8CFF]"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
