import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Navbar } from '@/components/layout/Navbar';
import { AskPrismView } from '@/components/ai/AskPrismView';
import type { Profile } from '@/types/auth';
import type { Policy } from '@/types/policy';

export const metadata: Metadata = {
  title: 'Ask PRISM — AI Insurance Companion',
  description: 'Ask questions about your health insurance policy with grounded citations and page-accurate evidence.',
};

export default async function AskPage({
  searchParams,
}: {
  searchParams?: Promise<{ policy_id?: string; q?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const initialPolicyId = resolvedParams.policy_id;
  const initialQuestion = resolvedParams.q;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const nextPath = initialPolicyId
      ? `/ask?policy_id=${initialPolicyId}${initialQuestion ? `&q=${encodeURIComponent(initialQuestion)}` : ''}`
      : '/ask';
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
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

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F8FB] dark:bg-[#0B1220]">
      <Navbar userEmail={user.email} profile={profile} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col">
        <AskPrismView
          policies={policies}
          userEmail={user.email}
          initialPolicyId={initialPolicyId}
          initialQuestion={initialQuestion}
        />
      </main>
    </div>
  );
}
