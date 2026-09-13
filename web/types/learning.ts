export type LearningCategory =
  | 'coverage'
  | 'costs_limits'
  | 'waiting_periods'
  | 'claims'
  | 'policy_mgmt';

export type ConceptDifficulty = 'essential' | 'intermediate' | 'advanced';

export interface ConceptExample {
  scenario: string;
  calculation: string;
}

export interface LearningConcept {
  id: string;
  slug: string;
  title: string;
  category: LearningCategory;
  categoryLabel: string;
  shortDescription: string;
  whatIsIt: string;
  whyItMatters: string;
  example: ConceptExample;
  readTime: string;
  difficulty: ConceptDifficulty;
  iconName: string;
  featured: boolean;
  searchKeywords: string[];
  retrievalQuery: string;
  suggestedQuestions: string[];
}

export interface ConceptPolicyEvidence {
  status: 'found' | 'not_found' | 'processing' | 'no_policy';
  hasEvidence: boolean;
  clauseTitle: string;
  pageNumber: number | null;
  documentName: string | null;
  verbatimExcerpt: string | null;
  explanation: string;
  similarity: number | null;
}
