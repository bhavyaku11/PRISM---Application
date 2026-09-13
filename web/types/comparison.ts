import type { Policy } from './policy';

export type ComparisonCategoryId =
  | 'overview'
  | 'coverage'
  | 'waiting_periods'
  | 'cost_sharing'
  | 'limits'
  | 'exclusions'
  | 'claims';

export interface DocumentChunkRecord {
  id: string;
  document_id: string;
  policy_id: string;
  page_number: number | null;
  section_title: string | null;
  content: string;
}

export interface PolicyComparisonValue {
  value: string;
  hasData: boolean;
  source: string;
  pageNumber?: number | null;
  sectionTitle?: string | null;
  excerpt?: string | null;
  documentName?: string | null;
  isExplicitlyNotCovered?: boolean;
}

export type DifferenceType = 'numeric' | 'text' | 'availability' | 'identical';

export interface ComparisonDifference {
  hasDifference: boolean;
  description: string;
  type: DifferenceType;
}

export interface ComparisonRow {
  id: string;
  label: string;
  description: string;
  category: ComparisonCategoryId;
  policyA: PolicyComparisonValue;
  policyB: PolicyComparisonValue;
  difference: ComparisonDifference;
}

export interface ComparisonCategorySection {
  id: ComparisonCategoryId;
  title: string;
  description: string;
  rows: ComparisonRow[];
}

export interface PolicyComparisonResult {
  policyA: Policy;
  policyB: Policy;
  categories: ComparisonCategorySection[];
  keyDifferences: string[];
  evidenceCount: {
    policyA: number;
    policyB: number;
  };
}
