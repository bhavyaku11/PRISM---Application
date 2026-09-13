import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../app/theme.dart';
import '../models/policy_model.dart';
import '../models/policy_section_model.dart';
import '../services/policy_service.dart';

class PolicyDetailScreen extends StatefulWidget {
  final String policyId;
  final PolicyService? policyService;
  final PolicyModel? initialPolicy;
  final List<PolicySectionModel>? initialSections;

  const PolicyDetailScreen({
    super.key,
    required this.policyId,
    this.policyService,
    this.initialPolicy,
    this.initialSections,
  });

  @override
  State<PolicyDetailScreen> createState() => _PolicyDetailScreenState();
}

class _PolicyDetailScreenState extends State<PolicyDetailScreen> {
  late final PolicyService _policyService;
  PolicyModel? _policy;
  List<PolicySectionModel> _sections = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _policyService = widget.policyService ?? PolicyService();
    if (widget.initialPolicy != null) {
      _policy = widget.initialPolicy;
      _sections = widget.initialSections ?? [];
      _isLoading = false;
    } else {
      _fetchPolicyData();
    }
  }

  Future<void> _fetchPolicyData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final policy = await _policyService.getPolicyById(widget.policyId);
      if (policy == null) {
        if (mounted) {
          setState(() {
            _policy = null;
            _isLoading = false;
            _errorMessage =
                'Policy not found or you do not have permission to view it.';
          });
        }
        return;
      }

      final sections = await _policyService.getPolicySections(widget.policyId);
      if (mounted) {
        setState(() {
          _policy = policy;
          _sections = sections;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = e.toString().replaceFirst('Exception: ', '');
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgColor = isDark ? PrismTheme.navyDark : PrismTheme.backgroundLight;

    return Scaffold(
      backgroundColor: bgColor,
      appBar: AppBar(
        title: Text(
          _policy?.policyName ?? 'Policy Details',
          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 17),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          tooltip: 'Back',
          onPressed: () {
            if (Navigator.of(context).canPop()) {
              Navigator.of(context).pop();
            } else {
              context.go('/policies');
            }
          },
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh Policy',
            onPressed: _isLoading ? null : _fetchPolicyData,
          ),
        ],
      ),
      body: _buildBody(isDark),
    );
  }

  Widget _buildBody(bool isDark) {
    if (_isLoading) {
      return _buildLoadingSkeleton(isDark);
    }

    if (_errorMessage != null || _policy == null) {
      return _buildErrorState(isDark);
    }

    final policy = _policy!;

    return RefreshIndicator(
      color: PrismTheme.primaryBlue,
      onRefresh: _fetchPolicyData,
      child: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
        children: [
          // 1. Header Card (Policy Name, Insurer, Status, Policy Number)
          _buildHeaderCard(policy, isDark),
          const SizedBox(height: 16),

          // 2. State-specific Banner if Processing or Failed
          if (policy.isProcessing) ...[
            _buildProcessingBanner(isDark),
            const SizedBox(height: 16),
          ] else if (policy.isFailed) ...[
            _buildFailedBanner(isDark),
            const SizedBox(height: 16),
          ],

          // 3. Policy Summary (Core fields)
          _buildSummaryCard(policy, isDark),
          const SizedBox(height: 16),

          // 4. Policy Insights (Only if processed, using neutral tags INFO, ATTENTION, IMPORTANT)
          if (policy.isProcessed) ...[
            _buildInsightsSection(policy, isDark),
            const SizedBox(height: 16),
          ],

          // 5. Ask PRISM Entry Point CTA
          _buildAskPrismCta(policy, isDark),
          const SizedBox(height: 20),

          // 6. Extracted Sections (Coverage, Waiting Periods, Exclusions, Limits)
          if (policy.isProcessed) ...[
            _buildCoverageSection(isDark),
            const SizedBox(height: 16),
            _buildWaitingPeriodsSection(isDark),
            const SizedBox(height: 16),
            _buildExclusionsSection(isDark),
            const SizedBox(height: 16),
            _buildLimitsSection(isDark),
            const SizedBox(height: 24),
          ] else if (policy.isProcessing) ...[
            _buildProcessingPlaceholder(isDark),
            const SizedBox(height: 24),
          ],
        ],
      ),
    );
  }

  // ===========================================================================
  // 1. HEADER CARD
  // ===========================================================================
  Widget _buildHeaderCard(PolicyModel policy, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? PrismTheme.navySurface : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? PrismTheme.navyBorder : PrismTheme.borderSubtle,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.25 : 0.04),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: PrismTheme.primaryBlue.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.shield_outlined,
                  color: PrismTheme.primaryBlue,
                  size: 24,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (policy.insurerName != null &&
                        policy.insurerName!.isNotEmpty)
                      Text(
                        policy.insurerName!.toUpperCase(),
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: PrismTheme.primaryBlue,
                          letterSpacing: 0.6,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    const SizedBox(height: 2),
                    Text(
                      policy.policyName,
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: isDark ? Colors.white : PrismTheme.textPrimary,
                        height: 1.25,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              _buildStatusBadge(policy),
              if (policy.policyType != null && policy.policyType!.isNotEmpty)
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: isDark ? Colors.white10 : const Color(0xFFEBF1FF),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: isDark ? Colors.white24 : const Color(0xFFC7D9FE),
                    ),
                  ),
                  child: Text(
                    policy.policyType!,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: isDark ? Colors.white70 : const Color(0xFF1D4ED8),
                    ),
                  ),
                ),
              if (policy.policyNumber != null &&
                  policy.policyNumber!.isNotEmpty)
                Text(
                  'No. ${policy.policyNumber}',
                  style: TextStyle(
                    fontSize: 12,
                    color: isDark ? Colors.white60 : PrismTheme.textSecondary,
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(PolicyModel policy) {
    Color bg;
    Color fg;
    Color border;
    IconData icon;

    if (policy.isProcessed) {
      bg = const Color(0xFFECFDF5);
      fg = const Color(0xFF059669);
      border = const Color(0xFFA7F3D0);
      icon = Icons.check_circle_outline;
    } else if (policy.isProcessing) {
      bg = const Color(0xFFEFF6FF);
      fg = const Color(0xFF2563EB);
      border = const Color(0xFFBFDBFE);
      icon = Icons.hourglass_top_rounded;
    } else if (policy.isFailed) {
      bg = const Color(0xFFFEF2F2);
      fg = const Color(0xFFDC2626);
      border = const Color(0xFFFECACA);
      icon = Icons.error_outline;
    } else {
      bg = const Color(0xFFF9FAFB);
      fg = const Color(0xFF4B5563);
      border = const Color(0xFFE5E7EB);
      icon = Icons.schedule;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: fg),
          const SizedBox(width: 5),
          Text(
            policy.statusBadgeLabel,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: fg,
            ),
          ),
        ],
      ),
    );
  }

  // ===========================================================================
  // 2. PROCESSING & FAILED BANNERS
  // ===========================================================================
  Widget _buildProcessingBanner(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF132238) : const Color(0xFFEFF6FF),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? const Color(0xFF1E3A5F) : const Color(0xFFBFDBFE),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(
            width: 22,
            height: 22,
            child: CircularProgressIndicator(
              strokeWidth: 2.5,
              color: PrismTheme.primaryBlue,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Your policy is being analyzed',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: PrismTheme.primaryBlue,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'PRISM is extracting clauses, waiting periods, limits, and coverage from your policy document. You will be able to explore detailed coverage and policy evidence once processing is complete.',
                  style: TextStyle(
                    fontSize: 13,
                    color: isDark ? Colors.white70 : const Color(0xFF1E3A8A),
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFailedBanner(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF2A1515) : const Color(0xFFFEF2F2),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? const Color(0xFF5F1E1E) : const Color(0xFFFECACA),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.error_outline, color: Color(0xFFDC2626), size: 24),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  "We couldn't finish processing this policy",
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFFDC2626),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Document processing encountered an issue or requires manual attention. Basic policy details recorded above remain available.',
                  style: TextStyle(
                    fontSize: 13,
                    color: isDark ? Colors.white70 : const Color(0xFF991B1B),
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ===========================================================================
  // 3. SUMMARY CARD
  // ===========================================================================
  Widget _buildSummaryCard(PolicyModel policy, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: isDark ? PrismTheme.navySurface : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? PrismTheme.navyBorder : PrismTheme.borderSubtle,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'POLICY SUMMARY',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.8,
              color: isDark ? Colors.white54 : PrismTheme.textSecondary,
            ),
          ),
          const SizedBox(height: 14),
          _buildSummaryRow(
            icon: Icons.currency_rupee,
            label: 'Sum Insured',
            value: policy.formattedSumInsured,
            isHighlight: true,
            isDark: isDark,
          ),
          const Divider(height: 20),
          if (policy.policyNumber != null &&
              policy.policyNumber!.isNotEmpty) ...[
            _buildSummaryRow(
              icon: Icons.badge_outlined,
              label: 'Policy Number',
              value: policy.policyNumber!,
              isDark: isDark,
            ),
            const Divider(height: 20),
          ],
          if (policy.insuredMember != null &&
              policy.insuredMember!.isNotEmpty) ...[
            _buildSummaryRow(
              icon: Icons.person_outline,
              label: 'Insured Member',
              value: policy.insuredMember!,
              isDark: isDark,
            ),
            const Divider(height: 20),
          ],
          _buildSummaryRow(
            icon: Icons.calendar_today_outlined,
            label: 'Start Date',
            value: policy.formattedStartDate,
            isDark: isDark,
          ),
          const Divider(height: 20),
          _buildSummaryRow(
            icon: Icons.event_available_outlined,
            label: 'Expiry Date',
            value: policy.formattedEndDate,
            isDark: isDark,
          ),
          if (policy.premium != null) ...[
            const Divider(height: 20),
            _buildSummaryRow(
              icon: Icons.payments_outlined,
              label: 'Premium',
              value: policy.formattedPremium,
              isDark: isDark,
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildSummaryRow({
    required IconData icon,
    required String label,
    required String value,
    bool isHighlight = false,
    required bool isDark,
  }) {
    return Row(
      children: [
        Icon(
          icon,
          size: 18,
          color: isHighlight
              ? PrismTheme.primaryBlue
              : (isDark ? Colors.white54 : PrismTheme.textSecondary),
        ),
        const SizedBox(width: 10),
        Text(
          label,
          style: TextStyle(
            fontSize: 13,
            color: isDark ? Colors.white60 : PrismTheme.textSecondary,
          ),
        ),
        const Spacer(),
        Flexible(
          child: Text(
            value,
            textAlign: TextAlign.right,
            style: TextStyle(
              fontSize: isHighlight ? 15 : 13,
              fontWeight: isHighlight ? FontWeight.w700 : FontWeight.w600,
              color: isHighlight
                  ? PrismTheme.primaryBlue
                  : (isDark ? Colors.white : PrismTheme.textPrimary),
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  // ===========================================================================
  // 4. POLICY INSIGHTS SECTION (NEUTRAL: INFO, ATTENTION, IMPORTANT)
  // ===========================================================================
  Widget _buildInsightsSection(PolicyModel policy, bool isDark) {
    final waitingSections =
        _sections.where((s) => s.sectionType == 'waiting_period').toList();
    final copaySections = _sections
        .where((s) =>
            s.sectionType == 'copayment' || s.sectionType == 'deductible')
        .toList();
    final exclusionSections =
        _sections.where((s) => s.sectionType == 'exclusions').toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.auto_awesome,
                size: 16, color: PrismTheme.primaryBlue),
            const SizedBox(width: 6),
            Text(
              'POLICY INSIGHTS',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.8,
                color: isDark ? Colors.white54 : PrismTheme.textSecondary,
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),

        // 1. Understanding Score Observation (INFO)
        if (policy.understandingScore != null)
          _buildInsightCard(
            tag: 'INFO',
            tagColor: const Color(0xFF2563EB),
            tagBg: isDark ? const Color(0xFF132238) : const Color(0xFFEFF6FF),
            title: 'Clause Parsing & Indexing Complete',
            body:
                'PRISM indexed and classified key clauses across this policy document (Indexing completeness: ${policy.understandingScore}/100). This indicates extraction coverage, not a claim probability or quality rating.',
            isDark: isDark,
          ),

        // 2. Co-pay or Deductible Notice (ATTENTION)
        if (copaySections.isNotEmpty)
          _buildInsightCard(
            tag: 'ATTENTION',
            tagColor: const Color(0xFFD97706),
            tagBg: isDark ? const Color(0xFF2C2213) : const Color(0xFFFFFBEB),
            title: 'Cost-Sharing Terms Identified',
            body:
                'Identified ${copaySections.length} co-pay / deductible clause(s) in policy wording. Review the out-of-pocket rules before hospitalization.',
            isDark: isDark,
          ),

        // 3. Waiting Periods Notice (IMPORTANT)
        if (waitingSections.isNotEmpty)
          _buildInsightCard(
            tag: 'IMPORTANT',
            tagColor: const Color(0xFFDC2626),
            tagBg: isDark ? const Color(0xFF2A1515) : const Color(0xFFFEF2F2),
            title: 'Waiting Period Timeline Applies',
            body:
                'Identified ${waitingSections.length} waiting period schedule(s) for pre-existing conditions or specified illnesses.',
            isDark: isDark,
          ),

        // 4. Exclusions Notice (INFO)
        if (exclusionSections.isNotEmpty)
          _buildInsightCard(
            tag: 'INFO',
            tagColor: const Color(0xFF059669),
            tagBg: isDark ? const Color(0xFF0E2820) : const Color(0xFFECFDF5),
            title: 'Extracted Policy Evidence',
            body:
                '${_sections.length} total sections verified with page citations from your uploaded policy PDF.',
            isDark: isDark,
          ),
      ],
    );
  }

  Widget _buildInsightCard({
    required String tag,
    required Color tagColor,
    required Color tagBg,
    required String title,
    required String body,
    required bool isDark,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? PrismTheme.navySurface : Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isDark ? PrismTheme.navyBorder : PrismTheme.borderSubtle,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: tagBg,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  tag,
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: tagColor,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  title,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: isDark ? Colors.white : PrismTheme.textPrimary,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            body,
            style: TextStyle(
              fontSize: 12,
              color: isDark ? Colors.white70 : PrismTheme.textSecondary,
              height: 1.35,
            ),
          ),
        ],
      ),
    );
  }

  // ===========================================================================
  // 5. ASK PRISM ENTRY POINT CTA
  // ===========================================================================
  Widget _buildAskPrismCta(PolicyModel policy, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isDark
              ? [const Color(0xFF162A46), const Color(0xFF0E1A2C)]
              : [const Color(0xFFF0F6FF), const Color(0xFFE2EDFE)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? PrismTheme.navyBorder : const Color(0xFFBFDBFE),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: PrismTheme.primaryBlue,
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.chat_bubble_outline,
              color: Colors.white,
              size: 20,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Ask PRISM',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: PrismTheme.primaryBlue,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Have a question about this policy?',
                  style: TextStyle(
                    fontSize: 12,
                    color: isDark ? Colors.white70 : PrismTheme.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: PrismTheme.primaryBlue,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              elevation: 0,
            ),
            onPressed: () {
              context.push('/ask?policy_id=${policy.id}');
            },
            child: const Text(
              'Ask',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }

  // ===========================================================================
  // 6. EXTRACTED POLICY SECTIONS
  // ===========================================================================
  Widget _buildCoverageSection(bool isDark) {
    final coverage =
        _sections.where((s) => s.sectionType == 'coverage').toList();

    return _buildSectionBlock(
      title: 'COVERAGE',
      subtitle: 'Hospitalization & benefits identified in policy wording',
      sections: coverage,
      emptyFallbackMessage: 'Not available in the processed policy evidence.',
      badgeColor: PrismTheme.primaryBlue,
      isDark: isDark,
    );
  }

  Widget _buildWaitingPeriodsSection(bool isDark) {
    final waiting =
        _sections.where((s) => s.sectionType == 'waiting_period').toList();

    return _buildSectionBlock(
      title: 'WAITING PERIODS',
      subtitle: 'Specific disease and pre-existing condition timelines',
      sections: waiting,
      emptyFallbackMessage: 'Not available in the processed policy evidence.',
      badgeColor: const Color(0xFFD97706),
      isDark: isDark,
    );
  }

  Widget _buildExclusionsSection(bool isDark) {
    final exclusions =
        _sections.where((s) => s.sectionType == 'exclusions').toList();

    return _buildSectionBlock(
      title: 'EXCLUSIONS',
      subtitle: 'Treatments & circumstances not covered under policy terms',
      sections: exclusions,
      emptyFallbackMessage: 'Not available in the processed policy evidence.',
      badgeColor: const Color(0xFFDC2626),
      isDark: isDark,
    );
  }

  Widget _buildLimitsSection(bool isDark) {
    final limits = _sections
        .where(
          (s) =>
              s.sectionType == 'limits' ||
              s.sectionType == 'copayment' ||
              s.sectionType == 'deductible',
        )
        .toList();

    return _buildSectionBlock(
      title: 'IMPORTANT LIMITS & CO-PAY',
      subtitle: 'Room rent, ICU, procedure sub-limits and cost sharing',
      sections: limits,
      emptyFallbackMessage: 'Not available in the processed policy evidence.',
      badgeColor: const Color(0xFF4B5563),
      isDark: isDark,
    );
  }

  Widget _buildSectionBlock({
    required String title,
    required String subtitle,
    required List<PolicySectionModel> sections,
    required String emptyFallbackMessage,
    required Color badgeColor,
    required bool isDark,
  }) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: isDark ? PrismTheme.navySurface : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? PrismTheme.navyBorder : PrismTheme.borderSubtle,
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
                  title,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.8,
                    color: isDark ? Colors.white54 : PrismTheme.textSecondary,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              if (sections.isNotEmpty)
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                  decoration: BoxDecoration(
                    color: badgeColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    '${sections.length} found',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: badgeColor,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 2),
          Text(
            subtitle,
            style: TextStyle(
              fontSize: 12,
              color: isDark ? Colors.white60 : PrismTheme.textSecondary,
            ),
          ),
          const SizedBox(height: 14),
          if (sections.isEmpty)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: isDark
                    ? Colors.white.withValues(alpha: 0.03)
                    : const Color(0xFFF9FAFB),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isDark ? Colors.white10 : const Color(0xFFE5E7EB),
                ),
              ),
              child: Text(
                emptyFallbackMessage,
                style: TextStyle(
                  fontSize: 12,
                  fontStyle: FontStyle.italic,
                  color: isDark ? Colors.white54 : PrismTheme.textSecondary,
                ),
                textAlign: TextAlign.center,
              ),
            )
          else
            ...sections.map(
              (sec) => _buildSectionItem(sec, isDark),
            ),
        ],
      ),
    );
  }

  Widget _buildSectionItem(PolicySectionModel sec, bool isDark) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF132238) : const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isDark ? PrismTheme.navyBorder : const Color(0xFFE2E8F0),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  sec.title,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: isDark ? Colors.white : PrismTheme.textPrimary,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                decoration: BoxDecoration(
                  color: PrismTheme.primaryBlue.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  sec.pageRangeText,
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: PrismTheme.primaryBlue,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            sec.content,
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: 12,
              color: isDark ? Colors.white70 : PrismTheme.textSecondary,
              height: 1.35,
            ),
          ),
          const SizedBox(height: 8),
          InkWell(
            onTap: () => _showEvidenceModal(sec),
            borderRadius: BorderRadius.circular(6),
            child: const Padding(
              padding: EdgeInsets.symmetric(vertical: 2),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'View source wording',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: PrismTheme.primaryBlue,
                    ),
                  ),
                  SizedBox(width: 4),
                  Icon(
                    Icons.arrow_forward,
                    size: 13,
                    color: PrismTheme.primaryBlue,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ===========================================================================
  // 7. EVIDENCE MODAL (VERBATIM CLAUSE WORDING)
  // ===========================================================================
  void _showEvidenceModal(PolicySectionModel section) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: isDark ? PrismTheme.navySurface : Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return DraggableScrollableSheet(
          initialChildSize: 0.7,
          minChildSize: 0.4,
          maxChildSize: 0.95,
          expand: false,
          builder: (context, scrollController) {
            return Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
              child: ListView(
                controller: scrollController,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      margin: const EdgeInsets.only(bottom: 16),
                      decoration: BoxDecoration(
                        color: Colors.grey.withValues(alpha: 0.3),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: PrismTheme.primaryBlue.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          section.humanSectionType.toUpperCase(),
                          style: const TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: PrismTheme.primaryBlue,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        section.pageRangeText,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: isDark
                              ? Colors.white60
                              : PrismTheme.textSecondary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    section.title,
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: isDark ? Colors.white : PrismTheme.textPrimary,
                    ),
                  ),
                  if (section.isLowConfidence) ...[
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: isDark
                            ? const Color(0xFF2C2213)
                            : const Color(0xFFFFFBEB),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: isDark
                              ? const Color(0xFF5F461E)
                              : const Color(0xFFFDE68A),
                        ),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.info_outline,
                              size: 16, color: Color(0xFFD97706)),
                          SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'PRISM identified a possible clause, but the extracted text may need review.',
                              style: TextStyle(
                                fontSize: 11,
                                color: Color(0xFFB45309),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                  const SizedBox(height: 16),
                  Text(
                    'ORIGINAL POLICY WORDING (VERBATIM EXTRACTED TEXT)',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.8,
                      color: isDark ? Colors.white54 : PrismTheme.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: isDark
                          ? const Color(0xFF0B1220)
                          : const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isDark
                            ? PrismTheme.navyBorder
                            : const Color(0xFFE2E8F0),
                      ),
                    ),
                    child: SelectableText(
                      section.content,
                      style: TextStyle(
                        fontFamily: 'monospace',
                        fontSize: 12,
                        height: 1.5,
                        color: isDark
                            ? const Color(0xFFE2E8F0)
                            : const Color(0xFF1E293B),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Evidence extracted from your uploaded policy PDF in private vault.',
                    style: TextStyle(
                      fontSize: 11,
                      fontStyle: FontStyle.italic,
                      color: isDark ? Colors.white38 : PrismTheme.textSecondary,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  // ===========================================================================
  // 8. PROCESSING PLACEHOLDER
  // ===========================================================================
  Widget _buildProcessingPlaceholder(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: isDark ? PrismTheme.navySurface : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? PrismTheme.navyBorder : PrismTheme.borderSubtle,
        ),
      ),
      child: Column(
        children: [
          const Icon(
            Icons.hourglass_empty_rounded,
            size: 40,
            color: PrismTheme.primaryBlue,
          ),
          const SizedBox(height: 12),
          Text(
            'Detailed Clauses Being Indexed',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: isDark ? Colors.white : PrismTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Coverage limits, waiting periods, and exclusions will appear here automatically once policy document extraction finishes.',
            style: TextStyle(
              fontSize: 13,
              color: isDark ? Colors.white60 : PrismTheme.textSecondary,
              height: 1.4,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  // ===========================================================================
  // 9. LOADING SKELETON
  // ===========================================================================
  Widget _buildLoadingSkeleton(bool isDark) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Container(
          height: 120,
          decoration: BoxDecoration(
            color: isDark ? PrismTheme.navySurface : Colors.white,
            borderRadius: BorderRadius.circular(16),
          ),
          child: const Center(
            child: CircularProgressIndicator(
              strokeWidth: 2.5,
              color: PrismTheme.primaryBlue,
            ),
          ),
        ),
        const SizedBox(height: 16),
        Container(
          height: 180,
          decoration: BoxDecoration(
            color: isDark ? PrismTheme.navySurface : Colors.white,
            borderRadius: BorderRadius.circular(16),
          ),
        ),
      ],
    );
  }

  // ===========================================================================
  // 10. ERROR / NOT FOUND STATE
  // ===========================================================================
  Widget _buildErrorState(bool isDark) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: const Color(0xFFFEF2F2),
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Icon(
                Icons.search_off_rounded,
                color: Color(0xFFDC2626),
                size: 28,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'Policy Not Found',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: isDark ? Colors.white : PrismTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _errorMessage ??
                  'We could not find this policy in your account, or you do not have permission to view it.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13,
                color: isDark ? Colors.white60 : PrismTheme.textSecondary,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: PrismTheme.primaryBlue,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                padding:
                    const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              ),
              onPressed: () {
                if (Navigator.of(context).canPop()) {
                  Navigator.of(context).pop();
                } else {
                  context.go('/policies');
                }
              },
              child: const Text('Return to My Policies'),
            ),
          ],
        ),
      ),
    );
  }
}
