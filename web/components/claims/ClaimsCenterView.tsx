'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Claim } from '@/types/claim';
import { formatClaimStatus } from '@/types/claim';
import type { Policy } from '@/types/policy';
import type { Profile } from '@/types/auth';
import { CreateClaimModal } from './CreateClaimModal';
import {
  IconPanelRightClose,
  IconMoon,
  IconSun,
  IconShield,
  IconShieldCheck,
  IconLayoutDashboard,
  IconFilePlus,
  IconSparkles,
  IconClipboardCheck,
  IconClipboardPlus,
  IconFolder,
  IconFolderOpen,
  IconFolderArchive,
  IconGraduationCap,
  IconSettings,
  IconHelpCircle,
  IconHeartPulse,
  IconClock,
  IconArrowRight,
  IconArrowUp,
  IconFileSearch,
  IconCircle,
  IconCheckCircle,
  IconDownload,
  IconBookOpen,
  IconFileText,
  IconReceipt,
  IconAlertTriangle,
  IconInfo,
  IconBot,
  IconExternalLink,
  IconCheckSquare,
  IconX,
  IconUpload,
  IconPlay,
  IconPlusCircle,
} from '@/components/ui/icons';

interface ClaimsCenterViewProps {
  userEmail?: string | null;
  profile?: Profile | null;
  claims: Claim[];
  policies: Policy[];
  documentsReadyCount: number;
  documentsMissingCount: number;
}

interface DrawerItemData {
  title: string;
  category: string;
  desc: string;
  source: string;
  reasons: string[];
}

interface ClauseModalData {
  title: string;
  text: string;
  source: string;
  uin?: string;
}

