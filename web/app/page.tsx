import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Navbar } from '@/components/layout/Navbar';
import type { Profile } from '@/types/auth';

export default async function HomePage() {
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

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F8FB] dark:bg-[#0B1220] text-[#111827] dark:text-[#F6F8FB]">
      <Navbar userEmail={user?.email} profile={profile} />

      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
        <div className="max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-900/50 text-[#4F8CFF] text-xs font-semibold tracking-wide uppercase mb-6 shadow-sm">
            <span>PRISM</span>
            <span className="w-1 h-1 rounded-full bg-[#4F8CFF]" />
            <span>AI Insurance Companion</span>
          </div>

          {/* Core Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#0B1220] dark:text-white leading-[1.15]">
            Understand your insurance{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#162A46] via-[#4F8CFF] to-[#6ED7E8] dark:from-[#4F8CFF] dark:to-[#6ED7E8]">
              before you need it.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-lg text-[#667085] dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Turn complicated health insurance policy documents into clear, evidence-backed answers, organized records, and practical claim readiness.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            {user ? (
              <Link
                href="/dashboard"
                className="w-full sm:w-auto h-12 px-7 inline-flex items-center justify-center font-medium text-sm rounded-xl text-white bg-[#0B1220] hover:bg-[#162A46] dark:bg-[#4F8CFF] dark:hover:bg-[#3d7ae8] transition-colors shadow-sm"
              >
                Go to your workspace &rarr;
              </Link>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="w-full sm:w-auto h-12 px-7 inline-flex items-center justify-center font-medium text-sm rounded-xl text-white bg-[#0B1220] hover:bg-[#162A46] dark:bg-[#4F8CFF] dark:hover:bg-[#3d7ae8] transition-colors shadow-sm"
                >
                  Get started with PRISM
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto h-12 px-7 inline-flex items-center justify-center font-medium text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[#0B1220] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
                >
                  Sign in
                </Link>
              </>
            )}
          </div>

          {/* Core Principles Summary */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left max-w-3xl mx-auto border-t border-slate-200/80 dark:border-slate-800/80 pt-10">
            <div className="p-4 rounded-xl bg-white/70 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#4F8CFF] block mb-1">
                Evidence First
              </span>
              <p className="text-xs text-[#667085] dark:text-slate-400 leading-relaxed">
                Answers cite exact page numbers and clauses from your uploaded policy PDF.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/70 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#4F8CFF] block mb-1">
                Explain, Don&apos;t Decide
              </span>
              <p className="text-xs text-[#667085] dark:text-slate-400 leading-relaxed">
                Objective policy explanations without false certainty, legal advice, or sales hype.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/70 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#4F8CFF] block mb-1">
                Claim Preparation
              </span>
              <p className="text-xs text-[#667085] dark:text-slate-400 leading-relaxed">
                Checklists and documentation organized before a medical situation occurs.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <span>&copy; {new Date().getFullYear()} PRISM. All rights reserved.</span>
            <span className="text-slate-300 dark:text-slate-700">&middot;</span>
            <Link href="/privacy" className="hover:text-[#4F8CFF] transition-colors">
              Privacy Policy
            </Link>
            <span className="text-slate-300 dark:text-slate-700">&middot;</span>
            <Link href="/terms" className="hover:text-[#4F8CFF] transition-colors">
              Terms of Service
            </Link>
            <span className="text-slate-300 dark:text-slate-700">&middot;</span>
            <Link href="/delete-account" className="hover:text-rose-500 transition-colors">
              Delete Account
            </Link>
          </div>
          <span className="text-[11px] text-slate-400">
            Informational companion &middot; Not a licensed insurance seller or legal authority.
          </span>
        </div>
      </footer>
    </div>
  );
}
