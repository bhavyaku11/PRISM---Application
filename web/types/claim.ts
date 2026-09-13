import type { PolicyDocument } from './policy';

export type ClaimType =
  | 'Hospitalization'
  | 'Day Care'
  | 'Pre/Post Hospitalization'
  | 'Other';

export type ClaimStatus =
  | 'preparing'
  | 'review'
  | 'submitted'
  | 'closed'
  | 'archived';

export const CLAIM_STATUS_DISPLAY_MAP: Record<string, string> = {
  preparing: 'Preparing',
  review: 'Ready for Review',
  submitted: 'Submitted (Manual)',
  closed: 'Resolved / Closed',
  archived: 'Archived',
};

export function formatClaimStatus(status: string | null | undefined): string {
  if (!status) return 'Preparing';
  const normalized = status.toLowerCase();
  return CLAIM_STATUS_DISPLAY_MAP[normalized] || status;
}

export type RequirementStatus =
  | 'Required'
  | 'Added'
  | 'Missing'
  | 'Needs Review';

export interface Claim {
  id: string;
  user_id: string;
  policy_id: string;
  claim_name: string;
  claim_type: string;
  insured_member: string | null;
  hospital_name: string | null;
  admission_date: string | null;
  discharge_date: string | null;
  estimated_expense: number | null;
  currency: string;
  status: string;
  preparation_progress: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClaimDocument {
  id: string;
  user_id: string;
  claim_id: string;
  document_id: string;
  notes: string | null;
  created_at: string;
  documents?: PolicyDocument | null;
}

export interface ClaimFormData {
  policyId: string;
  claimName: string;
  claimType: ClaimType;
  insuredMember: string;
  hospitalName: string;
  admissionDate: string;
  dischargeDate: string;
  estimatedExpense: string;
  notes: string;
}

export type ClaimDocumentCategory =
  | 'discharge_summary'
  | 'hospital_bill'
  | 'claim_form'
  | 'diagnostic_reports'
  | 'doctor_prescription'
  | 'pharmacy_bills'
  | 'id_proof'
  | 'insurance_card'
  | 'medical_reports'
  | 'other';

export interface ClaimCategoryOption {
  id: ClaimDocumentCategory;
  label: string;
  description: string;
  isMandatory: boolean;
}

export const CLAIM_DOCUMENT_CATEGORIES: ClaimCategoryOption[] = [
  {
    id: 'discharge_summary',
    label: 'Discharge Summary',
    description: 'Hospital summary with diagnosis, treatment course, doctor signatures, and discharge advice.',
    isMandatory: true,
  },
  {
    id: 'hospital_bill',
    label: 'Hospital Final Bill & Tax Invoice',
    description: 'Itemized hospital bill with breakups for room rent, nursing, ICU, diagnostics, and procedures.',
    isMandatory: true,
  },
  {
    id: 'claim_form',
    label: 'Claim Form (Part A & Part B)',
    description: 'Official insurer / TPA claim form filled and signed by policyholder and treating doctor.',
    isMandatory: true,
  },
  {
    id: 'diagnostic_reports',
    label: 'Diagnostic & Lab Reports',
    description: 'Investigation reports (blood tests, ultrasound, X-rays, MRI/CT, biopsy) supporting treatment.',
    isMandatory: true,
  },
  {
    id: 'doctor_prescription',
    label: 'Doctor Prescriptions & Advice',
    description: 'Original treating doctor prescriptions matching medications and consultation sheets.',
    isMandatory: false,
  },
  {
    id: 'pharmacy_bills',
    label: 'Pharmacy Bills & Receipts',
    description: 'Detailed medicine invoices with batch numbers and cash receipts matching prescriptions.',
    isMandatory: false,
  },
  {
    id: 'id_proof',
    label: 'KYC & Insured ID Proof',
    description: 'Government photo identification of the insured patient (Aadhaar, PAN, Passport).',
    isMandatory: false,
  },
  {
    id: 'insurance_card',
    label: 'Health Insurance Card / Policy Schedule',
    description: 'TPA electronic health card, policy schedule copy, or member ID card.',
    isMandatory: false,
  },
  {
    id: 'medical_reports',
    label: 'Additional Hospital Records',
    description: 'Indoor case papers (ICP), temperature charts, or operation theater notes if queried.',
    isMandatory: false,
  },
  {
    id: 'other',
    label: 'Other Supporting Document',
    description: 'Any additional hospital certificates, queries, or insurer correspondence.',
    isMandatory: false,
  },
];

export const STANDARD_CLAIM_REQUIREMENTS = CLAIM_DOCUMENT_CATEGORIES.map((c) => ({
  id: c.id,
  title: c.label,
  description: c.description,
  category: c.isMandatory ? ('clinical' as const) : ('billing' as const),
  isMandatory: c.isMandatory,
}));

export function getCategoryLabel(category: string | null | undefined): string {
  if (!category) return 'Claim Document';
  const found = CLAIM_DOCUMENT_CATEGORIES.find((c) => c.id === category);
  if (found) return found.label;
  return category
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Deterministic calculation of claim document readiness score.
 * Based on the 4 mandatory health claim requirements.
 */
export function calculateClaimReadiness(claimDocs: ClaimDocument[]) {
  const mandatoryCategories = CLAIM_DOCUMENT_CATEGORIES.filter((c) => c.isMandatory);
  const totalMandatoryCount = mandatoryCategories.length; // 4

  const uploadedCategories = new Set<string>();
  for (const cd of claimDocs) {
    const docType = cd.documents?.document_type?.toLowerCase() || '';
    const notes = cd.notes?.toLowerCase() || '';
    const name = cd.documents?.document_name?.toLowerCase() || '';

    for (const cat of mandatoryCategories) {
      if (
        docType === cat.id ||
        docType === cat.label.toLowerCase() ||
        notes.includes(cat.id) ||
        notes.includes(cat.label.toLowerCase()) ||
        (cat.id === 'discharge_summary' && (name.includes('discharge') || notes.includes('discharge'))) ||
        (cat.id === 'hospital_bill' && (name.includes('bill') || name.includes('invoice') || notes.includes('bill'))) ||
        (cat.id === 'claim_form' && (name.includes('form') || notes.includes('form'))) ||
        (cat.id === 'diagnostic_reports' && (name.includes('report') || name.includes('lab') || name.includes('ultrasound') || notes.includes('diagnostic')))
      ) {
        uploadedCategories.add(cat.id);
      }
    }
  }

  const uploadedMandatoryCount = uploadedCategories.size;
  const score = Math.round((uploadedMandatoryCount / totalMandatoryCount) * 100);
  const missingMandatoryCategories = mandatoryCategories.filter((c) => !uploadedCategories.has(c.id));

  return {
    score: Math.min(100, Math.max(0, score)),
    uploadedMandatoryCount,
    totalMandatoryCount,
    missingMandatoryCategories,
  };
}

/**
 * Deterministic calculation of claim preparation progress (0-100%).
 * 
 * Factors:
 * 1. Claim Core Details completed: 25%
 * 2. Mandatory Documents attached: 45% (pro-rated by required documents uploaded)
 * 3. Relevant Policy Evidence reviewed: 15%
 * 4. User Preparation Notes / Review completed: 15%
 */
export function calculatePreparationProgress(
  claim: Partial<Claim>,
  attachedDocumentsCount: number,
  hasReviewedEvidence: boolean = false,
  hasNotes: boolean = false
): number {
  let score = 0;

  // 1. Core details (25%)
  const hasName = Boolean(claim.claim_name?.trim());
  const hasHospital = Boolean(claim.hospital_name?.trim());
  const hasAdmission = Boolean(claim.admission_date);
  const hasExpense = typeof claim.estimated_expense === 'number' && claim.estimated_expense > 0;

  let detailsPoints = 0;
  if (hasName) detailsPoints += 10;
  if (hasHospital) detailsPoints += 5;
  if (hasAdmission) detailsPoints += 5;
  if (hasExpense) detailsPoints += 5;
  score += detailsPoints;

  // 2. Documents (up to 45%)
  // Baseline assumption: 3 essential documents (Discharge, Bill, Receipt)
  const targetDocs = 3;
  const docPoints = Math.min(45, Math.round((attachedDocumentsCount / targetDocs) * 45));
  score += docPoints;

  // 3. Policy Evidence Reviewed (15%)
  if (hasReviewedEvidence) {
    score += 15;
  }

  // 4. Notes & Checklist review (15%)
  if (hasNotes || Boolean(claim.notes?.trim())) {
    score += 15;
  }

  return Math.min(100, Math.max(0, score));
}

export type EvidenceRelevanceTier = 'relevant' | 'potentially_relevant' | 'insufficient_evidence';

export interface PolicyEvidenceItem {
  chunk_id: string;
  document_id: string;
  policy_id: string;
  page_number: number;
  section_title: string;
  content: string;
  similarity: number;
  relevance_tier: EvidenceRelevanceTier;
  why_it_matters: string;
  related_document_category?: ClaimDocumentCategory;
}

export interface ClaimEvidenceTopic {
  id: string;
  label: string;
  querySuffix: string;
  description: string;
}

export const CLAIM_EVIDENCE_TOPICS: ClaimEvidenceTopic[] = [
  {
    id: 'general',
    label: 'All Claim Context',
    querySuffix:
      'inpatient hospitalization room rent ICU limits claim procedure exclusions waiting period eligible expenses',
    description: 'Surfaces comprehensive clauses matching hospitalization, limits, procedures, and exclusions.',
  },
  {
    id: 'room_rent',
    label: 'Hospitalization & Room Rent',
    querySuffix:
      'room rent limit daily capping ICU intensive care charges boarding nursing proportionate deduction single private room',
    description: 'Checks room rent categories, ICU daily limits, and proportionate billing clauses.',
  },
  {
    id: 'pre_post',
    label: 'Pre/Post Hospitalization',
    querySuffix:
      'pre-hospitalization post-hospitalization medical expenses doctor consultations pharmacy medicines 60 days 180 days',
    description: 'Covers diagnostic and pharmacy expenses incurred before admission and after discharge.',
  },
  {
    id: 'procedure',
    label: 'Claim Procedure & Notice',
    querySuffix:
      'claim notification notice intimation timeline emergency admission 24 hours 48 hours settlement documents submission form',
    description: 'Details insurer intimation windows, required forms, and timeline for bill submission.',
  },
  {
    id: 'exclusions',
    label: 'Waiting Periods & Exclusions',
    querySuffix:
      'waiting period pre-existing disease specific illness exclusions permanent exceptions not payable not covered',
    description: 'Identifies waiting period requirements, specific illness moratoriums, and standard exclusions.',
  },
  {
    id: 'copay',
    label: 'Co-pay & Deductibles',
    querySuffix:
      'co-payment deductible voluntary deductible zone copay proportionate deduction sublimit capping',
    description: 'Reviews policyholder cost-sharing, zone co-pays, and deductible clauses.',
  },
];

export function generateWhyItMatters(
  clauseTitle: string,
  content: string,
  claim: Partial<Claim>
): string {
  const title = (clauseTitle || '').toLowerCase();
  const text = (content || '').toLowerCase();
  const hospital = claim.hospital_name ? `at ${claim.hospital_name}` : 'during hospitalization';
  const claimType = claim.claim_type || 'hospitalization';

  if (
    title.includes('room') ||
    title.includes('rent') ||
    text.includes('room rent') ||
    text.includes('icu')
  ) {
    return `This section appears relevant because your claim involves ${claimType} expenses ${hospital}. Review room category eligibility and daily capping limits before submitting.`;
  }
  if (
    title.includes('pre') ||
    title.includes('post') ||
    text.includes('pre-hospitalisation') ||
    text.includes('post-hospitalisation')
  ) {
    return `This section appears relevant to outpatient doctor visits, pharmacy bills, and follow-up expenses incurred immediately prior to and following discharge.`;
  }
  if (
    title.includes('notice') ||
    title.includes('procedure') ||
    title.includes('intimation') ||
    text.includes('intimation') ||
    text.includes('claim form')
  ) {
    return `This section outlines mandatory intimation windows and submission timelines. Review these procedural requirements to prevent avoidable delays.`;
  }
  if (
    title.includes('waiting') ||
    title.includes('ped') ||
    text.includes('waiting period') ||
    text.includes('pre-existing')
  ) {
    return `Review this clause to verify policy waiting periods or condition-specific moratoriums that may apply to this treatment history.`;
  }
  if (
    title.includes('exclusion') ||
    text.includes('not covered') ||
    text.includes('permanent exclusions')
  ) {
    return `Review this section to check non-payable items, consumables, or specific treatment limitations before submitting your hospital invoice.`;
  }
  if (
    title.includes('copay') ||
    title.includes('deductible') ||
    text.includes('co-pay')
  ) {
    return `This clause details cost-sharing or deductible percentages that your insurer may apply during claim calculation.`;
  }

  return `This policy section appears relevant to your ${claimType} claim ${hospital}. Review these terms when compiling your claim dossier.`;
}

export function mapDocumentToEvidenceCategory(
  docCategory: string | null | undefined
): string | null {
  const cat = (docCategory || '').toLowerCase();
  if (cat.includes('bill') || cat.includes('invoice') || cat.includes('receipt'))
    return 'Hospitalization & Room Rent';
  if (cat.includes('discharge') || cat.includes('summary'))
    return 'Inpatient Hospitalization';
  if (cat.includes('form')) return 'Claim Procedure & Notice';
  if (cat.includes('prescrip') || cat.includes('pharmacy'))
    return 'Pre/Post Hospitalization';
  if (cat.includes('diag') || cat.includes('lab') || cat.includes('report'))
    return 'Diagnostic & Investigation Coverage';
  return null;
}