export function ClaimsCenterView({
  userEmail,
  profile,
  claims,
  policies,
  documentsReadyCount,
  documentsMissingCount,
}: ClaimsCenterViewProps) {
  const router = useRouter();

  // State Controller (Populated vs Empty vs Processing)
  const [activeState, setActiveState] = useState<'populated' | 'empty' | 'processing'>(() => {
    if (claims.length === 0) return 'empty';
    const firstPolicy = policies[0];
    if (firstPolicy && firstPolicy.status === 'processing') return 'processing';
    return 'populated';
  });

  // Dark Mode state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Modals & Drawers
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [drawerData, setDrawerData] = useState<DrawerItemData>({
    title: 'Discharge Summary',
    category: 'Checklist Item',
    desc: 'Must clearly state initial complaints, clinical findings, treatment given, medical history, and final discharge condition signed by attending doctor with hospital stamp.',
    source: 'Policy Details → Claims Procedure → Page 63 (Clause 8.2)',
    reasons: [
      'Missing surgical notes in case of operational procedures.',
      'Lack of symptom onset timeline (crucial for waiting periods).',
      'Illegible doctor signature or absence of registration number.',
    ],
  });

  const [clauseModalOpen, setClauseModalOpen] = useState<boolean>(false);
  const [clauseModalData, setClauseModalData] = useState<ClauseModalData>({
    title: 'Hospitalisation Coverage',
    text: 'Covered up to ₹10,00,000 subject to Single Private AC room terms. If insured occupies room higher than eligibility, proportionate deduction applies.',
    source: 'Section 3.2, Page 18',
    uin: 'Care Supreme Schedule UIN: RHIHLIP21332V012021',
  });

  // Ask PRISM input state
  const [askQuery, setAskQuery] = useState<string>('');

  // Primary active claim from Supabase (or fallback for populated preview)
  const activeClaim = claims.length > 0 ? claims[0] : null;

  // Associated Policy for active claim
  const activePolicy =
    policies.find((p) => p.id === activeClaim?.policy_id) || (policies.length > 0 ? policies[0] : null);

  // Preparation progress percentage from real Supabase claim
  const preparationScore = activeClaim ? activeClaim.preparation_progress || 68 : 68;

  // Calculation for SVG circular gauge (Circumference ~ 283)
  const strokeDashoffset = 283 - (283 * preparationScore) / 100;

  // Display details
  const displayName = profile?.full_name || userEmail?.split('@')[0] || 'Bhavya Kumar';
  const displayEmail = userEmail || 'bhavya@policyvault.in';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'BK';

  // Format currency
  const formatCurrency = (val: number | null | undefined) => {
    if (val === null || val === undefined) return 'Pending estimation';
    return `₹${val.toLocaleString('en-IN')}`;
  };

  // Format date
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'Not provided';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Keyboard shortcut: Escape closes drawer and modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDrawerOpen(false);
        setClauseModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleDarkMode = () => {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      setIsDarkMode(false);
    } else {
      html.classList.add('dark');
      setIsDarkMode(true);
    }
  };

  // Handler for opening requirement inspector drawer
  const openItemDrawer = (item: {
    title: string;
    category?: string;
    desc: string;
    source: string;
    reasons?: string[];
  }) => {
    setDrawerData({
      title: item.title,
      category: item.category || 'Checklist Item',
      desc: item.desc,
      source: item.source,
      reasons: item.reasons || [
        'Document missing hospital seal or attending doctor signature.',
        'Dates on receipt do not match admission period.',
        'Breakup of medical services missing from hospital tax invoice.',
      ],
    });
    setDrawerOpen(true);
  };

  // Handler for opening grounded clause modal
  const openClauseModal = (item: {
    title: string;
    text: string;
    source: string;
    uin?: string;
  }) => {
    setClauseModalData(item);
    setClauseModalOpen(true);
  };

  // Handler for Ask PRISM query submission
  const handleAskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!askQuery.trim()) return;
    const policyParam = activePolicy ? `&policy_id=${activePolicy.id}` : '';
    router.push(`/ask?q=${encodeURIComponent(askQuery.trim())}${policyParam}`);
  };

  const handleChipClick = (question: string) => {
    const policyParam = activePolicy ? `&policy_id=${activePolicy.id}` : '';
    router.push(`/ask?q=${encodeURIComponent(question)}${policyParam}`);
  };

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md antialiased selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* ========================================================================= */}
      {/* TOP STATE SIMULATOR DOCK (Stitch Interactive Controller)                  */}
      {/* ========================================================================= */}
      <aside
        aria-label="Interactive State Simulator"
        className="bg-inverse-surface text-inverse-on-surface px-4 py-2 text-label-sm font-label-sm flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/30 sticky top-0 z-[60]"
      >
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-tertiary-fixed-dim animate-pulse" />
          <span className="font-headline-sm text-label-md font-bold tracking-tight">PRISM State Controller</span>
          <span className="text-outline-variant hidden sm:inline">|</span>
          <span className="text-outline-variant hidden sm:inline">Claims Center (Screen 13)</span>
        </div>

        <div className="flex items-center flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setActiveState('populated')}
            className={`px-2.5 py-1 rounded transition-all text-label-sm font-label-sm ${
              activeState === 'populated'
                ? 'bg-primary-container text-on-primary font-medium'
                : 'bg-surface-container-highest/20 hover:bg-surface-container-highest/40 text-inverse-on-surface'
            }`}
          >
            1. Active Claim (Populated)
          </button>

          <button
            type="button"
            onClick={() => setActiveState('empty')}
            className={`px-2.5 py-1 rounded transition-all text-label-sm font-label-sm ${
              activeState === 'empty'
                ? 'bg-primary-container text-on-primary font-medium'
                : 'bg-surface-container-highest/20 hover:bg-surface-container-highest/40 text-inverse-on-surface'
            }`}
          >
            2. Empty State
          </button>

          <button
            type="button"
            onClick={() => setActiveState('processing')}
            className={`px-2.5 py-1 rounded transition-all text-label-sm font-label-sm ${
              activeState === 'processing'
                ? 'bg-primary-container text-on-primary font-medium'
                : 'bg-surface-container-highest/20 hover:bg-surface-container-highest/40 text-inverse-on-surface'
            }`}
          >
            3. Policy Processing
          </button>

          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="px-2.5 py-1 rounded bg-surface-container-highest/20 hover:bg-surface-container-highest/40 text-inverse-on-surface transition-all text-label-sm font-label-sm flex items-center gap-1"
          >
            <IconPanelRightClose size={14} animateOnTap />
            <span>Item Drawer</span>
          </button>

          <button
            type="button"
            onClick={toggleDarkMode}
            className="px-2.5 py-1 rounded bg-surface-container-highest/20 hover:bg-surface-container-highest/40 text-inverse-on-surface transition-all text-label-sm font-label-sm flex items-center gap-1"
          >
            {isDarkMode ? <IconSun size={14} animateOnHover /> : <IconMoon size={14} animateOnHover />}
            <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* APP SHELL: 256px Sidebar + Main Workspace                                 */}
      {/* ========================================================================= */}
      <div className="min-h-[calc(100vh-41px)] flex flex-col md:flex-row w-full max-w-[1536px] mx-auto">
        {/* LEFT SIDEBAR */}
        <aside className="w-full md:w-64 flex-shrink-0 bg-surface-container-lowest border-r border-outline-variant/30 flex flex-col justify-between py-5 px-4 sticky top-[41px] md:h-[calc(100vh-41px)] overflow-y-auto custom-scrollbar">
          <div>
            {/* BRAND LOGO */}
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 px-2 pb-6 border-b border-outline-variant/30 hover:opacity-90 transition-opacity"
            >
              <div className="w-8 h-8 rounded-xl bg-primary-container flex items-center justify-center text-on-primary shadow-xs">
                <IconShield size={20} />
              </div>
              <div>
                <div className="font-headline-sm text-title-lg font-bold tracking-tight text-on-surface">PRISM</div>
                <div className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-wider">
                  Policy Intelligence
                </div>
              </div>
            </Link>

            {/* MAIN NAVIGATION */}
            <nav className="mt-6 space-y-1">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-on-surface-variant hover:bg-surface-container-low transition-colors font-title-md text-body-md"
              >
                <IconLayoutDashboard size={20} />
                <span>Overview</span>
              </Link>

              <Link
                href="/policies"
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-on-surface-variant hover:bg-surface-container-low transition-colors font-title-md text-body-md"
              >
                <IconShieldCheck size={20} />
                <span>My Policies</span>
                <span className="ml-auto text-label-sm font-label-sm px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant">
                  {policies.length || 1}
                </span>
              </Link>

              <Link
                href="/add-policy"
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-on-surface-variant hover:bg-surface-container-low transition-colors font-title-md text-body-md"
              >
                <IconFilePlus size={20} animateOnHover />
                <span>Add Policy</span>
              </Link>

              <Link
                href="/ask"
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-on-surface-variant hover:bg-surface-container-low transition-colors font-title-md text-body-md"
              >
                <IconSparkles size={20} animateOnHover />
                <span>Ask PRISM</span>
              </Link>

              {/* ACTIVE NAVIGATION LINK */}
              <Link
                href="/claims"
                className="flex items-center gap-3 px-3 py-2 rounded-xl bg-primary-container text-on-primary font-title-md text-body-md shadow-xs"
              >
                <IconClipboardCheck size={20} />
                <span className="font-semibold">Claims</span>
                <span className="ml-auto text-label-sm font-label-sm px-1.5 py-0.5 rounded bg-white/20 text-on-primary font-medium">
                  {claims.length > 0 ? `${claims.length} active` : 'In prep'}
                </span>
              </Link>

              <Link
                href="/documents"
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-on-surface-variant hover:bg-surface-container-low transition-colors font-title-md text-body-md"
              >
                <IconFolder size={20} />
                <span>Documents</span>
              </Link>

              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-on-surface-variant hover:bg-surface-container-low transition-colors font-title-md text-body-md"
              >
                <IconGraduationCap size={20} />
                <span>Learn</span>
              </Link>
            </nav>
          </div>

          {/* FOOTER SIDEBAR LINKS & PROFILE */}
          <div className="pt-4 border-t border-outline-variant/30 space-y-3 mt-6">
            <div className="space-y-0.5">
              <Link
                href="/settings"
                className="flex items-center gap-3 px-3 py-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low text-body-sm font-body-sm transition-colors"
              >
                <IconSettings size={18} animateOnHover />
                <span>Settings</span>
              </Link>
              <Link
                href="/help"
                className="flex items-center gap-3 px-3 py-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low text-body-sm font-body-sm transition-colors"
              >
                <IconHelpCircle size={18} animateOnHover />
                <span>Help & Support</span>
              </Link>
            </div>

            {/* USER PROFILE CARD */}
            <div className="flex items-center gap-3 p-2 rounded-xl bg-surface-container-low border border-outline-variant/20">
              <div className="w-9 h-9 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold text-label-md font-label-md shrink-0">
                {initials}
              </div>
              <div className="overflow-hidden min-w-0">
                <div className="font-headline-sm text-body-md font-semibold text-on-surface truncate">
                  {displayName}
                </div>
                <div className="text-label-sm font-label-sm text-on-surface-variant truncate">
                  {displayEmail}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN CLAIMS CONTENT CANVAS */}
        <main className="flex-1 p-4 md:p-8 lg:p-10 max-w-6xl mx-auto w-full space-y-8 overflow-y-auto">
          {/* HEADER HERO */}
          <header className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-label-sm font-label-sm font-semibold uppercase tracking-wider text-primary px-2 py-0.5 rounded bg-surface-container-high">
                  Claims Center
                </span>
                <span className="text-outline-variant">•</span>
                <span className="inline-flex items-center gap-1.5 text-label-sm font-label-sm font-medium px-2.5 py-0.5 rounded-full bg-tertiary/10 text-tertiary border border-tertiary/20">
                  <IconShieldCheck size={14} animateOnView />
                  <span>Policy-aware guidance</span>
                </span>
              </div>

              {/* ACTIVE POLICY SELECTOR PILL */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-lowest border border-outline-variant/40 shadow-xs text-label-sm font-label-sm">
                <IconHeartPulse size={16} className="text-primary" />
                <span className="text-on-surface font-semibold">
                  {activePolicy ? activePolicy.policy_name : 'Care Supreme'}
                </span>
                <span className="text-on-surface-variant font-normal">
                  {activePolicy ? `(${activePolicy.insurer_name})` : '(Zone B Tier)'}
                </span>
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
              </div>
            </div>

            <div className="max-w-3xl">
              <h1 className="font-headline-lg text-headline-lg font-bold tracking-tight text-on-surface">
                Be prepared before you file a claim.
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant mt-2 leading-relaxed">
                Understand the claims process, check what documents you may need, and organize your evidence before
                submitting anything to your insurer.
              </p>
            </div>
          </header>

          {/* SIMULATED STATE: POLICY PROCESSING WARNING */}
          {(activeState === 'processing' || activePolicy?.status === 'processing') && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-start gap-3.5">
              <IconClock size={22} className="text-amber-600 mt-0.5" />
              <div>
                <h3 className="font-headline-sm text-title-md font-bold text-amber-950 dark:text-amber-100">
                  Policy document is currently being ingested
                </h3>
                <p className="font-body-md text-body-md text-amber-800 dark:text-amber-300 mt-0.5">
                  PRISM is indexing 84 pages of your {activePolicy?.policy_name || 'Care Supreme'} policy clauses. While
                  this completes, generic IRDAI claims guidance is displayed.
                </p>
              </div>
            </div>
          )}

          {/* SECTION 1: PRIMARY CLAIMS ACTION AREA (What do you need help with?) */}
          <section aria-label="Claims Primary Actions" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-sm text-title-lg font-semibold text-on-surface">
                What do you need help with?
              </h2>
              <span className="text-label-sm font-label-sm text-on-surface-variant">Step-by-step guidance</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Option 1: Prepare a Claim */}
              <div className="p-5 rounded-3xl bg-surface-container-lowest border border-outline-variant/30 hover:border-primary-container hover:shadow-md transition-all group flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                    <IconClipboardPlus size={22} animateOnHover />
                  </div>
                  <h3 className="font-headline-sm text-title-md font-bold text-on-surface">Prepare a Claim</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                    Build a structured checklist of documents and hospital evidence tailored to your specific admission.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(true)}
                  className="mt-5 inline-flex items-center gap-1.5 text-label-md font-label-md font-semibold text-primary group-hover:gap-2.5 transition-all text-left focus:outline-none focus:underline"
                >
                  <span>Start preparation</span>
                  <IconArrowRight size={16} animateOnHover />
                </button>
              </div>

              {/* Option 2: Understand a Claim */}
              <div className="p-5 rounded-3xl bg-surface-container-lowest border border-outline-variant/30 hover:border-primary-container hover:shadow-md transition-all group flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-tertiary/10 text-tertiary flex items-center justify-center group-hover:scale-105 transition-transform">
                    <IconFileSearch size={22} animateOnHover />
                  </div>
                  <h3 className="font-headline-sm text-title-md font-bold text-on-surface">Understand a Claim</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                    Upload a hospital document, queries, or insurer deficiency email to let PRISM decode the legalese.
                  </p>
                </div>
                {activeClaim ? (
                  <Link
                    href={`/claims/${activeClaim.id}`}
                    className="mt-5 inline-flex items-center gap-1.5 text-label-md font-label-md font-semibold text-primary group-hover:gap-2.5 transition-all text-left"
                  >
                    <span>Review a document</span>
                    <IconArrowRight size={16} animateOnHover />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      openItemDrawer({
                        title: 'Discharge Summary',
                        category: 'Medical Document',
                        desc: 'Upload a hospital document, queries, or insurer deficiency email to let PRISM decode the legalese.',
                        source: 'Policy Details → Claims Procedure → Page 63',
                      })
                    }
                    className="mt-5 inline-flex items-center gap-1.5 text-label-md font-label-md font-semibold text-primary group-hover:gap-2.5 transition-all text-left focus:outline-none focus:underline"
                  >
                    <span>Review a document</span>
                    <IconArrowRight size={16} animateOnHover />
                  </button>
                )}
              </div>

              {/* Option 3: Check My Coverage */}
              <div className="p-5 rounded-3xl bg-surface-container-lowest border border-outline-variant/30 hover:border-primary-container hover:shadow-md transition-all group flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-secondary-container text-on-secondary-fixed flex items-center justify-center group-hover:scale-105 transition-transform">
                    <IconShieldCheck size={22} animateOnHover />
                  </div>
                  <h3 className="font-headline-sm text-title-md font-bold text-on-surface">Check My Coverage</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                    Find exact room rent sub-limits, modern treatments, and day-care clauses relevant to your procedure.
                  </p>
                </div>
                <Link
                  href="/ask?q=What+are+the+room+rent+limits+and+coverage+details+under+my+policy%3F"
                  className="mt-5 inline-flex items-center gap-1.5 text-label-md font-label-md font-semibold text-primary group-hover:gap-2.5 transition-all text-left"
                >
                  <span>Explore coverage</span>
                  <IconArrowRight size={16} animateOnHover />
                </Link>
              </div>
            </div>
          </section>

          {/* EMPTY STATE VIEW CONTAINER (When empty state is active) */}
          {activeState === 'empty' ? (
            <div className="p-12 text-center bg-surface-container-lowest rounded-3xl border border-outline-variant/30 space-y-4">
              <div className="w-16 h-16 rounded-full bg-surface-container mx-auto flex items-center justify-center text-on-surface-variant">
                <IconFolderOpen size={32} />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="font-headline-sm text-title-lg font-bold text-on-surface">
                  No active claims in preparation
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant mt-1.5">
                  Planning a hospital admission or need to file a reimbursement? PRISM helps you compile all requirements in advance.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-headline-sm text-title-md font-semibold shadow-xs hover:bg-primary/90 transition-all focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                Initialize new claim workspace
              </button>
            </div>
          ) : (
            /* POPULATED WORKSPACE (Sections 2, 3, 4, 5, 6) */
            <div className="space-y-8">
              {/* SECTION 2 & 3: GRID (CLAIM READINESS & ACTIVE CLAIM WORKSPACE) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* SECTION 2: CLAIM READINESS SECTION (5 Cols) */}
                <div className="lg:col-span-5 p-6 rounded-3xl bg-surface-container-lowest border border-outline-variant/30 flex flex-col justify-between shadow-xs relative overflow-hidden">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-label-sm font-label-sm uppercase tracking-wider font-semibold text-on-surface-variant">
                        Preparedness Score
                      </span>
                      <span className="px-2 py-0.5 rounded text-label-sm font-label-sm font-semibold bg-primary/10 text-primary">
                        Pre-submission
                      </span>
                    </div>

                    {/* GAUGE & METRIC */}
                    <div className="flex items-center gap-5 pt-2">
                      <div className="relative w-24 h-24 flex-shrink-0 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle
                            className="text-surface-container"
                            cx="50"
                            cy="50"
                            fill="none"
                            r="45"
                            stroke="currentColor"
                            strokeWidth="10"
                          />
                          <circle
                            className="text-primary gauge-circle"
                            cx="50"
                            cy="50"
                            fill="none"
                            r="45"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeWidth="10"
                            style={{ strokeDashoffset }}
                          />
                        </svg>
                        <div className="absolute text-center">
                          <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                            {preparationScore}%
                          </span>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-headline-sm text-title-md font-bold text-on-surface leading-tight">
                          {preparationScore >= 80
                            ? 'Well Prepared'
                            : preparationScore >= 40
                            ? 'Ready to prepare'
                            : 'Starting preparation'}
                        </h3>
                        <p className="font-body-sm text-[12px] text-on-surface-variant mt-1 leading-snug">
                          Measures document completeness & clarity before insurer transmission.{' '}
                          <em>Not an approval guarantee.</em>
                        </p>
                      </div>
                    </div>

                    {/* CHECKLIST BREAKDOWN */}
                    <div className="pt-3 border-t border-outline-variant/20 space-y-2">
                      <div className="text-label-sm font-label-sm font-semibold text-on-surface flex items-center justify-between">
                        <span>Readiness checklist:</span>
                        {documentsMissingCount > 0 && (
                          <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                            {documentsMissingCount} recommended pending
                          </span>
                        )}
                      </div>
                      <ul className="space-y-1.5 text-body-sm font-body-sm">
                        <li className="flex items-center gap-2 text-on-surface">
                          <IconCheckCircle size={16} className="text-emerald-600 shrink-0" />
                          <span>Policy document verified & indexed</span>
                        </li>
                        <li className="flex items-center gap-2 text-on-surface">
                          <IconCheckCircle size={16} className="text-emerald-600 shrink-0" />
                          <span>Coverage details & exclusions mapped</span>
                        </li>
                        <li className="flex items-center gap-2 text-on-surface">
                          <IconCheckCircle size={16} className="text-emerald-600 shrink-0" />
                          <span>Policy & TPA reference available</span>
                        </li>
                        <li className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                          {documentsReadyCount >= 2 ? (
                            <IconCheckCircle size={16} className="text-emerald-600 shrink-0" />
                          ) : (
                            <IconCircle size={16} className="text-amber-600 shrink-0" />
                          )}
                          <span>
                            {documentsReadyCount >= 2
                              ? 'Hospital invoice attached'
                              : 'Hospital final invoice not parsed'}
                          </span>
                        </li>
                        <li className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                          {documentsReadyCount >= 4 ? (
                            <IconCheckCircle size={16} className="text-emerald-600 shrink-0" />
                          ) : (
                            <IconCircle size={16} className="text-amber-600 shrink-0" />
                          )}
                          <span>
                            {documentsReadyCount >= 4
                              ? 'Claim notification timeline verified'
                              : 'Claim notification timeline unverified'}
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="pt-4 mt-2">
                    <a
                      href="#checklist"
                      className="text-label-md font-label-md font-semibold text-primary hover:underline inline-flex items-center gap-1 group"
                    >
                      <span>View readiness breakdown</span>
                      <IconArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </a>
                  </div>
                </div>

                {/* SECTION 3: ACTIVE CLAIM WORKSPACE (7 Cols) */}
                <div className="lg:col-span-7 p-6 rounded-3xl bg-surface-container-lowest border border-outline-variant/30 flex flex-col justify-between shadow-xs spectral-border">
                  <div className="space-y-5">
                    {/* WORKSPACE HEADER */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-headline-sm text-title-lg font-bold text-on-surface">
                            {activeClaim ? activeClaim.claim_name : 'Hospitalisation Claim'}
                          </h3>
                          <span className="px-2.5 py-0.5 rounded-full text-label-sm font-label-sm font-semibold bg-primary/10 text-primary">
                            {activeClaim ? formatClaimStatus(activeClaim.status) : 'Preparation in progress'}
                          </span>
                        </div>
                        <p className="text-body-sm font-body-sm text-on-surface-variant mt-0.5">
                          Planned admission at{' '}
                          {activeClaim?.hospital_name || 'Apollo Hospitals, Greams Road'} · TPA:{' '}
                          {activePolicy?.insurer_name || 'Medi Assist'}
                        </p>
                      </div>
                      <span className="text-label-sm font-label-sm text-on-surface-variant">
                        Updated {activeClaim ? formatDate(activeClaim.updated_at) : '2h ago'}
                      </span>
                    </div>

                    {/* CLAIM METADATA PILLS */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-3 border-y border-outline-variant/20 text-body-sm font-body-sm">
                      <div>
                        <span className="text-label-sm font-label-sm text-on-surface-variant block">Policy</span>
                        <span className="font-semibold text-on-surface truncate block">
                          {activePolicy ? activePolicy.policy_name : 'Care Supreme'}
                        </span>
                      </div>
                      <div>
                        <span className="text-label-sm font-label-sm text-on-surface-variant block">Claim Type</span>
                        <span className="font-semibold text-on-surface truncate block">
                          {activeClaim?.claim_type || 'Cashless Request'}
                        </span>
                      </div>
                      <div>
                        <span className="text-label-sm font-label-sm text-on-surface-variant block">Started</span>
                        <span className="font-semibold text-on-surface block">
                          {activeClaim
                            ? formatDate(activeClaim.admission_date || activeClaim.created_at)
                            : '12 Aug 2026'}
                        </span>
                      </div>
                      <div>
                        <span className="text-label-sm font-label-sm text-on-surface-variant block">Documents</span>
                        <span className="font-semibold text-primary block">
                          {documentsReadyCount || 4} of 7 ready
                        </span>
                      </div>
                    </div>

                    {/* 4-STEP PROGRESS TRACKER */}
                    <div className="space-y-2">
                      <div className="text-label-sm font-label-sm font-semibold text-on-surface-variant">
                        Claim Lifecycle:
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {/* Step 1: Documents */}
                        <div className="space-y-1">
                          <div className="h-1.5 rounded-full bg-primary" />
                          <div className="flex items-center gap-1 text-label-sm font-label-sm font-bold text-primary">
                            <span>1. Documents</span>
                          </div>
                        </div>
                        {/* Step 2: Review */}
                        <div className="space-y-1">
                          <div
                            className={`h-1.5 rounded-full ${
                              activeClaim && activeClaim.status === 'review'
                                ? 'bg-primary'
                                : 'bg-surface-container-high'
                            }`}
                          />
                          <div className="text-label-sm font-label-sm text-on-surface-variant">
                            <span>2. Review</span>
                          </div>
                        </div>
                        {/* Step 3: Submission */}
                        <div className="space-y-1">
                          <div
                            className={`h-1.5 rounded-full ${
                              activeClaim && activeClaim.status === 'submitted'
                                ? 'bg-primary'
                                : 'bg-surface-container-high'
                            }`}
                          />
                          <div className="text-label-sm font-label-sm text-on-surface-variant">
                            <span>3. Submission</span>
                          </div>
                        </div>
                        {/* Step 4: Insurer status */}
                        <div className="space-y-1">
                          <div
                            className={`h-1.5 rounded-full ${
                              activeClaim && activeClaim.status === 'closed'
                                ? 'bg-primary'
                                : 'bg-surface-container-high'
                            }`}
                          />
                          <div className="text-label-sm font-label-sm text-on-surface-variant">
                            <span>4. Insurer status</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ACTIONS */}
                  <div className="pt-6 flex flex-wrap items-center gap-3">
                    {activeClaim ? (
                      <Link
                        href={`/claims/${activeClaim.id}`}
                        className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-headline-sm text-label-md font-semibold shadow-xs hover:bg-primary/90 transition-all inline-flex items-center gap-2"
                      >
                        <IconPlay size={18} />
                        <span>Continue preparation</span>
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setCreateModalOpen(true)}
                        className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-headline-sm text-label-md font-semibold shadow-xs hover:bg-primary/90 transition-all inline-flex items-center gap-2"
                      >
                        <IconPlay size={18} />
                        <span>Continue preparation</span>
                      </button>
                    )}

                    {activeClaim ? (
                      <Link
                        href={`/claims/${activeClaim.id}`}
                        className="px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/60 text-on-surface font-headline-sm text-label-md font-semibold hover:bg-surface-container-low transition-all"
                      >
                        View claim details
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setCreateModalOpen(true)}
                        className="px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/60 text-on-surface font-headline-sm text-label-md font-semibold hover:bg-surface-container-low transition-all"
                      >
                        View claim details
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 4: CLAIM PREPARATION CHECKLIST */}
              <section
                aria-label="Claim Preparation Checklist"
                className="p-6 rounded-3xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs space-y-6"
                id="checklist"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="font-headline-sm text-title-lg font-bold text-on-surface">
                      Typical claim preparation
                    </h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 max-w-2xl">
                      Requirements can vary by policy and claim type. Always verify the exact requirements with your insurer or network hospital TPA desk.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-label-sm font-label-sm bg-surface-container-low text-on-surface-variant font-medium border border-outline-variant/30">
                    Interactive Checklist
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Category 1: Policy Information */}
                  <div className="p-4 rounded-2xl bg-surface-container-low/60 border border-outline-variant/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-headline-sm text-label-md font-bold text-on-surface uppercase tracking-wide">
                        1. Policy Information
                      </span>
                      <span className="text-label-sm font-label-sm text-emerald-600 font-semibold">3/3 ready</span>
                    </div>

                    <div className="space-y-2">
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() =>
                          openItemDrawer({
                            title: 'Policy Document',
                            category: 'Policy Information',
                            desc: `The base policy schedule verifies policy active dates, insured members, and baseline sum insured of ${
                              activePolicy?.sum_insured ? formatCurrency(activePolicy.sum_insured) : '₹10,00,000'
                            }.`,
                            source: 'Page 1, Schedule of Insurance',
                          })
                        }
                        className="p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/20 flex items-center justify-between text-body-sm font-body-sm cursor-pointer hover:border-primary/40 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <IconCheckCircle size={18} className="text-emerald-600 shrink-0" />
                          <span className="font-medium text-on-surface">Policy document</span>
                        </div>
                        <IconInfo size={16} className="text-on-surface-variant shrink-0" />
                      </div>

                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() =>
                          openItemDrawer({
                            title: 'Policy Number',
                            category: 'Policy Information',
                            desc: 'Exact identifier used by hospitals and TPAs to initiate pre-authorisation queries.',
                            source: `Card No: ${activePolicy?.policy_number || '4821-9021-3312'}`,
                          })
                        }
                        className="p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/20 flex items-center justify-between text-body-sm font-body-sm cursor-pointer hover:border-primary/40 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <IconCheckCircle size={18} className="text-emerald-600 shrink-0" />
                          <span className="font-medium text-on-surface">Policy number</span>
                        </div>
                        <span className="text-label-sm font-label-sm text-on-surface-variant">
                          {activePolicy?.policy_number
                            ? `...${activePolicy.policy_number.slice(-4)}`
                            : '...3312'}
                        </span>
                      </div>

                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() =>
                          openItemDrawer({
                            title: 'Insured Person Details',
                            category: 'Policy Information',
                            desc: 'Matches government ID with insured person registered under the schedule.',
                            source: 'Schedule Annexure A',
                          })
                        }
                        className="p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/20 flex items-center justify-between text-body-sm font-body-sm cursor-pointer hover:border-primary/40 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <IconCheckCircle size={18} className="text-emerald-600 shrink-0" />
                          <span className="font-medium text-on-surface">Insured&apos;s details</span>
                        </div>
                        <IconInfo size={16} className="text-on-surface-variant shrink-0" />
                      </div>
                    </div>
                  </div>

                  {/* Category 2: Medical Documents */}
                  <div className="p-4 rounded-2xl bg-surface-container-low/60 border border-outline-variant/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-headline-sm text-label-md font-bold text-on-surface uppercase tracking-wide">
                        2. Medical Documents
                      </span>
                      <span className="text-label-sm font-label-sm text-amber-600 font-semibold">2/4 ready</span>
                    </div>

                    <div className="space-y-2">
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() =>
                          openItemDrawer({
                            title: 'Discharge Summary',
                            category: 'Medical Document',
                            desc: 'Must clearly mention diagnosis, date of admission, date of discharge, and treatment given.',
                            source: 'Policy Details → Claims Procedure → Page 63 (Clause 8.2)',
                          })
                        }
                        className="p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/20 flex items-center justify-between text-body-sm font-body-sm cursor-pointer hover:border-primary/40 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <IconCheckCircle size={18} className="text-emerald-600 shrink-0" />
                          <span className="font-medium text-on-surface">Discharge summary</span>
                        </div>
                        <IconInfo size={16} className="text-on-surface-variant shrink-0" />
                      </div>

                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() =>
                          openItemDrawer({
                            title: 'Hospital Itemized Bills',
                            category: 'Billing Evidence',
                            desc: 'Detailed break-up for OT charges, doctor fees, room rent, and medicines with signed receipts.',
                            source: 'Clause 8.2 (Itemized Billing)',
                          })
                        }
                        className="p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/20 flex items-center justify-between text-body-sm font-body-sm cursor-pointer hover:border-primary/40 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <IconCheckCircle size={18} className="text-emerald-600 shrink-0" />
                          <span className="font-medium text-on-surface">Hospital bills</span>
                        </div>
                        <IconInfo size={16} className="text-on-surface-variant shrink-0" />
                      </div>

                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() =>
                          openItemDrawer({
                            title: 'Investigation Reports',
                            category: 'Diagnostic Evidence',
                            desc: 'Diagnostic reports supporting the medical condition, including blood work, CT scans, or ECG.',
                            source: 'Clause 8.3 (Diagnostic Evidence)',
                          })
                        }
                        className="p-2.5 rounded-xl bg-surface-container-lowest border border-amber-500/30 flex items-center justify-between text-body-sm font-body-sm cursor-pointer hover:border-amber-500 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <IconClock size={18} className="text-amber-500 shrink-0" />
                          <span className="font-medium text-on-surface">Investigation reports</span>
                        </div>
                        <span className="text-label-sm font-label-sm font-semibold text-amber-700 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">
                          Review
                        </span>
                      </div>

                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() =>
                          openItemDrawer({
                            title: 'Prescription & Medical Records',
                            category: 'Clinical Records',
                            desc: 'Doctor prescription detailing line of treatment and prescription for pharmacy supplies.',
                            source: 'Clause 8.2',
                          })
                        }
                        className="p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/20 flex items-center justify-between text-body-sm font-body-sm cursor-pointer hover:border-primary/40 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <IconCircle size={18} className="text-outline shrink-0" />
                          <span className="text-on-surface-variant">Prescriptions / Records</span>
                        </div>
                        <IconPlusCircle size={16} className="text-outline shrink-0" />
                      </div>
                    </div>
                  </div>

                  {/* Category 3: Claim Information */}
                  <div className="p-4 rounded-2xl bg-surface-container-low/60 border border-outline-variant/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-headline-sm text-label-md font-bold text-on-surface uppercase tracking-wide">
                        3. Claim Information
                      </span>
                      <span className="text-label-sm font-label-sm text-on-surface-variant font-semibold">1/2 ready</span>
                    </div>

                    <div className="space-y-2">
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() =>
                          openItemDrawer({
                            title: 'Claim Form Part A & B',
                            category: 'IRDAI Claim Form',
                            desc: 'Form A to be filled by the policyholder, Form B to be certified by the attending medical officer.',
                            source: 'IRDAI Standard Claim Forms',
                          })
                        }
                        className="p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/20 flex items-center justify-between text-body-sm font-body-sm cursor-pointer hover:border-primary/40 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <IconCircle size={18} className="text-outline shrink-0" />
                          <span className="text-on-surface-variant">Claim Form Part A & B</span>
                        </div>
                        <IconDownload size={16} className="text-outline shrink-0" />
                      </div>

                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() =>
                          openItemDrawer({
                            title: 'Cashless Pre-Auth Mail',
                            category: 'TPA Communications',
                            desc: 'Approval or initial query letter received from the hospital insurance coordination cell.',
                            source: 'TPA Letter Ref: PA-990214',
                          })
                        }
                        className="p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/20 flex items-center justify-between text-body-sm font-body-sm cursor-pointer hover:border-primary/40 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <IconCheckCircle size={18} className="text-emerald-600 shrink-0" />
                          <span className="font-medium text-on-surface">Cashless pre-auth corr.</span>
                        </div>
                        <IconInfo size={16} className="text-on-surface-variant shrink-0" />
                      </div>

                      {/* Guidance note */}
                      <div className="p-2.5 rounded-xl bg-surface-container-high/40 text-on-surface-variant text-[11px] leading-relaxed">
                        Tip: Keep physical copies of all bills with revenue stamps if filing a post-hospitalisation reimbursement claim.
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* SECTION 5: "WHAT DOES MY POLICY SAY ABOUT CLAIMS?" (Policy Clause Extractor) */}
              <section aria-label="Policy Clause Citations" className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-headline-sm text-title-lg font-bold text-on-surface">
                      What does my policy say about claims?
                    </h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                      Exact clauses extracted from your {activePolicy?.policy_name || 'Care Supreme'} policy contract.
                    </p>
                  </div>

                  {activePolicy ? (
                    <Link
                      href={`/policies/${activePolicy.id}/details`}
                      className="text-label-sm font-label-sm text-primary font-medium flex items-center gap-1 hover:underline"
                    >
                      <IconBookOpen size={16} className="shrink-0" />
                      <span>Full policy contract (84 pages)</span>
                    </Link>
                  ) : (
                    <span className="text-label-sm font-label-sm text-primary font-medium flex items-center gap-1">
                      <IconBookOpen size={16} className="shrink-0" />
                      <span>Full policy contract (84 pages)</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Clause 1: Hospitalisation */}
                  <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 hover:shadow-xs transition-all space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-headline-sm text-title-md font-bold text-on-surface">
                        Hospitalisation Coverage
                      </span>
                      <span className="text-label-sm font-label-sm px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 font-semibold">
                        {activePolicy?.sum_insured
                          ? `Upto ₹${activePolicy.sum_insured.toLocaleString('en-IN')}`
                          : 'Upto ₹10,00,000'}
                      </span>
                    </div>
                    <p className="font-body-md text-body-md text-on-surface leading-relaxed">
                      Covered up to {activePolicy?.sum_insured ? formatCurrency(activePolicy.sum_insured) : '₹10,00,000'}{' '}
                      sum insured subject to{' '}
                      <span className="bg-primary/10 px-1 py-0.5 rounded text-primary font-medium">
                        Single Private AC room
                      </span>{' '}
                      category terms without sub-limit penalty.
                    </p>
                    <div className="pt-2 flex items-center justify-between border-t border-outline-variant/20 text-label-sm font-label-sm">
                      <div className="flex items-center gap-1 text-on-surface-variant">
                        <IconShieldCheck size={15} className="text-primary shrink-0" />
                        <span>Source: Policy Details · Page 18, Sec 3.2</span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          openClauseModal({
                            title: 'Hospitalisation Coverage',
                            text: 'Covered up to ₹10,00,000 subject to Single Private AC room terms. If insured occupies room higher than eligibility, proportionate deduction applies.',
                            source: 'Section 3.2, Page 18',
                            uin: 'Care Supreme Schedule UIN: RHIHLIP21332V012021',
                          })
                        }
                        className="text-primary font-semibold hover:underline focus:outline-none"
                      >
                        View clause
                      </button>
                    </div>
                  </div>

                  {/* Clause 2: Pre & Post Hospitalisation */}
                  <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 hover:shadow-xs transition-all space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-headline-sm text-title-md font-bold text-on-surface">
                        Pre & Post Hospitalisation
                      </span>
                      <span className="text-label-sm font-label-sm px-2 py-0.5 rounded bg-surface-container text-on-surface font-semibold">
                        60 & 180 Days
                      </span>
                    </div>
                    <p className="font-body-md text-body-md text-on-surface leading-relaxed">
                      Medical expenses incurred{' '}
                      <span className="bg-primary/10 px-1 py-0.5 rounded text-primary font-medium">60 days prior</span>{' '}
                      and{' '}
                      <span className="bg-primary/10 px-1 py-0.5 rounded text-primary font-medium">
                        180 days post-discharge
                      </span>{' '}
                      are eligible for reimbursement.
                    </p>
                    <div className="pt-2 flex items-center justify-between border-t border-outline-variant/20 text-label-sm font-label-sm">
                      <div className="flex items-center gap-1 text-on-surface-variant">
                        <IconShieldCheck size={15} className="text-primary shrink-0" />
                        <span>Source: Policy Details · Page 17, Sec 3.5</span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          openClauseModal({
                            title: 'Pre & Post Hospitalisation',
                            text: 'Medical expenses directly related to same illness for which hospitalisation occurred are payable up to 60 days before admission and 180 days after discharge.',
                            source: 'Section 3.5, Page 17',
                            uin: 'Care Supreme Schedule UIN: RHIHLIP21332V012021',
                          })
                        }
                        className="text-primary font-semibold hover:underline focus:outline-none"
                      >
                        View clause
                      </button>
                    </div>
                  </div>

                  {/* Clause 3: Claim Notification */}
                  <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 hover:shadow-xs transition-all space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-headline-sm text-title-md font-bold text-on-surface">
                        Claim Notification Timelines
                      </span>
                      <span className="text-label-sm font-label-sm px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 font-semibold">
                        Crucial Timeline
                      </span>
                    </div>
                    <p className="font-body-md text-body-md text-on-surface leading-relaxed">
                      Notice must be given within{' '}
                      <span className="bg-amber-100/70 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 px-1 py-0.5 rounded font-medium">
                        24 hours of emergency
                      </span>{' '}
                      admission, or{' '}
                      <span className="bg-amber-100/70 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 px-1 py-0.5 rounded font-medium">
                        48 hours prior
                      </span>{' '}
                      to planned elective procedures.
                    </p>
                    <div className="pt-2 flex items-center justify-between border-t border-outline-variant/20 text-label-sm font-label-sm">
                      <div className="flex items-center gap-1 text-on-surface-variant">
                        <IconShieldCheck size={15} className="text-primary shrink-0" />
                        <span>Source: Policy Details · Page 63, Sec 8.1</span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          openClauseModal({
                            title: 'Claim Notification Timeline',
                            text: 'In case of planned hospitalization, notice must be sent 48 hours before admission. In emergency hospitalization, notice must be sent within 24 hours of admission to TPA or Company.',
                            source: 'Section 8.1, Page 63',
                            uin: 'Care Supreme Schedule UIN: RHIHLIP21332V012021',
                          })
                        }
                        className="text-primary font-semibold hover:underline focus:outline-none"
                      >
                        View clause
                      </button>
                    </div>
                  </div>

                  {/* Clause 4: Proportionate Deduction Warning */}
                  <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 hover:shadow-xs transition-all space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-headline-sm text-title-md font-bold text-on-surface">
                        Proportionate Deduction Warning
                      </span>
                      <span className="text-label-sm font-label-sm px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 font-semibold">
                        Important Copay
                      </span>
                    </div>
                    <p className="font-body-md text-body-md text-on-surface leading-relaxed">
                      Opting for a room above Single Private AC triggers proportional deductions across associate doctor fees, OT charges, and nursing.
                    </p>
                    <div className="pt-2 flex items-center justify-between border-t border-outline-variant/20 text-label-sm font-label-sm">
                      <div className="flex items-center gap-1 text-on-surface-variant">
                        <IconShieldCheck size={15} className="text-primary shrink-0" />
                        <span>Source: Policy Details · Page 18, Sec 7.2</span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          openClauseModal({
                            title: 'Proportionate Deduction Clause',
                            text: 'If the Insured occupies a room with room rent higher than the entitled limit, all associated medical expenses will be proportionately scaled down.',
                            source: 'Section 7.2, Page 18',
                            uin: 'Care Supreme Schedule UIN: RHIHLIP21332V012021',
                          })
                        }
                        className="text-primary font-semibold hover:underline focus:outline-none"
                      >
                        View clause
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* SECTION 6: RECENT CLAIM DOCUMENTS & AUDIT TRAIL */}
              <section
                aria-label="Recent Documents"
                className="p-6 rounded-3xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-headline-sm text-title-lg font-bold text-on-surface">
                      Recent claim documents & audit trail
                    </h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Uploaded bills and medical evidence parsed by PRISM Document Intelligence.
                    </p>
                  </div>
                  <Link
                    href={activeClaim ? `/claims/${activeClaim.id}` : '/documents'}
                    className="px-3 py-1.5 rounded-xl border border-outline-variant/50 text-label-md font-label-md font-medium text-on-surface hover:bg-surface-container-low transition-colors flex items-center gap-1.5"
                  >
                    <IconUpload size={16} className="shrink-0" />
                    <span>Upload Document</span>
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-outline-variant/30 text-label-sm font-label-sm text-on-surface-variant">
                        <th className="py-2.5 px-3">Document Name</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Associated Claim</th>
                        <th className="py-2.5 px-3">Uploaded</th>
                        <th className="py-2.5 px-3">Parsing Status</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20 text-body-sm font-body-sm">
                      {/* Row 1 */}
                      <tr className="hover:bg-surface-container-low/40 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <IconFileText size={20} className="text-primary shrink-0" />
                            <span className="font-medium text-on-surface">Discharge_Summary_Apollo.pdf</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-on-surface-variant">Medical Document</td>
                        <td className="py-3 px-3 text-on-surface">{activeClaim?.claim_name || 'Hospitalisation'}</td>
                        <td className="py-3 px-3 text-on-surface-variant">Today, 11:20 AM</td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-sm font-label-sm font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            <span>Processed</span>
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              openItemDrawer({
                                title: 'Discharge Summary',
                                category: 'Medical Document',
                                desc: 'Hospital discharge summary parsed with ICD-10 diagnosis, treatment plan, and doctor verification.',
                                source: 'Parsed via PRISM Document Intelligence',
                              })
                            }
                            className="text-primary hover:underline font-medium text-label-md font-label-md"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>

                      {/* Row 2 */}
                      <tr className="hover:bg-surface-container-low/40 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <IconReceipt size={20} className="text-primary shrink-0" />
                            <span className="font-medium text-on-surface">Hospital_Final_Bill_Itemized.pdf</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-on-surface-variant">Hospital Invoice</td>
                        <td className="py-3 px-3 text-on-surface">{activeClaim?.claim_name || 'Hospitalisation'}</td>
                        <td className="py-3 px-3 text-on-surface-variant">Yesterday</td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-sm font-label-sm font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            <span>Processed</span>
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              openItemDrawer({
                                title: 'Hospital Final Bill',
                                category: 'Hospital Invoice',
                                desc: 'Final tax invoice itemized across Room Rent, Nursing, Medicines, and OT charges.',
                                source: 'Parsed via PRISM Document Intelligence',
                              })
                            }
                            className="text-primary hover:underline font-medium text-label-md font-label-md"
                          >
                            View
                          </button>
                        </td>
                      </tr>

                      {/* Row 3 */}
                      <tr className="hover:bg-surface-container-low/40 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <IconAlertTriangle size={20} className="text-amber-600 shrink-0" />
                            <span className="font-medium text-on-surface">Cashless_PreAuth_Query_Notice.pdf</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-on-surface-variant">Claim Form / TPA</td>
                        <td className="py-3 px-3 text-on-surface">{activeClaim?.claim_name || 'Hospitalisation'}</td>
                        <td className="py-3 px-3 text-on-surface-variant">2 days ago</td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-sm font-label-sm font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                            <span>Needs review</span>
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              openItemDrawer({
                                title: 'Cashless Query Notice',
                                category: 'Claim Form / TPA',
                                desc: 'Insurer TPA requested additional clarification regarding previous consultations or illness history.',
                                source: 'TPA Desk Inquiry',
                              })
                            }
                            className="text-amber-700 dark:text-amber-400 hover:underline font-semibold text-label-md font-label-md"
                          >
                            Resolve
                          </button>
                        </td>
                      </tr>

                      {/* Row 4 */}
                      <tr className="hover:bg-surface-container-low/40 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <IconFolderArchive size={20} className="text-primary shrink-0" />
                            <span className="font-medium text-on-surface">Pharmacy_Bills_Pack.zip</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-on-surface-variant">Invoices</td>
                        <td className="py-3 px-3 text-on-surface">{activeClaim?.claim_name || 'Hospitalisation'}</td>
                        <td className="py-3 px-3 text-on-surface-variant">3 days ago</td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-sm font-label-sm font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            <span>Processed</span>
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              openItemDrawer({
                                title: 'Pharmacy Bills Pack',
                                category: 'Invoices',
                                desc: 'Batch of outpatient pharmacy bills with doctor prescriptions.',
                                source: 'Document Vault Archive',
                              })
                            }
                            className="text-primary hover:underline font-medium text-label-md font-label-md"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* SECTION 7: ASK PRISM CLAIMS COMPANION */}
          <section
            aria-label="AI Claims Companion"
            className="p-6 md:p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs spectral-border space-y-5"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-label-sm font-label-sm font-semibold text-primary">
                  <IconBot size={16} className="shrink-0" />
                  <span>Ask PRISM Claims Companion</span>
                </div>
                <h2 className="font-headline-sm text-title-lg font-bold text-on-surface">
                  Not sure what to do next?
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Ask PRISM about your policy clauses, claim documents, or how to address insurer query letters.
                </p>
              </div>
              <IconSparkles size={36} className="text-primary/30 hidden sm:block shrink-0" />
            </div>

            {/* INPUT BOX */}
            <form onSubmit={handleAskSubmit} className="relative">
              <input
                type="text"
                value={askQuery}
                onChange={(e) => setAskQuery(e.target.value)}
                placeholder="Ask about my claim or paste a requirement clause..."
                className="w-full bg-surface-container-low border border-outline-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl py-3.5 pl-4 pr-28 text-body-md text-on-surface placeholder:text-on-surface-variant/60 transition-all shadow-inner"
              />
              <button
                type="submit"
                className="absolute right-2 top-2 bottom-2 px-4 rounded-xl bg-primary text-on-primary font-headline-sm text-label-md font-semibold hover:bg-primary/90 transition-all flex items-center gap-1"
              >
                <span>Ask</span>
                <IconArrowUp size={16} className="shrink-0" />
              </button>
            </form>

            {/* QUICK QUESTION CHIPS */}
            <div className="space-y-2">
              <span className="text-label-sm font-label-sm text-on-surface-variant font-medium">
                Frequently checked by {activePolicy ? activePolicy.policy_name : 'Care Supreme'} policyholders:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleChipClick('What documents does my policy require?')}
                  className="px-3 py-1.5 rounded-full bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 text-label-sm font-label-sm text-on-surface transition-colors"
                >
                  &ldquo;What documents does my policy require?&rdquo;
                </button>
                <button
                  type="button"
                  onClick={() => handleChipClick('Is pre-hospitalisation covered for 180 days?')}
                  className="px-3 py-1.5 rounded-full bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 text-label-sm font-label-sm text-on-surface transition-colors"
                >
                  &ldquo;Is pre-hospitalisation covered for 180 days?&rdquo;
                </button>
                <button
                  type="button"
                  onClick={() => handleChipClick('Where does my policy describe claim notification timelines?')}
                  className="px-3 py-1.5 rounded-full bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 text-label-sm font-label-sm text-on-surface transition-colors"
                >
                  &ldquo;Where does my policy describe claim notification timelines?&rdquo;
                </button>
                <button
                  type="button"
                  onClick={() => handleChipClick('What should I check before submitting my claim?')}
                  className="px-3 py-1.5 rounded-full bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 text-label-sm font-label-sm text-on-surface transition-colors"
                >
                  &ldquo;What should I check before submitting my claim?&rdquo;
                </button>
              </div>
            </div>

            {/* GROUNDING VERIFICATION */}
            <div className="pt-3 border-t border-outline-variant/20 flex items-center gap-2 text-label-sm font-label-sm text-on-surface-variant">
              <IconShieldCheck size={15} className="text-primary shrink-0" />
              <span>
                Grounded in {activePolicy ? activePolicy.policy_name : 'Care Supreme'} official policy schedule (IRDAI
                UIN: RHIHLIP21332V012021). No legal or approval guarantees.
              </span>
            </div>
          </section>

          {/* SECTION 8: IMPORTANT DISCLAIMER & SAFETY AREA */}
          <section
            aria-label="Disclaimer & Safety"
            className="p-5 rounded-2xl bg-surface-container-low/70 border border-outline-variant/30 flex items-start gap-4"
          >
            <IconShield size={22} className="text-outline mt-0.5 shrink-0" />
            <div className="space-y-1">
              <h3 className="font-headline-sm text-label-md font-bold text-on-surface">
                A note about claims and advice
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                PRISM helps you understand your policy and organize claim information. It does not determine whether a claim will be approved, replace your insurer&apos;s official claims process, or provide legal advice. All final adjudications are made solely by Care Health Insurance Limited under IRDAI regulations.
              </p>
              <a
                href="https://irdai.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-label-sm font-label-sm font-semibold text-primary hover:underline pt-1"
              >
                <span>Learn more about IRDAI claims guidelines</span>
                <IconExternalLink size={13} className="shrink-0" />
              </a>
            </div>
          </section>

          {/* SHARED COMPONENT FOOTER */}
          <footer className="w-full max-w-[1400px] mx-auto px-6 lg:px-12 py-16 bg-surface-container-low dark:bg-inverse-surface border-t border-outline-variant/30 dark:border-outline/20 rounded-3xl mt-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-8 border-b border-outline-variant/30">
              <div>
                <div className="text-headline-sm font-headline-sm font-bold text-on-surface dark:text-inverse-on-surface">
                  PRISM
                </div>
                <p className="text-body-sm font-body-sm text-on-surface-variant dark:text-outline-variant mt-1">
                  AI-Powered Health Insurance Intelligence for India
                </p>
              </div>
              <div className="flex flex-wrap gap-4 text-label-sm font-label-sm">
                <Link
                  href="/dashboard"
                  className="text-on-surface-variant dark:text-outline-variant hover:text-primary dark:hover:text-primary-fixed transition-colors duration-150"
                >
                  Product Overview
                </Link>
                <Link
                  href="/dashboard"
                  className="text-on-surface-variant dark:text-outline-variant hover:text-primary dark:hover:text-primary-fixed transition-colors duration-150"
                >
                  How It Works
                </Link>
                <Link
                  href="/claims"
                  className="text-primary dark:text-primary-fixed font-medium"
                >
                  Claims Readiness
                </Link>
                <Link
                  href="/policies"
                  className="text-on-surface-variant dark:text-outline-variant hover:text-primary dark:hover:text-primary-fixed transition-colors duration-150"
                >
                  Cashless Network
                </Link>
                <Link
                  href="/documents"
                  className="text-on-surface-variant dark:text-outline-variant hover:text-primary dark:hover:text-primary-fixed transition-colors duration-150"
                >
                  Document Decoder
                </Link>
              </div>
            </div>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 text-body-sm font-body-sm text-on-surface-variant dark:text-outline-variant">
              <p>
                &copy; 2025 PRISM Technologies India Pvt Ltd. All rights reserved. IRDAI regulatory compliant document intelligence companion.
              </p>
              <div className="flex gap-4 text-label-sm font-label-sm">
                <a href="#" className="hover:text-primary transition-colors">
                  Privacy Policy
                </a>
                <a href="#" className="hover:text-primary transition-colors">
                  Terms of Service
                </a>
                <a href="#" className="hover:text-primary transition-colors">
                  Security & Encryption
                </a>
                <a href="#" className="hover:text-primary transition-colors">
                  Contact Support
                </a>
              </div>
            </div>
          </footer>
        </main>
      </div>

      {/* ========================================================================= */}
      {/* SLIDE-OVER DRAWER (Requirement Inspector)                                 */}
      {/* ========================================================================= */}
      {drawerOpen && (
        <div
          role="presentation"
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[70] transition-opacity"
          onClick={() => setDrawerOpen(false)}
        />
      )}
      <aside
        id="item-drawer"
        aria-label="Requirement Inspector"
        className={`fixed top-0 right-0 bottom-0 w-full max-w-md bg-surface-container-lowest border-l border-outline-variant/30 shadow-2xl z-[80] transform transition-transform duration-300 flex flex-col justify-between p-6 ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="space-y-6 overflow-y-auto custom-scrollbar">
          {/* Drawer Header */}
          <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30">
            <div className="flex items-center gap-2">
              <IconCheckSquare size={20} className="text-primary shrink-0" />
              <span className="font-headline-sm text-label-md font-bold uppercase tracking-wider text-primary">
                Requirement Inspector
              </span>
            </div>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant"
            >
              <IconX size={20} className="shrink-0" />
            </button>
          </div>

          {/* Item Content */}
          <div className="space-y-4">
            <div>
              <span className="px-2 py-0.5 rounded text-label-sm font-label-sm font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                {drawerData.category}
              </span>
              <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface mt-1.5">
                {drawerData.title}
              </h2>
            </div>

            <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 space-y-2">
              <div className="text-label-sm font-label-sm font-bold text-on-surface uppercase tracking-wide">
                Why this may matter
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                {drawerData.desc}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-2">
              <div className="flex items-center gap-1.5 text-label-sm font-label-sm font-bold text-primary">
                <IconBookOpen size={16} className="shrink-0" />
                <span>Policy Citation & Grounding</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface font-mono bg-surface-container-lowest p-2 rounded-xl border border-outline-variant/20">
                {drawerData.source}
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <div className="text-label-sm font-label-sm font-semibold text-on-surface">
                Common reasons for insurer query:
              </div>
              <ul className="text-body-sm font-body-sm text-on-surface-variant space-y-1.5 list-disc pl-4">
                {drawerData.reasons.map((r, idx) => (
                  <li key={idx}>{r}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="pt-4 border-t border-outline-variant/30 flex items-center gap-3">
          {activeClaim ? (
            <Link
              href={`/claims/${activeClaim.id}`}
              className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary font-headline-sm text-label-md font-semibold hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5"
            >
              <IconUpload size={18} className="shrink-0" />
              <span>Upload Matching File</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                setDrawerOpen(false);
                setCreateModalOpen(true);
              }}
              className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary font-headline-sm text-label-md font-semibold hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5"
            >
              <IconUpload size={18} className="shrink-0" />
              <span>Upload Matching File</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="px-4 py-2.5 rounded-xl bg-surface-container-low text-on-surface font-headline-sm text-label-md font-semibold hover:bg-surface-container transition-all"
          >
            Close
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* CLAUSE DETAIL MODAL                                                       */}
      {/* ========================================================================= */}
      {clauseModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[90] flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setClauseModalOpen(false);
            }
          }}
        >
          <div className="w-full max-w-lg bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <div className="flex items-center gap-2">
                <IconShieldCheck size={20} className="text-primary shrink-0" />
                <span className="font-headline-sm text-title-md font-bold text-on-surface">
                  PRISM Grounded Policy Clause
                </span>
              </div>
              <button
                type="button"
                onClick={() => setClauseModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant"
              >
                <IconX size={20} className="shrink-0" />
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="font-headline-sm text-title-lg font-bold text-on-surface">
                {clauseModalData.title}
              </h3>
              <blockquote className="p-4 rounded-2xl bg-surface-container-low text-body-md text-on-surface border-l-4 border-primary font-serif italic leading-relaxed">
                {clauseModalData.text}
              </blockquote>
              <div className="flex items-center justify-between text-label-sm font-label-sm text-on-surface-variant">
                <span className="font-semibold text-primary">{clauseModalData.source}</span>
                <span>{clauseModalData.uin || 'Care Supreme Schedule UIN: RHIHLIP21332V012021'}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-outline-variant/20 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setClauseModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-primary text-on-primary text-label-md font-label-md font-semibold hover:bg-primary/90 transition-colors"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CREATE CLAIM MODAL (Real Supabase claim intake flow)                      */}
      {/* ========================================================================= */}
      <CreateClaimModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        policies={policies}
        defaultPolicyId={activePolicy?.id}
      />
    </div>
  );
}
