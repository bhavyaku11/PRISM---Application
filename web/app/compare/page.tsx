import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Navbar } from '@/components/layout/Navbar';
import { PolicyComparisonView } from '@/components/policies/PolicyComparisonView';
import { buildPolicyComparison } from '@/lib/policy-comparison';
import type { Profile } from '@/types/auth';
import type { Policy, PolicySection } from '@/types/policy';
import type { DocumentChunkRecord } from '@/types/comparison';
import {
  IconSlidersHorizontal,
  IconShield,
  IconPlusCircle,
  IconInfo,
} from '@/components/ui/icons';

export const metadata: Metadata = {
  title: 'Policy Comparison — PRISM Insurance Companion',
  description:
    'Compare health insurance policies side-by-side with ground-truth clause verification and evidence-backed differences.',
};

interface PolicyComparisonPageProps {
  searchParams: Promise<{
    policyA?: string;
    policyB?: string;
  }>;
}

export default async function PolicyComparisonPage({
  searchParams,
}: PolicyComparisonPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/compare');
  }

  // Fetch user profile
  let profile: Profile | null = null;
  try {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    profile = profileData as Profile | null;
  } catch {
    profile = null;
  }

  // Fetch all policies owned by this user strictly
  const { data: userPoliciesData } = await supabase
    .from('policies')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const userPolicies = (userPoliciesData || []) as Policy[];

  // 1. EMPTY STATE: Fewer than 2 policies
  if (userPolicies.length < 2) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F6F8FB] dark:bg-[#0B1220]">
        <Navbar userEmail={user.email} profile={profile} />

        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="text-center max-w-xl mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-[#4F8CFF] mb-6 shadow-sm border border-blue-200/50 dark:border-blue-900/50">
              <IconSlidersHorizontal size={32} />
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-[#4F8CFF] text-xs font-semibold uppercase tracking-wider mb-3 border border-blue-200/50 dark:border-blue-900/50">
              Page 15 · Policy Comparison
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-[#0B1220] dark:text-[#F6F8FB] tracking-tight">
              You need at least two policies to compare.
            </h1>

            <p className="mt-3 text-sm text-[#667085] dark:text-slate-400 leading-relaxed">
              PRISM compares coverage limits, room-rent caps, waiting periods, and exclusions
              between two of your own uploaded policies using ground-truth clause evidence.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/add-policy"
                className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-semibold text-white bg-[#0B1220] hover:bg-[#162A46] dark:bg-[#4F8CFF] dark:hover:bg-[#3d7ae8] transition-colors shadow-sm inline-flex items-center justify-center gap-2"
              >
                <IconPlusCircle size={16} />
                <span>Add Another Policy</span>
              </Link>
              <Link
                href="/policies"
                className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors shadow-xs inline-flex items-center justify-center gap-2"
              >
                <IconShield size={16} />
                <span>View Policy Vault</span>
              </Link>
            </div>

            {/* Informational Guidance */}
            <div className="mt-12 p-4 rounded-xl bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-slate-800 text-left shadow-xs">
              <div className="flex items-start gap-3">
                <IconInfo size={18} className="text-[#4F8CFF] shrink-0 mt-0.5" />
                <div className="text-xs text-[#667085] dark:text-slate-400 space-y-1">
                  <p className="font-semibold text-[#0B1220] dark:text-[#F6F8FB]">
                    Why compare policies in PRISM?
                  </p>
                  <p>
                    PRISM parses individual schedule clauses to identify differences in room rent limits,
                    daycare procedures, ICU caps, and specific disease waiting periods without bias or sales recommendations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 2. SELECTION RESOLUTION & SECURITY CHECK
  const resolvedParams = await searchParams;
  const userPolicyMap = new Map(userPolicies.map((p) => [p.id, p]));

  let policyAId = resolvedParams.policyA;
  let policyBId = resolvedParams.policyB;

  // Validate policyA ownership
  if (!policyAId || !userPolicyMap.has(policyAId)) {
    policyAId = userPolicies[0].id;
  }

  // Validate policyB ownership (must be different from policyA)
  if (!policyBId || !userPolicyMap.has(policyBId) || policyBId === policyAId) {
    const alternative = userPolicies.find((p) => p.id !== policyAId);
    policyBId = alternative ? alternative.id : userPolicies[1].id;
  }

  const selectedPolicyA = userPolicyMap.get(policyAId)!;
  const selectedPolicyB = userPolicyMap.get(policyBId)!;

  // 3. FETCH EVIDENCE FOR BOTH POLICIES CONCURRENTLY
  // Policy sections and document chunks belong to the policies
  const [sectionsARes, sectionsBRes, chunksARes, chunksBRes] =
    await Promise.all([
      supabase
        .from('policy_sections')
        .select('*')
        .eq('policy_id', selectedPolicyA.id)
        .eq('user_id', user.id),
      supabase
        .from('policy_sections')
        .select('*')
        .eq('policy_id', selectedPolicyB.id)
        .eq('user_id', user.id),
      supabase
        .from('document_chunks')
        .select(
          'id, document_id, policy_id, page_number, section_title, content'
        )
        .eq('policy_id', selectedPolicyA.id)
        .limit(80),
      supabase
        .from('document_chunks')
        .select(
          'id, document_id, policy_id, page_number, section_title, content'
        )
        .eq('policy_id', selectedPolicyB.id)
        .limit(80),
    ]);

  const sectionsA = (sectionsARes.data || []) as PolicySection[];
  const sectionsB = (sectionsBRes.data || []) as PolicySection[];
  const chunksA = (chunksARes.data || []) as DocumentChunkRecord[];
  const chunksB = (chunksBRes.data || []) as DocumentChunkRecord[];

  // 4. RUN DETERMINISTIC COMPARISON
  const comparisonResult = buildPolicyComparison(
    selectedPolicyA,
    sectionsA,
    chunksA,
    selectedPolicyB,
    sectionsB,
    chunksB
  );

  const isProcessingA =
    selectedPolicyA.status === 'processing' || selectedPolicyA.status === 'pending';
  const isProcessingB =
    selectedPolicyB.status === 'processing' || selectedPolicyB.status === 'pending';

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F8FB] dark:bg-[#0B1220]">
      <Navbar userEmail={user.email} profile={profile} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <PolicyComparisonView
          userPolicies={userPolicies}
          selectedPolicyA={selectedPolicyA}
          selectedPolicyB={selectedPolicyB}
          comparisonResult={comparisonResult}
          isProcessingA={isProcessingA}
          isProcessingB={isProcessingB}
        />
      </main>
    </div>
  );
}
