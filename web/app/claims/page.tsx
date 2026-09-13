import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ClaimsCenterView } from '@/components/claims/ClaimsCenterView';
import type { Profile } from '@/types/auth';
import type { Claim, ClaimDocument } from '@/types/claim';
import type { Policy } from '@/types/policy';

export const metadata: Metadata = {
  title: 'Claims Center — PRISM Insurance Companion',
  description: 'Prepare, understand, and organize your health insurance claims before submission.',
};

export default async function ClaimsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/claims');
  }

  let profile: Profile | null = null;
  let claims: Claim[] = [];
  let policies: Policy[] = [];
  let claimDocs: ClaimDocument[] = [];

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

    const { data: claimsData } = await supabase
      .from('claims')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    claims = (claimsData || []) as Claim[];

    const { data: claimDocsData } = await supabase
      .from('claim_documents')
      .select('*')
      .eq('user_id', user.id);
    claimDocs = (claimDocsData || []) as ClaimDocument[];
  } catch {
    profile = null;
    claims = [];
    policies = [];
    claimDocs = [];
  }

  // Calculate readiness:
  // Each active claim typically requires 4 essential mandatory documents (Discharge summary, Hospital bill, Claim form, Diagnostic reports)
  const targetRequiredPerClaim = 4;
  const totalTargetRequired = claims.length * targetRequiredPerClaim;
  const documentsReadyCount = claimDocs.length;
  const documentsMissingCount = Math.max(0, totalTargetRequired - documentsReadyCount);

  return (
    <ClaimsCenterView
      userEmail={user.email}
      profile={profile}
      claims={claims}
      policies={policies}
      documentsReadyCount={documentsReadyCount}
      documentsMissingCount={documentsMissingCount}
    />
  );
}
