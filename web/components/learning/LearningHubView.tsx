'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import type { Policy } from '@/types/policy';
import type {
  LearningConcept,
  ConceptPolicyEvidence,
} from '@/types/learning';
import {
  LEARNING_CATEGORIES,
  LEARNING_CONCEPTS,
} from '@/data/learning-concepts';
import {
  IconSearch,
  IconX,
  IconShield,
  IconClock,
  IconHeartPulse,
  IconReceipt,
  IconAlertTriangle,
  IconCheckCircle,
  IconFileText,
  IconSlidersHorizontal,
  IconBookOpen,
  IconSparkles,
  IconBot,
  IconPlusCircle,
  IconInfo,
  IconCopy,
  IconCheck,
} from '@/components/ui/icons';

interface LearningHubViewProps {
  userPolicies: Policy[];
  initialPolicyId?: string;
}

function getConceptIcon(iconName: string, size = 20) {
  switch (iconName) {
    case 'Shield':
      return <IconShield size={size} />;
    case 'Clock':
      return <IconClock size={size} />;
    case 'HeartPulse':
      return <IconHeartPulse size={size} />;
    case 'Receipt':
      return <IconReceipt size={size} />;
    case 'AlertTriangle':
      return <IconAlertTriangle size={size} />;
    case 'CheckCircle':
      return <IconCheckCircle size={size} />;
    case 'FileText':
      return <IconFileText size={size} />;
    case 'SlidersHorizontal':
      return <IconSlidersHorizontal size={size} />;
    default:
      return <IconBookOpen size={size} />;
  }
}

function getDifficultyBadge(difficulty: string) {
  switch (difficulty) {
    case 'essential':
      return {
        label: 'Essential',
        classes: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-900/50',
      };
    case 'intermediate':
      return {
        label: 'Intermediate',
        classes: 'bg-blue-50 dark:bg-blue-950/40 text-[#4F8CFF] border-blue-200/60 dark:border-blue-900/50',
      };
    case 'advanced':
      return {
        label: 'Advanced',
        classes: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-200/60 dark:border-purple-900/50',
      };
    default:
      return {
        label: 'Concept',
        classes: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
      };
  }
}

