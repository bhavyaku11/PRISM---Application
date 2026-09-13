import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Navbar } from '@/components/layout/Navbar';
import { ClaimWorkspaceView } from '@/components/claims/ClaimWorkspaceView';
import type { Profile } from '@/types/auth';
import type { Claim, ClaimDocument } from '@/types/claim';
import type { Policy, PolicyDocument } from '@/types/policy';

export const metadata: Metadata = {
  title: 'Claim Workspace — PRISM Insurance Companion',
  description: 'Prepare documents, review relevant policy clauses, and organize your insurance claim.',
};

export default async function ClaimWorkspacePage({
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
    redirect(`/login?next=/claims/${id}`);
  }

  // Fetch profile
  let profile: Profile | null = null;
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  profile = profileData as Profile | null;

  // Query claim ensuring ownership via RLS and user_id check
  const { data: claimData, error: claimError } = await supabase
    .from('claims')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (claimError || !claimData) {
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
            Claim Workspace Not Found
          </h1>

          <p className="mt-2 text-sm text-[#667085] dark:text-slate-400 leading-relaxed">
            We could not locate this claim workspace, or you do not have permission to view it.
          </p>

          <div className="mt-6">
            <Link
              href="/claims"
              className="h-10 px-5 inline-flex items-center justify-center font-medium text-xs rounded-xl text-white bg-[#0B1220] hover:bg-[#162A46] dark:bg-[#4F8CFF] dark:hover:bg-[#3d7ae8] transition-colors shadow-sm"
            >
              Return to Claims Center
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const claim = claimData as Claim;

  // Query associated policy
  let policy: Policy | null = null;
  if (claim.policy_id) {
    const { data: policyData } = await supabase
      .from('policies')
      .select('*')
      .eq('id', claim.policy_id)
      .eq('user_id', user.id)
      .maybeSingle();
    policy = policyData as Policy | null;
  }

  let claimDocuments: ClaimDocument[] = [];
  try {
    const { data: claimDocsData } = await supabase
      .from('claim_documents')
      .select('id, user_id, claim_id, document_id, notes, created_at, documents(*)')
      .eq('claim_id', claim.id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const rawList = (claimDocsData || []) as Array<{
      id: string;
      user_id: string;
      claim_id: string;
      document_id: string;
      notes: string | null;
      created_at: string;
      documents?: unknown;
    }>;

    claimDocuments = rawList.map((item) => {
      let doc: PolicyDocument | null = null;
      if (Array.isArray(item.documents) && item.documents.length > 0) {
        doc = item.documents[0] as PolicyDocument;
      } else if (item.documents && typeof item.documents === 'object') {
        doc = item.documents as PolicyDocument;
      }

      return {
        id: item.id,
        user_id: item.user_id,
        claim_id: item.claim_id,
        document_id: item.document_id,
        notes: item.notes,
        created_at: item.created_at,
        documents: doc,
      };
    });
  } catch {
    claimDocuments = [];
  }

  // Query all user documents from vault (for linking)
  let allUserDocuments: PolicyDocument[] = [];
  try {
    const { data: allDocsData } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    allUserDocuments = (allDocsData || []) as PolicyDocument[];
  } catch {
    allUserDocuments = [];
  }

  return (
    <ClaimWorkspaceView
      userEmail={user.email}
      profile={profile}
      claim={claim}
      policy={policy}
      claimDocuments={claimDocuments}
      allUserDocuments={allUserDocuments}
    />
  );
}
