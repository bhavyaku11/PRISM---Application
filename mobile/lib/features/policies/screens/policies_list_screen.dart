import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../app/theme.dart';
import '../models/policy_model.dart';
import '../services/policy_service.dart';

class PoliciesListScreen extends StatefulWidget {
  final PolicyService? policyService;
  final List<PolicyModel>? initialPolicies;

  const PoliciesListScreen({
    super.key,
    this.policyService,
    this.initialPolicies,
  });

  @override
  State<PoliciesListScreen> createState() => _PoliciesListScreenState();
}

class _PoliciesListScreenState extends State<PoliciesListScreen> {
  late final PolicyService _service;
  List<PolicyModel> _policies = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _service = widget.policyService ?? PolicyService();
    if (widget.initialPolicies != null) {
      _policies = widget.initialPolicies!;
      _isLoading = false;
    } else {
      _fetchPolicies();
    }
  }

  Future<void> _fetchPolicies() async {
    setState(() {
      _errorMessage = null;
    });

    try {
      final list = await _service.getPolicies();
      if (mounted) {
        setState(() {
          _policies = list;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Unable to load policies. Pull down to retry.';
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _showAddPolicySheet(BuildContext context) async {
    await context.push('/policies/add');
    if (mounted) {
      _fetchPolicies();
    }
  }

  Widget _buildStatusBadge(PolicyModel p) {
    Color bg;
    Color fg;
    IconData icon;

    if (p.isProcessing) {
      bg = PrismTheme.warning.withValues(alpha: 0.12);
      fg = const Color(0xFFB45309);
      icon = Icons.sync;
    } else if (p.isFailed) {
      bg = PrismTheme.error.withValues(alpha: 0.12);
      fg = PrismTheme.error;
      icon = Icons.error_outline;
    } else {
      bg = PrismTheme.success.withValues(alpha: 0.12);
      fg = PrismTheme.success;
      icon = Icons.check_circle_outline;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: fg),
          const SizedBox(width: 4),
          Text(
            p.statusBadgeLabel,
            style: TextStyle(
              color: fg,
              fontSize: 11,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPolicyCard(PolicyModel policy) {
    return InkWell(
      onTap: () => context.push('/policies/${policy.id}'),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: PrismTheme.borderSubtle),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Row: Insurer & Status Badge
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Text(
                    policy.insurerName?.toUpperCase() ?? 'HEALTH INSURANCE',
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: PrismTheme.primaryBlue,
                      letterSpacing: 0.5,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 8),
                _buildStatusBadge(policy),
              ],
            ),
            const SizedBox(height: 6),

            // Policy Name
            Text(
              policy.policyName,
              style: const TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.bold,
                color: PrismTheme.textPrimary,
                letterSpacing: -0.2,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),

            if (policy.policyNumber != null &&
                policy.policyNumber!.isNotEmpty) ...[
              const SizedBox(height: 4),
              Text(
                'Policy #${policy.policyNumber}',
                style: const TextStyle(
                  fontSize: 12,
                  color: PrismTheme.textSecondary,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],

            const Divider(height: 24),

            // Grid of Policy Metadata
            Row(
              children: [
                // Sum Insured
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Sum Insured',
                        style: TextStyle(
                            fontSize: 11, color: PrismTheme.textSecondary),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        policy.formattedSumInsured,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: PrismTheme.textPrimary,
                        ),
                      ),
                    ],
                  ),
                ),

                // Insured Member or Type
                if (policy.insuredMember != null &&
                    policy.insuredMember!.isNotEmpty)
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Insured Member',
                          style: TextStyle(
                              fontSize: 11, color: PrismTheme.textSecondary),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          policy.insuredMember!,
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: PrismTheme.textPrimary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  )
                else
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Policy Type',
                          style: TextStyle(
                              fontSize: 11, color: PrismTheme.textSecondary),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          policy.policyType ?? 'Individual Health',
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: PrismTheme.textPrimary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
              ],
            ),

            const SizedBox(height: 12),

            // Period / Expiry Row
            if (policy.endDate != null) ...[
              Row(
                children: [
                  const Icon(Icons.event_outlined,
                      size: 14, color: PrismTheme.textMuted),
                  const SizedBox(width: 6),
                  Text(
                    'Expires: ${policy.formattedEndDate}',
                    style: const TextStyle(
                      fontSize: 12,
                      color: PrismTheme.textSecondary,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
            ],

            // Card Action Footer
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    'Added ${policy.formattedDate(policy.createdAt)}',
                    style: const TextStyle(
                        fontSize: 11, color: PrismTheme.textMuted),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const Row(
                  children: [
                    Text(
                      'View Details',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: PrismTheme.primaryBlue,
                      ),
                    ),
                    SizedBox(width: 4),
                    Icon(Icons.arrow_forward_ios,
                        size: 10, color: PrismTheme.primaryBlue),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 48),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: PrismTheme.borderSubtle),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: PrismTheme.primaryBlue.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.shield_outlined,
                size: 40, color: PrismTheme.primaryBlue),
          ),
          const SizedBox(height: 20),
          const Text(
            'Your insurance starts here.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: PrismTheme.textPrimary,
              letterSpacing: -0.2,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Add your health insurance policy to understand your coverage, exclusions, waiting periods, and important limits.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 13,
              color: PrismTheme.textSecondary,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () => _showAddPolicySheet(context),
            icon: const Icon(Icons.add, size: 18, color: Colors.white),
            label: const Text(
              'Add Policy',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w600,
                fontSize: 14,
              ),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: PrismTheme.navy,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
              elevation: 0,
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final activeCount = _policies.where((p) => p.isProcessed).length;
    final inProgressCount = _policies.where((p) => p.isProcessing).length;

    return Scaffold(
      backgroundColor: PrismTheme.backgroundLight,
      appBar: AppBar(
        title: const Text('My Policies'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add, size: 24),
            tooltip: 'Add Policy',
            onPressed: () => _showAddPolicySheet(context),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _fetchPolicies,
        color: PrismTheme.primaryBlue,
        child: _isLoading
            ? const Center(
                child: CircularProgressIndicator(
                  color: PrismTheme.primaryBlue,
                  strokeWidth: 2.5,
                ),
              )
            : ListView(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                children: [
                  // Header Block
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'My Policies',
                              style: TextStyle(
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                                color: PrismTheme.textPrimary,
                                letterSpacing: -0.4,
                              ),
                            ),
                            SizedBox(height: 4),
                            Text(
                              'Your insurance policies, organized in one place.',
                              style: TextStyle(
                                fontSize: 13,
                                color: PrismTheme.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      ElevatedButton.icon(
                        onPressed: () => _showAddPolicySheet(context),
                        icon: const Icon(Icons.add,
                            size: 16, color: Colors.white),
                        label: const Text('Add Policy',
                            style: TextStyle(
                                color: Colors.white,
                                fontSize: 12,
                                fontWeight: FontWeight.w600)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: PrismTheme.navy,
                          padding: const EdgeInsets.symmetric(
                              horizontal: 14, vertical: 10),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10)),
                          elevation: 0,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),

                  // Metrics Summary Row (if policies exist)
                  if (_policies.isNotEmpty) ...[
                    Row(
                      children: [
                        Expanded(
                          child: _buildMetricTile('Total',
                              '${_policies.length}', PrismTheme.primaryBlue),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: _buildMetricTile(
                              'Active', '$activeCount', PrismTheme.success),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: _buildMetricTile('Analyzing',
                              '$inProgressCount', PrismTheme.warning),
                        ),
                      ],
                    ),
                    const SizedBox(height: 18),
                  ],

                  // Error Banner
                  if (_errorMessage != null) ...[
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: PrismTheme.warning.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                            color: PrismTheme.warning.withValues(alpha: 0.3)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.info_outline,
                              color: PrismTheme.warning, size: 20),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              _errorMessage!,
                              style: const TextStyle(
                                  color: PrismTheme.textPrimary, fontSize: 13),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Policies List or Empty State
                  if (_policies.isEmpty)
                    _buildEmptyState()
                  else
                    ..._policies.map((p) => Padding(
                          padding: const EdgeInsets.only(bottom: 14),
                          child: _buildPolicyCard(p),
                        )),
                ],
              ),
      ),
    );
  }

  Widget _buildMetricTile(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: PrismTheme.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label,
              style: const TextStyle(
                  fontSize: 11,
                  color: PrismTheme.textSecondary,
                  fontWeight: FontWeight.w500)),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}
