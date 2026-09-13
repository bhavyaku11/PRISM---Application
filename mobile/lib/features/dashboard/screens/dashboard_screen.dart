import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../app/theme.dart';
import '../../policies/models/policy_model.dart';
import '../models/dashboard_data.dart';

class DashboardScreen extends StatefulWidget {
  final SupabaseClient? client;
  final DashboardData? initialData;

  const DashboardScreen({
    super.key,
    this.client,
    this.initialData,
  });

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  late DashboardData _data;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    if (widget.initialData != null) {
      _data = widget.initialData!;
    } else {
      _data = DashboardData.initial();
      _loadDashboardData();
    }
  }

  Future<void> _loadDashboardData() async {
    setState(() {
      _errorMessage = null;
    });

    try {
      SupabaseClient? supabase = widget.client;
      if (supabase == null) {
        try {
          supabase = Supabase.instance.client;
        } catch (_) {
          supabase = null;
        }
      }

      if (supabase == null) {
        if (mounted) {
          setState(() {
            _data = DashboardData(
              userName: 'there',
              policies: [],
              activeClaimsCount: 0,
              unreadNotificationsCount: 0,
              isLoading: false,
            );
          });
        }
        return;
      }

      final user = supabase.auth.currentUser;

      if (user == null) {
        if (mounted) context.go('/login');
        return;
      }

      // 1. Fetch User Profile Name
      String displayName = user.userMetadata?['full_name'] as String? ?? '';
      try {
        final profileRes = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .maybeSingle();
        if (profileRes != null && profileRes['full_name'] != null) {
          displayName = profileRes['full_name'] as String;
        }
      } catch (_) {
        // Fallback to email username if profile table is empty
        if (displayName.isEmpty && user.email != null) {
          displayName = user.email!.split('@').first;
        }
      }

      // 2. Fetch User Policies
      final policiesRes = await supabase
          .from('policies')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', ascending: false);

      final List<PolicyModel> loadedPolicies = (policiesRes as List<dynamic>)
          .map((item) => PolicyModel.fromJson(item as Map<String, dynamic>))
          .toList();

      // 3. Fetch Claims Count
      int claimsCount = 0;
      try {
        final claimsRes =
            await supabase.from('claims').select('id').eq('user_id', user.id);
        claimsCount = (claimsRes as List<dynamic>).length;
      } catch (_) {}

      // 4. Fetch Unread Notifications Count
      int unreadCount = 0;
      try {
        final notifRes = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', user.id)
            .eq('read', false);
        unreadCount = (notifRes as List<dynamic>).length;
      } catch (_) {}

      if (mounted) {
        setState(() {
          _data = DashboardData(
            userName: displayName.isNotEmpty ? displayName : 'there',
            policies: loadedPolicies,
            activeClaimsCount: claimsCount,
            unreadNotificationsCount: unreadCount,
            isLoading: false,
          );
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Unable to load dashboard. Pull down to retry.';
          _data = DashboardData(
            userName: 'there',
            policies: [],
            activeClaimsCount: 0,
            unreadNotificationsCount: 0,
            isLoading: false,
          );
        });
      }
    }
  }

  String _formatCurrency(num? amount) {
    if (amount == null) return 'Not specified';
    final format =
        NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);
    return format.format(amount);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: PrismTheme.backgroundLight,
      appBar: AppBar(
        title: Row(
          children: [
            const Icon(Icons.shield_outlined,
                color: PrismTheme.primaryBlue, size: 24),
            const SizedBox(width: 8),
            const Text(
              'PRISM',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 18,
                letterSpacing: 0.5,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: Stack(
              children: [
                const Icon(Icons.notifications_outlined, size: 24),
                if (_data.unreadNotificationsCount > 0)
                  Positioned(
                    right: 0,
                    top: 0,
                    child: Container(
                      padding: const EdgeInsets.all(3),
                      decoration: const BoxDecoration(
                        color: PrismTheme.primaryBlue,
                        shape: BoxShape.circle,
                      ),
                      constraints:
                          const BoxConstraints(minWidth: 14, minHeight: 14),
                      child: Text(
                        '${_data.unreadNotificationsCount}',
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            onPressed: () => context.push('/notifications'),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadDashboardData,
        color: PrismTheme.primaryBlue,
        child: _data.isLoading
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
                  // Greeting Header
                  Text(
                    'Hello, ${_data.userName}',
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: PrismTheme.textPrimary,
                      letterSpacing: -0.3,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Here is your health insurance overview',
                    style: TextStyle(
                      fontSize: 14,
                      color: PrismTheme.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Error banner if any
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

                  // Intelligence Action Highlight Card
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [PrismTheme.navy, PrismTheme.deepBlue],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Icon(Icons.auto_awesome,
                                  color: PrismTheme.softCyan, size: 18),
                            ),
                            const SizedBox(width: 10),
                            const Text(
                              'Ask PRISM Intelligence',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        const Text(
                          'Have a question about waiting periods, room rent caps, or daycare procedures? Get grounded answers directly from your policy text.',
                          style: TextStyle(
                              color: Color(0xFFD1D5DB),
                              fontSize: 13,
                              height: 1.4),
                        ),
                        const SizedBox(height: 14),
                        InkWell(
                          onTap: () => context.push('/ask'),
                          borderRadius: BorderRadius.circular(8),
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 14, vertical: 8),
                            decoration: BoxDecoration(
                              color: PrismTheme.primaryBlue,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  'Ask a question',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                SizedBox(width: 6),
                                Icon(Icons.arrow_forward,
                                    size: 14, color: Colors.white),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Quick Stats Row
                  Row(
                    children: [
                      Expanded(
                        child: _buildMetricCard(
                          title: 'Active Policies',
                          value: '${_data.policies.length}',
                          icon: Icons.description_outlined,
                          color: PrismTheme.primaryBlue,
                          onTap: () => context.go('/policies'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildMetricCard(
                          title: 'Claims Filed',
                          value: '${_data.activeClaimsCount}',
                          icon: Icons.assignment_outlined,
                          color: PrismTheme.softCyan,
                          onTap: () => context.go('/claims'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Policies Section Header
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Your Policies',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: PrismTheme.textPrimary,
                        ),
                      ),
                      if (_data.policies.isNotEmpty)
                        TextButton(
                          onPressed: () => context.go('/policies'),
                          style: TextButton.styleFrom(
                            padding: EdgeInsets.zero,
                            minimumSize: const Size(50, 30),
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          ),
                          child: const Text(
                            'View all',
                            style: TextStyle(
                              color: PrismTheme.primaryBlue,
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Policies List or Empty State
                  if (_data.policies.isEmpty)
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 20, vertical: 32),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: PrismTheme.borderSubtle),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color:
                                  PrismTheme.primaryBlue.withValues(alpha: 0.1),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.note_add_outlined,
                              size: 32,
                              color: PrismTheme.primaryBlue,
                            ),
                          ),
                          const SizedBox(height: 12),
                          const Text(
                            'Add your first policy',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: PrismTheme.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'Upload your health insurance policy document to get verified insights and clarity.',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 13,
                              color: PrismTheme.textSecondary,
                            ),
                          ),
                          const SizedBox(height: 16),
                          ElevatedButton.icon(
                            onPressed: () async {
                              await context.push('/policies/add');
                              if (mounted) {
                                _loadDashboardData();
                              }
                            },
                            icon: const Icon(Icons.add, size: 16, color: Colors.white),
                            label: const Text(
                              'Add Policy',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: PrismTheme.navy,
                              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              elevation: 0,
                            ),
                          ),
                        ],
                      ),
                    )
                  else
                    ..._data.policies
                        .take(3)
                        .map((policy) => _buildPolicyCard(policy)),

                  const SizedBox(height: 24),

                  // Quick Tools Shortcuts
                  const Text(
                    'Intelligence Tools',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: PrismTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _buildToolTile(
                          title: 'Scenario Analysis',
                          subtitle: 'Simulate treatments',
                          icon: Icons.calculate_outlined,
                          onTap: () => context.push('/scenario'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildToolTile(
                          title: 'Evidence Mapping',
                          subtitle: 'Prepare claim docs',
                          icon: Icons.rule_folder_outlined,
                          onTap: () => context.go('/claims'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                ],
              ),
      ),
    );
  }

  Widget _buildMetricCard({
    required String title,
    required String value,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: PrismTheme.borderSubtle),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: PrismTheme.textSecondary,
                  ),
                ),
                Icon(icon, size: 18, color: color),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              value,
              style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: PrismTheme.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPolicyCard(PolicyModel policy) {
    final bool isProcessing = policy.status == 'processing';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: PrismTheme.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  policy.policyName,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: PrismTheme.textPrimary,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: isProcessing
                      ? PrismTheme.warning.withValues(alpha: 0.12)
                      : PrismTheme.success.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  isProcessing ? 'Processing' : 'Active',
                  style: TextStyle(
                    color:
                        isProcessing ? PrismTheme.warning : PrismTheme.success,
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            policy.insurerName ?? 'Health Insurance',
            style: const TextStyle(
              fontSize: 13,
              color: PrismTheme.textSecondary,
            ),
          ),
          const Divider(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Sum Insured',
                    style: TextStyle(
                        fontSize: 11, color: PrismTheme.textSecondary),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    _formatCurrency(policy.sumInsured),
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: PrismTheme.textPrimary,
                    ),
                  ),
                ],
              ),
              if (policy.endDate != null)
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    const Text(
                      'Valid Till',
                      style: TextStyle(
                          fontSize: 11, color: PrismTheme.textSecondary),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      policy.endDate!,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: PrismTheme.textPrimary,
                      ),
                    ),
                  ],
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildToolTile({
    required String title,
    required String subtitle,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: PrismTheme.borderSubtle),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: PrismTheme.primaryBlue.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, size: 20, color: PrismTheme.primaryBlue),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: PrismTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      fontSize: 11,
                      color: PrismTheme.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
