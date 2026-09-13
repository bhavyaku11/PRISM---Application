import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../app/theme.dart';
import '../models/claim_model.dart';
import '../services/claim_service.dart';
import '../widgets/claim_document_checklist.dart';
import '../widgets/claim_evidence_card.dart';
import '../widgets/claim_progress_header.dart';

const List<String> kContextualAskPrompts = [
  'What documents does my policy require for reimbursement claims?',
  'What is the room rent limit and ICU capping for this hospitalization?',
  'Are there waiting periods or specific exclusions applicable to this admission?',
  'What is the notice timeline to intimate the insurer after hospital entry?',
];

class ClaimDetailScreen extends StatefulWidget {
  final String claimId;
  final ClaimService? claimService;
  final ClaimModel? initialClaim;
  final List<ClaimDocumentModel>? initialDocuments;
  final List<PolicyEvidenceItem>? initialEvidence;

  const ClaimDetailScreen({
    super.key,
    required this.claimId,
    this.claimService,
    this.initialClaim,
    this.initialDocuments,
    this.initialEvidence,
  });

  @override
  State<ClaimDetailScreen> createState() => _ClaimDetailScreenState();
}

class _ClaimDetailScreenState extends State<ClaimDetailScreen>
    with SingleTickerProviderStateMixin {
  late final ClaimService _claimService;
  late final TabController _tabController;

  ClaimModel? _claim;
  List<ClaimDocumentModel> _claimDocuments = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _claimService = widget.claimService ?? ClaimService();
    _tabController = TabController(length: 5, vsync: this);

    if (widget.initialClaim != null) {
      _claim = widget.initialClaim;
      _claimDocuments = widget.initialDocuments ?? [];
      _isLoading = false;
    } else {
      _loadClaimData();
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadClaimData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final claim = await _claimService.getClaimById(widget.claimId);
      if (!mounted) return;

      if (claim == null) {
        setState(() {
          _isLoading = false;
          _errorMessage = 'Claim workspace not found or you do not have permission.';
        });
        return;
      }

      final docs = await _claimService.getClaimDocuments(claim.id);
      if (!mounted) return;

      setState(() {
        _claim = claim;
        _claimDocuments = docs;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _errorMessage = 'Error loading claim workspace. Please try again.';
      });
    }
  }

  Color _getStatusColor(String status, bool isDark) {
    switch (status.toLowerCase()) {
      case 'review':
        return isDark ? const Color(0xFF38BDF8) : const Color(0xFF0284C7);
      case 'submitted':
        return isDark ? const Color(0xFF818CF8) : const Color(0xFF4F46E5);
      case 'closed':
        return isDark ? const Color(0xFF34D399) : const Color(0xFF059669);
      case 'archived':
        return isDark ? Colors.white38 : Colors.black45;
      case 'preparing':
      default:
        return isDark ? const Color(0xFFFBBF24) : const Color(0xFFD97706);
    }
  }

  Color _getStatusBg(String status, bool isDark) {
    switch (status.toLowerCase()) {
      case 'review':
        return isDark ? const Color(0xFF082F49) : const Color(0xFFF0F9FF);
      case 'submitted':
        return isDark ? const Color(0xFF1E1B4B) : const Color(0xFFEEF2FF);
      case 'closed':
        return isDark ? const Color(0xFF064E3B) : const Color(0xFFECFDF5);
      case 'archived':
        return isDark ? Colors.white10 : const Color(0xFFF1F5F9);
      case 'preparing':
      default:
        return isDark ? const Color(0xFF451A03) : const Color(0xFFFFFBEB);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (_isLoading) {
      return Scaffold(
        backgroundColor:
            isDark ? PrismTheme.backgroundDark : PrismTheme.backgroundLight,
        appBar: AppBar(title: const Text('Claim Workspace')),
        body: const Center(
          child: CircularProgressIndicator(
            valueColor: AlwaysStoppedAnimation<Color>(PrismTheme.primaryBlue),
          ),
        ),
      );
    }

    if (_errorMessage != null || _claim == null) {
      return Scaffold(
        backgroundColor:
            isDark ? PrismTheme.backgroundDark : PrismTheme.backgroundLight,
        appBar: AppBar(title: const Text('Claim Workspace')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF451A03) : const Color(0xFFFEF3C7),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.warning_amber_rounded,
                    size: 40,
                    color: Color(0xFFD97706),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  _errorMessage ?? 'Claim Workspace Not Found',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: isDark ? Colors.white : PrismTheme.textPrimary,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  'We could not locate this claim workspace, or you do not have permission to view it.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 12.5,
                    color: isDark ? PrismTheme.textSecondaryDark : PrismTheme.textSecondary,
                  ),
                ),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: () => context.pop(),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: PrismTheme.primaryBlue,
                    foregroundColor: Colors.white,
                  ),
                  child: const Text('Return to Claims Center'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final claim = _claim!;
    final readiness = calculateClaimReadiness(_claimDocuments);
    final statusColor = _getStatusColor(claim.status, isDark);
    final statusBg = _getStatusBg(claim.status, isDark);

    return Scaffold(
      backgroundColor:
          isDark ? PrismTheme.backgroundDark : PrismTheme.backgroundLight,
      appBar: AppBar(
        title: FittedBox(
          fit: BoxFit.scaleDown,
          alignment: Alignment.centerLeft,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                claim.claimName,
                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              if (claim.policy != null)
                Text(
                  claim.policy!.policyName,
                  style: const TextStyle(fontSize: 11, color: PrismTheme.textSecondary),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
            ],
          ),
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 14),
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: statusBg,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: statusColor.withValues(alpha: 0.4)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 5,
                  height: 5,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: statusColor,
                  ),
                ),
                const SizedBox(width: 5),
                Text(
                  formatClaimStatus(claim.status),
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: statusColor,
                  ),
                ),
              ],
            ),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          labelColor: PrismTheme.primaryBlue,
          unselectedLabelColor: isDark ? Colors.white60 : PrismTheme.textSecondary,
          indicatorColor: PrismTheme.primaryBlue,
          labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
          unselectedLabelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
          tabs: const [
            Tab(text: '1. Understand'),
            Tab(text: '2. Documents'),
            Tab(text: '3. Policy Evidence'),
            Tab(text: '4. Prepare / Review'),
            Tab(text: '5. Tracking'),
          ],
        ),
      ),
      body: SafeArea(
        child: TabBarView(
          controller: _tabController,
          children: [
            // TAB 1: UNDERSTAND / CORE DETAILS
            _buildUnderstandTab(claim, readiness, isDark),

            // TAB 2: REQUIRED & ATTACHED DOCUMENTS
            _buildDocumentsTab(claim, isDark),

            // TAB 3: POLICY EVIDENCE MAPPING
            _buildEvidenceTab(claim, isDark),

            // TAB 4: PREPARE & REVIEW
            _buildReviewTab(claim, readiness, isDark),

            // TAB 5: TRACKING GUIDANCE
            _buildTrackingTab(isDark),
          ],
        ),
      ),
    );
  }

  // ===========================================================================
  // TAB 1: UNDERSTAND / OVERVIEW
  // ===========================================================================
  Widget _buildUnderstandTab(ClaimModel claim, ClaimReadiness readiness, bool isDark) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Progress Header
        ClaimProgressHeader(
          claim: claim,
          attachedDocumentsCount: _claimDocuments.length,
          readiness: readiness,
        ),
        const SizedBox(height: 16),

        // Claim Details Card
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: isDark ? PrismTheme.navySurface : Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: isDark ? PrismTheme.navyBorder : const Color(0xFFE2E8F0),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      'CLAIM SUMMARY',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.8,
                        color: isDark ? PrismTheme.textSecondaryDark : PrismTheme.textSecondary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF1E293B) : const Color(0xFFEFF6FF),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      claim.claimType.toUpperCase(),
                      style: const TextStyle(
                        fontSize: 9.5,
                        fontWeight: FontWeight.bold,
                        color: PrismTheme.primaryBlue,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),

              _buildInfoRow('Insured Patient', claim.insuredMember ?? 'Not specified', isDark),
              _buildInfoRow('Hospital / Clinic', claim.hospitalName ?? 'Not specified', isDark),
              _buildInfoRow('Admission Date', claim.formattedAdmissionDate, isDark),
              _buildInfoRow('Discharge Date', claim.formattedDischargeDate, isDark),
              _buildInfoRow('Estimated Expense', claim.formattedExpense, isDark),
              if (claim.policy != null)
                _buildInfoRow(
                  'Associated Policy',
                  '${claim.policy!.policyName}${claim.policy!.insurerName != null ? " (${claim.policy!.insurerName})" : ""}',
                  isDark,
                ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Preparation Notes Card
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: isDark ? PrismTheme.navySurface : Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: isDark ? PrismTheme.navyBorder : const Color(0xFFE2E8F0),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'PREPARATION NOTES & CHECKLIST',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.8,
                  color: isDark ? PrismTheme.textSecondaryDark : PrismTheme.textSecondary,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                claim.notes != null && claim.notes!.trim().isNotEmpty
                    ? claim.notes!
                    : 'No preparation notes added yet. Add doctor reminders, queries, or pharmacy receipts.',
                style: TextStyle(
                  fontSize: 12.5,
                  height: 1.45,
                  color: isDark ? Colors.white70 : PrismTheme.textPrimary,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Contextual Ask PRISM card
        _buildContextualAskCard(claim, isDark),
      ],
    );
  }

  // ===========================================================================
  // TAB 2: DOCUMENTS
  // ===========================================================================
  Widget _buildDocumentsTab(ClaimModel claim, bool isDark) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        ClaimDocumentChecklist(
          claim: claim,
          claimDocuments: _claimDocuments,
          claimService: _claimService,
          onDocumentsChanged: _loadClaimData,
        ),
        const SizedBox(height: 16),
        _buildContextualAskCard(claim, isDark),
      ],
    );
  }

  // ===========================================================================
  // TAB 3: POLICY EVIDENCE
  // ===========================================================================
  Widget _buildEvidenceTab(ClaimModel claim, bool isDark) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        ClaimEvidenceCard(
          claim: claim,
          initialEvidence: widget.initialEvidence,
          claimService: _claimService,
        ),
        const SizedBox(height: 16),
        _buildContextualAskCard(claim, isDark),
      ],
    );
  }

  // ===========================================================================
  // TAB 4: PREPARE & REVIEW
  // ===========================================================================
  Widget _buildReviewTab(ClaimModel claim, ClaimReadiness readiness, bool isDark) {
    final allMandatoryReady =
        readiness.uploadedMandatoryCount == readiness.totalMandatoryCount;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Readiness summary banner
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: isDark ? PrismTheme.navySurface : Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: isDark ? PrismTheme.navyBorder : const Color(0xFFE2E8F0),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: allMandatoryReady
                          ? (isDark ? const Color(0xFF064E3B) : const Color(0xFFECFDF5))
                          : (isDark ? const Color(0xFF451A03) : const Color(0xFFFFFBEB)),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      allMandatoryReady ? Icons.check : Icons.warning_amber_rounded,
                      size: 20,
                      color: allMandatoryReady
                          ? const Color(0xFF10B981)
                          : const Color(0xFFF59E0B),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          allMandatoryReady
                              ? 'Claim Package Ready for Review'
                              : 'Documentation Incomplete',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: isDark ? Colors.white : PrismTheme.textPrimary,
                          ),
                        ),
                        Text(
                          '${readiness.uploadedMandatoryCount} of ${readiness.totalMandatoryCount} mandatory documents attached.',
                          style: TextStyle(
                            fontSize: 12,
                            color: isDark ? PrismTheme.textSecondaryDark : PrismTheme.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              const Divider(height: 1),
              const SizedBox(height: 14),

              Text(
                'SUBMISSION CHECKLIST',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.8,
                  color: isDark ? PrismTheme.textSecondaryDark : PrismTheme.textSecondary,
                ),
              ),
              const SizedBox(height: 10),

              _buildChecklistItem(
                title: 'Core details completed',
                isDone: claim.claimName.isNotEmpty && claim.hospitalName != null,
                isDark: isDark,
              ),
              _buildChecklistItem(
                title: 'Mandatory clinical and billing documents attached',
                isDone: allMandatoryReady,
                isDark: isDark,
              ),
              _buildChecklistItem(
                title: 'Policy clauses & sub-limits reviewed',
                isDone: true,
                isDark: isDark,
              ),
              _buildChecklistItem(
                title: 'Preparation notes updated',
                isDone: claim.notes != null && claim.notes!.isNotEmpty,
                isDark: isDark,
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Non-insurer submission disclaimer
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1E293B) : const Color(0xFFEFF6FF),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isDark ? PrismTheme.navyBorder : const Color(0xFFDBEAFE),
            ),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.info_outline, size: 18, color: PrismTheme.primaryBlue),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'PRISM Preparation Notice',
                      style: TextStyle(
                        fontSize: 12.5,
                        fontWeight: FontWeight.bold,
                        color: isDark ? Colors.white : PrismTheme.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      'PRISM organizes your claim package for personal preparation and verification. PRISM is not an insurance company and does not directly file claims to insurers or guarantee reimbursement outcomes.',
                      style: TextStyle(
                        fontSize: 11.5,
                        height: 1.4,
                        color: isDark ? Colors.white70 : const Color(0xFF334155),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Action CTA
        ElevatedButton.icon(
          onPressed: () {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text(
                  'Your claim package is prepared. Present your documents to the hospital TPA desk or insurer portal.',
                ),
                behavior: SnackBarBehavior.floating,
              ),
            );
          },
          icon: const Icon(Icons.check_circle_outline, size: 18),
          label: const Text('Claim Package Prepared'),
          style: ElevatedButton.styleFrom(
            backgroundColor: allMandatoryReady ? const Color(0xFF10B981) : PrismTheme.primaryBlue,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 14),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
          ),
        ),
        const SizedBox(height: 16),
        _buildContextualAskCard(claim, isDark),
      ],
    );
  }

  // ===========================================================================
  // TAB 5: TRACKING
  // ===========================================================================
  Widget _buildTrackingTab(bool isDark) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Container(
          padding: const EdgeInsets.all(22),
          decoration: BoxDecoration(
            color: isDark ? PrismTheme.navySurface : Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: isDark ? PrismTheme.navyBorder : const Color(0xFFE2E8F0),
            ),
          ),
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1E293B) : const Color(0xFFEFF6FF),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.track_changes_outlined,
                  size: 36,
                  color: PrismTheme.primaryBlue,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Submission & Tracking Guidance',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: isDark ? Colors.white : PrismTheme.textPrimary,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'PRISM assists in organizing documentation prior to filing. Insurer claim tracking updates are not received directly inside PRISM at this time.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 12.5,
                  height: 1.45,
                  color: isDark ? PrismTheme.textSecondaryDark : PrismTheme.textSecondary,
                ),
              ),
              const SizedBox(height: 20),
              const Divider(height: 1),
              const SizedBox(height: 16),

              _buildGuidanceStep('1', 'Present your pre-auth or cashless card at the hospital TPA desk.', isDark),
              const SizedBox(height: 12),
              _buildGuidanceStep('2', 'Collect original discharge summary, tax invoice, and lab reports upon discharge.', isDark),
              const SizedBox(height: 12),
              _buildGuidanceStep('3', 'For reimbursement, upload all signed claim forms within the insurer notice window.', isDark),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildGuidanceStep(String number, String text, bool isDark) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 22,
          height: 22,
          decoration: BoxDecoration(
            color: PrismTheme.primaryBlue.withValues(alpha: 0.15),
            shape: BoxShape.circle,
          ),
          child: Center(
            child: Text(
              number,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: PrismTheme.primaryBlue,
              ),
            ),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            text,
            style: TextStyle(
              fontSize: 12,
              height: 1.4,
              color: isDark ? Colors.white70 : PrismTheme.textPrimary,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildInfoRow(String label, String value, bool isDark) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            flex: 2,
            child: Text(
              label,
              style: TextStyle(
                fontSize: 12,
                color: isDark ? PrismTheme.textSecondaryDark : PrismTheme.textSecondary,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            flex: 3,
            child: Text(
              value,
              style: TextStyle(
                fontSize: 12.5,
                fontWeight: FontWeight.w600,
                color: isDark ? Colors.white : PrismTheme.textPrimary,
              ),
              textAlign: TextAlign.end,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildChecklistItem({
    required String title,
    required bool isDone,
    required bool isDark,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Icon(
            isDone ? Icons.check_circle : Icons.radio_button_unchecked,
            size: 16,
            color: isDone ? const Color(0xFF10B981) : Colors.grey,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              title,
              style: TextStyle(
                fontSize: 12,
                color: isDark ? Colors.white70 : PrismTheme.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContextualAskCard(ClaimModel claim, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF162032) : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isDark ? PrismTheme.navyBorder : const Color(0xFFE2E8F0),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(5),
                decoration: BoxDecoration(
                  color: PrismTheme.primaryBlue,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text('✦', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Ask PRISM About This Claim',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: isDark ? Colors.white : PrismTheme.textPrimary,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            'Ask specific questions regarding coverage, room rent limits, or timelines for this hospitalization.',
            style: TextStyle(
              fontSize: 11.5,
              color: isDark ? PrismTheme.textSecondaryDark : PrismTheme.textSecondary,
            ),
          ),
          const SizedBox(height: 12),
          ...kContextualAskPrompts.map((prompt) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: InkWell(
                onTap: () {
                  final encoded = Uri.encodeComponent(prompt);
                  context.push('/ask?policy_id=${claim.policyId}&q=$encoded');
                },
                borderRadius: BorderRadius.circular(10),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: isDark ? PrismTheme.navySurface : const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: isDark ? PrismTheme.navyBorder : const Color(0xFFE2E8F0),
                    ),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          prompt,
                          style: TextStyle(
                            fontSize: 11.5,
                            color: isDark ? Colors.white70 : PrismTheme.textPrimary,
                          ),
                        ),
                      ),
                      const SizedBox(width: 6),
                      const Icon(Icons.arrow_forward, size: 12, color: PrismTheme.primaryBlue),
                    ],
                  ),
                ),
              ),
            );
          }),
        ],
      ),
    );
  }
}
