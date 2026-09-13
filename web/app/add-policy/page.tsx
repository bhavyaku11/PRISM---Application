import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Navbar } from '@/components/layout/Navbar';
import { PolicyForm } from '@/components/policies/PolicyForm';
import type { Profile } from '@/types/auth';

export const metadata: Metadata = {
  title: 'Add Policy — PRISM Insurance Companion',
  description:
    'Upload your health insurance policy document to PRISM for secure storage and intelligence preparation.',
};

export default async function AddPolicyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/add-policy');
  }

  let profile: Profile | null = null;
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  profile = data as Profile | null;

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F8FB] dark:bg-[#0B1220]">
      <Navbar userEmail={user.email} profile={profile} />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Page Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-[#4F8CFF] text-xs font-semibold uppercase tracking-wider mb-2 border border-blue-200/50 dark:border-blue-900/50">
            Page 07 &middot; Policy Intake
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0B1220] dark:text-[#F6F8FB] tracking-tight">
            Add Health Insurance Policy
          </h1>
          <p className="mt-1.5 text-sm text-[#667085] dark:text-slate-400 leading-relaxed">
            Upload your policy document (PDF) to organize your coverage, store it securely, and prepare for evidence-grounded answers.
          </p>
        </div>

        {/* Main Form Container */}
        <div className="p-6 sm:p-9 rounded-2xl bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <PolicyForm />
        </div>
      </main>
    </div>
  );
}
