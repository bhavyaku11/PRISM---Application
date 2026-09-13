'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type {
  Claim,
  ClaimDocument,
  ClaimType,
  ClaimDocumentCategory,
  PolicyEvidenceItem,
  EvidenceRelevanceTier,
} from '@/types/claim';
import {
  calculatePreparationProgress,
  formatClaimStatus,
  CLAIM_DOCUMENT_CATEGORIES,
  CLAIM_EVIDENCE_TOPICS,
  getCategoryLabel,
  calculateClaimReadiness,
  generateWhyItMatters,
} from '@/types/claim';
import type { Policy, PolicyDocument } from '@/types/policy';
import type { Profile } from '@/types/auth';
import {
  IconSlidersHorizontal,
  IconPanelRightClose,
  IconMoon,
  IconSun,
  IconShield,
  IconLayoutDashboard,
  IconShieldCheck,
  IconPlusCircle,
  IconSparkles,
  IconClipboardCheck,
  IconFolder,
  IconGraduationCap,
  IconSettings,
  IconHelpCircle,
  IconMoreVertical,
  IconBell,
  IconArrowRight,
  IconMoreHorizontal,
  IconHeartPulse,
  IconFolderOpen,
  IconUpload,
  IconCheckCircle,
  IconFileText,
  IconReceipt,
  IconFlaskConical,
  IconPill,
  IconPlus,
  IconUploadCloud,
  IconUser,
  IconCalendar,
  IconFileEdit,
  IconPencil,
  IconTrash2,
  IconCircleX,
  IconInfo,
  IconBot,
  IconArrowUp,
  IconEye,
  IconX,
  IconDownload,
  IconFileSearch,
  IconAlertTriangle,
  IconExternalLink,
} from '@/components/ui/icons';

interface ClaimWorkspaceViewProps {
  userEmail?: string | null;
  profile?: Profile | null;
  claim: Claim;
  policy: Policy | null;
  claimDocuments: ClaimDocument[];
  allUserDocuments: PolicyDocument[];
}

interface DrawerData {
  title: string;
  filename: string;
  content: string;
  documentId?: string;
  category?: string;
  fileSize?: number;
  uploadedAt?: string;
  hospitalType?: string;
  roomCategory?: string;
  preAuth?: string;
  confidenceNote?: string;
  pageNumber?: number;
  sectionTitle?: string;
  whyItMatters?: string;
  isPolicyEvidence?: boolean;
}

function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return 'Attached';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getCategoryIcon(category: string | null | undefined, size = 20) {
  const cat = category?.toLowerCase() || '';
  if (cat.includes('bill') || cat.includes('invoice') || cat.includes('receipt') || cat.includes('pharmacy')) {
    return <IconReceipt size={size} />;
  }
  if (cat.includes('diag') || cat.includes('lab') || cat.includes('report') || cat.includes('biotech')) {
    return <IconFlaskConical size={size} />;
  }
  if (cat.includes('prescrip') || cat.includes('medicin')) {
    return <IconPill size={size} />;
  }
  if (cat.includes('form') || cat.includes('assign')) {
    return <IconClipboardCheck size={size} />;
  }
  if (cat.includes('id') || cat.includes('kyc') || cat.includes('patient') || cat.includes('badge')) {
    return <IconUser size={size} />;
  }
  if (cat.includes('policy') || cat.includes('card') || cat.includes('insurance') || cat.includes('shield')) {
    return <IconShieldCheck size={size} />;
  }
  return <IconFileText size={size} />;
}

