import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Navbar } from '@/components/layout/Navbar';
import { IconBell } from '@/components/ui/icons';
import { syncUserNotifications } from '@/lib/notifications';
import type { Profile } from '@/types/auth';
import type { Policy } from '@/types/policy';
import type { AppNotification } from '@/types/notification';

export const metadata: Metadata = {
  title: 'Dashboard — PRISM Insurance Companion',
  description: 'Manage your health insurance policies, coverage insights, and claims readiness.',
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: Profile | null = null;
  let policies: Policy[] = [];
  let notifications: AppNotification[] = [];

  if (user) {
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

      notifications = await syncUserNotifications(supabase, user.id);
    } catch {
      profile = null;
      policies = [];
      notifications = [];
    }
  }

  const unreadNotifs = notifications.filter((n) => !n.is_read);
  const urgentAlert =
    unreadNotifs.find(
      (n) =>
        n.priority === 'urgent' ||
        n.notification_type === 'POLICY_RENEWAL' ||
        n.notification_type === 'CLAIM_DOCUMENTS'
    ) || unreadNotifs[0];

  const displayName =
    profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Member';

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F8FB] dark:bg-[#0B1220]">
      <Navbar userEmail={user?.email} profile={profile} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Welcome Greeting Banner */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-medium border border-emerald-200/60 dark:border-emerald-900/50 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Authenticated Session Active
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0B1220] dark:text-[#F6F8FB] tracking-tight">
              Good day, {displayName}.
            </h1>
            <p className="mt-1 text-sm text-[#667085] dark:text-slate-400">
              Here is your PRISM insurance workspace overview.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/add-policy"
              className="px-4 py-2 text-xs font-medium rounded-xl text-white bg-[#0B1220] hover:bg-[#162A46] dark:bg-[#4F8CFF] dark:hover:bg-[#3d7ae8] transition-colors shadow-sm inline-flex items-center gap-1.5"
            >
              <span>+ Add Policy</span>
            </Link>
            <Link
              href="/onboarding"
              className="px-4 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[#0B1220] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
            >
              Walkthrough
            </Link>
          </div>
        </div>

        {/* Proactive Notification / Renewal Alert Banner */}
        {urgentAlert && (
          <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200/80 dark:border-amber-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-start gap-3.5">
              <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5">
                <IconBell size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    {urgentAlert.notification_type === 'POLICY_RENEWAL' ? 'Renewal Alert' : 'Action Required'}
                  </span>
                  {unreadNotifs.length > 1 && (
                    <span className="text-[10px] text-slate-500">
                      (+{unreadNotifs.length - 1} more alert{unreadNotifs.length > 2 ? 's' : ''})
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-amber-950 dark:text-amber-200">
                  {urgentAlert.title}
                </h3>
                <p className="text-xs text-amber-800/90 dark:text-amber-300/80 mt-0.5">
                  {urgentAlert.message}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              {urgentAlert.action_url && (
                <Link
                  href={urgentAlert.action_url}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl text-white bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-500 transition shadow-xs"
                >
                  Review
                </Link>
              )}
              <Link
                href="/notifications"
                className="px-3 py-2 text-xs font-medium text-amber-900 dark:text-amber-200 hover:underline"
              >
                View all →
              </Link>
            </div>
          </div>
        )}

        {/* Top Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {/* User Identity & Profile Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                User Profile
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 dark:bg-blue-950/40 text-[#4F8CFF] border border-blue-200/50 dark:border-blue-900/50">
                Supabase Auth
              </span>
            </div>
            <div className="space-y-2">
              <div>
                <span className="text-[11px] text-slate-400 block">Name</span>
                <span className="text-sm font-semibold text-[#0B1220] dark:text-slate-100">
                  {displayName}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Email</span>
                <span className="text-xs font-mono text-slate-600 dark:text-slate-300 break-all">
                  {user?.email}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Account ID</span>
                <span className="text-[11px] font-mono text-slate-500 truncate block">
                  {user?.id}
                </span>
              </div>
            </div>
          </div>

          {/* Database Profile Sync Status */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Policies Recorded
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 dark:bg-blue-950/40 text-[#4F8CFF] border border-blue-200/50 dark:border-blue-900/50">
                {policies.length} {policies.length === 1 ? 'Policy' : 'Policies'}
              </span>
            </div>
            <p className="text-xs text-[#667085] dark:text-slate-400 leading-relaxed">
              {policies.length > 0
                ? `You have ${policies.length} policy record(s) indexed in your private insurance vault.`
                : 'Upload your first health policy PDF to begin document intelligence and organization.'}
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
              Storage: <code className="font-mono text-[10px] text-slate-600 dark:text-slate-300">policy-documents/ (Private)</code>
            </div>
          </div>

          {/* Product Slice Status */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Active Milestone
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/50">
                Slice 2: Intake
              </span>
            </div>
            <p className="text-xs text-[#667085] dark:text-slate-400 leading-relaxed">
              Policy creation and secure user-scoped PDF uploads are active.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
              Next Slice: <span className="font-medium text-[#0B1220] dark:text-slate-200">Document Processing Engine</span>
            </div>
          </div>
        </div>

        {/* POLICIES SECTION */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#0B1220] dark:text-[#F6F8FB]">
                Your Health Insurance Policies
              </h2>
              <p className="text-xs text-[#667085] dark:text-slate-400">
                Policies stored and prepared for PRISM analysis.
              </p>
            </div>

            {policies.length > 0 && (
              <Link
                href="/add-policy"
                className="text-xs font-medium text-[#4F8CFF] hover:underline"
              >
                + Add Another Policy
              </Link>
            )}
          </div>

          {policies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {policies.map((p) => (
                <div
                  key={p.id}
                  className="p-5 rounded-2xl bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-[#4F8CFF]/50 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h3 className="text-sm font-semibold text-[#0B1220] dark:text-[#F6F8FB]">
                          {p.policy_name}
                        </h3>
                        <p className="text-xs text-[#667085] dark:text-slate-400">
                          {p.insurer_name}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/50">
                        {p.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                      <div>
                        <span className="text-[11px] text-slate-400 block">Policy Type</span>
                        <span className="font-medium text-[#0B1220] dark:text-slate-200">
                          {p.policy_type}
                        </span>
                      </div>

                      <div>
                        <span className="text-[11px] text-slate-400 block">Sum Insured</span>
                        <span className="font-medium text-[#0B1220] dark:text-slate-200">
                          {p.sum_insured ? `₹${p.sum_insured.toLocaleString('en-IN')}` : 'Not provided'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      Uploaded {new Date(p.created_at).toLocaleDateString('en-IN')}
                    </span>
                    <div className="flex items-center gap-2">
                      {p.status === 'processing' || p.status === 'pending' ? (
                        <Link
                          href={`/processing/${p.id}`}
                          className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                        >
                          <span>Processing Status</span>
                          <span>&rarr;</span>
                        </Link>
                      ) : (
                        <>
                          <Link
                            href={`/policies/${p.id}`}
                            className="text-xs font-semibold text-[#4F8CFF] hover:underline"
                          >
                            Overview
                          </Link>
                          <span className="text-slate-300 dark:text-slate-700">·</span>
                          <Link
                            href={`/policies/${p.id}/details`}
                            className="text-xs font-semibold text-[#0B1220] dark:text-slate-200 hover:underline flex items-center gap-0.5"
                          >
                            <span>Details</span>
                            <span>&rarr;</span>
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 sm:p-12 text-center bg-white/40 dark:bg-slate-900/30">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-[#4F8CFF] mx-auto flex items-center justify-center mb-4 border border-blue-100 dark:border-blue-900/50">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-[#0B1220] dark:text-[#F6F8FB]">
                No insurance policies added yet
              </h3>
              <p className="mt-1.5 text-xs text-[#667085] dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                Add your policy PDF to store it securely in your private vault and queue it for analysis.
              </p>
              <div className="mt-5">
                <Link
                  href="/add-policy"
                  className="inline-flex items-center gap-2 px-5 h-10 rounded-xl text-xs font-medium text-white bg-[#0B1220] hover:bg-[#162A46] dark:bg-[#4F8CFF] dark:hover:bg-[#3d7ae8] transition-colors shadow-sm"
                >
                  <span>+ Add Your First Policy</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
