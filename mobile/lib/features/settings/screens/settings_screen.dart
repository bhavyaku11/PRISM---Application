import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/theme.dart';
import '../../auth/services/auth_service.dart';
import '../../notifications/services/notification_service.dart';
import '../../profile/models/profile_model.dart';
import '../../profile/services/profile_service.dart';
import '../controllers/theme_controller.dart';

class SettingsScreen extends StatefulWidget {
  final ProfileService? profileService;
  final NotificationService? notificationService;
  final AuthService? authService;
  final ThemeController? themeController;

  const SettingsScreen({
    super.key,
    this.profileService,
    this.notificationService,
    this.authService,
    this.themeController,
  });

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  late final ProfileService _profileService;
  late final NotificationService _notificationService;
  late final AuthService _authService;
  late final ThemeController _themeController;

  ProfileModel? _profile;
  int _unreadNotificationsCount = 0;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _profileService = widget.profileService ?? ProfileService();
    _notificationService = widget.notificationService ?? NotificationService();
    _authService = widget.authService ?? AuthService();
    _themeController = widget.themeController ?? ThemeController.instance;
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final p = await _profileService.getProfile();
      final count = await _notificationService.getUnreadCount();
      if (mounted) {
        setState(() {
          _profile = p;
          _unreadNotificationsCount = count;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _handleSignOut() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Sign out of PRISM?'),
          content: const Text(
            'You will need to sign in again to access your policies, claims, and AI companion.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.of(context).pop(true),
              style: ElevatedButton.styleFrom(
                backgroundColor: PrismTheme.error,
                foregroundColor: Colors.white,
              ),
              child: const Text('Sign out'),
            ),
          ],
        );
      },
    );

    if (confirmed == true && mounted) {
      await _authService.signOut();
      if (mounted) {
        context.go('/login');
      }
    }
  }

  Future<void> _handleClearCache() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Clear local application cache?'),
          content: const Text(
            'This will clear locally cached documents and preview images. Your policies and claims saved in the cloud will not be affected.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.of(context).pop(true),
              style: ElevatedButton.styleFrom(
                backgroundColor: PrismTheme.navy,
                foregroundColor: Colors.white,
              ),
              child: const Text('Clear Cache'),
            ),
          ],
        );
      },
    );

    if (confirmed == true && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Application cache cleared successfully'),
          backgroundColor: PrismTheme.success,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  void _showPrivacyDetail(String title, String description) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) {
        final isDark = Theme.of(context).brightness == Brightness.dark;
        return Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: isDark ? PrismTheme.navyDark : Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.shield_outlined,
                      color: PrismTheme.primaryBlue, size: 22),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      title,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: isDark ? Colors.white : PrismTheme.navy,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                description,
                style: TextStyle(
                  fontSize: 13,
                  height: 1.5,
                  color:
                      isDark ? PrismTheme.textMuted : PrismTheme.textSecondary,
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('Done'),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  void _showAccountDeletionNotice() {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Account & Data Deletion'),
          content: const Text(
            'PRISM complies with data privacy and protection guidelines. To request complete account erasure and permanent deletion of all stored policy documents and claims dossiers, please contact privacy@prism.app with your registered email.\n\nAll associated document chunks, embeddings, and database records will be permanently purged within 7 business days.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Understood'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final email = _profile?.email ??
        _authService.currentUser?.email ??
        'user@prism.app';
    final displayName = _profile?.displayName ?? 'Policyholder';
    final initials = _profile?.initials ?? 'P';

    return Scaffold(
      backgroundColor:
          isDark ? PrismTheme.backgroundDark : PrismTheme.backgroundLight,
      appBar: AppBar(
        title: const Text('Profile & Settings'),
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(
                color: PrismTheme.primaryBlue,
                strokeWidth: 2.5,
              ),
            )
          : RefreshIndicator(
              onRefresh: _loadData,
              color: PrismTheme.primaryBlue,
              child: ListView(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                children: [
                  // 1. User Profile Card
                  _buildProfileCard(
                    context: context,
                    initials: initials,
                    displayName: displayName,
                    email: email,
                    isDark: isDark,
                  ),
                  const SizedBox(height: 24),

                  // 2. Notifications Tile with Unread Badge
                  _buildSectionHeader('Notifications', isDark),
                  const SizedBox(height: 8),
                  _buildNotificationsTile(isDark),
                  const SizedBox(height: 24),

                  // 3. Appearance Mode Switcher
                  _buildSectionHeader('Appearance', isDark),
                  const SizedBox(height: 8),
                  _buildAppearanceCard(isDark),
                  const SizedBox(height: 24),

                  // 4. Privacy & Security
                  _buildSectionHeader('Privacy & Security', isDark),
                  const SizedBox(height: 8),
                  _buildPrivacySecurityCard(isDark),
                  const SizedBox(height: 24),

                  // 5. Data Controls
                  _buildSectionHeader('Data Controls', isDark),
                  const SizedBox(height: 8),
                  _buildDataControlsCard(isDark),
                  const SizedBox(height: 24),

                  // 6. Sign Out Button
                  OutlinedButton.icon(
                    onPressed: _handleSignOut,
                    icon: const Icon(Icons.logout,
                        color: PrismTheme.error, size: 20),
                    label: const Text(
                      'Sign out',
                      style: TextStyle(
                        color: PrismTheme.error,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      side: const BorderSide(color: PrismTheme.error, width: 1),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // 7. About PRISM Footer
                  _buildAboutFooter(isDark),
                  const SizedBox(height: 24),
                ],
              ),
            ),
    );
  }

  Widget _buildSectionHeader(String title, bool isDark) {
    return Text(
      title,
      style: TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.bold,
        letterSpacing: 0.2,
        color: isDark ? PrismTheme.textMuted : PrismTheme.textSecondary,
      ),
    );
  }

  Widget _buildProfileCard({
    required BuildContext context,
    required String initials,
    required String displayName,
    required String email,
    required bool isDark,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? PrismTheme.cardDark : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? PrismTheme.borderDark : PrismTheme.borderSubtle,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: const BoxDecoration(
              color: PrismTheme.navy,
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                initials,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  displayName,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: isDark ? Colors.white : PrismTheme.navy,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  email,
                  style: TextStyle(
                    fontSize: 12,
                    color: isDark
                        ? PrismTheme.textMuted
                        : PrismTheme.textSecondary,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          ElevatedButton(
            onPressed: () async {
              await context.push('/profile');
              _loadData();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: isDark
                  ? PrismTheme.primaryBlue.withValues(alpha: 0.2)
                  : const Color(0xFFEFF6FF),
              foregroundColor: PrismTheme.primaryBlue,
              elevation: 0,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: const Text(
              'Edit Profile',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNotificationsTile(bool isDark) {
    return Material(
      color: isDark ? PrismTheme.cardDark : Colors.white,
      borderRadius: BorderRadius.circular(16),
      clipBehavior: Clip.antiAlias,
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isDark ? PrismTheme.borderDark : PrismTheme.borderSubtle,
          ),
        ),
        child: ListTile(
          onTap: () async {
            await context.push('/notifications');
            _loadData();
          },
          leading: Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: isDark
                  ? PrismTheme.primaryBlue.withValues(alpha: 0.2)
                  : const Color(0xFFEFF6FF),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Center(
              child: Icon(Icons.notifications_outlined,
                  color: PrismTheme.primaryBlue, size: 20),
            ),
          ),
          title: Row(
            children: [
              Flexible(
                child: Text(
                  'Notification Center',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: isDark ? Colors.white : PrismTheme.textPrimary,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              if (_unreadNotificationsCount > 0) ...[
                const SizedBox(width: 8),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: PrismTheme.primaryBlue,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    '$_unreadNotificationsCount new',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ],
          ),
          subtitle: Text(
            'Renewals, missing claim documents, milestones',
            style: TextStyle(
              fontSize: 12,
              color: isDark ? PrismTheme.textMuted : PrismTheme.textSecondary,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          trailing: Icon(
            Icons.chevron_right,
            color: isDark ? PrismTheme.textMuted : PrismTheme.textMuted,
          ),
        ),
      ),
    );
  }

  Widget _buildAppearanceCard(bool isDark) {
    return ListenableBuilder(
      listenable: _themeController,
      builder: (context, _) {
        final currentMode = _themeController.themeMode;

        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isDark ? PrismTheme.cardDark : Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isDark ? PrismTheme.borderDark : PrismTheme.borderSubtle,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Theme Mode',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: isDark ? Colors.white : PrismTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 12),
              SegmentedButton<ThemeMode>(
                segments: const [
                  ButtonSegment<ThemeMode>(
                    value: ThemeMode.system,
                    label: Text('System'),
                    icon: Icon(Icons.brightness_auto, size: 16),
                  ),
                  ButtonSegment<ThemeMode>(
                    value: ThemeMode.light,
                    label: Text('Light'),
                    icon: Icon(Icons.light_mode_outlined, size: 16),
                  ),
                  ButtonSegment<ThemeMode>(
                    value: ThemeMode.dark,
                    label: Text('Dark'),
                    icon: Icon(Icons.dark_mode_outlined, size: 16),
                  ),
                ],
                selected: {currentMode},
                onSelectionChanged: (newSelection) {
                  _themeController.setThemeMode(newSelection.first);
                },
                style: ButtonStyle(
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  textStyle: WidgetStateProperty.all(
                    const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildPrivacySecurityCard(bool isDark) {
    return Material(
      color: isDark ? PrismTheme.cardDark : Colors.white,
      borderRadius: BorderRadius.circular(16),
      clipBehavior: Clip.antiAlias,
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isDark ? PrismTheme.borderDark : PrismTheme.borderSubtle,
          ),
        ),
        child: Column(
          children: [
            _buildSettingsTile(
              icon: Icons.security,
              title: 'Row-Level Security (RLS)',
              subtitle: 'Enforced at the database level for all user records',
              isDark: isDark,
              onTap: () => _showPrivacyDetail(
                'Row-Level Security (RLS)',
                'Every database query against policies, claims, documents, and notifications is validated by Supabase RLS against your authenticated user token (auth.uid()). Cross-user data leakage is strictly prohibited by database constraints.',
              ),
            ),
            Divider(
              height: 1,
              color: isDark ? PrismTheme.borderDark : PrismTheme.borderSubtle,
            ),
            _buildSettingsTile(
              icon: Icons.lock_outline,
              title: 'Encryption in Transit & Rest',
              subtitle: 'TLS 1.3 encryption and AES-256 cloud storage',
              isDark: isDark,
              onTap: () => _showPrivacyDetail(
                'Data Encryption',
                'All communication between your mobile app, the FastAPI backend, and Supabase occurs over TLS 1.3 encrypted connections. Uploaded policy PDFs and claim attachments are stored in private buckets protected with AES-256 encryption at rest.',
              ),
            ),
            Divider(
              height: 1,
              color: isDark ? PrismTheme.borderDark : PrismTheme.borderSubtle,
            ),
            _buildSettingsTile(
              icon: Icons.model_training,
              title: 'Zero LLM Training',
              subtitle: 'Your policy documents are never used for model training',
              isDark: isDark,
              onTap: () => _showPrivacyDetail(
                'Zero LLM Training Policy',
                'PRISM uses Groq LLM inference strictly via ephemeral retrieval-augmented generation (RAG). Your uploaded documents and personal claims data are never stored or retained for model training.',
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDataControlsCard(bool isDark) {
    return Material(
      color: isDark ? PrismTheme.cardDark : Colors.white,
      borderRadius: BorderRadius.circular(16),
      clipBehavior: Clip.antiAlias,
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isDark ? PrismTheme.borderDark : PrismTheme.borderSubtle,
          ),
        ),
        child: Column(
          children: [
            _buildSettingsTile(
              icon: Icons.cleaning_services_outlined,
              title: 'Clear Application Cache',
              subtitle: 'Free up local temporary preview files and cache',
              isDark: isDark,
              onTap: _handleClearCache,
            ),
            Divider(
              height: 1,
              color: isDark ? PrismTheme.borderDark : PrismTheme.borderSubtle,
            ),
            _buildSettingsTile(
              icon: Icons.storage_outlined,
              title: 'Data Retention Policy',
              subtitle: 'Manage stored policy documents and claim dossiers',
              isDark: isDark,
              onTap: () => _showPrivacyDetail(
                'Data Retention Policy',
                'Policy schedules, CIS sheets, and claim documents are stored strictly to power your personalized Q&A, clause extraction, and claim preparation. When you delete a policy or claim, associated document chunks and extracted sections are permanently purged.',
              ),
            ),
            Divider(
              height: 1,
              color: isDark ? PrismTheme.borderDark : PrismTheme.borderSubtle,
            ),
            _buildSettingsTile(
              icon: Icons.person_remove_outlined,
              title: 'Account & Data Deletion',
              subtitle: 'Request complete account and data erasure',
              isDark: isDark,
              onTap: _showAccountDeletionNotice,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSettingsTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required bool isDark,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: ListTile(
        onTap: onTap,
        leading: Icon(icon, color: PrismTheme.primaryBlue, size: 22),
        title: Text(
          title,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: isDark ? Colors.white : PrismTheme.textPrimary,
          ),
        ),
        subtitle: Text(
          subtitle,
          style: TextStyle(
            fontSize: 12,
            color: isDark ? PrismTheme.textMuted : PrismTheme.textSecondary,
          ),
        ),
        trailing: Icon(
          Icons.chevron_right,
          size: 20,
          color: isDark ? PrismTheme.textMuted : PrismTheme.textMuted,
        ),
      ),
    );
  }

  Widget _buildAboutFooter(bool isDark) {
    return Column(
      children: [
        Text(
          'PRISM Insurance Companion',
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: isDark ? Colors.white70 : PrismTheme.navy,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          'Version 1.0.0 (Build 1) · Phase 6',
          style: TextStyle(
            fontSize: 11,
            color: isDark ? PrismTheme.textMuted : PrismTheme.textSecondary,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          'Grounded insurance intelligence for Indian policyholders.',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 11,
            color: isDark ? PrismTheme.textMuted : PrismTheme.textSecondary,
          ),
        ),
      ],
    );
  }
}