function generateClaimStoragePath(
  userId: string,
  policyId: string,
  claimId: string,
  originalFilename: string
): string {
  const safeName = originalFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${userId}/${policyId}/claims/${claimId}/${timestamp}_${randomSuffix}_${safeName}`;
}

export function ClaimWorkspaceView({
  userEmail,
  profile,
  claim: initialClaim,
  policy,
  claimDocuments: initialClaimDocs,
  allUserDocuments,
}: ClaimWorkspaceViewProps) {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Claim State
  const [claim, setClaim] = useState<Claim>(initialClaim);
  const [claimDocs, setClaimDocs] = useState<ClaimDocument[]>(initialClaimDocs);

  // State Simulator Controller: 'active' | 'empty' | 'processing'
  const [simState, setSimState] = useState<'active' | 'empty' | 'processing'>('active');

  // Dynamic Document Readiness Calculation (Deterministic: 4 Mandatory Requirements)
  const readiness = calculateClaimReadiness(claimDocs);
  const effectiveDocs = simState === 'empty' ? [] : claimDocs;
  const readyDocsCount = effectiveDocs.length;
  const progressPercent = simState === 'empty' ? 0 : readiness.score;

  // Dark Mode state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Active Stage in 5-Stage Stepper
  const [activeStage, setActiveStage] = useState<'understand' | 'documents' | 'review' | 'submit' | 'track'>('documents');

  // Slide-out Document Inspection Drawer State
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [drawerData, setDrawerData] = useState<DrawerData>({
    title: 'Discharge Summary',
    filename: 'Discharge_Summary.pdf',
    content: 'Discharge recorded on 16 Aug 2026. Treating surgeon Dr. R. Sundaram. Hospital seal verified.',
    hospitalType: 'Recognized Tertiary (Apollo)',
    roomCategory: 'Single Private AC (Eligible)',
    preAuth: 'Emergency Intimated',
    confidenceNote: 'This document matches all mandatory IRDAI claim dossier requirements for hospitalization reimbursement claims.',
  });

  // Edit Claim Modal State
  const [isEditingDetails, setIsEditingDetails] = useState<boolean>(false);
  const [claimName, setClaimName] = useState(claim.claim_name);
  const [claimType, setClaimType] = useState<ClaimType>((claim.claim_type as ClaimType) || 'Hospitalization');
  const [insuredMember, setInsuredMember] = useState(claim.insured_member || '');
  const [hospitalName, setHospitalName] = useState(claim.hospital_name || '');
  const [admissionDate, setAdmissionDate] = useState(claim.admission_date || '');
  const [dischargeDate, setDischargeDate] = useState(claim.discharge_date || '');
  const [estimatedExpense, setEstimatedExpense] = useState(
    claim.estimated_expense ? claim.estimated_expense.toString() : ''
  );
  const [notes, setNotes] = useState(claim.notes || '');
  const [isSavingDetails, setIsSavingDetails] = useState<boolean>(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // Note Modal & Editing
  const [isEditingNote, setIsEditingNote] = useState<boolean>(false);
  const [noteContent, setNoteContent] = useState(claim.notes || '');

  // Document Management & Upload State
  const [uploadModalOpen, setUploadModalOpen] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<ClaimDocumentCategory>('discharge_summary');
  const [uploadFileObj, setUploadFileObj] = useState<File | null>(null);
  const [uploadNotes, setUploadNotes] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteConfirmDoc, setDeleteConfirmDoc] = useState<ClaimDocument | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Legacy / Direct upload state
  const [activeReqForUpload, setActiveReqForUpload] = useState<string | null>(null);
  const [linkModalOpen, setLinkModalOpen] = useState<boolean>(false);
  const [selectedVaultDocId, setSelectedVaultDocId] = useState<string>('');
  const [isLinking, setIsLinking] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Ask PRISM Contextual Assistant State
  const [assistantInput, setAssistantInput] = useState<string>('');
  const [assistantLoading, setAssistantLoading] = useState<boolean>(false);

  // Policy Evidence Mapping State
  const [selectedEvidenceTopic, setSelectedEvidenceTopic] = useState<string>('general');
  const [evidenceList, setEvidenceList] = useState<PolicyEvidenceItem[]>([]);
  const [isEvidenceLoading, setIsEvidenceLoading] = useState<boolean>(false);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);
  const [expandedEvidenceChunkId, setExpandedEvidenceChunkId] = useState<string | null>(null);
  const [hasReviewedEvidence, setHasReviewedEvidence] = useState<boolean>(false);

  // Policy Evidence Retrieval Handler
  const fetchPolicyEvidence = useCallback(
    async (topicId = selectedEvidenceTopic) => {
      if (!claim.policy_id) {
        setIsEvidenceLoading(false);
        setEvidenceList([]);
        return;
      }

      setIsEvidenceLoading(true);
      setEvidenceError(null);

      const topicConfig = CLAIM_EVIDENCE_TOPICS.find((t) => t.id === topicId) || CLAIM_EVIDENCE_TOPICS[0];

      // Construct rich claim-specific retrieval query using real claim context
      const queryParts = [
        claim.claim_name || '',
        claim.claim_type || 'Hospitalization',
        claim.hospital_name || '',
        topicConfig.querySuffix,
      ].filter(Boolean);
      const constructedQuery = queryParts.join(' ');

      try {
        const res = await fetch('/api/retrieval/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: constructedQuery,
            policy_id: claim.policy_id,
            top_k: 6,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to retrieve policy evidence.');
        }

        const data = await res.json();
        interface RetrievalChunkRecord {
          chunk_id?: string;
          document_id?: string;
          policy_id?: string;
          page_number?: number;
          section_title?: string;
          content?: string;
          similarity?: number;
        }
        const rawResults = (Array.isArray(data.results) ? data.results : []) as RetrievalChunkRecord[];

        const items: PolicyEvidenceItem[] = rawResults.map((r) => {
          const similarity = typeof r.similarity === 'number' ? r.similarity : 0.72;
          let relevance_tier: EvidenceRelevanceTier = 'potentially_relevant';
          if (similarity >= 0.76) {
            relevance_tier = 'relevant';
          } else if (similarity < 0.45) {
            relevance_tier = 'insufficient_evidence';
          }

          const why = generateWhyItMatters(r.section_title || '', r.content || '', claim);

          // Derive related claim document category based on policy content/title
          let relatedCat: ClaimDocumentCategory | undefined;
          const lowerSection = (r.section_title || '').toLowerCase();
          const lowerContent = (r.content || '').toLowerCase();
          if (
            lowerSection.includes('room') ||
            lowerSection.includes('rent') ||
            lowerSection.includes('icu') ||
            lowerContent.includes('room rent') ||
            lowerContent.includes('icu') ||
            lowerContent.includes('boarding')
          ) {
            relatedCat = 'hospital_bill';
          } else if (
            lowerSection.includes('pre') ||
            lowerSection.includes('post') ||
            lowerContent.includes('pre-hospitalisation') ||
            lowerContent.includes('post-hospitalisation')
          ) {
            relatedCat = 'pharmacy_bills';
          } else if (
            lowerSection.includes('procedure') ||
            lowerSection.includes('notice') ||
            lowerSection.includes('intimation') ||
            lowerSection.includes('claim form') ||
            lowerContent.includes('notice of claim')
          ) {
            relatedCat = 'claim_form';
          } else if (
            lowerSection.includes('diagnostic') ||
            lowerSection.includes('investigation') ||
            lowerContent.includes('diagnostic') ||
            lowerContent.includes('investigation')
          ) {
            relatedCat = 'diagnostic_reports';
          } else {
            relatedCat = 'discharge_summary';
          }

          return {
            chunk_id: r.chunk_id || `chk_${Math.random().toString(36).substring(2, 8)}`,
            document_id: r.document_id || '',
            policy_id: r.policy_id || claim.policy_id || '',
            page_number: typeof r.page_number === 'number' ? r.page_number : 1,
            section_title: r.section_title || 'Policy Provision',
            content: r.content || '',
            similarity,
            relevance_tier,
            why_it_matters: why,
            related_document_category: relatedCat,
          };
        });

        setEvidenceList(items);
        setHasReviewedEvidence(true);
      } catch (err) {
        console.error('Evidence retrieval error:', err);
        setEvidenceError(err instanceof Error ? err.message : 'Unable to analyze policy evidence at this time.');
      } finally {
        setIsEvidenceLoading(false);
      }
    },
    [claim, selectedEvidenceTopic]
  );

  useEffect(() => {
    if (!claim.policy_id) return;
    const timer = setTimeout(() => {
      fetchPolicyEvidence(selectedEvidenceTopic);
    }, 0);
    return () => clearTimeout(timer);
  }, [claim.policy_id, selectedEvidenceTopic, fetchPolicyEvidence]);

  const askAboutEvidenceClause = (clauseTitle: string, pageNumber: number) => {
    const question = `What does my policy state regarding ${clauseTitle} (Page ${pageNumber}) for this ${claim.claim_type || 'hospitalization'} claim?`;
    setAssistantInput(question);
    submitAssistant(question);
  };

  // Overflow menu toggle
  const [moreMenuOpen, setMoreMenuOpen] = useState<boolean>(false);

  // User display metadata
  const displayName = profile?.full_name || userEmail?.split('@')[0] || 'Bhavya Kumar';
  const displayEmail = userEmail || 'bhavya@policyvault.in';
  const initials =
    displayName
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

  // Format date helper
  const formatDate = (dateStr: string | null | undefined, fallback = 'Not specified') => {
    if (!dateStr) return fallback;
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

  // Calculate duration between admission and discharge
  const getStayDuration = () => {
    if (!claim.admission_date || !claim.discharge_date) return '';
    try {
      const d1 = new Date(claim.admission_date);
      const d2 = new Date(claim.discharge_date);
      const diffTime = Math.abs(d2.getTime() - d1.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? ` (${diffDays} days stay)` : '';
    } catch {
      return '';
    }
  };

  // Sync keyboard shortcuts (Escape closes drawers and modals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDrawerOpen(false);
        setIsEditingDetails(false);
        setIsEditingNote(false);
        setLinkModalOpen(false);
        setMoreMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Dark Mode Toggle
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

  // State Simulator helper
  const setSimulationState = (state: 'active' | 'empty' | 'processing') => {
    setSimState(state);
    if (state === 'empty') {
      setDrawerOpen(false);
    }
  };

  // Open Drawer with custom data
  const openDrawer = (
    title: string,
    filename: string,
    content: string,
    options?: {
      documentId?: string;
      category?: string;
      fileSize?: number;
      uploadedAt?: string;
      hospitalType?: string;
      roomCategory?: string;
      preAuth?: string;
      confidenceNote?: string;
      pageNumber?: number;
      sectionTitle?: string;
      whyItMatters?: string;
      isPolicyEvidence?: boolean;
    }
  ) => {
    setDrawerData({
      title,
      filename,
      content,
      documentId: options?.documentId,
      category: options?.category,
      fileSize: options?.fileSize,
      uploadedAt: options?.uploadedAt,
      hospitalType: options?.hospitalType || 'Recognized Tertiary (Apollo)',
      roomCategory: options?.roomCategory || 'Single Private AC (Eligible)',
      preAuth: options?.preAuth || 'Emergency Intimated',
      confidenceNote:
        options?.confidenceNote ||
        'This document is stored in your private, encrypted claim vault.',
      pageNumber: options?.pageNumber,
      sectionTitle: options?.sectionTitle,
      whyItMatters: options?.whyItMatters,
      isPolicyEvidence: options?.isPolicyEvidence,
    });
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
  };

  // Update claim progress deterministically in Supabase
  const updateClaimProgressInDb = async (newDocCount: number) => {
    try {
      const updatedProgress = calculatePreparationProgress(
        claim,
        newDocCount,
        true,
        Boolean(claim.notes)
      );

      const { data } = await supabase
        .from('claims')
        .update({
          preparation_progress: updatedProgress,
          updated_at: new Date().toISOString(),
        })
        .eq('id', claim.id)
        .select()
        .single();

      if (data) {
        setClaim(data as Claim);
      }
    } catch {
      // Non-critical background progress sync
    }
  };

  // File Upload Core Logic with Category Support and Validation
  const uploadFile = async (
    file: File,
    category: ClaimDocumentCategory = selectedCategory || 'discharge_summary',
    customNotes?: string
  ) => {
    setIsUploading(true);
    setActionError(null);
    setSuccessMessage(null);

    // Validate file size (25MB limit)
    const MAX_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setActionError('File size exceeds the 25MB limit. Please upload a smaller file.');
      setIsUploading(false);
      return;
    }

    // Validate supported file types
    const validExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.zip'];
    const lowerName = file.name.toLowerCase();
    const hasValidExt = validExtensions.some((ext) => lowerName.endsWith(ext));
    if (!hasValidExt) {
      setActionError('Unsupported file format. Please upload a PDF, JPG, PNG, WEBP, or ZIP.');
      setIsUploading(false);
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setActionError('Session expired. Please sign in again.');
        setIsUploading(false);
        return;
      }

      // 1. Upload to private Supabase storage
      const storagePath = generateClaimStoragePath(user.id, claim.policy_id, claim.id, file.name);

      const { error: uploadErr } = await supabase.storage
        .from('policy-documents')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || 'application/pdf',
        });

      if (uploadErr) {
        setActionError(`Storage upload failed: ${uploadErr.message}`);
        setIsUploading(false);
        return;
      }

      // 2. Insert into documents table
      const { data: newDoc, error: docErr } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          policy_id: claim.policy_id,
          document_name: file.name,
          document_type: category,
          storage_path: storagePath,
          mime_type: file.type || 'application/pdf',
          file_size: file.size,
          processing_status: 'processed',
          metadata: {
            claim_id: claim.id,
            category: category,
            original_filename: file.name,
            uploaded_at: new Date().toISOString(),
            notes: customNotes || '',
          },
        })
        .select()
        .single();

      if (docErr || !newDoc) {
        setActionError(docErr?.message || 'Failed to record document in vault.');
        setIsUploading(false);
        return;
      }

      // 3. Link into claim_documents
      const noteTag = `[${category}]${customNotes ? ` ${customNotes}` : ''}`;

      const { data: newClaimDoc, error: linkErr } = await supabase
        .from('claim_documents')
        .insert({
          user_id: user.id,
          claim_id: claim.id,
          document_id: newDoc.id,
          notes: noteTag,
        })
        .select('id, user_id, claim_id, document_id, notes, created_at')
        .single();

      if (linkErr || !newClaimDoc) {
        setActionError(linkErr?.message || 'Failed to link document to claim.');
        setIsUploading(false);
        return;
      }

      const completeClaimDoc: ClaimDocument = {
        ...newClaimDoc,
        documents: newDoc as PolicyDocument,
      };

      const updatedDocs = [completeClaimDoc, ...claimDocs];
      setClaimDocs(updatedDocs);

      // Deterministic preparation score update
      const newReadiness = calculateClaimReadiness(updatedDocs);
      await supabase
        .from('claims')
        .update({
          preparation_progress: newReadiness.score,
          updated_at: new Date().toISOString(),
        })
        .eq('id', claim.id);

      setClaim((prev) => ({ ...prev, preparation_progress: newReadiness.score }));
      setSuccessMessage(`"${file.name}" uploaded successfully as ${getCategoryLabel(category)}.`);
      setUploadModalOpen(false);
      setUploadFileObj(null);
      setUploadNotes('');

      openDrawer(
        getCategoryLabel(category),
        newDoc.document_name,
        `Document successfully uploaded and attached to claim dossier.\nCategory: ${getCategoryLabel(
          category
        )}\nFile size: ${formatFileSize(file.size)}.\nStatus: Uploaded and ready for review.`,
        {
          documentId: newDoc.id,
          category: category,
          fileSize: file.size,
          uploadedAt: new Date().toISOString(),
          confidenceNote: 'Uploaded to private Supabase storage and linked to this claim.',
        }
      );

      router.refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to upload document.');
    } finally {
      setIsUploading(false);
      setActiveReqForUpload(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Secure Document Deletion Handler
  const handleConfirmDelete = async () => {
    if (!deleteConfirmDoc) return;
    setIsDeleting(true);
    setActionError(null);

    try {
      const docId = deleteConfirmDoc.document_id;
      const res = await fetch(`/api/documents/${docId}?claim_id=${claim.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to delete document');
      }

      const updatedDocs = claimDocs.filter((d) => d.id !== deleteConfirmDoc.id);
      setClaimDocs(updatedDocs);

      const newReadiness = calculateClaimReadiness(updatedDocs);
      await supabase
        .from('claims')
        .update({
          preparation_progress: newReadiness.score,
          updated_at: new Date().toISOString(),
        })
        .eq('id', claim.id);

      setClaim((prev) => ({ ...prev, preparation_progress: newReadiness.score }));
      setSuccessMessage('Document removed from claim dossier.');
      setDeleteConfirmDoc(null);

      if (drawerData.documentId === docId) {
        setDrawerOpen(false);
      }

      router.refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete document.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      setUploadFileObj(files[0]);
      setUploadModalOpen(true);
    }
  };

  // Handle standard file picker
  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const category = (activeReqForUpload as ClaimDocumentCategory) || selectedCategory || 'discharge_summary';
      await uploadFile(file, category);
    }
  };

  // Link existing document from vault
  const handleLinkExisting = async (reqId?: string) => {
    if (!selectedVaultDocId) return;
    setIsLinking(true);
    setActionError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setActionError('Session expired. Please sign in again.');
        setIsLinking(false);
        return;
      }

      const noteTag = reqId ? `Requirement: [${reqId}]` : 'Claim Attachment';

      const { data: linkedItem, error } = await supabase
        .from('claim_documents')
        .insert({
          user_id: user.id,
          claim_id: claim.id,
          document_id: selectedVaultDocId,
          notes: noteTag,
        })
        .select('id, user_id, claim_id, document_id, notes, created_at')
        .single();

      if (error || !linkedItem) {
        setActionError(error?.message || 'Could not link document.');
        setIsLinking(false);
        return;
      }

      const vaultDoc = allUserDocuments.find((d) => d.id === selectedVaultDocId);
      const completeItem: ClaimDocument = {
        ...linkedItem,
        documents: vaultDoc || null,
      };

      const updated = [completeItem, ...claimDocs];
      setClaimDocs(updated);
      await updateClaimProgressInDb(updated.length);

      setLinkModalOpen(false);
      setSelectedVaultDocId('');
      router.refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Error linking document.');
    } finally {
      setIsLinking(false);
    }
  };

  // Save Claim Details Form
  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setDetailsError(null);

    if (!claimName.trim()) {
      setDetailsError('Claim name cannot be empty.');
      return;
    }

    setIsSavingDetails(true);
    try {
      const expenseVal = estimatedExpense.trim()
        ? parseFloat(estimatedExpense.replace(/,/g, ''))
        : null;

      const updatedProgress = calculatePreparationProgress(
        {
          claim_name: claimName.trim(),
          hospital_name: hospitalName.trim(),
          admission_date: admissionDate || null,
          estimated_expense: expenseVal,
          notes: notes.trim(),
        },
        claimDocs.length,
        true,
        Boolean(notes.trim())
      );

      const { data, error } = await supabase
        .from('claims')
        .update({
          claim_name: claimName.trim(),
          claim_type: claimType,
          insured_member: insuredMember.trim() || null,
          hospital_name: hospitalName.trim() || null,
          admission_date: admissionDate || null,
          discharge_date: dischargeDate || null,
          estimated_expense: isNaN(expenseVal as number) ? null : expenseVal,
          notes: notes.trim() || null,
          preparation_progress: updatedProgress,
          updated_at: new Date().toISOString(),
        })
        .eq('id', claim.id)
        .select()
        .single();

      if (error || !data) {
        setDetailsError(error?.message || 'Failed to update claim details.');
        setIsSavingDetails(false);
        return;
      }

      setClaim(data as Claim);
      setIsEditingDetails(false);
      router.refresh();
    } catch (err) {
      setDetailsError(err instanceof Error ? err.message : 'Error updating claim.');
    } finally {
      setIsSavingDetails(false);
    }
  };

  // Save / Update Note
  const handleSaveNote = async () => {
    try {
      const { data, error } = await supabase
        .from('claims')
        .update({
          notes: noteContent.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', claim.id)
        .select()
        .single();

      if (!error && data) {
        setClaim(data as Claim);
        setIsEditingNote(false);
      }
    } catch {
      // Ignore
    }
  };

  // Delete Note
  const handleDeleteNote = async () => {
    try {
      const { data, error } = await supabase
        .from('claims')
        .update({
          notes: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', claim.id)
        .select()
        .single();

      if (!error && data) {
        setClaim(data as Claim);
        setNoteContent('');
      }
    } catch {
      // Ignore
    }
  };

  // Handle Ask PRISM question
  const askQuestion = (q: string) => {
    setAssistantInput(q);
    submitAssistant(q);
  };

  const submitAssistant = async (queryParam?: string) => {
    const q = (queryParam || assistantInput).trim();
    if (!q || assistantLoading) return;

    setAssistantLoading(true);

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          policy_id: claim.policy_id,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.answer) {
        interface AskCitationPayload {
          page_number?: number;
          section_title?: string;
          excerpt?: string;
          content?: string;
        }
        const citationList = (Array.isArray(data.citations) ? data.citations : []) as AskCitationPayload[];
        const citationText =
          citationList.length > 0
            ? '\n\n---\nPolicy Evidence Citations:\n' +
              citationList
                .map(
                  (c) =>
                    `• Page ${c.page_number || '?'}${c.section_title ? ` (${c.section_title})` : ''}: "${c.excerpt || c.content || ''}"`
                )
                .join('\n\n')
            : '';

        openDrawer(
          'PRISM Grounded Explanation',
          policy?.policy_name || 'Policy Document',
          `${data.answer}${citationText}`,
          {
            isPolicyEvidence: true,
            confidenceNote: data.grounded
              ? `Grounded in Policy with ${data.confidence || 'high'} confidence (${citationList.length} citations).`
              : 'PRISM could not verify sufficient policy evidence for full confidence.',
          }
        );
      } else {
        openDrawer(
          'Policy Analysis',
          policy?.policy_name || 'Uploaded Policy',
          "PRISM could not find sufficient evidence in your uploaded policy to answer this confidently. Please review your policy wording or ask a more specific question regarding your claim.",
          {
            isPolicyEvidence: true,
            confidenceNote: 'Insufficient evidence found in uploaded policy documents.',
          }
        );
      }
    } catch {
      openDrawer(
        'Policy Analysis',
        policy?.policy_name || 'Uploaded Policy',
        "PRISM could not find sufficient evidence in your uploaded policy to answer this confidently. Please review your policy wording or ask a more specific question regarding your claim.",
        {
          isPolicyEvidence: true,
          confidenceNote: 'Could not connect to PRISM retrieval service.',
        }
      );
    } finally {
      setAssistantLoading(false);
      setAssistantInput('');
    }
  };


  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col font-body-md antialiased select-none overflow-x-hidden">
      {/* Hidden File Input for Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept=".pdf,.jpg,.jpeg,.png,.zip"
        className="hidden"
      />

      {/* ========================================================================= */}
      {/* 1. TOP INTERACTIVE STATE SIMULATOR BAR                                     */}
      {/* ========================================================================= */}
      <header className="bg-inverse-surface text-inverse-on-surface px-4 py-2 text-xs flex flex-wrap items-center justify-between z-50 sticky top-0 border-b border-outline-variant/20">
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center gap-1.5 font-semibold text-tertiary-fixed px-2 py-0.5 rounded bg-tertiary-container/40">
            <IconSlidersHorizontal size={14} className="shrink-0" /> STATE SIMULATOR
          </span>
          <span className="text-outline-variant hidden sm:inline">| Switch claim mockup perspectives:</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            className={`px-2.5 py-1 rounded transition text-xs font-medium ${
              simState === 'active'
                ? 'bg-primary-container text-white font-medium hover:opacity-90'
                : 'bg-surface-container-highest/20 text-inverse-on-surface hover:bg-surface-container-highest/30'
            }`}
            onClick={() => setSimulationState('active')}
          >
            1. Active Workspace ({readyDocsCount}/7)
          </button>
          <button
            type="button"
            className={`px-2.5 py-1 rounded transition text-xs font-medium ${
              simState === 'empty'
                ? 'bg-primary-container text-white font-medium hover:opacity-90'
                : 'bg-surface-container-highest/20 text-inverse-on-surface hover:bg-surface-container-highest/30'
            }`}
            onClick={() => setSimulationState('empty')}
          >
            2. Empty State
          </button>
          <button
            type="button"
            className={`px-2.5 py-1 rounded transition text-xs font-medium ${
              simState === 'processing'
                ? 'bg-primary-container text-white font-medium hover:opacity-90'
                : 'bg-surface-container-highest/20 text-inverse-on-surface hover:bg-surface-container-highest/30'
            }`}
            onClick={() => setSimulationState('processing')}
          >
            3. Processing Docs
          </button>
          <button
            type="button"
            className="px-2.5 py-1 rounded bg-surface-container-highest/20 text-inverse-on-surface hover:bg-surface-container-highest/30 transition text-xs flex items-center gap-1"
            onClick={() => setDrawerOpen((prev) => !prev)}
          >
            <span>4. Inspection Drawer</span>
            <IconPanelRightClose size={14} className="shrink-0" />
          </button>
          <button
            type="button"
            className="px-2.5 py-1 rounded bg-surface-container-highest/20 text-inverse-on-surface hover:bg-surface-container-highest/30 transition text-xs flex items-center gap-1"
            onClick={toggleDarkMode}
          >
            {isDarkMode ? (
              <IconSun size={14} className="shrink-0" />
            ) : (
              <IconMoon size={14} className="shrink-0" />
            )}
            <span>{isDarkMode ? 'Light' : 'Dark'}</span>
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. APP BODY: 256px PERSISTENT SIDEBAR + MAIN WORKSPACE CONTAINER           */}
      {/* ========================================================================= */}
      <div className="flex flex-1 w-full min-h-[calc(100vh-40px)]">
        {/* Persistent Left Sidebar (256px) */}
        <aside className="w-64 bg-surface-container-lowest border-r border-outline-variant/30 flex flex-col justify-between shrink-0 hidden md:flex z-30">
          <div className="p-6">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-3 mb-8 hover:opacity-90 transition">
              <div className="w-8 h-8 rounded-xl bg-primary-container flex items-center justify-center text-on-primary shadow-xs">
                <IconShield size={20} className="shrink-0" />
              </div>
              <span className="font-headline-sm text-headline-sm font-bold tracking-tight text-on-surface">
                PRISM
              </span>
            </Link>

            {/* Navigation Cluster */}
            <nav className="space-y-1.5 font-label-md text-label-md">
              <Link
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors"
                href="/dashboard"
              >
                <IconLayoutDashboard size={20} className="text-outline shrink-0" />
                <span>Overview</span>
              </Link>
              <Link
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors"
                href="/policies"
              >
                <IconShieldCheck size={20} className="text-outline shrink-0" />
                <span>My Policies</span>
              </Link>
              <Link
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors"
                href="/add-policy"
              >
                <IconPlusCircle size={20} className="text-outline shrink-0" />
                <span>Add Policy</span>
              </Link>
              <Link
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors"
                href="/ask"
              >
                <IconSparkles size={20} className="text-outline shrink-0" />
                <span>Ask PRISM</span>
              </Link>

              {/* Active Claims Destination */}
              <Link
                className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-primary-fixed/40 text-primary font-semibold border-l-4 border-primary"
                href="/claims"
              >
                <div className="flex items-center gap-3">
                  <IconClipboardCheck size={20} className="text-primary shrink-0" />
                  <span>Claims</span>
                </div>
                <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full font-bold">
                  ACTIVE
                </span>
              </Link>

              <Link
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors"
                href="/documents"
              >
                <IconFolder size={20} className="text-outline shrink-0" />
                <span>Documents</span>
              </Link>
              <Link
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors"
                href="/learn"
              >
                <IconGraduationCap size={20} className="text-outline shrink-0" />
                <span>Learn</span>
              </Link>
              <Link
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors"
                href="/settings"
              >
                <IconSettings size={20} className="text-outline shrink-0" />
                <span>Settings</span>
              </Link>
              <Link
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors"
                href="/help"
              >
                <IconHelpCircle size={20} className="text-outline shrink-0" />
                <span>Help</span>
              </Link>
            </nav>
          </div>

          {/* User Profile Card */}
          <div className="p-4 border-t border-outline-variant/30 bg-surface-container-low/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center font-bold text-on-primary-fixed border border-primary/20">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-title-md text-sm font-semibold truncate text-on-surface">{displayName}</p>
                <p className="font-body-sm text-xs truncate text-on-surface-variant">{displayEmail}</p>
              </div>
              <Link href="/settings" className="text-outline hover:text-on-surface p-1">
                <IconMoreVertical size={18} className="shrink-0" />
              </Link>
            </div>
          </div>
        </aside>

        {/* ========================================================================= */}
        {/* MAIN WORKSPACE CONTAINER                                                  */}
        {/* ========================================================================= */}
        <div className="flex-1 flex flex-col min-w-0 bg-surface">
          {/* Top Bar with Breadcrumbs & Context */}
          <header className="h-16 px-6 lg:px-8 border-b border-outline-variant/30 bg-surface-container-lowest flex items-center justify-between sticky top-10 z-20">
            <div className="flex items-center gap-3 text-sm">
              <Link
                className="text-on-surface-variant hover:text-primary transition flex items-center gap-1 font-medium"
                href="/claims"
              >
                Claims
              </Link>
              <span className="text-outline-variant">/</span>
              <span className="text-on-surface font-semibold">Claim Workspace</span>
              <span className="h-4 w-px bg-outline-variant/40 mx-2"></span>

              {/* Active Policy Pill */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-container-low border border-outline-variant/40 rounded-full text-xs font-medium text-on-surface">
                <span className="w-2 h-2 rounded-full bg-tertiary-container"></span>
                <span>{policy?.policy_name || 'Care Supreme (Zone B Tier)'}</span>
                <span className="text-outline-variant">•</span>
                <span className="text-on-surface-variant text-[11px]">
                  {policy?.insurer_name ? `Insurer: ${policy.insurer_name}` : 'UIN: RHIHLIP21332V012021'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-full relative transition"
                title="Notifications"
              >
                <IconBell size={20} className="shrink-0" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"></span>
              </button>
              <div className="h-5 w-px bg-outline-variant/40"></div>
              <div className="flex items-center gap-2 pl-1 cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center font-bold text-xs">
                  {initials}
                </div>
              </div>
            </div>
          </header>

          {/* Workspace Hero & Flow Stage Header */}
          <section className="bg-surface-container-lowest border-b border-outline-variant/30 px-6 lg:px-8 pt-6 pb-6">
            <div className="max-w-[1400px] mx-auto">
              {/* Top Row: Eyebrow + Actions */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-label-sm text-label-sm font-bold text-primary tracking-wider uppercase">
                      CLAIM WORKSPACE
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-fixed/50 text-on-primary-fixed text-xs font-semibold rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>{' '}
                      {formatClaimStatus(claim.status || 'Preparing')}
                    </span>
                  </div>
                  <h1 className="font-headline-md text-headline-md font-bold text-on-surface tracking-tight">
                    {claim.claim_name}
                  </h1>
                  <p className="text-on-surface-variant text-sm mt-0.5">
                    Preparation in progress for cashless / reimbursement documentation
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <Link
                    href="/claims"
                    className="px-4 py-2.5 rounded-lg border border-outline-variant/60 text-on-surface hover:bg-surface-container font-label-md text-label-md transition active:scale-[0.98] inline-flex items-center justify-center"
                  >
                    Save &amp; exit
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('required-documents');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-5 py-2.5 rounded-lg bg-primary text-white hover:bg-primary/90 font-label-md text-label-md font-semibold shadow-sm hover:shadow transition flex items-center gap-1.5 active:scale-[0.98] group"
                  >
                    <span>Continue preparation</span>
                    <IconArrowRight size={16} className="shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setMoreMenuOpen((prev) => !prev)}
                      className="p-2.5 rounded-lg border border-outline-variant/60 hover:bg-surface-container text-on-surface-variant"
                    >
                      <IconMoreHorizontal size={20} className="shrink-0" />
                    </button>
                    {moreMenuOpen && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-surface-container-lowest rounded-lg shadow-lg border border-outline-variant/40 py-1.5 z-40 text-sm">
                        <button
                          type="button"
                          onClick={() => {
                            setMoreMenuOpen(false);
                            setIsEditingDetails(true);
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-surface-container text-on-surface"
                        >
                          Edit claim details
                        </button>
                        {policy && (
                          <Link
                            href={`/policies/${policy.id}`}
                            className="block px-3 py-1.5 hover:bg-surface-container text-on-surface"
                            onClick={() => setMoreMenuOpen(false)}
                          >
                            View active policy
                          </Link>
                        )}
                        <div className="my-1 border-t border-outline-variant/20"></div>
                        <button
                          type="button"
                          onClick={() => {
                            setMoreMenuOpen(false);
                            router.push('/claims');
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-error-container/40 text-error"
                        >
                          Close workspace
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Metadata Strip */}
              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 py-3 px-4 bg-surface-container-low rounded-xl border border-outline-variant/30 text-xs text-on-surface-variant mb-6">
                <div className="flex items-center gap-1.5">
                  <IconHeartPulse size={16} className="text-primary shrink-0" />
                  <span className="font-medium text-on-surface">{claim.claim_type || 'Health Insurance'}</span>
                </div>
                <span className="text-outline-variant">•</span>
                <div>
                  <span className="text-outline">Policy:</span>{' '}
                  <span className="font-medium text-on-surface">
                    {policy?.policy_name || 'Family Health Plan (Care Supreme)'}
                  </span>
                </div>
                <span className="text-outline-variant">•</span>
                <div>
                  <span className="text-outline">Insured:</span>{' '}
                  <span className="font-medium text-on-surface">
                    {claim.insured_member || 'Bhavya Kumar (Self)'}
                  </span>
                </div>
                <span className="text-outline-variant">•</span>
                <div>
                  <span className="text-outline">Hospital:</span>{' '}
                  <span className="font-medium text-on-surface">
                    {claim.hospital_name || 'Apollo Hospitals, Greams Road'}
                  </span>
                </div>
                <span className="text-outline-variant">•</span>
                <div>
                  <span className="text-outline">Started:</span>{' '}
                  <span className="font-medium text-on-surface">
                    {formatDate(claim.admission_date || claim.created_at, '12 Aug 2026')}
                  </span>
                </div>
              </div>

              {/* 5-Stage Claim Progress Timeline */}
              <div className="relative pt-2">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 relative z-10">
                  {/* 01 Understand */}
                  <button
                    type="button"
                    onClick={() => setActiveStage('understand')}
                    className={`text-left flex items-start gap-3 p-2.5 rounded-lg border transition ${
                      activeStage === 'understand'
                        ? 'border-2 border-primary bg-primary-fixed/20 shadow-sm'
                        : 'border-outline-variant/40 bg-surface-container-low hover:bg-surface-container'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-tertiary text-white flex items-center justify-center shrink-0 text-xs font-bold">
                      ✓
                    </div>
                    <div>
                      <p className="text-xs font-bold text-on-surface leading-tight">01 Understand</p>
                      <p className="text-[11px] text-on-surface-variant truncate">Policy context</p>
                    </div>
                  </button>

                  {/* 02 Documents (Active Stage) */}
                  <button
                    type="button"
                    onClick={() => setActiveStage('documents')}
                    className={`text-left flex items-start gap-3 p-2.5 rounded-lg border-2 relative overflow-hidden transition ${
                      activeStage === 'documents'
                        ? 'border-primary bg-primary-fixed/20 shadow-sm'
                        : 'border-outline-variant/40 bg-surface-container-low hover:bg-surface-container'
                    }`}
                  >
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1b59f8] to-[#6cd5e6]"></div>
                    <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shrink-0 text-xs font-bold">
                      2
                    </div>
                    <div>
                      <p className="text-xs font-bold text-primary leading-tight">02 Documents</p>
                      <p className="text-[11px] text-on-surface font-medium">Collect evidence</p>
                    </div>
                  </button>

                  {/* 03 Review */}
                  <button
                    type="button"
                    onClick={() => setActiveStage('review')}
                    className={`text-left flex items-start gap-3 p-2.5 rounded-lg border transition ${
                      activeStage === 'review'
                        ? 'border-2 border-primary bg-primary-fixed/20 shadow-sm'
                        : 'border-outline-variant/30 bg-surface opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full border border-outline text-outline flex items-center justify-center shrink-0 text-xs font-medium">
                      3
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-on-surface-variant leading-tight">03 Review</p>
                      <p className="text-[11px] text-outline">Completeness check</p>
                    </div>
                  </button>

                  {/* 04 Submit */}
                  <button
                    type="button"
                    onClick={() => setActiveStage('submit')}
                    className={`text-left flex items-start gap-3 p-2.5 rounded-lg border transition ${
                      activeStage === 'submit'
                        ? 'border-2 border-primary bg-primary-fixed/20 shadow-sm'
                        : 'border-outline-variant/30 bg-surface opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full border border-outline text-outline flex items-center justify-center shrink-0 text-xs font-medium">
                      4
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-on-surface-variant leading-tight">04 Submit</p>
                      <p className="text-[11px] text-outline">Insurer channel</p>
                    </div>
                  </button>

                  {/* 05 Track */}
                  <button
                    type="button"
                    onClick={() => setActiveStage('track')}
                    className={`text-left flex items-start gap-3 p-2.5 rounded-lg border transition ${
                      activeStage === 'track'
                        ? 'border-2 border-primary bg-primary-fixed/20 shadow-sm'
                        : 'border-outline-variant/30 bg-surface opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full border border-outline text-outline flex items-center justify-center shrink-0 text-xs font-medium">
                      5
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-on-surface-variant leading-tight">05 Track</p>
                      <p className="text-[11px] text-outline">Status updates</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 3. MAIN WORKSPACE 3-COLUMN-INSPIRED FLOW                                   */}
          {/* ========================================================================= */}
          <main className="flex-1 max-w-[1400px] w-full mx-auto p-6 lg:p-8 flex flex-col lg:flex-row gap-6">
            {/* ----------------------------------------------------------------------- */}
            {/* LEFT SUB-NAVIGATION OUTLINE (240px / lg:w-60)                           */}
            {/* ----------------------------------------------------------------------- */}
            <div className="w-full lg:w-60 shrink-0 space-y-4">
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-4 shadow-sm">
                <h3 className="font-headline-sm text-xs uppercase tracking-wider text-outline font-bold mb-3">
                  Claim Preparation
                </h3>
                <ul className="space-y-1 text-xs">
                  <li>
                    <a
                      className="flex items-center justify-between p-2 rounded-lg text-on-surface-variant hover:bg-surface-container"
                      href="#overview"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-tertiary font-bold text-xs">✓</span>
                        <span>Overview</span>
                      </span>
                      <span className="text-[10px] text-outline">Done</span>
                    </a>
                  </li>
                  <li>
                    <a
                      className="flex items-center justify-between p-2 rounded-lg text-on-surface-variant hover:bg-surface-container"
                      href="#claim-details"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-tertiary font-bold text-xs">✓</span>
                        <span>Claim details</span>
                      </span>
                      <span className="text-[10px] text-outline">Done</span>
                    </a>
                  </li>
                  <li>
                    <a
                      className="flex items-center justify-between p-2 rounded-lg bg-primary-fixed/30 text-primary font-semibold"
                      href="#required-documents"
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                        <span>Required documents</span>
                      </span>
                      <span className="text-[10px] bg-primary-container text-white px-1.5 py-0.5 rounded">
                        {readyDocsCount}/7
                      </span>
                    </a>
                  </li>
                  <li>
                    <a
                      className="flex items-center justify-between p-2 rounded-lg text-on-surface-variant hover:bg-surface-container"
                      href="#policy-coverage"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-tertiary font-bold text-xs">✓</span>
                        <span>Policy coverage</span>
                      </span>
                      <span className="text-[10px] text-outline">Matched</span>
                    </a>
                  </li>
                  <li>
                    <a
                      className="flex items-center justify-between p-2 rounded-lg text-on-surface-variant hover:bg-surface-container"
                      href="#deadlines"
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                        <span>Important dates</span>
                      </span>
                      <span className="text-[10px] text-outline">In progress</span>
                    </a>
                  </li>
                  <li>
                    <a
                      className="flex items-center justify-between p-2 rounded-lg text-on-surface-variant hover:bg-surface-container"
                      href="#notes"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-tertiary font-bold text-xs">✓</span>
                        <span>Private notes</span>
                      </span>
                      <span className="text-[10px] text-outline">1 note</span>
                    </a>
                  </li>
                  <li>
                    <a
                      className="flex items-center justify-between p-2 rounded-lg text-outline hover:bg-surface-container"
                      href="#review"
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full border border-outline"></span>
                        <span>Review &amp; Validate</span>
                      </span>
                      <span className="text-[10px]">Pending</span>
                    </a>
                  </li>
                </ul>
              </div>

              {/* Quick Regulatory Reassurance Card */}
              <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs">
                <div className="flex items-center gap-2 text-primary font-semibold mb-1">
                  <IconShieldCheck size={18} className="shrink-0" />
                  <span>Evidence-Backed</span>
                </div>
                <p className="text-on-surface-variant leading-relaxed">
                  Every requirement is verified against IRDAI guidelines &amp; Care Supreme policy clause wording.
                </p>
              </div>
            </div>

            {/* ----------------------------------------------------------------------- */}
            {/* CENTER WORKSPACE: DOCUMENT PREPARATION ENGINE (Flexible Wide Column)    */}
            {/* ----------------------------------------------------------------------- */}
            <div className="flex-1 space-y-6 min-w-0" id="main-workspace-content">
              {/* Processing State Banner */}
              {simState === 'processing' && (
                <div className="p-4 rounded-xl bg-surface-container-high border border-primary/30 flex items-center gap-4 animate-in fade-in">
                  <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                  <div>
                    <p className="font-title-md text-sm font-semibold text-primary">
                      Processing documents with OCR &amp; Clause Matching...
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      Extracting hospital itemization and checking room rent capping clauses.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Error Banner if any */}
              {actionError && (
                <div className="p-3.5 rounded-xl bg-error-container text-on-error-container text-xs flex items-center justify-between">
                  <span>{actionError}</span>
                  <button type="button" onClick={() => setActionError(null)} className="font-bold">
                    &times;
                  </button>
                </div>
              )}

              {/* Empty State Container */}
              {simState === 'empty' ? (
                <div className="bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-surface-container mx-auto flex items-center justify-center text-primary mb-4">
                    <IconFolderOpen size={32} className="shrink-0" />
                  </div>
                  <h3 className="font-headline-sm text-lg font-bold text-on-surface mb-2">
                    No documents added to this claim yet
                  </h3>
                  <p className="text-sm text-on-surface-variant max-w-md mx-auto mb-6">
                    Upload your hospital discharge summary, bills, or prescriptions to begin evidence validation against
                    your Care Supreme policy.
                  </p>
                  <button
                    type="button"
                    className="px-5 py-2.5 rounded-lg bg-primary text-white font-label-md text-sm font-semibold inline-flex items-center gap-2 hover:bg-primary/90 transition shadow-sm"
                    onClick={() => {
                      setSimulationState('active');
                      fileInputRef.current?.click();
                    }}
                  >
                    <IconUpload size={18} className="shrink-0" />
                    <span>Upload first document</span>
                  </button>
                </div>
              ) : (
                /* Main Document Preparation Workspace (Active State) */
                <div className="space-y-6" id="active-state-view">
                  {/* Section 1: Required Documents Overview & Dropzone */}
                  <div
                    className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-6 shadow-sm"
                    id="required-documents"
                  >
                    {/* Section Header & Preparation Score */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-outline-variant/20">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                            Claim documents
                          </h2>
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-medium">
                            {readiness.uploadedMandatoryCount} of {readiness.totalMandatoryCount} mandatory ready
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant mt-1">
                          Organize and track documents required for your claim dossier. Encrypted in private Supabase Storage.
                        </p>
                      </div>

                      <div className="flex flex-col sm:items-end gap-2 shrink-0">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCategory('discharge_summary');
                              setUploadFileObj(null);
                              setUploadNotes('');
                              setUploadModalOpen(true);
                            }}
                            className="px-3.5 py-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-[0.98] transition"
                          >
                            <IconPlus size={16} />
                            <span>Add Document</span>
                          </button>
                        </div>

                        <div className="text-right">
                          <div className="inline-flex items-center gap-2 text-xs font-bold text-primary">
                            <span>Claim Preparation: {progressPercent}%</span>
                            <IconCheckCircle
                              size={16}
                              className={progressPercent === 100 ? 'text-tertiary shrink-0' : 'text-primary shrink-0'}
                            />
                          </div>
                          {/* Deterministic Progress Bar */}
                          <div className="w-48 h-2 bg-surface-container-highest rounded-full mt-1.5 overflow-hidden">
                            <div
                              className="bg-primary h-full rounded-full transition-all duration-500"
                              style={{ width: `${progressPercent}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 1. UPLOADED DOCUMENTS LIST (Real Supabase Data) */}
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-title-md text-xs uppercase tracking-wider text-outline font-bold flex items-center gap-1.5">
                          <IconCheckCircle size={16} className="text-tertiary shrink-0" />
                          <span>Uploaded Documents ({effectiveDocs.length})</span>
                        </h3>
                        <span className="text-[11px] text-on-surface-variant">
                          Click any document to inspect details or preview
                        </span>
                      </div>

                      {effectiveDocs.length === 0 ? (
                        <div className="p-8 rounded-xl border border-dashed border-outline-variant/60 bg-surface-container-low/20 text-center">
                          <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-outline mx-auto mb-2">
                            <IconFileText size={24} />
                          </div>
                          <p className="text-sm font-semibold text-on-surface">No documents uploaded yet.</p>
                          <p className="text-xs text-on-surface-variant mt-1 max-w-sm mx-auto">
                            Upload your hospital bills, discharge summary, or claim forms to build your claim readiness dossier.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCategory('discharge_summary');
                              setUploadFileObj(null);
                              setUploadNotes('');
                              setUploadModalOpen(true);
                            }}
                            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/90 transition inline-flex items-center gap-1.5"
                          >
                            <IconPlus size={16} />
                            <span>Upload First Document</span>
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {effectiveDocs.map((cd) => {
                            const doc = cd.documents;
                            const categoryKey =
                              (doc?.metadata as { category?: string } | null)?.category ||
                              doc?.document_type ||
                              'other';
                            const categoryLabel = getCategoryLabel(categoryKey);
                            const filename = doc?.document_name || 'Attached Document';
                            const fileSize = doc?.file_size;
                            const uploadDate = doc?.created_at || cd.created_at;
                            const docId = doc?.id || cd.document_id;

                            return (
                              <div
                                key={cd.id}
                                className="p-3.5 rounded-xl border border-outline-variant/40 bg-surface hover:border-primary/40 hover:bg-surface-container-lowest transition group flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                              >
                                <div
                                  className="flex items-center gap-3.5 min-w-0 cursor-pointer flex-1"
                                  onClick={() =>
                                    openDrawer(
                                      categoryLabel,
                                      filename,
                                      cd.notes || 'Document cataloged and attached to claim dossier.',
                                      {
                                        documentId: docId,
                                        category: categoryKey,
                                        fileSize: fileSize,
                                        uploadedAt: uploadDate,
                                        confidenceNote: 'Uploaded to private Supabase storage and linked to claim.',
                                      }
                                    )
                                  }
                                >
                                  <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary shrink-0">
                                    {getCategoryIcon(categoryKey, 20)}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p className="font-title-md text-sm font-semibold text-on-surface truncate">
                                        {categoryLabel}
                                      </p>
                                      <span className="text-[10px] bg-tertiary-fixed/30 text-on-tertiary-fixed-variant px-2 py-0.5 rounded font-medium truncate max-w-[180px]">
                                        {filename}
                                      </span>
                                      <span className="text-[10px] bg-surface-container-highest text-on-surface-variant px-1.5 py-0.5 rounded font-medium">
                                        Uploaded
                                      </span>
                                    </div>
                                    <p className="text-xs text-on-surface-variant truncate mt-0.5">
                                      {formatFileSize(fileSize)} • Uploaded {formatDate(uploadDate)}
                                      {cd.notes ? ` • ${cd.notes}` : ''}
                                    </p>
                                  </div>
                                </div>

                                {/* Action Buttons: View, Download, Delete */}
                                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                  {/* View / Preview in new tab */}
                                  <a
                                    href={`/api/documents/${docId}/download?preview=true&redirect=true`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface-container-low hover:bg-primary hover:text-white text-on-surface transition inline-flex items-center gap-1"
                                    title="Preview file in browser"
                                  >
                                    <IconEye size={14} />
                                    <span>View</span>
                                  </a>

                                  {/* Download */}
                                  <a
                                    href={`/api/documents/${docId}/download?redirect=true`}
                                    className="p-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface transition inline-flex items-center justify-center"
                                    title="Download file"
                                  >
                                    <IconDownload size={15} />
                                  </a>

                                  {/* Delete */}
                                  <button
                                    type="button"
                                    onClick={() => setDeleteConfirmDoc(cd)}
                                    className="p-1.5 rounded-lg text-outline hover:text-error hover:bg-error-container/30 transition inline-flex items-center justify-center"
                                    title="Remove document from claim"
                                  >
                                    <IconTrash2 size={15} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* 2. REQUIRED DOCUMENTS CHECKLIST */}
                    <div className="mt-6 pt-5 border-t border-outline-variant/20">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-title-md text-xs uppercase tracking-wider text-outline font-bold flex items-center gap-1.5">
                          <IconClipboardCheck size={16} className="text-primary shrink-0" />
                          <span>Required Documents Checklist</span>
                        </h3>
                        <span className="text-[11px] text-outline">
                          {readiness.uploadedMandatoryCount} of {readiness.totalMandatoryCount} mandatory uploaded
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {CLAIM_DOCUMENT_CATEGORIES.filter((cat) => cat.isMandatory).map((cat) => {
                          // Check if a document in this category is already uploaded
                          const matchingDoc = claimDocs.find((cd) => {
                            const dType = cd.documents?.document_type?.toLowerCase() || '';
                            const dMetaCat = ((cd.documents?.metadata as { category?: string } | null)?.category || '').toLowerCase();
                            const catId = cat.id.toLowerCase();
                            return (
                              dType === catId ||
                              dMetaCat === catId ||
                              dType.includes(catId) ||
                              dMetaCat.includes(catId) ||
                              (catId === 'hospital_bill' && (dType.includes('bill') || dMetaCat.includes('bill'))) ||
                              (catId === 'discharge_summary' && (dType.includes('discharge') || dMetaCat.includes('discharge'))) ||
                              (catId === 'claim_form' && (dType.includes('claim_form') || dMetaCat.includes('claim_form') || dType.includes('form') || dMetaCat.includes('form'))) ||
                              (catId === 'diagnostic_reports' && (dType.includes('diag') || dMetaCat.includes('diag') || dType.includes('report') || dMetaCat.includes('report')))
                            );
                          });

                          const isUploaded = Boolean(matchingDoc);

                          return (
                            <div
                              key={cat.id}
                              className={`p-3.5 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                isUploaded
                                  ? 'border-outline-variant/30 bg-surface/50'
                                  : 'border-dashed border-outline-variant/80 bg-surface-container-low/30'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div
                                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                                    isUploaded
                                      ? 'bg-tertiary-fixed/30 text-tertiary'
                                      : 'bg-surface-container-highest text-outline'
                                  }`}
                                >
                                  {isUploaded ? <IconCheckCircle size={18} /> : getCategoryIcon(cat.id, 18)}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-title-md text-sm font-semibold text-on-surface">
                                      {cat.label}
                                    </p>
                                    <span
                                      className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                                        isUploaded
                                          ? 'bg-tertiary-fixed/40 text-on-tertiary-fixed-variant'
                                          : 'bg-error-container/70 text-on-error-container'
                                      }`}
                                    >
                                      {isUploaded ? '✓ Uploaded' : '○ Missing (Mandatory)'}
                                    </span>
                                  </div>
                                  <p className="text-xs text-on-surface-variant mt-0.5">
                                    {isUploaded && matchingDoc
                                      ? `Satisfied by: ${matchingDoc.documents?.document_name || 'Attached file'}`
                                      : cat.description}
                                  </p>
                                </div>
                              </div>

                              {!isUploaded ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedCategory(cat.id);
                                    setUploadFileObj(null);
                                    setUploadNotes('');
                                    setUploadModalOpen(true);
                                  }}
                                  className="px-3.5 py-1.5 bg-surface-container-lowest border border-primary text-primary hover:bg-primary hover:text-white rounded-lg text-xs font-semibold transition shrink-0 self-start sm:self-center flex items-center gap-1 active:scale-[0.98]"
                                >
                                  <IconPlus size={16} />
                                  <span>Add document</span>
                                </button>
                              ) : (
                                <span className="text-xs font-semibold text-tertiary shrink-0 self-start sm:self-center flex items-center gap-1">
                                  <IconCheckCircle size={14} /> Ready
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 3. Drag & Drop Upload Zone */}
                    <div className="mt-6 pt-5 border-t border-outline-variant/20">
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => {
                          setSelectedCategory('discharge_summary');
                          setUploadFileObj(null);
                          setUploadNotes('');
                          setUploadModalOpen(true);
                        }}
                        className={`border-2 border-dashed rounded-xl p-6 transition cursor-pointer text-center group ${
                          isDragging
                            ? 'border-primary bg-primary-fixed/20'
                            : 'border-primary/30 bg-surface hover:bg-primary-fixed/10'
                        }`}
                      >
                        <div className="w-12 h-12 rounded-full bg-primary-fixed/40 text-primary flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition">
                          <IconUploadCloud size={24} />
                        </div>
                        <p className="text-sm font-semibold text-on-surface">
                          {isUploading ? (
                            <span>Uploading document...</span>
                          ) : (
                            <>
                              Drag and drop a PDF or image here, or{' '}
                              <span className="text-primary underline">Browse files</span>
                            </>
                          )}
                        </p>
                        <p className="text-xs text-on-surface-variant mt-1">
                          Supports PDF, JPG, PNG, WEBP, ZIP up to 25MB per document. Stored privately and encrypted.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Claim Details & Timeline Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Claim Details (Collapsible Card) */}
                    <div
                      className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-5 shadow-sm"
                      id="claim-details"
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
                        <h3 className="font-headline-sm text-sm font-bold text-on-surface flex items-center gap-2">
                          <IconUser size={18} className="text-primary" />
                          <span>Claim details</span>
                        </h3>
                        <button
                          type="button"
                          onClick={() => setIsEditingDetails(true)}
                          className="text-xs font-semibold text-primary hover:underline"
                        >
                          Edit details
                        </button>
                      </div>
                      <dl className="mt-3 divide-y divide-outline-variant/10 text-xs">
                        <div className="py-2 flex justify-between">
                          <dt className="text-on-surface-variant">Claim type</dt>
                          <dd className="font-semibold text-on-surface">{claim.claim_type || 'Inpatient Hospitalisation'}</dd>
                        </div>
                        <div className="py-2 flex justify-between">
                          <dt className="text-on-surface-variant">Insured person</dt>
                          <dd className="font-semibold text-on-surface">
                            {claim.insured_member || 'Self (Bhavya Kumar)'}
                          </dd>
                        </div>
                        <div className="py-2 flex justify-between">
                          <dt className="text-on-surface-variant">Hospital</dt>
                          <dd className="font-semibold text-on-surface text-right">
                            {claim.hospital_name || 'Apollo Hospitals, Greams Rd, Chennai'}
                          </dd>
                        </div>
                        <div className="py-2 flex justify-between">
                          <dt className="text-on-surface-variant">Admission date</dt>
                          <dd className="font-semibold text-on-surface">
                            {formatDate(claim.admission_date, '12 Aug 2026')}
                          </dd>
                        </div>
                        <div className="py-2 flex justify-between">
                          <dt className="text-on-surface-variant">Discharge date</dt>
                          <dd className="font-semibold text-on-surface">
                            {formatDate(claim.discharge_date, '16 Aug 2026')}
                            {getStayDuration() || ' (4 days stay)'}
                          </dd>
                        </div>
                        <div className="py-2 flex justify-between">
                          <dt className="text-on-surface-variant">Estimated expense</dt>
                          <dd className="font-bold text-primary font-data-tabular">
                            {claim.estimated_expense ? formatCurrency(claim.estimated_expense) : '₹1,84,500'}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    {/* Important Dates & Deadlines */}
                    <div
                      className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-5 shadow-sm"
                      id="deadlines"
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
                        <h3 className="font-headline-sm text-sm font-bold text-on-surface flex items-center gap-2">
                          <IconCalendar size={18} className="text-tertiary" />
                          <span>Important dates &amp; milestones</span>
                        </h3>
                        <span className="text-[11px] text-tertiary font-semibold bg-tertiary-fixed/30 px-2 py-0.5 rounded">
                          Timeline Tracked
                        </span>
                      </div>
                      <div className="mt-4 relative pl-5 border-l-2 border-primary/20 space-y-4 text-xs">
                        <div className="relative">
                          <div className="absolute -left-[25px] top-0 w-3 h-3 rounded-full bg-tertiary"></div>
                          <p className="font-bold text-on-surface">
                            {formatDate(claim.admission_date, '12 Aug 2026')}
                          </p>
                          <p className="text-on-surface-variant">Hospital Admission recorded</p>
                        </div>
                        <div className="relative">
                          <div className="absolute -left-[25px] top-0 w-3 h-3 rounded-full bg-tertiary"></div>
                          <p className="font-bold text-on-surface">
                            {formatDate(claim.discharge_date, '16 Aug 2026')}
                          </p>
                          <p className="text-on-surface-variant">
                            Discharge from {claim.hospital_name || 'Apollo Greams Road'}
                          </p>
                        </div>
                        <div className="relative">
                          <div className="absolute -left-[25px] top-0 w-3 h-3 rounded-full bg-primary ring-4 ring-primary-fixed/40"></div>
                          <p className="font-bold text-primary">{formatDate(new Date().toISOString())} (Today)</p>
                          <p className="text-on-surface-variant">
                            {readyDocsCount} documents organized in PRISM Workspace
                          </p>
                        </div>
                        <div className="relative">
                          <div className="absolute -left-[25px] top-0 w-3 h-3 rounded-full border-2 border-outline bg-surface"></div>
                          <p className="font-semibold text-outline">Upcoming Step</p>
                          <p className="text-on-surface-variant">
                            Complete missing claim form &amp; submit to TPA within 30 days of discharge
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Private Notes Workspace */}
                  <div
                    className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-5 shadow-sm"
                    id="notes"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
                      <div>
                        <h3 className="font-headline-sm text-sm font-bold text-on-surface flex items-center gap-2">
                          <IconFileEdit size={18} className="text-primary" />
                          <span>My private claim notes</span>
                        </h3>
                        <p className="text-xs text-on-surface-variant">
                          Notes are stored locally in your workspace for personal reference.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setNoteContent(claim.notes || '');
                          setIsEditingNote(true);
                        }}
                        className="text-xs font-semibold px-3 py-1 bg-surface-container rounded-lg hover:bg-surface-container-high transition"
                      >
                        + Add note
                      </button>
                    </div>
                    <div className="mt-4 p-3.5 bg-surface-container-low rounded-xl border border-outline-variant/30 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-on-surface leading-relaxed">
                          {claim.notes ||
                            '"Spoke with Apollo TPA insurance desk on 14th Aug; requested original indoor case papers stamped by Dr. R. Sundaram. Waiting for pharmacy breakup receipt from third-floor desk."'}
                        </p>
                        <div className="flex items-center gap-1 shrink-0 text-outline">
                          <button
                            type="button"
                            onClick={() => {
                              setNoteContent(claim.notes || '');
                              setIsEditingNote(true);
                            }}
                            className="hover:text-primary p-1"
                            title="Edit note"
                          >
                            <IconPencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={handleDeleteNote}
                            className="hover:text-error p-1"
                            title="Delete note"
                          >
                            <IconTrash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 text-[11px] text-outline-variant font-medium">
                        Recorded on {formatDate(claim.updated_at || claim.created_at, '14 Aug 2026')}, 04:30 PM
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Relevant Policy Coverage Cards (Evidence-Grounded Policy Evidence Mapping) */}
                  <div
                    className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-6 shadow-sm"
                    id="policy-coverage"
                  >
                    {/* Header */}
                    <div className="pb-4 border-b border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-headline-sm text-sm font-bold text-on-surface">
                            Relevant policy evidence for this claim
                          </h3>
                          {isEvidenceLoading ? (
                            <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded font-bold animate-pulse">
                              ANALYZING POLICY...
                            </span>
                          ) : (
                            <span className="text-[10px] bg-tertiary-fixed/30 text-on-tertiary-fixed-variant px-2 py-0.5 rounded font-bold">
                              {evidenceList.length} CLAUSES IDENTIFIED
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          Clauses retrieved from {policy?.policy_name || 'your uploaded policy'} matched dynamically against your claim context.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => fetchPolicyEvidence(selectedEvidenceTopic)}
                        disabled={isEvidenceLoading}
                        className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant/40 bg-surface hover:bg-surface-container text-xs font-semibold text-on-surface transition disabled:opacity-50"
                      >
                        <IconFileSearch size={14} className="text-primary" />
                        <span>Re-analyze</span>
                      </button>
                    </div>

                    {/* Topic Filter Chips */}
                    <div className="mt-4 mb-2">
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 custom-scrollbar">
                        {CLAIM_EVIDENCE_TOPICS.map((topic) => {
                          const isSelected = selectedEvidenceTopic === topic.id;
                          return (
                            <button
                              key={topic.id}
                              type="button"
                              onClick={() => {
                                setSelectedEvidenceTopic(topic.id);
                                fetchPolicyEvidence(topic.id);
                              }}
                              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 ${
                                isSelected
                                  ? 'bg-primary text-on-primary font-bold shadow-xs'
                                  : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant font-medium border border-outline-variant/30'
                              }`}
                            >
                              <span>{topic.label}</span>
                            </button>
                          );
                        })}
                      </div>
                      {/* Active Topic Description */}
                      <p className="text-[11px] text-outline mt-1.5">
                        {CLAIM_EVIDENCE_TOPICS.find((t) => t.id === selectedEvidenceTopic)?.description}
                      </p>
                    </div>

                    {/* Decision Support Advisory Banner */}
                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-surface-container-low/70 border border-outline-variant/25 text-xs text-on-surface-variant my-3.5">
                      <IconInfo size={16} className="text-primary shrink-0 mt-0.5" />
                      <div className="leading-relaxed">
                        <span className="font-semibold text-on-surface">Decision support: </span>
                        PRISM highlights policy provisions that appear relevant to preparing your claim dossier. PRISM does not make claim approval or rejection decisions. Review these clauses directly against your hospital records before filing.
                      </div>
                    </div>

                    {/* Retrieval Error Alert */}
                    {evidenceError && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-error-container/20 border border-error/30 text-xs text-error my-3">
                        <IconAlertTriangle size={15} className="shrink-0" />
                        <span>{evidenceError}</span>
                      </div>
                    )}

                    {/* Evidence Loading State */}
                    {isEvidenceLoading && (
                      <div className="p-8 rounded-xl border border-outline-variant/30 bg-surface text-center flex flex-col items-center justify-center space-y-3 mt-4">
                        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                        <p className="text-xs font-semibold text-on-surface">Analyzing relevant policy sections...</p>
                        <p className="text-[11px] text-on-surface-variant max-w-sm">
                          Searching {policy?.policy_name || 'your policy'} for clauses relevant to {claim.claim_type || 'hospitalization'}{claim.hospital_name ? ` at ${claim.hospital_name}` : ''}.
                        </p>
                      </div>
                    )}

                    {/* No Evidence State */}
                    {!isEvidenceLoading && evidenceList.length === 0 && (
                      <div className="p-8 rounded-xl border border-dashed border-outline-variant/40 bg-surface-container-low/50 text-center flex flex-col items-center justify-center space-y-2.5 mt-4">
                        <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-outline">
                          <IconFileSearch size={20} />
                        </div>
                        <h4 className="text-sm font-bold text-on-surface">No strong policy evidence found</h4>
                        <p className="text-xs text-on-surface-variant max-w-md">
                          PRISM could not find sufficient evidence in your uploaded policy for this claim context. Review the policy manually or ask a more specific question.
                        </p>
                        <button
                          type="button"
                          onClick={() => askQuestion(`Does my policy cover ${claim.claim_type || 'hospitalization'} expenses?`)}
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 transition shadow-xs"
                        >
                          <IconSparkles size={13} />
                          Ask PRISM about this claim
                        </button>
                      </div>
                    )}

                    {/* Evidence Cards Grid */}
                    {!isEvidenceLoading && evidenceList.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-4">
                        {evidenceList.map((item) => {
                          const isExpanded = expandedEvidenceChunkId === item.chunk_id;
                          const isLong = item.content.length > 200;
                          const displayedText = isLong && !isExpanded ? item.content.slice(0, 200) + '...' : item.content;

                          // Check if associated document category is uploaded in claim docs
                          const hasMatchingDoc = claimDocs.some((d) => {
                            const dCat = d.documents?.document_type?.toLowerCase() || '';
                            const dNotes = d.notes?.toLowerCase() || '';
                            const dName = d.documents?.document_name?.toLowerCase() || '';
                            const catId = item.related_document_category?.toLowerCase() || '';
                            return dCat.includes(catId) || dNotes.includes(catId) || dName.includes(catId);
                          });

                          const relevanceBadge =
                            item.relevance_tier === 'relevant' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                <IconCheckCircle size={10} />
                                Relevant clause
                              </span>
                            ) : item.relevance_tier === 'potentially_relevant' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                <IconInfo size={10} />
                                Potentially relevant
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-500/10 text-slate-700 dark:text-slate-400 border border-slate-500/20">
                                Limited match
                              </span>
                            );

                          return (
                            <div
                              key={item.chunk_id}
                              className="p-4 rounded-xl border border-outline-variant/30 bg-surface hover:bg-surface-container-low/50 transition flex flex-col justify-between shadow-2xs"
                            >
                              <div>
                                {/* Card Top: Title & Relevance */}
                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                  <div>
                                    <span className="text-[10px] font-bold text-tertiary tracking-wide uppercase">
                                      POLICY CLAUSE
                                    </span>
                                    <h4 className="text-xs font-bold text-on-surface leading-snug">
                                      {item.section_title}
                                    </h4>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {relevanceBadge}
                                    <span className="text-[10px] text-outline font-semibold">
                                      {Math.round(item.similarity * 100)}% match
                                    </span>
                                  </div>
                                </div>

                                {/* Citation Metadata */}
                                <div className="flex items-center gap-2 text-[11px] text-outline mb-2.5">
                                  <span className="font-semibold text-primary">Page {item.page_number}</span>
                                  <span>•</span>
                                  <span className="truncate max-w-[200px]">{policy?.policy_name || 'Policy.pdf'}</span>
                                </div>

                                {/* Why This Matters Callout */}
                                <div className="p-2.5 rounded-lg bg-surface-container-low/70 border-l-2 border-primary mb-2.5 text-xs text-on-surface">
                                  <span className="font-bold text-primary block text-[11px] mb-0.5">
                                    Why this matters for your claim:
                                  </span>
                                  <p className="text-xs text-on-surface-variant leading-relaxed">
                                    {item.why_it_matters}
                                  </p>
                                </div>

                                {/* Verbatim Excerpt */}
                                <div className="p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/20 mb-3">
                                  <p className="text-[11px] font-mono leading-relaxed text-on-surface-variant select-text whitespace-pre-wrap">
                                    &ldquo;{displayedText}&rdquo;
                                  </p>
                                  {isLong && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setExpandedEvidenceChunkId(isExpanded ? null : item.chunk_id)
                                      }
                                      className="mt-1.5 text-[10px] font-bold text-primary hover:underline block"
                                    >
                                      {isExpanded ? 'Show less' : 'Read full excerpt →'}
                                    </button>
                                  )}
                                </div>

                                {/* Document -> Evidence Connection */}
                                {item.related_document_category && (
                                  <div className="pt-2 pb-1 border-t border-outline-variant/15 flex items-center justify-between text-[11px]">
                                    <span className="text-outline">Potentially relevant evidence:</span>
                                    {hasMatchingDoc ? (
                                      <span className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                        <IconCheckCircle size={12} />
                                        {getCategoryLabel(item.related_document_category)} (Attached)
                                      </span>
                                    ) : (
                                      <span className="font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                        <IconAlertTriangle size={12} />
                                        {getCategoryLabel(item.related_document_category)} (Missing)
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Card Actions */}
                              <div className="flex items-center justify-between pt-3 mt-2 border-t border-outline-variant/20 text-xs">
                                <button
                                  type="button"
                                  className="text-primary font-semibold hover:underline flex items-center gap-1"
                                  onClick={() =>
                                    openDrawer(
                                      item.section_title,
                                      policy?.policy_name || 'Policy.pdf',
                                      item.content,
                                      {
                                        pageNumber: item.page_number,
                                        sectionTitle: item.section_title,
                                        whyItMatters: item.why_it_matters,
                                        isPolicyEvidence: true,
                                        confidenceNote: `Retrieved with ${Math.round(item.similarity * 100)}% match against ${claim.claim_name}.`,
                                      }
                                    )
                                  }
                                >
                                  <span>View full clause</span>
                                  <IconExternalLink size={12} className="shrink-0" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => askAboutEvidenceClause(item.section_title, item.page_number)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-on-surface-variant hover:text-primary hover:bg-surface-container transition"
                                >
                                  <IconSparkles size={12} className="text-primary" />
                                  Ask PRISM about this
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Section 5: Bottom "Before You Proceed" Readiness Card */}
                  <div className="bg-surface-container-low rounded-2xl border border-outline-variant/30 p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/20">
                      <div>
                        <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                          Before you proceed to submission
                        </h3>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          Summary of claims readiness across your workspace
                        </p>
                      </div>
                      <span className="text-xs font-bold px-3 py-1 bg-surface-container-highest text-primary rounded-full">
                        4 of 5 preparation checks complete
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4 text-xs">
                      <div className="flex items-center gap-2 text-on-surface">
                        <span className="text-tertiary font-bold text-sm">✓</span>
                        <span>Policy document available &amp; validated</span>
                      </div>
                      <div className="flex items-center gap-2 text-on-surface">
                        <span className="text-tertiary font-bold text-sm">✓</span>
                        <span>
                          Relevant policy coverage and limits reviewed{' '}
                          {hasReviewedEvidence && `(${evidenceList.length} clauses mapped)`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-on-surface">
                        <span className="text-tertiary font-bold text-sm">✓</span>
                        <span>Hospital bill &amp; discharge documents organized</span>
                      </div>
                      <div className="flex items-center gap-2 text-on-surface">
                        <span className="text-tertiary font-bold text-sm">✓</span>
                        <span>Claim details &amp; hospital stay dates completed</span>
                      </div>
                      <div className="flex items-center gap-2 text-error font-semibold col-span-1 sm:col-span-2">
                        <IconCircleX size={16} />
                        <span>Missing supporting documents (Claim Form Part A/B &amp; original Prescriptions)</span>
                      </div>
                    </div>

                    {/* CTA Row & Clear Regulatory Disclaimer */}
                    <div className="pt-4 border-t border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-2 max-w-xl">
                        <IconInfo size={18} className="text-outline shrink-0" />
                        <p className="text-[11px] text-on-surface-variant leading-relaxed">
                          <strong>Important notice:</strong> PRISM does not submit or approve claims. Review your
                          information and follow your insurer&apos;s official claim process via Medi Assist TPA or Care
                          Health online portal.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById('required-documents');
                          el?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="px-6 py-3 rounded-lg bg-primary text-white font-label-md text-sm font-semibold hover:bg-primary/90 shadow transition shrink-0 flex items-center justify-center gap-2 active:scale-[0.98]"
                      >
                        <span>Review claim preparation</span>
                        <IconArrowRight size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ----------------------------------------------------------------------- */}
            {/* RIGHT STICKY POLICY EVIDENCE & PRISM ASSISTANCE PANEL (320px / lg:w-80) */}
            {/* ----------------------------------------------------------------------- */}
            <div className="w-full lg:w-80 shrink-0 space-y-6">
              <div className="sticky top-28 space-y-5">
                {/* Policy Evidence Anchor Card */}
                <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-5 shadow-sm">
                  <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
                    <div className="flex items-center gap-2">
                      <span className="text-primary text-base font-bold">◇</span>
                      <h3 className="font-headline-sm text-sm font-bold text-on-surface">Policy evidence</h3>
                    </div>
                    <span className="text-[11px] text-tertiary font-bold bg-tertiary-fixed/30 px-2 py-0.5 rounded">
                      Grounded
                    </span>
                  </div>
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-on-surface">
                      {policy?.policy_name || 'Care Supreme Family Health Plan'}
                    </p>
                    <p className="text-[11px] text-outline font-data-tabular">
                      {policy?.insurer_name ? `Insurer: ${policy.insurer_name}` : 'UIN: RHIHLIP21332V012021'}
                    </p>
                  </div>

                  {/* Quick Source Page Links */}
                  <div className="mt-4 pt-3 border-t border-outline-variant/20">
                    <p className="font-label-sm text-[11px] uppercase tracking-wider text-outline font-bold mb-2">
                      Relevant Sources
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        type="button"
                        className="p-2 rounded-lg bg-surface border border-outline-variant/40 hover:border-primary text-left text-on-surface font-medium transition flex items-center justify-between"
                        onClick={() =>
                          openDrawer(
                            'Hospitalisation Limits',
                            'Policy.pdf',
                            'Page 18, Sec 3.2: Room rent, ICU expenses, surgeon fee caps. Covered up to Sum Insured with Single Private AC room.'
                          )
                        }
                      >
                        <span>Hospitalisation</span>
                        <span className="text-outline-variant text-[10px]">P.18</span>
                      </button>
                      <button
                        type="button"
                        className="p-2 rounded-lg bg-surface border border-outline-variant/40 hover:border-primary text-left text-on-surface font-medium transition flex items-center justify-between"
                        onClick={() =>
                          openDrawer(
                            'Claim Procedure',
                            'Policy.pdf',
                            'Page 43, Sec 8.1: Step by step checklist for reimbursement submission within 30 days of discharge.'
                          )
                        }
                      >
                        <span>Procedure</span>
                        <span className="text-outline-variant text-[10px]">P.43</span>
                      </button>
                      <button
                        type="button"
                        className="p-2 rounded-lg bg-surface border border-outline-variant/40 hover:border-primary text-left text-on-surface font-medium transition flex items-center justify-between"
                        onClick={() =>
                          openDrawer(
                            'Pre-hospitalisation',
                            'Policy.pdf',
                            'Page 21, Sec 3.5: 60 days pre-admission coverage parameters matching doctor clinical referral.'
                          )
                        }
                      >
                        <span>Pre-hosp (60d)</span>
                        <span className="text-outline-variant text-[10px]">P.21</span>
                      </button>
                      <button
                        type="button"
                        className="p-2 rounded-lg bg-surface border border-outline-variant/40 hover:border-primary text-left text-on-surface font-medium transition flex items-center justify-between"
                        onClick={() =>
                          openDrawer(
                            'Post-hospitalisation',
                            'Policy.pdf',
                            'Page 22, Sec 3.5: 180 days post-discharge coverage guidelines for diagnostic tests and pharmacy.'
                          )
                        }
                      >
                        <span>Post-hosp (180d)</span>
                        <span className="text-outline-variant text-[10px]">P.22</span>
                      </button>
                    </div>
                  </div>

                  {/* Verbatim Excerpt Box */}
                  <div className="mt-4 pt-3 border-t border-outline-variant/20">
                    <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 text-xs">
                      <div className="flex items-center justify-between text-[11px] text-outline mb-1.5 font-medium">
                        <span>Verbatim Excerpt</span>
                        <span>Policy.pdf • Page 18</span>
                      </div>
                      <p className="text-on-surface-variant italic leading-relaxed text-[11px]">
                        &ldquo;Eligible hospitalisation expenses are subject to the terms, conditions, exclusions and
                        applicable limits specified in this policy document.&rdquo;
                      </p>
                    </div>
                  </div>
                </div>

                {/* "Ask PRISM" Contextual Assistant */}
                <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-5 shadow-sm">
                  <div className="flex items-center gap-2 pb-3 border-b border-outline-variant/20">
                    <IconBot size={20} className="text-primary" />
                    <div>
                      <h3 className="font-headline-sm text-sm font-bold text-on-surface">Ask PRISM</h3>
                      <p className="text-[11px] text-on-surface-variant">Contextual assistant for this claim</p>
                    </div>
                  </div>

                  {/* Grounding Label */}
                  <div className="my-3 px-2 py-1 rounded bg-surface-container text-[11px] text-on-surface-variant flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    <span className="truncate">
                      Context: {claim.claim_name} • {policy?.policy_name || 'Care Supreme'}
                    </span>
                  </div>

                  {/* Suggested Clickable Chips */}
                  <div className="space-y-1.5 mb-3">
                    <button
                      type="button"
                      className="w-full text-left p-2 rounded-lg bg-surface hover:bg-surface-container text-xs text-on-surface transition flex items-center justify-between group"
                      onClick={() => askQuestion('What documents am I missing for this claim?')}
                    >
                      <span>What documents am I missing?</span>
                      <IconArrowRight size={14} className="text-outline group-hover:text-primary transition" />
                    </button>
                    <button
                      type="button"
                      className="w-full text-left p-2 rounded-lg bg-surface hover:bg-surface-container text-xs text-on-surface transition flex items-center justify-between group"
                      onClick={() => askQuestion('What does my policy say about hospitalisation room rent?')}
                    >
                      <span>What does my policy say about room rent?</span>
                      <IconArrowRight size={14} className="text-outline group-hover:text-primary transition" />
                    </button>
                    <button
                      type="button"
                      className="w-full text-left p-2 rounded-lg bg-surface hover:bg-surface-container text-xs text-on-surface transition flex items-center justify-between group"
                      onClick={() => askQuestion('Where is the claim notification requirement stated?')}
                    >
                      <span>Where is notification requirement?</span>
                      <IconArrowRight size={14} className="text-outline group-hover:text-primary transition" />
                    </button>
                    <button
                      type="button"
                      className="w-full text-left p-2 rounded-lg bg-surface hover:bg-surface-container text-xs text-on-surface transition flex items-center justify-between group"
                      onClick={() => askQuestion('What should I review before submitting to Medi Assist?')}
                    >
                      <span>What to review before submitting?</span>
                      <IconArrowRight size={14} className="text-outline group-hover:text-primary transition" />
                    </button>
                  </div>

                  {/* Assistant Input Box */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      submitAssistant();
                    }}
                    className="relative"
                  >
                    <input
                      className="w-full text-xs rounded-xl border border-outline-variant/60 py-2.5 pl-3 pr-10 focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-surface"
                      placeholder="Ask about this claim..."
                      type="text"
                      value={assistantInput}
                      onChange={(e) => setAssistantInput(e.target.value)}
                      disabled={assistantLoading}
                    />
                    <button
                      type="submit"
                      disabled={assistantLoading || !assistantInput.trim()}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center hover:opacity-90 disabled:opacity-50 transition"
                    >
                      {assistantLoading ? (
                        <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                      ) : (
                        <IconArrowUp size={16} />
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </main>

          {/* ========================================================================= */}
          {/* 4. SHARED COMPONENT: FOOTER                                                */}
          {/* ========================================================================= */}
          <footer className="bg-surface-container-low dark:bg-inverse-surface border-t border-outline-variant/30 dark:border-outline/20 mt-auto">
            <div className="w-full max-w-[1400px] mx-auto px-6 lg:px-12 py-12">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-outline-variant/30">
                <div className="flex items-center gap-3">
                  <span className="font-headline-sm text-headline-sm font-bold text-on-surface dark:text-inverse-on-surface">
                    PRISM
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-semibold">
                    Document Intelligence
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 text-body-sm font-body-sm text-on-surface-variant dark:text-outline-variant">
                  <Link className="hover:text-primary dark:hover:text-primary-fixed transition-colors duration-150" href="/dashboard">
                    Product Overview
                  </Link>
                  <Link className="hover:text-primary dark:hover:text-primary-fixed transition-colors duration-150" href="/learn">
                    How It Works
                  </Link>
                  <Link className="hover:text-primary dark:hover:text-primary-fixed transition-colors duration-150" href="/claims">
                    Claims Readiness
                  </Link>
                  <Link className="hover:text-primary dark:hover:text-primary-fixed transition-colors duration-150" href="/policies">
                    Cashless Network
                  </Link>
                  <Link className="hover:text-primary dark:hover:text-primary-fixed transition-colors duration-150" href="/documents">
                    Document Decoder
                  </Link>
                  <Link className="hover:text-primary dark:hover:text-primary-fixed transition-colors duration-150" href="/settings">
                    Privacy Policy
                  </Link>
                  <Link className="hover:text-primary dark:hover:text-primary-fixed transition-colors duration-150" href="/help">
                    Contact Support
                  </Link>
                </div>
              </div>
              <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-on-surface-variant dark:text-outline-variant">
                <p>
                  © 2025 PRISM Technologies India Pvt Ltd. All rights reserved. IRDAI regulatory compliant document
                  intelligence companion.
                </p>
                <p className="italic text-[11px]">Not an insurance broker, web aggregator, or claim adjudicator.</p>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. SLIDE-OUT DOCUMENT INSPECTION DRAWER (State 4)                         */}
      {/* ========================================================================= */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 transition-opacity"
          onClick={closeDrawer}
        />
      )}

      <aside
        id="inspection-drawer"
        aria-label="Document Inspection"
        className={`fixed inset-y-0 right-0 w-full max-w-md bg-surface-container-lowest border-l border-outline-variant/30 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-5 border-b border-outline-variant/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconEye size={18} className="text-primary" />
            <h3 className="font-headline-sm text-sm font-bold text-on-surface">
              {drawerData.title}
            </h3>
          </div>
          <button
            type="button"
            className="p-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition"
            onClick={closeDrawer}
          >
            <IconX size={18} />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-5 custom-scrollbar">
          {drawerData.isPolicyEvidence ? (
            <>
              <div>
                <span className="text-[11px] font-bold text-tertiary tracking-wide uppercase">
                  POLICY EVIDENCE CLAUSE
                </span>
                <h4 className="font-title-lg text-base font-bold text-on-surface mt-0.5">
                  {drawerData.sectionTitle || drawerData.title}
                </h4>
                <p className="text-xs text-on-surface-variant">
                  {drawerData.filename} • Page {drawerData.pageNumber || 1}
                </p>
              </div>

              {/* Why This Matters */}
              {drawerData.whyItMatters && (
                <div className="p-3.5 rounded-xl bg-surface-container-low border-l-2 border-primary">
                  <p className="text-xs font-bold text-primary mb-1">Why this matters for your claim</p>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {drawerData.whyItMatters}
                  </p>
                </div>
              )}

              {/* Exact Policy Content */}
              <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30">
                <p className="text-xs font-semibold text-on-surface mb-1.5">Retrieved Policy Wording</p>
                <div className="text-xs text-on-surface-variant leading-relaxed whitespace-pre-wrap font-mono select-text bg-surface/60 p-3 rounded-lg border border-outline-variant/20">
                  {drawerData.content}
                </div>
              </div>

              {/* Claim Context Reference */}
              <div>
                <p className="text-xs font-bold text-on-surface uppercase tracking-wider mb-2">Claim Context</p>
                <div className="p-3.5 rounded-xl border border-outline-variant/30 bg-surface space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant">Hospital:</span>
                    <span className="font-semibold text-on-surface">
                      {claim.hospital_name || drawerData.hospitalType || 'Hospitalization'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant">Claim Type:</span>
                    <span className="font-semibold text-tertiary">{claim.claim_type || 'Hospitalization'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant">Estimated Expense:</span>
                    <span className="font-semibold text-on-surface">
                      {claim.estimated_expense ? formatCurrency(claim.estimated_expense) : 'Pending estimation'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Safety & Grounding Disclaimer */}
              <div className="p-4 rounded-xl bg-primary-fixed/20 border border-primary/20 text-xs">
                <p className="font-semibold text-primary mb-1">Grounded Policy Evidence</p>
                <p className="text-on-surface-variant leading-relaxed">
                  {drawerData.confidenceNote ||
                    'Retrieved directly from your uploaded policy document. Informational decision support only — PRISM does not make claim approval decisions.'}
                </p>
              </div>
            </>
          ) : (
            <>
              <div>
                <span className="text-[11px] font-bold text-primary tracking-wide uppercase">DOCUMENT UPLOADED</span>
                <h4 className="font-title-lg text-base font-bold text-on-surface mt-0.5">
                  {drawerData.filename}
                </h4>
                <p className="text-xs text-on-surface-variant">
                  {drawerData.fileSize ? formatFileSize(drawerData.fileSize) : 'Claim Attachment'}
                  {drawerData.uploadedAt ? ` • Uploaded ${formatDate(drawerData.uploadedAt)}` : ''}
                </p>
              </div>

              {/* Document Notes / Metadata */}
              <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30">
                <p className="text-xs font-semibold text-on-surface mb-1">Dossier Notes &amp; Information</p>
                <p className="text-xs text-on-surface-variant leading-relaxed whitespace-pre-wrap">
                  {drawerData.content}
                </p>
              </div>

              {/* Policy Alignment */}
              <div>
                <p className="text-xs font-bold text-on-surface uppercase tracking-wider mb-2">Claim Context</p>
                <div className="p-3.5 rounded-xl border border-outline-variant/30 bg-surface space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant">Hospital:</span>
                    <span className="font-semibold text-on-surface">
                      {claim.hospital_name || drawerData.hospitalType || 'Apollo Hospitals'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant">Claim Type:</span>
                    <span className="font-semibold text-tertiary">{claim.claim_type || 'Hospitalization'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant">Patient:</span>
                    <span className="font-semibold text-on-surface">{claim.insured_member || displayName}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-primary-fixed/20 border border-primary/20 text-xs">
                <p className="font-semibold text-primary mb-1">Storage &amp; Security</p>
                <p className="text-on-surface-variant">
                  {drawerData.confidenceNote ||
                    'This document is encrypted in private Supabase Storage and associated with your claim dossier.'}
                </p>
              </div>
            </>
          )}
        </div>

        <div className="p-4 border-t border-outline-variant/20 bg-surface-container-low flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-surface-container hover:bg-surface-container-high transition text-on-surface"
            onClick={closeDrawer}
          >
            Close Inspector
          </button>
          {drawerData.isPolicyEvidence ? (
            <button
              type="button"
              className="px-3.5 py-2 text-xs font-bold rounded-lg bg-primary text-on-primary hover:bg-primary/90 transition flex items-center gap-1.5 shadow-xs"
              onClick={() => {
                closeDrawer();
                askAboutEvidenceClause(drawerData.sectionTitle || drawerData.title, drawerData.pageNumber || 1);
              }}
            >
              <IconSparkles size={14} />
              <span>Ask PRISM about this</span>
            </button>
          ) : drawerData.documentId && (
            <>
              <a
                href={`/api/documents/${drawerData.documentId}/download?preview=true&redirect=true`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-surface-container-high hover:bg-primary hover:text-white transition text-on-surface flex items-center gap-1.5"
              >
                <IconEye size={14} />
                <span>Preview</span>
              </a>
              <a
                href={`/api/documents/${drawerData.documentId}/download?redirect=true`}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 transition flex items-center gap-1.5 active:scale-[0.98]"
              >
                <IconDownload size={14} />
                <span>Download</span>
              </a>
            </>
          )}
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 6. EDIT CLAIM DETAILS MODAL                                                */}
      {/* ========================================================================= */}
      {isEditingDetails && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-surface-container-lowest border border-outline-variant/40 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20 mb-4">
              <h3 className="text-base font-bold text-on-surface">Edit Claim Information</h3>
              <button
                type="button"
                onClick={() => setIsEditingDetails(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-outline hover:text-on-surface"
              >
                &times;
              </button>
            </div>

            {detailsError && (
              <div className="p-3 mb-3 rounded-xl bg-error-container text-on-error-container text-xs">
                {detailsError}
              </div>
            )}

            <form onSubmit={handleSaveDetails} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-on-surface-variant font-medium mb-1">Claim Name</label>
                <input
                  type="text"
                  value={claimName}
                  onChange={(e) => setClaimName(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl bg-surface border border-outline-variant text-on-surface focus:border-primary outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-on-surface-variant font-medium mb-1">Claim Type</label>
                  <select
                    value={claimType}
                    onChange={(e) => setClaimType(e.target.value as ClaimType)}
                    className="w-full h-9 px-2.5 rounded-xl bg-surface border border-outline-variant text-on-surface focus:border-primary outline-none"
                  >
                    <option value="Hospitalization">Hospitalization</option>
                    <option value="Day Care">Day Care</option>
                    <option value="Pre/Post Hospitalization">Pre/Post Hospitalization</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-on-surface-variant font-medium mb-1">Insured Patient</label>
                  <input
                    type="text"
                    value={insuredMember}
                    onChange={(e) => setInsuredMember(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl bg-surface border border-outline-variant text-on-surface focus:border-primary outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-on-surface-variant font-medium mb-1">Hospital Name</label>
                  <input
                    type="text"
                    value={hospitalName}
                    onChange={(e) => setHospitalName(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl bg-surface border border-outline-variant text-on-surface focus:border-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block text-on-surface-variant font-medium mb-1">Estimated Expense (₹)</label>
                  <input
                    type="text"
                    value={estimatedExpense}
                    onChange={(e) => setEstimatedExpense(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl bg-surface border border-outline-variant text-on-surface focus:border-primary outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-on-surface-variant font-medium mb-1">Admission Date</label>
                  <input
                    type="date"
                    value={admissionDate}
                    onChange={(e) => setAdmissionDate(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl bg-surface border border-outline-variant text-on-surface focus:border-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block text-on-surface-variant font-medium mb-1">Discharge Date</label>
                  <input
                    type="date"
                    value={dischargeDate}
                    onChange={(e) => setDischargeDate(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl bg-surface border border-outline-variant text-on-surface focus:border-primary outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-on-surface-variant font-medium mb-1">Preparation Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 rounded-xl bg-surface border border-outline-variant text-on-surface focus:border-primary outline-none resize-none"
                />
              </div>

              <div className="pt-3 border-t border-outline-variant/20 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingDetails(false)}
                  className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingDetails}
                  className="px-5 py-2 rounded-lg text-white bg-primary hover:bg-primary/90 disabled:opacity-50"
                >
                  {isSavingDetails ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. NOTE MODAL                                                              */}
      {/* ========================================================================= */}
      {isEditingNote && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-surface-container-lowest border border-outline-variant/40 shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20 mb-3">
              <h3 className="text-sm font-bold text-on-surface">Claim Preparation Note</h3>
              <button
                type="button"
                onClick={() => setIsEditingNote(false)}
                className="text-outline hover:text-on-surface"
              >
                &times;
              </button>
            </div>
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              rows={4}
              placeholder="Record notes from your conversation with the hospital TPA desk or insurance agent..."
              className="w-full p-3 rounded-xl bg-surface border border-outline-variant text-xs text-on-surface focus:border-primary outline-none resize-none"
            />
            <div className="pt-3 border-t border-outline-variant/20 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditingNote(false)}
                className="px-3.5 py-1.5 rounded-lg border border-outline-variant text-xs text-on-surface-variant hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNote}
                className="px-4 py-1.5 rounded-lg text-xs text-white bg-primary hover:bg-primary/90"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. LINK VAULT DOCUMENT MODAL                                              */}
      {/* ========================================================================= */}
      {linkModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-surface-container-lowest border border-outline-variant/40 shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20 mb-3">
              <h3 className="text-sm font-bold text-on-surface">Link Document from Vault</h3>
              <button
                type="button"
                onClick={() => setLinkModalOpen(false)}
                className="text-outline hover:text-on-surface"
              >
                &times;
              </button>
            </div>
            <p className="text-xs text-on-surface-variant mb-3">
              Choose an existing document from your PRISM policy vault to associate with this claim.
            </p>
            <select
              value={selectedVaultDocId}
              onChange={(e) => setSelectedVaultDocId(e.target.value)}
              className="w-full h-9 px-3 rounded-xl bg-surface border border-outline-variant text-xs text-on-surface focus:border-primary outline-none mb-4"
            >
              <option value="">-- Choose document from vault --</option>
              {allUserDocuments.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.document_name} ({doc.document_type || 'PDF'})
                </option>
              ))}
            </select>
            <div className="pt-3 border-t border-outline-variant/20 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setLinkModalOpen(false)}
                className="px-3.5 py-1.5 rounded-lg border border-outline-variant text-xs text-on-surface-variant hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedVaultDocId || isLinking}
                onClick={() => handleLinkExisting()}
                className="px-4 py-1.5 rounded-lg text-xs text-white bg-primary hover:bg-primary/90 disabled:opacity-50"
              >
                {isLinking ? 'Linking...' : 'Link to Claim'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. ADD DOCUMENT MODAL (Claim Document Management)                         */}
      {/* ========================================================================= */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-surface-container-lowest border border-outline-variant/40 shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <IconFileText size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-surface">Add Claim Document</h3>
                  <p className="text-xs text-on-surface-variant">
                    Attach and catalog documents to this claim dossier
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isUploading) {
                    setUploadModalOpen(false);
                    setUploadFileObj(null);
                    setUploadNotes('');
                  }
                }}
                disabled={isUploading}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container transition disabled:opacity-50"
              >
                <IconX size={16} />
              </button>
            </div>

            {actionError && (
              <div className="p-3 mb-4 rounded-xl bg-error-container text-on-error-container text-xs flex items-center justify-between">
                <span>{actionError}</span>
                <button type="button" onClick={() => setActionError(null)} className="font-bold text-sm">
                  &times;
                </button>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (uploadFileObj) {
                  uploadFile(uploadFileObj, selectedCategory, uploadNotes);
                }
              }}
              className="space-y-4 text-xs"
            >
              {/* 1. Document Category Selection */}
              <div>
                <label className="block text-on-surface-variant font-medium mb-1.5">
                  Document Type <span className="text-error">*</span>
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as ClaimDocumentCategory)}
                  disabled={isUploading}
                  className="w-full h-10 px-3 rounded-xl bg-surface border border-outline-variant text-on-surface focus:border-primary outline-none transition"
                  required
                >
                  {CLAIM_DOCUMENT_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label} {cat.isMandatory ? '★ Mandatory' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-on-surface-variant mt-1">
                  {CLAIM_DOCUMENT_CATEGORIES.find((c) => c.id === selectedCategory)?.description}
                </p>
              </div>

              {/* 2. File Picker & Drop Target */}
              <div>
                <label className="block text-on-surface-variant font-medium mb-1.5">
                  File Attachment <span className="text-error">*</span>
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition ${
                    uploadFileObj
                      ? 'border-primary/60 bg-primary-fixed/10'
                      : 'border-outline-variant/80 hover:border-primary/50 bg-surface'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-primary-fixed/30 text-primary flex items-center justify-center mx-auto mb-2">
                    <IconUploadCloud size={20} />
                  </div>
                  {uploadFileObj ? (
                    <div>
                      <p className="text-xs font-semibold text-primary truncate max-w-xs mx-auto">
                        {uploadFileObj.name}
                      </p>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">
                        {formatFileSize(uploadFileObj.size)} • Click to change file
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-medium text-on-surface">
                        Click to select document or drag &amp; drop
                      </p>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">
                        PDF, JPG, PNG, WEBP, or ZIP up to 25MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Document Notes / Remarks */}
              <div>
                <label className="block text-on-surface-variant font-medium mb-1.5">
                  Remarks / Notes (Optional)
                </label>
                <input
                  type="text"
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  placeholder="e.g. Interim bill, paid with hospital transaction receipt"
                  disabled={isUploading}
                  className="w-full h-9 px-3 rounded-xl bg-surface border border-outline-variant text-on-surface focus:border-primary outline-none transition"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setUploadModalOpen(false);
                    setUploadFileObj(null);
                    setUploadNotes('');
                  }}
                  disabled={isUploading}
                  className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!uploadFileObj || isUploading}
                  className="px-5 py-2 rounded-lg text-white bg-primary hover:bg-primary/90 disabled:opacity-50 font-semibold transition flex items-center gap-2 active:scale-[0.98]"
                >
                  {isUploading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                      <span>Uploading document...</span>
                    </>
                  ) : (
                    <>
                      <IconPlus size={16} />
                      <span>Upload &amp; Attach</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. SECURE DELETE CONFIRMATION MODAL                                      */}
      {/* ========================================================================= */}
      {deleteConfirmDoc && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-surface-container-lowest border border-outline-variant/40 shadow-2xl p-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-error-container/60 text-error flex items-center justify-center shrink-0">
                <IconTrash2 size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-on-surface">Delete Claim Document</h3>
                <p className="text-xs text-on-surface-variant">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
              Are you sure you want to delete{' '}
              <strong className="text-on-surface">
                {deleteConfirmDoc.documents?.document_name || 'this document'}
              </strong>
              ? It will be permanently removed from private storage and unlinked from this claim dossier.
            </p>

            <div className="pt-3 border-t border-outline-variant/20 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setDeleteConfirmDoc(null)}
                disabled={isDeleting}
                className="px-3.5 py-1.5 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-1.5 rounded-lg text-white bg-error hover:bg-error/90 disabled:opacity-50 font-semibold transition flex items-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <IconTrash2 size={14} />
                    <span>Delete Document</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 11. FLOATING TOAST NOTIFICATION                                           */}
      {/* ========================================================================= */}
      {successMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 text-white shadow-xl border border-slate-700 text-xs animate-in slide-in-from-bottom-3 duration-200">
          <IconCheckCircle size={16} className="text-emerald-400 shrink-0" />
          <span className="font-medium">{successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="ml-2 text-slate-400 hover:text-white transition"
          >
            <IconX size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
