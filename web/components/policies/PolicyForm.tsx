'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PolicyFileUploader } from './PolicyFileUploader';
import type { PolicyFormData, UploadStep } from '@/types/policy';

export function PolicyForm() {
  const router = useRouter();
  const supabase = createClient();

  const [formData, setFormData] = useState<PolicyFormData>({
    policyName: '',
    insurerName: '',
    policyNumber: '',
    policyType: 'Health Insurance',
    insuredMember: '',
    startDate: '',
    endDate: '',
    sumInsured: '',
    premium: '',
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [step, setStep] = useState<UploadStep>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const sanitizeFilename = (filename: string): string => {
    // Remove non-alphanumeric characters except dot, dash, and underscore
    return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    // Client-side validations
    if (!formData.policyName.trim()) {
      setErrorMessage('Please enter a policy name.');
      return;
    }

    if (!formData.insurerName.trim()) {
      setErrorMessage('Please enter the insurance company name.');
      return;
    }

    if (!selectedFile) {
      setErrorMessage('Please select a health insurance policy PDF to upload.');
      return;
    }

    setStep('validating');

    try {
      // 1. Authenticate user session
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setErrorMessage('Your session has expired. Please sign in again.');
        setStep('error');
        router.push('/login?next=/add-policy');
        return;
      }

      // 2. Insert Policy Record in public.policies
      setStep('creating_policy');
      const sumInsuredVal = formData.sumInsured.trim()
        ? parseFloat(formData.sumInsured.replace(/,/g, ''))
        : null;
      const premiumVal = formData.premium.trim()
        ? parseFloat(formData.premium.replace(/,/g, ''))
        : null;

      const { data: policy, error: policyError } = await supabase
        .from('policies')
        .insert({
          user_id: user.id,
          policy_name: formData.policyName.trim(),
          insurer_name: formData.insurerName.trim(),
          policy_number: formData.policyNumber.trim() || null,
          policy_type: formData.policyType.trim() || 'Health Insurance',
          insured_member: formData.insuredMember.trim() || null,
          policy_start_date: formData.startDate || null,
          policy_end_date: formData.endDate || null,
          sum_insured: isNaN(sumInsuredVal as number) ? null : sumInsuredVal,
          premium: isNaN(premiumVal as number) ? null : premiumVal,
          premium_currency: 'INR',
          status: 'processing',
          understanding_score: null,
        })
        .select()
        .single();

      if (policyError || !policy) {
        setErrorMessage(
          policyError?.message ||
            'Could not save policy information. Please check the values and try again.'
        );
        setStep('error');
        return;
      }

      // 3. Upload PDF to private Supabase Storage bucket `policy-documents`
      setStep('uploading_document');
      const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const safeFileName = `${uniqueSuffix}_${sanitizeFilename(selectedFile.name)}`;
      const storagePath = `${user.id}/${policy.id}/${safeFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('policy-documents')
        .upload(storagePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: selectedFile.type || 'application/pdf',
        });

      if (uploadError) {
        // Rollback created policy to prevent orphaned policy records without document
        await supabase.from('policies').delete().eq('id', policy.id);

        setErrorMessage(
          'We could not upload your policy document to secure storage. Please check your connection and try again.'
        );
        setStep('error');
        return;
      }

      // 4. Create Document record in public.documents
      setStep('creating_document');
      const { error: docError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          policy_id: policy.id,
          document_name: selectedFile.name,
          document_type: 'policy',
          storage_path: storagePath,
          mime_type: selectedFile.type || 'application/pdf',
          file_size: selectedFile.size,
          page_count: null,
          processing_status: 'pending',
          processing_error: null,
          extracted_text: null,
          metadata: {
            original_filename: selectedFile.name,
            uploaded_at: new Date().toISOString(),
          },
        });

      if (docError) {
        // Rollback both storage and policy record
        await supabase.storage.from('policy-documents').remove([storagePath]);
        await supabase.from('policies').delete().eq('id', policy.id);

        setErrorMessage(
          'Failed to record the uploaded document in PRISM database. Please try again.'
        );
        setStep('error');
        return;
      }

      // 5. Complete and redirect to Policy Processing page
      setStep('complete');
      router.push(`/processing/${policy.id}`);
    } catch {
      setErrorMessage(
        'An unexpected error occurred while adding the policy. Please try again.'
      );
      setStep('error');
    }
  };

  const isSubmitting = step !== 'idle' && step !== 'error';

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">
      {/* Alert Error Message */}
      {errorMessage && (
        <div
          role="alert"
          aria-live="polite"
          className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 text-sm flex items-start gap-3 shadow-sm"
        >
          <svg
            className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1 leading-relaxed">{errorMessage}</div>
        </div>
      )}

      {/* SECTION 1: PDF Document Upload */}
      <div className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#0B1220] dark:text-[#F6F8FB]">
            1. Policy Document (PDF)
          </h2>
          <p className="text-xs text-[#667085] dark:text-slate-400 mt-0.5">
            Upload the official policy schedule, wording, or Customer Information Sheet.
          </p>
        </div>

        <PolicyFileUploader
          selectedFile={selectedFile}
          onFileSelect={setSelectedFile}
          disabled={isSubmitting}
        />
      </div>

      {/* SECTION 2: Basic Policy Information */}
      <div className="space-y-5 pt-4 border-t border-slate-200/80 dark:border-slate-800">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#0B1220] dark:text-[#F6F8FB]">
            2. Policy Information
          </h2>
          <p className="text-xs text-[#667085] dark:text-slate-400 mt-0.5">
            Enter key details to identify this policy in your PRISM vault.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {/* Policy Name (Required) */}
          <div className="md:col-span-2">
            <label
              htmlFor="policyName"
              className="block text-xs font-medium text-[#0B1220] dark:text-[#F6F8FB] mb-1.5"
            >
              Policy Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="policyName"
              name="policyName"
              type="text"
              required
              value={formData.policyName}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="e.g. Optima Secure / Care Supreme / ReAssure 2.0"
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[#111827] dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F8CFF] focus:border-transparent transition-all disabled:opacity-60"
            />
          </div>

          {/* Insurer Name (Required) */}
          <div>
            <label
              htmlFor="insurerName"
              className="block text-xs font-medium text-[#0B1220] dark:text-[#F6F8FB] mb-1.5"
            >
              Insurance Company <span className="text-rose-500">*</span>
            </label>
            <input
              id="insurerName"
              name="insurerName"
              type="text"
              required
              value={formData.insurerName}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="e.g. HDFC ERGO, Care Health, Niva Bupa, Star Health"
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[#111827] dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F8CFF] focus:border-transparent transition-all disabled:opacity-60"
            />
          </div>

          {/* Policy Number (Optional) */}
          <div>
            <label
              htmlFor="policyNumber"
              className="block text-xs font-medium text-[#0B1220] dark:text-[#F6F8FB] mb-1.5"
            >
              Policy Number <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              id="policyNumber"
              name="policyNumber"
              type="text"
              value={formData.policyNumber}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="e.g. 2825-2024-819200-01"
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[#111827] dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F8CFF] focus:border-transparent transition-all disabled:opacity-60"
            />
          </div>

          {/* Policy Type (Default: Health Insurance) */}
          <div>
            <label
              htmlFor="policyType"
              className="block text-xs font-medium text-[#0B1220] dark:text-[#F6F8FB] mb-1.5"
            >
              Policy Type
            </label>
            <input
              id="policyType"
              name="policyType"
              type="text"
              readOnly
              value={formData.policyType}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-[#0B1220] dark:text-slate-300 text-sm cursor-not-allowed select-none"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              PRISM currently specializes in Indian health insurance policies.
            </span>
          </div>

          {/* Insured Member (Optional) */}
          <div>
            <label
              htmlFor="insuredMember"
              className="block text-xs font-medium text-[#0B1220] dark:text-[#F6F8FB] mb-1.5"
            >
              Covered Members <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              id="insuredMember"
              name="insuredMember"
              type="text"
              value={formData.insuredMember}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="e.g. Self, Spouse, 2 Children"
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[#111827] dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F8CFF] focus:border-transparent transition-all disabled:opacity-60"
            />
          </div>

          {/* Sum Insured (Optional) */}
          <div>
            <label
              htmlFor="sumInsured"
              className="block text-xs font-medium text-[#0B1220] dark:text-[#F6F8FB] mb-1.5"
            >
              Sum Insured (₹) <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              id="sumInsured"
              name="sumInsured"
              type="text"
              value={formData.sumInsured}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="e.g. 1000000"
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[#111827] dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F8CFF] focus:border-transparent transition-all disabled:opacity-60"
            />
          </div>

          {/* Annual Premium (Optional) */}
          <div>
            <label
              htmlFor="premium"
              className="block text-xs font-medium text-[#0B1220] dark:text-[#F6F8FB] mb-1.5"
            >
              Annual Premium (₹) <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              id="premium"
              name="premium"
              type="text"
              value={formData.premium}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="e.g. 18500"
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[#111827] dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F8CFF] focus:border-transparent transition-all disabled:opacity-60"
            />
          </div>

          {/* Policy Start Date (Optional) */}
          <div>
            <label
              htmlFor="startDate"
              className="block text-xs font-medium text-[#0B1220] dark:text-[#F6F8FB] mb-1.5"
            >
              Policy Start Date <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              id="startDate"
              name="startDate"
              type="date"
              value={formData.startDate}
              onChange={handleInputChange}
              disabled={isSubmitting}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[#111827] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4F8CFF] focus:border-transparent transition-all disabled:opacity-60"
            />
          </div>

          {/* Policy End Date (Optional) */}
          <div>
            <label
              htmlFor="endDate"
              className="block text-xs font-medium text-[#0B1220] dark:text-[#F6F8FB] mb-1.5"
            >
              Policy Expiry Date <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              id="endDate"
              name="endDate"
              type="date"
              value={formData.endDate}
              onChange={handleInputChange}
              disabled={isSubmitting}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[#111827] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4F8CFF] focus:border-transparent transition-all disabled:opacity-60"
            />
          </div>
        </div>
      </div>

      {/* SUBMISSION CONTROLS */}
      <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-[#667085] dark:text-slate-400">
          Your document is encrypted and stored in private user-scoped storage.
        </p>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto min-w-[180px] h-11 px-6 inline-flex items-center justify-center font-medium text-sm rounded-xl text-white bg-[#0B1220] hover:bg-[#162A46] dark:bg-[#4F8CFF] dark:hover:bg-[#3d7ae8] transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]/50 shadow-sm"
        >
          {step === 'validating' && (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
              Validating...
            </span>
          )}
          {step === 'creating_policy' && (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
              Creating policy...
            </span>
          )}
          {step === 'uploading_document' && (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
              Uploading PDF...
            </span>
          )}
          {step === 'creating_document' && (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
              Finalizing...
            </span>
          )}
          {step === 'complete' && <span>Redirecting...</span>}
          {(step === 'idle' || step === 'error') && <span>Add Policy &amp; Upload</span>}
        </button>
      </div>
    </form>
  );
}