export function LearningHubView({
  userPolicies,
  initialPolicyId,
}: LearningHubViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeConcept, setActiveConcept] = useState<LearningConcept | null>(null);

  // Selected policy for policy-grounded exploration
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>(() => {
    if (initialPolicyId && userPolicies.some((p) => p.id === initialPolicyId)) {
      return initialPolicyId;
    }
    return userPolicies[0]?.id || '';
  });

  // State for retrieved policy evidence for the active concept
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [policyEvidence, setPolicyEvidence] = useState<ConceptPolicyEvidence | null>(null);
  const [copied, setCopied] = useState(false);

  const selectedPolicy = useMemo(
    () => userPolicies.find((p) => p.id === selectedPolicyId) || null,
    [userPolicies, selectedPolicyId]
  );

  // Filtered concepts based on search keyword and selected category
  const filteredConcepts = useMemo(() => {
    return LEARNING_CONCEPTS.filter((concept) => {
      // Category filter
      if (selectedCategory !== 'all' && concept.category !== selectedCategory) {
        return false;
      }

      // Search keyword filter
      if (!searchTerm.trim()) return true;

      const term = searchTerm.toLowerCase().trim();
      const matchTitle = concept.title.toLowerCase().includes(term);
      const matchDesc = concept.shortDescription.toLowerCase().includes(term);
      const matchCategory = concept.categoryLabel.toLowerCase().includes(term);
      const matchKeywords = concept.searchKeywords.some((kw) =>
        kw.toLowerCase().includes(term)
      );

      return matchTitle || matchDesc || matchCategory || matchKeywords;
    });
  }, [selectedCategory, searchTerm]);

  // Featured concepts
  const featuredConcepts = useMemo(() => {
    return LEARNING_CONCEPTS.filter((c) => c.featured);
  }, []);

  // Fetch policy evidence for the active concept
  const fetchPolicyEvidence = useCallback(
    async (concept: LearningConcept, policy: Policy | null) => {
      if (!policy) {
        setPolicyEvidence({
          status: 'no_policy',
          hasEvidence: false,
          clauseTitle: '',
          pageNumber: null,
          documentName: null,
          verbatimExcerpt: null,
          explanation: '',
          similarity: null,
        });
        return;
      }

      if (policy.status === 'processing' || policy.status === 'pending') {
        setPolicyEvidence({
          status: 'processing',
          hasEvidence: false,
          clauseTitle: '',
          pageNumber: null,
          documentName: null,
          verbatimExcerpt: null,
          explanation: '',
          similarity: null,
        });
        return;
      }

      setEvidenceLoading(true);
      try {
        const res = await fetch('/api/retrieval/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: concept.retrievalQuery,
            policy_id: policy.id,
            top_k: 3,
          }),
        });

        if (!res.ok) {
          throw new Error('Retrieval failed');
        }

        const data = await res.json();
        interface ChunkItem {
          id?: string;
          chunk_id?: string;
          section_title?: string;
          page_number?: number;
          content?: string;
          similarity?: number;
        }

        const results: ChunkItem[] = Array.isArray(data.results) ? data.results : [];
        const topMatch = results.find((r) => (r.similarity ?? 1) >= 0.35) || results[0];

        if (topMatch && topMatch.content) {
          setPolicyEvidence({
            status: 'found',
            hasEvidence: true,
            clauseTitle: topMatch.section_title || `${concept.title} Provision`,
            pageNumber: topMatch.page_number || null,
            documentName: policy.policy_name,
            verbatimExcerpt: topMatch.content.trim(),
            explanation: `Grounded in your ${policy.insurer_name} (${policy.policy_name}) policy documents.`,
            similarity: topMatch.similarity ?? null,
          });
        } else {
          setPolicyEvidence({
            status: 'not_found',
            hasEvidence: false,
            clauseTitle: '',
            pageNumber: null,
            documentName: policy.policy_name,
            verbatimExcerpt: null,
            explanation:
              "PRISM couldn't find a clear reference to this concept in your uploaded policy. That does not necessarily mean the policy does not cover or exclude it. Review the policy wording or ask PRISM a specific question.",
            similarity: null,
          });
        }
      } catch {
        setPolicyEvidence({
          status: 'not_found',
          hasEvidence: false,
          clauseTitle: '',
          pageNumber: null,
          documentName: policy.policy_name,
          verbatimExcerpt: null,
          explanation:
            "PRISM couldn't find a clear reference to this concept in your uploaded policy. That does not necessarily mean the policy does not cover or exclude it. Review the policy wording or ask PRISM a specific question.",
          similarity: null,
        });
      } finally {
        setEvidenceLoading(false);
      }
    },
    []
  );

  const handleOpenConcept = (concept: LearningConcept) => {
    setActiveConcept(concept);
    fetchPolicyEvidence(concept, selectedPolicy);
  };

  const handleCloseDrawer = () => {
    setActiveConcept(null);
    setPolicyEvidence(null);
  };

  const handleSelectPolicy = (policyId: string) => {
    setSelectedPolicyId(policyId);
    const newPolicy = userPolicies.find((p) => p.id === policyId) || null;
    if (activeConcept) {
      fetchPolicyEvidence(activeConcept, newPolicy);
    }
  };

  const handleCopyExcerpt = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-10 pb-16">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-[#4F8CFF] text-xs font-semibold uppercase tracking-wider mb-2 border border-blue-200/50 dark:border-blue-900/50">
            Page 12 · Insurance Decoded
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0B1220] dark:text-[#F6F8FB] tracking-tight">
            Insurance, Decoded
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#667085] dark:text-slate-400 max-w-2xl">
            Understand the insurance terms that matter — and see how they apply to your policy with verified clause evidence.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/policies"
            className="px-3.5 py-2 text-xs font-medium rounded-xl text-slate-700 dark:text-slate-300 bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors shadow-xs"
          >
            ← Policy Vault
          </Link>
          <Link
            href="/ask"
            className="px-3.5 py-2 text-xs font-semibold rounded-xl text-white bg-[#0B1220] hover:bg-[#162A46] dark:bg-[#4F8CFF] dark:hover:bg-[#3d7ae8] transition-colors shadow-xs inline-flex items-center gap-1.5"
          >
            <IconBot size={14} />
            <span>Ask PRISM</span>
          </Link>
        </div>
      </div>

      {/* 2. Search Bar & Topic Filters */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <IconSearch size={18} />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search insurance concepts (e.g. room rent, co-pay, waiting period, cashless)..."
            className="w-full pl-10 pr-10 py-3 text-sm rounded-xl bg-slate-50 dark:bg-[#162A46]/50 border border-slate-200 dark:border-slate-700 text-[#0B1220] dark:text-[#F6F8FB] placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#4F8CFF] transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <IconX size={16} />
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-[#0B1220] dark:bg-[#4F8CFF] text-white shadow-xs'
                : 'bg-slate-50 dark:bg-[#131f33] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            All Concepts ({LEARNING_CONCEPTS.length})
          </button>
          {LEARNING_CATEGORIES.map((cat) => {
            const count = LEARNING_CONCEPTS.filter((c) => c.category === cat.id).length;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-[#0B1220] dark:bg-[#4F8CFF] text-white shadow-xs'
                    : 'bg-slate-50 dark:bg-[#131f33] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {cat.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Featured / Important Concepts Ribbon (only when no search active) */}
      {!searchTerm && selectedCategory === 'all' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <IconSparkles size={16} className="text-[#4F8CFF]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Essential Foundation Concepts
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {featuredConcepts.map((concept) => (
              <div
                key={concept.id}
                onClick={() => handleOpenConcept(concept)}
                className="p-4 rounded-2xl bg-gradient-to-br from-white to-blue-50/40 dark:from-[#0E1726] dark:to-[#162A46]/30 border border-blue-100 dark:border-slate-800 hover:border-[#4F8CFF]/50 transition-all cursor-pointer shadow-xs hover:shadow-md group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#4F8CFF] group-hover:scale-105 transition-transform">
                      {getConceptIcon(concept.iconName, 18)}
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                      Core
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[#0B1220] dark:text-[#F6F8FB] group-hover:text-[#4F8CFF] transition-colors">
                    {concept.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-snug">
                    {concept.shortDescription}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-[#4F8CFF] font-medium">
                  <span>Learn &amp; verify</span>
                  <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Active Policy Selector Bar (Learn from your policy) */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0B1220] via-[#101c2c] to-[#162A46] text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/10 text-[#6ED7E8] backdrop-blur-md shrink-0">
            <IconShield size={22} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 block">
              Policy-Grounded Learning Active
            </span>
            <h3 className="text-sm sm:text-base font-bold text-white">
              {userPolicies.length > 0
                ? 'Exploring terms through your uploaded policy'
                : 'See these concepts applied to your own policy'}
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              {userPolicies.length > 0
                ? 'When you open any concept, PRISM references your actual policy schedule and clause citations.'
                : 'Upload a policy schedule to unlock verified clause citations and personalized policy context.'}
            </p>
          </div>
        </div>

        {userPolicies.length > 0 ? (
          <div className="shrink-0 w-full sm:w-auto">
            <label htmlFor="learning-policy-select" className="sr-only">
              Select Policy for Learning Context
            </label>
            <select
              id="learning-policy-select"
              value={selectedPolicyId}
              onChange={(e) => handleSelectPolicy(e.target.value)}
              className="w-full sm:w-auto px-3.5 py-2 text-xs font-semibold rounded-xl bg-white/10 border border-white/20 text-white backdrop-blur-md focus:outline-hidden focus:ring-2 focus:ring-[#6ED7E8]"
            >
              {userPolicies.map((p) => (
                <option key={p.id} value={p.id} className="text-[#0B1220]">
                  {p.insurer_name} — {p.policy_name} ({p.status})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <Link
            href="/add-policy"
            className="shrink-0 px-4 py-2 text-xs font-semibold rounded-xl bg-white text-[#0B1220] hover:bg-slate-100 transition shadow-xs inline-flex items-center gap-1.5"
          >
            <IconPlusCircle size={14} />
            <span>Add Policy</span>
          </Link>
        )}
      </div>

      {/* 5. All Concepts Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#0B1220] dark:text-[#F6F8FB]">
            {selectedCategory === 'all'
              ? 'All Insurance Concepts'
              : LEARNING_CATEGORIES.find((c) => c.id === selectedCategory)?.label || 'Concepts'}
          </h2>
          <span className="text-xs text-slate-400">
            Showing {filteredConcepts.length} of {LEARNING_CONCEPTS.length} concepts
          </span>
        </div>

        {filteredConcepts.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-slate-800">
            <IconSearch size={28} className="mx-auto text-slate-400 mb-3" />
            <h3 className="text-sm font-bold text-[#0B1220] dark:text-[#F6F8FB]">
              No matching concepts found
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No insurance terms matched &ldquo;{searchTerm}&rdquo;. Try searching for &ldquo;co-pay&rdquo;, &ldquo;room rent&rdquo;, or &ldquo;waiting period&rdquo;.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
              className="mt-4 px-3.5 py-2 text-xs font-semibold rounded-xl text-[#4F8CFF] bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 transition"
            >
              Clear Search &amp; Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredConcepts.map((concept) => {
              const diffBadge = getDifficultyBadge(concept.difficulty);
              return (
                <div
                  key={concept.id}
                  onClick={() => handleOpenConcept(concept)}
                  className="p-5 rounded-2xl bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-slate-800 hover:border-[#4F8CFF]/60 dark:hover:border-[#4F8CFF]/50 transition-all cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#4F8CFF] group-hover:scale-105 transition-transform">
                        {getConceptIcon(concept.iconName, 20)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${diffBadge.classes}`}
                        >
                          {diffBadge.label}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {concept.readTime}
                        </span>
                      </div>
                    </div>

                    <div className="mb-1">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        {concept.categoryLabel}
                      </span>
                      <h3 className="text-base font-bold text-[#0B1220] dark:text-[#F6F8FB] group-hover:text-[#4F8CFF] transition-colors">
                        {concept.title}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1 line-clamp-3">
                      {concept.shortDescription}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-[#4F8CFF]">
                    <span>Learn &amp; see policy clause</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. Concept Detail Inspection Drawer */}
      {activeConcept && (
        <div
          role="presentation"
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 transition-opacity"
          onClick={handleCloseDrawer}
        />
      )}

      <aside
        id="concept-detail-drawer"
        aria-label="Insurance Concept Inspection"
        className={`fixed inset-y-0 right-0 w-full max-w-xl bg-white dark:bg-[#0E1726] border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          activeConcept ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {activeConcept && (
          <>
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-[#131f33]/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#4F8CFF]">
                  {getConceptIcon(activeConcept.iconName, 22)}
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#4F8CFF]">
                    {activeConcept.categoryLabel}
                  </span>
                  <h3 className="text-base font-bold text-[#0B1220] dark:text-[#F6F8FB]">
                    {activeConcept.title}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                onClick={handleCloseDrawer}
              >
                <IconX size={18} />
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="p-6 flex-1 overflow-y-auto space-y-6 custom-scrollbar">
              {/* Section 1: What is it? */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  What is it?
                </span>
                <p className="text-xs sm:text-sm text-[#0B1220] dark:text-[#F6F8FB] leading-relaxed">
                  {activeConcept.whatIsIt}
                </p>
              </div>

              {/* Section 2: Why it matters */}
              <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
                <span className="text-[11px] font-bold text-[#4F8CFF] uppercase tracking-wider flex items-center gap-1 mb-1">
                  <IconInfo size={13} />
                  Why it matters
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {activeConcept.whyItMatters}
                </p>
              </div>

              {/* Section 3: Illustrative Example (Prominently Labeled) */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#131f33] border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/50">
                    Illustrative Example (Not your actual policy)
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {activeConcept.example.scenario}
                </p>
                <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-xs font-semibold text-[#0B1220] dark:text-slate-200">
                  <span className="text-slate-400 font-normal">Outcome: </span>
                  {activeConcept.example.calculation}
                </div>
              </div>

              {/* Section 4: Policy Connection (The core PRISM innovation) */}
              <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <IconShield size={16} className="text-[#4F8CFF]" />
                    <h4 className="text-sm font-bold text-[#0B1220] dark:text-[#F6F8FB]">
                      How this applies to your policy
                    </h4>
                  </div>
                  {userPolicies.length > 1 && (
                    <select
                      value={selectedPolicyId}
                      onChange={(e) => handleSelectPolicy(e.target.value)}
                      className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 dark:bg-[#162A46] border border-slate-200 dark:border-slate-700 text-[#0B1220] dark:text-[#F6F8FB]"
                    >
                      {userPolicies.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.insurer_name} — {p.policy_name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {evidenceLoading ? (
                  <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#131f33] border border-slate-200 dark:border-slate-800 text-center space-y-2">
                    <IconClock size={20} className="mx-auto text-[#4F8CFF] animate-spin" />
                    <p className="text-xs text-slate-500">
                      Finding relevant policy sections in {selectedPolicy?.policy_name || 'your policy'}...
                    </p>
                  </div>
                ) : !selectedPolicy ? (
                  /* No Policy State */
                  <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#131f33] border border-slate-200/80 dark:border-slate-800 text-center space-y-2.5">
                    <IconBookOpen size={24} className="mx-auto text-slate-400" />
                    <h5 className="text-xs font-bold text-[#0B1220] dark:text-[#F6F8FB]">
                      See this in your own policy
                    </h5>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                      Upload a policy to see how this concept applies to you with ground-truth citations.
                    </p>
                    <Link
                      href="/add-policy"
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl text-white bg-[#0B1220] hover:bg-[#162A46] dark:bg-[#4F8CFF] dark:hover:bg-[#3d7ae8] transition"
                    >
                      <IconPlusCircle size={14} />
                      <span>Add Policy</span>
                    </Link>
                  </div>
                ) : selectedPolicy.status === 'processing' || selectedPolicy.status === 'pending' ? (
                  /* Policy Processing State */
                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 flex items-start gap-3">
                    <IconClock size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-900 dark:text-amber-200 space-y-0.5">
                      <p className="font-semibold">Your policy is still being processed.</p>
                      <p className="text-amber-700 dark:text-amber-300">
                        Policy-specific explanations will appear once processing is complete.
                      </p>
                    </div>
                  </div>
                ) : policyEvidence?.hasEvidence ? (
                  /* Policy Evidence Found */
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-emerald-800 dark:text-emerald-300">
                          {policyEvidence.clauseTitle}
                        </span>
                        <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                          {policyEvidence.documentName}
                          {policyEvidence.pageNumber ? ` • Page ${policyEvidence.pageNumber}` : ''}
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-300/80">
                        {policyEvidence.explanation}
                      </p>
                    </div>

                    {policyEvidence.verbatimExcerpt && (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Extracted Clause Excerpt
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyExcerpt(policyEvidence.verbatimExcerpt!)}
                            className="text-xs text-[#4F8CFF] hover:underline inline-flex items-center gap-1"
                          >
                            {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                            <span>{copied ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                        <blockquote className="p-3.5 rounded-xl bg-slate-900 text-slate-100 dark:bg-black/60 dark:text-slate-200 text-xs font-mono leading-relaxed border border-slate-700/60 whitespace-pre-wrap">
                          &ldquo;{policyEvidence.verbatimExcerpt}&rdquo;
                        </blockquote>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Missing Evidence (Safe Fallback) */
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#131f33] border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <IconInfo size={14} className="text-slate-400 shrink-0" />
                      <span>PRISM couldn&apos;t find a clear reference to this concept in your uploaded policy.</span>
                    </div>
                    <p className="text-xs text-slate-500 pl-5 leading-relaxed">
                      That does not necessarily mean the policy does not cover or exclude it. Review the policy wording or ask PRISM a specific question.
                    </p>
                  </div>
                )}
              </div>

              {/* Section 5: Ask PRISM Deep Dive Suggestions */}
              <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 space-y-2.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Ask PRISM about this concept
                </span>
                <div className="space-y-1.5">
                  {activeConcept.suggestedQuestions.map((q, idx) => (
                    <Link
                      key={idx}
                      href={`/ask?${selectedPolicy ? `policy_id=${selectedPolicy.id}&` : ''}q=${encodeURIComponent(q)}`}
                      className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-[#131f33] dark:hover:bg-[#182842] border border-slate-200/60 dark:border-slate-800 text-xs text-[#0B1220] dark:text-slate-200 flex items-center justify-between transition group"
                    >
                      <span className="truncate">{q}</span>
                      <IconBot size={14} className="text-[#4F8CFF] group-hover:scale-110 transition-transform shrink-0 ml-2" />
                    </Link>
                  ))}
                </div>
              </div>

              {/* Section 6: Educational Disclaimer */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#131f33] border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                PRISM is an informational decision-support tool. Explanations and policy excerpts are for educational and guidance purposes only and do not constitute legal advice, medical diagnosis, or guaranteed claim outcomes.
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#131f33]/50 flex items-center justify-between gap-3">
              <Link
                href={`/ask?${selectedPolicy ? `policy_id=${selectedPolicy.id}&` : ''}q=${encodeURIComponent(
                  `Explain how ${activeConcept.title} works in my policy`
                )}`}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#0B1220] hover:bg-[#162A46] dark:bg-[#4F8CFF] dark:hover:bg-[#3d7ae8] text-white text-xs font-semibold text-center transition shadow-xs inline-flex items-center justify-center gap-1.5"
              >
                <IconBot size={14} />
                <span>Ask PRISM about {activeConcept.title}</span>
              </Link>
              <button
                type="button"
                onClick={handleCloseDrawer}
                className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Close
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
