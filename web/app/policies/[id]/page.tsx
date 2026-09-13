import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Navbar } from '@/components/layout/Navbar';
import { PolicyOverviewView } from '@/components/policies/PolicyOverviewView';
import type { Profile } from '@/types/auth';
import type { Policy, PolicyDocument, PolicySection } from '@/types/policy';

export const metadata: Metadata = {
  title: 'Policy Overview — PRISM Insurance Companion',
  description:
    'Comprehensive overview of your health insurance policy, verified coverage benefits, and source-grounded exclusions.',
};

export default async function PolicyOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/policies/${id}`);
  }

  // Fetch user profile
  let profile: Profile | null = null;
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  profile = profileData as Profile | null;

  // Query policy record with strict user-scoped ownership check
  const { data: policyData, error: policyError } = await supabase
    .from('policies')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  // Handle Policy Not Found or Unauthorized Access
  if (policyError || !policyData) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F6F8FB] dark:bg-[#0B1220]">
        <Navbar userEmail={user.email} profile={profile} />
        <main className="flex-1 max-w-md w-full mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 border border-amber-200/60 dark:border-amber-900/50">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-[#0B1220] dark:text-[#F6F8FB]">
            Policy Not Found
          </h1>
          <p className="mt-2 text-sm text-[#667085] dark:text-slate-400 leading-relaxed">
            We could not find this policy in your account, or you do not have permission to view it.
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard"
              className="h-10 px-5 inline-flex items-center justify-center font-medium text-xs rounded-xl text-white bg-[#0B1220] hover:bg-[#162A46] dark:bg-[#4F8CFF] dark:hover:bg-[#3d7ae8] transition-colors shadow-sm"
            >
              Return to Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const policy = policyData as Policy;

  // Handle Processing Incomplete State
  if (policy.status === 'processing' || policy.status === 'pending') {
    return (
      <div className="min-h-screen flex flex-col bg-[#F6F8FB] dark:bg-[#0B1220]">
        <Navbar userEmail={user.email} profile={profile} />
        <main className="flex-1 max-w-md w-full mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-[#4F8CFF] flex items-center justify-center mb-4 border border-blue-200/60 dark:border-blue-900/50">
            <span className="w-4 h-4 rounded-full bg-[#4F8CFF] animate-ping" />
          </div>
          <h1 className="text-xl font-bold text-[#0B1220] dark:text-[#F6F8FB]">
            Policy Analysis in Progress
          </h1>
          <p className="mt-2 text-sm text-[#667085] dark:text-slate-400 leading-relaxed">
            PRISM is currently extracting text and indexing sections from your policy document. Insights will be available as soon as analysis is complete.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
            <Link
              href={`/processing/${policy.id}`}
              className="h-10 px-5 inline-flex items-center justify-center font-semibold text-xs rounded-xl text-white bg-[#0B1220] hover:bg-[#162A46] dark:bg-[#4F8CFF] dark:hover:bg-[#3d7ae8] transition-colors shadow-sm"
            >
              View Live Processing Tracker &rarr;
            </Link>
            <Link
              href="/dashboard"
              className="h-10 px-4 inline-flex items-center justify-center font-medium text-xs rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Handle Processing Failed State
  if (policy.status === 'failed' || policy.status === 'error') {
    return (
      <div className="min-h-screen flex flex-col bg-[#F6F8FB] dark:bg-[#0B1220]">
        <Navbar userEmail={user.email} profile={profile} />
        <main className="flex-1 max-w-md w-full mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4 border border-rose-200/60 dark:border-rose-900/50">
            ✕
          </div>
          <h1 className="text-xl font-bold text-[#0B1220] dark:text-[#F6F8FB]">
            Document Processing Failed
          </h1>
          <p className="mt-2 text-sm text-[#667085] dark:text-slate-400 leading-relaxed">
            We encountered an issue while processing this document. You can retry the document analysis.
          </p>
          <div className="mt-6">
            <Link
              href={`/processing/${policy.id}`}
              className="h-10 px-5 inline-flex items-center justify-center font-medium text-xs rounded-xl text-white bg-[#0B1220] hover:bg-[#162A46] dark:bg-[#4F8CFF] dark:hover:bg-[#3d7ae8] transition-colors shadow-sm"
            >
              View Processing Details &amp; Retry
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Query associated document record
  const { data: docData } = await supabase
    .from('documents')
    .select('*')
    .eq('policy_id', id)
    .eq('user_id', user.id)
    .maybeSingle();
  const document = docData as PolicyDocument | null;

  // Query policy sections ordered by start page
  const { data: sectionsData } = await supabase
    .from('policy_sections')
    .select('*')
    .eq('policy_id', id)
    .eq('user_id', user.id)
    .order('page_start', { ascending: true });
  const sections = (sectionsData || []) as PolicySection[];

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F8FB] dark:bg-[#0B1220]">
      <Navbar userEmail={user.email} profile={profile} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <PolicyOverviewView
          policy={policy}
          document={document}
          sections={sections}
        />
      </main>
    </div>
  );
}
