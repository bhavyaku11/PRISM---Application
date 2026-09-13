import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Navbar } from '@/components/layout/Navbar';
import { LearningHubView } from '@/components/learning/LearningHubView';
import type { Profile } from '@/types/auth';
import type { Policy } from '@/types/policy';

export const metadata: Metadata = {
  title: 'Insurance Learning Hub — PRISM Insurance Companion',
  description:
    'Decode essential health insurance terms and see how they apply to your policy with verified clause evidence.',
};

interface LearnPageProps {
  searchParams?: Promise<{
    policy_id?: string;
  }>;
}

export default async function LearnPage({ searchParams }: LearnPageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const initialPolicyId = resolvedParams.policy_id;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const nextPath = initialPolicyId
      ? `/learn?policy_id=${initialPolicyId}`
      : '/learn';
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

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <LearningHubView
          userPolicies={policies}
          initialPolicyId={initialPolicyId}
        />
      </main>
    </div>
  );
}
