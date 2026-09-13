import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Navbar } from '@/components/layout/Navbar';
import type { Profile } from '@/types/auth';
import type { Policy } from '@/types/policy';
import { IconSlidersHorizontal } from '@/components/ui/icons';

export const metadata: Metadata = {
  title: 'My Policies — PRISM Insurance Companion',
  description: 'Manage, view, and deep-dive into your active health insurance policies in PRISM.',
};

export default async function PoliciesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/policies');
  }

  let profile: Profile | null = null;
  let policies: Policy[] = [];

  try {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    profile = profileData as Profile | null;

    const { data: policiesData } = await supabase
      .from('policies')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    policies = (policiesData || []) as Policy[];
  } catch {
    profile = null;
    policies = [];
  }

  const formatCurrency = (val: number | null | undefined) => {
    if (val === null || val === undefined) return 'Not provided';
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'Not provided';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const activeCount = policies.filter((p) => p.status === 'active' || p.status === 'processed').length;
  const processingCount = policies.filter((p) => p.status === 'processing' || p.status === 'pending').length;

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F8FB] dark:bg-[#0B1220]">
      <Navbar userEmail={user.email} profile={profile} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-[#4F8CFF] text-xs font-semibold uppercase tracking-wider mb-2 border border-blue-200/50 dark:border-blue-900/50">
              Page 06 · Policy Vault
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0B1220] dark:text-[#F6F8FB] tracking-tight">
              My Health Insurance Policies
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#667085] dark:text-slate-400">
              Your policies indexed with ground-truth clause verification.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {policies.length >= 2 && (
              <Link
                href="/compare"
                className="px-4 py-2.5 text-xs font-semibold rounded-xl text-slate-800 dark:text-white bg-white dark:bg-[#162A46] border border-slate-200/80 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-[#1f375b] transition-colors shadow-xs inline-flex items-center gap-1.5"
              >
                <IconSlidersHorizontal size={14} />
                <span>Compare Policies</span>
              </Link>
            )}
            <Link
              href="/add-policy"
              className="px-4 py-2.5 text-xs font-semibold rounded-xl text-white bg-[#0B1220] hover:bg-[#162A46] dark:bg-[#4F8CFF] dark:hover:bg-[#3d7ae8] transition-colors shadow-sm inline-flex items-center gap-1.5"
            >
              <span>+ Add Policy</span>
            </Link>
          </div>
        </div>

        {/* Status Metrics Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Total Policies
            </span>
            <div className="text-2xl font-bold text-[#0B1220] dark:text-[#F6F8FB]">
              {policies.length}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Recorded in your private account</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Active &amp; Analyzed
            </span>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {activeCount}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Ready for grounded intelligence</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Analysis In-Progress
            </span>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {processingCount}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Document text parsing &amp; indexing</p>
          </div>
        </div>

        {/* Policy Grid */}
        {policies.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {policies.map((p) => {
              const isProcessing = p.status === 'processing' || p.status === 'pending';

              return (
                <div
                  key={p.id}
                  className="p-6 rounded-3xl bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-[#4F8CFF]/50 transition-all flex flex-col justify-between space-y-5"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-[#4F8CFF]">
                          {p.insurer_name}
                        </span>
                        <h3 className="text-lg font-bold text-[#0B1220] dark:text-[#F6F8FB] tracking-tight mt-0.5">
                          {p.policy_name}
                        </h3>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize shrink-0 ${
                          isProcessing
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/50'
                            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/50'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <div>
                        <span className="text-[11px] text-slate-400 block">Sum Insured</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {formatCurrency(p.sum_insured)}
                        </span>
                      </div>

                      <div>
                        <span className="text-[11px] text-slate-400 block">Policy Type</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {p.policy_type}
                        </span>
                      </div>

                      <div>
                        <span className="text-[11px] text-slate-400 block">Insured Member</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate block">
                          {p.insured_member || 'Not provided'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[11px] text-slate-400 block">Policy Period</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {formatDate(p.policy_start_date)}
                        </span>
                      </div>

                      <div>
                        <span className="text-[11px] text-slate-400 block">Expiry / Renewal</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {formatDate(p.policy_end_date)}
                        </span>
                      </div>

                      <div>
                        <span className="text-[11px] text-slate-400 block">Premium</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {formatCurrency(p.premium)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400">
                      Added {formatDate(p.created_at)}
                    </span>

                    <div className="flex items-center gap-2">
                      {isProcessing ? (
                        <Link
                          href={`/processing/${p.id}`}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-semibold transition-colors"
                        >
                          View Processing Tracker &rarr;
                        </Link>
                      ) : (
                        <>
                          <Link
                            href={`/policies/${p.id}`}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
                          >
                            Overview
                          </Link>
                          <Link
                            href={`/policies/${p.id}/details`}
                            className="px-3.5 py-1.5 rounded-xl bg-[#0B1220] hover:bg-[#162A46] dark:bg-[#4F8CFF] dark:hover:bg-[#3d7ae8] text-white text-xs font-semibold shadow-2xs transition-colors"
                          >
                            Details &rarr;
                          </Link>
                          <Link
                            href={`/ask?policy_id=${p.id}`}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-[#4F8CFF] hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                            title="Ask PRISM about this policy"
                          >
                            ✦
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty Vault */
          <div className="rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-12 text-center bg-white/40 dark:bg-slate-900/30">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-[#4F8CFF] mx-auto flex items-center justify-center mb-4 border border-blue-100 dark:border-blue-900/50 text-xl">
              🛡️
            </div>
            <h3 className="text-base font-semibold text-[#0B1220] dark:text-[#F6F8FB]">
              No insurance policies added yet
            </h3>
            <p className="mt-1.5 text-xs text-[#667085] dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Upload your health insurance policy document to begin automated section extraction and grounded evidence analysis.
            </p>
            <div className="mt-6">
              <Link
                href="/add-policy"
                className="inline-flex items-center gap-2 px-5 h-11 rounded-xl text-xs font-semibold text-white bg-[#0B1220] hover:bg-[#162A46] dark:bg-[#4F8CFF] dark:hover:bg-[#3d7ae8] transition-colors shadow-sm"
              >
                <span>+ Add Your First Policy</span>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
