import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../app/theme.dart';
import '../../policies/models/policy_model.dart';
import '../../policies/services/policy_service.dart';
import '../models/claim_model.dart';
import '../services/claim_service.dart';
import '../widgets/claim_card.dart';
import '../widgets/create_claim_modal.dart';

class ClaimsScreen extends StatefulWidget {
  final ClaimService? claimService;
  final PolicyService? policyService;
  final List<ClaimModel>? initialClaims;
  final List<PolicyModel>? initialPolicies;

  const ClaimsScreen({
    super.key,
    this.claimService,
    this.policyService,
    this.initialClaims,
    this.initialPolicies,
  });

  @override
  State<ClaimsScreen> createState() => _ClaimsScreenState();
}

class _ClaimsScreenState extends State<ClaimsScreen> {
  late final ClaimService _claimService;
  late final PolicyService _policyService;

  List<ClaimModel> _claims = [];
  List<PolicyModel> _policies = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _claimService = widget.claimService ?? ClaimService();
    _policyService = widget.policyService ?? PolicyService();

    if (widget.initialClaims != null) {
      _claims = widget.initialClaims!;
      _policies = widget.initialPolicies ?? [];
      _isLoading = false;
    } else {
      _loadData();
    }
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final results = await Future.wait([
        _claimService.getClaims(),
        _policyService.getPolicies(),
      ]);

      if (!mounted) return;
      setState(() {
        _claims = results[0] as List<ClaimModel>;
        _policies = results[1] as List<PolicyModel>;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _errorMessage = 'Could not load claims. Please pull down to refresh.';
      });
    }
  }

  void _openCreateClaimModal() {
    if (_policies.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please add an insurance policy before preparing a claim.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    CreateClaimModal.show(
      context: context,
      policies: _policies,
      claimService: _claimService,
      onClaimCreated: (newClaim) {
        setState(() {
          _claims.insert(0, newClaim);
        });
        context.push('/claims/${newClaim.id}');
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor:
          isDark ? PrismTheme.backgroundDark : PrismTheme.backgroundLight,
      appBar: AppBar(
        title: const Text('Claims Center'),
        actions: [
          if (_claims.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.add, size: 22),
              tooltip: 'Prepare a Claim',
              onPressed: _openCreateClaimModal,
            ),
        ],
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(PrismTheme.primaryBlue),
                strokeWidth: 2.5,
              ),
            )
          : RefreshIndicator(
              onRefresh: _loadData,
              color: PrismTheme.primaryBlue,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // 1. Header Banner
                  _buildHeaderBanner(isDark),
                  const SizedBox(height: 16),

                  // 2. Error Message
                  if (_errorMessage != null) ...[
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF450A0A) : const Color(0xFFFEE2E2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        _errorMessage!,
                        style: TextStyle(
                          fontSize: 12,
                          color: isDark ? const Color(0xFFFCA5A5) : const Color(0xFF991B1B),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // 3. Claims Statistics Row (when claims exist)
                  if (_claims.isNotEmpty) ...[
                    _buildStatsRow(isDark),
                    const SizedBox(height: 18),
                    Text(
                      'ACTIVE CLAIM WORKSPACES (${_claims.length})',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.8,
                        color: isDark ? PrismTheme.textSecondaryDark : PrismTheme.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 10),
                    // 4. Claims List
                    ..._claims.map((claim) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: ClaimCard(
                          claim: claim,
                          onTap: () => context.push('/claims/${claim.id}'),
                        ),
                      );
                    }),
                  ] else ...[
                    // 5. Empty State
                    _buildEmptyState(isDark),
                  ],

                  const SizedBox(height: 16),
                  // 6. Contextual Help / Ask PRISM Prompt
                  _buildAskPrismPrompt(isDark),
                ],
              ),
            ),
    );
  }

  Widget _buildHeaderBanner(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: isDark ? PrismTheme.navySurface : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? PrismTheme.navyBorder : const Color(0xFFE2E8F0),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Claims Center',
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.bold,
                    letterSpacing: -0.3,
                    color: isDark ? Colors.white : PrismTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Prepare your claim with the documents and policy evidence you may need.',
                  style: TextStyle(
                    fontSize: 12,
                    height: 1.4,
                    color: isDark ? PrismTheme.textSecondaryDark : PrismTheme.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          ElevatedButton.icon(
            onPressed: _openCreateClaimModal,
            icon: const Icon(Icons.add, size: 16),
            label: const Text('Prepare', style: TextStyle(fontSize: 12)),
            style: ElevatedButton.styleFrom(
              backgroundColor: PrismTheme.primaryBlue,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsRow(bool isDark) {
    final activeCount = _claims.length;
    final avgProgress = (_claims.fold<int>(0, (sum, c) => sum + c.preparationProgress) /
            (activeCount > 0 ? activeCount : 1))
        .round();

    return Row(
      children: [
        Expanded(
          child: _buildStatCard(
            title: 'ACTIVE CLAIMS',
            value: '$activeCount',
            icon: Icons.folder_open_outlined,
            color: PrismTheme.primaryBlue,
            isDark: isDark,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _buildStatCard(
            title: 'AVG READINESS',
            value: '$avgProgress%',
            icon: Icons.pie_chart_outline,
            color: const Color(0xFF10B981),
            isDark: isDark,
          ),
        ),
      ],
    );
  }

  Widget _buildStatCard({
    required String title,
    required String value,
    required IconData icon,
    required Color color,
    required bool isDark,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      decoration: BoxDecoration(
        color: isDark ? PrismTheme.navySurface : Colors.white,
        borderRadius: BorderRadius.circular(16),
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
                  title,
                  style: TextStyle(
                    fontSize: 9.5,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.5,
                    color: isDark ? Colors.white38 : PrismTheme.textSecondary,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 4),
              Icon(icon, size: 16, color: color),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: isDark ? Colors.white : PrismTheme.textPrimary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 36),
      decoration: BoxDecoration(
        color: isDark ? PrismTheme.navySurface : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? PrismTheme.navyBorder : const Color(0xFFE2E8F0),
        ),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E293B) : const Color(0xFFEFF6FF),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.assignment_outlined,
              size: 40,
              color: PrismTheme.primaryBlue,
            ),
          ),
          const SizedBox(height: 18),
          Text(
            'Be prepared before you file a claim.',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: isDark ? Colors.white : PrismTheme.textPrimary,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            'Create a claim workspace to organize your documents and review relevant policy evidence.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 12.5,
              height: 1.45,
              color: isDark ? PrismTheme.textSecondaryDark : PrismTheme.textSecondary,
            ),
          ),
          const SizedBox(height: 22),
          ElevatedButton.icon(
            onPressed: _openCreateClaimModal,
            icon: const Icon(Icons.add, size: 18),
            label: const Text('Prepare a Claim'),
            style: ElevatedButton.styleFrom(
              backgroundColor: PrismTheme.primaryBlue,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAskPrismPrompt(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : const Color(0xFFEFF6FF),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? PrismTheme.navyBorder : const Color(0xFFDBEAFE),
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: PrismTheme.primaryBlue,
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Text('✦', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Have questions about claim coverage?',
                  style: TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.bold,
                    color: isDark ? Colors.white : PrismTheme.textPrimary,
                  ),
                ),
                Text(
                  'Ask PRISM about room rent limits, ICU sub-limits, or exclusions.',
                  style: TextStyle(
                    fontSize: 11,
                    color: isDark ? Colors.white70 : PrismTheme.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          TextButton(
            onPressed: () => context.push('/ask'),
            child: const Text('Ask PRISM →', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}
