import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Navbar } from '@/components/layout/Navbar';
import type { Profile } from '@/types/auth';

export const metadata: Metadata = {
  title: 'Welcome to PRISM — Onboarding',
  description: 'Learn how PRISM transforms your health insurance policy into clear, actionable intelligence.',
};

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: Profile | null = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    profile = data as Profile | null;
  }

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there';

  const steps = [
    {
      number: '01',
      title: 'Add your insurance policy',
      description: 'Upload your health insurance policy schedule or Customer Information Sheet (CIS) in PDF format.',
    },
    {
      number: '02',
      title: 'PRISM analyzes the document',
      description: 'Our pipeline extracts structured clauses, waiting periods, sub-limits, and exclusions with traceable citations.',
    },
    {
      number: '03',
      title: 'Explore your coverage',
      description: 'Review clear, plain-language summaries of room rent limits, ICU caps, co-payments, and claim conditions.',
    },
    {
      number: '04',
      title: 'Ask PRISM questions',
      description: 'Get evidence-grounded answers citing exact pages and sections in your uploaded policy documents.',
    },
    {
      number: '05',
      title: 'Become claim-ready',
      description: 'Prepare documentation and checklists ahead of time so you are confident and organized before an emergency.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F8FB] dark:bg-[#0B1220]">
      <Navbar userEmail={user?.email} profile={profile} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Hero Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/50 text-[#4F8CFF] text-xs font-medium mb-4">
            Account verified & ready
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0B1220] dark:text-[#F6F8FB] tracking-tight">
            Welcome to PRISM, {displayName}
          </h1>
          <p className="mt-3 text-sm text-[#667085] dark:text-slate-400 leading-relaxed">
            Understand your insurance before you need it, and be better prepared when you need to use it.
            Here is how your companion works:
          </p>
        </div>

        {/* 5-Step Process Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {steps.map((step, idx) => (
            <div
              key={step.number}
              className={`p-5 rounded-2xl bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all hover:border-[#4F8CFF]/40 ${
                idx === 4 ? 'md:col-span-2' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-[#4F8CFF] font-semibold text-xs flex items-center justify-center">
                  {step.number}
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-[#0B1220] dark:text-[#F6F8FB]">
                    {step.title}
                  </h2>
                  <p className="mt-1 text-xs text-[#667085] dark:text-slate-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-slate-200/80 dark:border-slate-800">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-6 h-11 inline-flex items-center justify-center font-medium text-sm rounded-xl text-white bg-[#0B1220] hover:bg-[#162A46] dark:bg-[#4F8CFF] dark:hover:bg-[#3d7ae8] transition-colors shadow-sm"
          >
            Continue to Dashboard &rarr;
          </Link>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-5 h-11 inline-flex items-center justify-center font-medium text-xs text-[#667085] dark:text-slate-400 hover:text-[#0B1220] dark:hover:text-white transition-colors"
          >
            Skip for now
          </Link>
        </div>
      </main>
    </div>
  );
}
