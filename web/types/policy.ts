export interface Policy {
  id: string;
  user_id: string;
  policy_name: string;
  insurer_name: string;
  policy_number: string | null;
  policy_type: string;
  insured_member: string | null;
  policy_start_date: string | null;
  policy_end_date: string | null;
  sum_insured: number | null;
  premium: number | null;
  premium_currency: string;
  status: string;
  understanding_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface PolicyDocument {
  id: string;
  user_id: string;
  policy_id: string;
  document_name: string;
  document_type: string;
  storage_path: string;
  mime_type: string;
  file_size: number;
  page_count: number | null;
  processing_status: string;
  processing_error: string | null;
  extracted_text: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface PolicyFormData {
  policyName: string;
  insurerName: string;
  policyNumber: string;
  policyType: string;
  insuredMember: string;
  startDate: string;
  endDate: string;
  sumInsured: string;
  premium: string;
}

export type UploadStep =
  | 'idle'
  | 'validating'
  | 'creating_policy'
  | 'uploading_document'
  | 'creating_document'
  | 'complete'
  | 'error';

export interface PolicySection {
  id: string;
  user_id: string;
  policy_id: string;
  document_id: string;
  section_type: string;
  title: string;
  content: string;
  page_start: number;
  page_end: number;
  confidence: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}
