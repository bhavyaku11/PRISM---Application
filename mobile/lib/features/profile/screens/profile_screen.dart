import 'package:flutter/material.dart';
import '../../../../app/theme.dart';
import '../../../../core/errors/app_error.dart';
import '../models/profile_model.dart';
import '../services/profile_service.dart';

class ProfileScreen extends StatefulWidget {
  final ProfileService? profileService;

  const ProfileScreen({
    super.key,
    this.profileService,
  });

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  late final ProfileService _service;
  ProfileModel? _profile;
  bool _isLoading = true;
  bool _isSaving = false;
  String? _errorMessage;

  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;
  late final TextEditingController _phoneController;
  late final TextEditingController _dobController;

  @override
  void initState() {
    super.initState();
    _service = widget.profileService ?? ProfileService();
    _nameController = TextEditingController();
    _phoneController = TextEditingController();
    _dobController = TextEditingController();
    _loadProfile();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _dobController.dispose();
    super.dispose();
  }

  Future<void> _loadProfile() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final p = await _service.getProfile();
      if (mounted) {
        setState(() {
          _profile = p;
          _isLoading = false;
          if (p != null) {
            _nameController.text = p.fullName ?? '';
            _phoneController.text = p.phone ?? '';
            _dobController.text = p.dateOfBirth ?? '';
          }
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = 'Failed to load profile. Please try again.';
        });
      }
    }
  }

  Future<void> _selectDateOfBirth() async {
    DateTime initial = DateTime(1990, 1, 1);
    if (_dobController.text.isNotEmpty) {
      final parsed = DateTime.tryParse(_dobController.text);
      if (parsed != null) initial = parsed;
    }

    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(1920),
      lastDate: DateTime.now(),
      builder: (context, child) {
        final isDark = Theme.of(context).brightness == Brightness.dark;
        return Theme(
          data: isDark ? PrismTheme.darkTheme : PrismTheme.lightTheme,
          child: child!,
        );
      },
    );

    if (picked != null) {
      final formatted =
          '${picked.year.toString().padLeft(4, '0')}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}';
      setState(() {
        _dobController.text = formatted;
      });
    }
  }

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isSaving = true;
      _errorMessage = null;
    });

    try {
      final updated = await _service.updateProfile(
        fullName: _nameController.text.trim(),
        phone: _phoneController.text.trim().isNotEmpty
            ? _phoneController.text.trim()
            : null,
        dateOfBirth: _dobController.text.trim().isNotEmpty
            ? _dobController.text.trim()
            : null,
      );

      if (mounted) {
        setState(() {
          _profile = updated;
          _isSaving = false;
        });

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Profile updated successfully'),
            backgroundColor: PrismTheme.success,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } on AppError catch (e) {
      if (mounted) {
        setState(() {
          _isSaving = false;
          _errorMessage = e.message;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _isSaving = false;
          _errorMessage = 'An unexpected error occurred while saving.';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor:
          isDark ? PrismTheme.backgroundDark : PrismTheme.backgroundLight,
      appBar: AppBar(
        title: const Text('Account Profile'),
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(
                color: PrismTheme.primaryBlue,
                strokeWidth: 2.5,
              ),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Profile Header Card
                    _buildAvatarHeader(context, isDark),
                    const SizedBox(height: 24),

                    if (_errorMessage != null) ...[
                      _buildErrorBanner(context, isDark),
                      const SizedBox(height: 16),
                    ],

                    // Section Title
                    Text(
                      'Personal Information',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: isDark ? Colors.white : PrismTheme.navy,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'This information helps personalize policy analysis and claim dossiers.',
                      style: TextStyle(
                        fontSize: 12,
                        color: isDark
                            ? PrismTheme.textMuted
                            : PrismTheme.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Full Name Field
                    _buildTextField(
                      label: 'Full Name',
                      controller: _nameController,
                      prefixIcon: Icons.person_outline,
                      isDark: isDark,
                      validator: (value) {
                        if (value == null || value.trim().length < 2) {
                          return 'Full name must be at least 2 characters';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 14),

                    // Email Field (Read-only)
                    _buildTextField(
                      label: 'Account Email',
                      initialValue: _profile?.email ?? '',
                      readOnly: true,
                      prefixIcon: Icons.email_outlined,
                      suffixIcon: Icons.lock_outline,
                      isDark: isDark,
                      helperText: 'Email address cannot be changed directly.',
                    ),
                    const SizedBox(height: 14),

                    // Phone Number Field
                    _buildTextField(
                      label: 'Phone Number (Optional)',
                      controller: _phoneController,
                      keyboardType: TextInputType.phone,
                      prefixIcon: Icons.phone_outlined,
                      isDark: isDark,
                      hintText: '+91 XXXXX XXXXX',
                      validator: (value) {
                        if (value != null && value.trim().isNotEmpty) {
                          final digits = value.replaceAll(RegExp(r'\D'), '');
                          if (digits.length < 10) {
                            return 'Enter a valid 10-digit phone number';
                          }
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 14),

                    // Date of Birth Field
                    _buildTextField(
                      label: 'Date of Birth (Optional)',
                      controller: _dobController,
                      readOnly: true,
                      onTap: _selectDateOfBirth,
                      prefixIcon: Icons.calendar_today_outlined,
                      suffixIcon: Icons.edit_calendar_outlined,
                      isDark: isDark,
                      hintText: 'YYYY-MM-DD',
                    ),
                    const SizedBox(height: 28),

                    // Save Button
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _isSaving ? null : _saveProfile,
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          backgroundColor: PrismTheme.primaryBlue,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: _isSaving
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  color: Colors.white,
                                  strokeWidth: 2,
                                ),
                              )
                            : const Text(
                                'Save Changes',
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                      ),
                    ),
                    const SizedBox(height: 28),

                    // Account Security & Metadata Card
                    _buildAccountMetadataCard(context, isDark),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildAvatarHeader(BuildContext context, bool isDark) {
    final initials = _profile?.initials ?? 'P';
    final name = _profile?.displayName ?? 'Policyholder';
    final email = _profile?.email ?? '';

    return Container(
      padding: const EdgeInsets.all(18),
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
            width: 58,
            height: 58,
            decoration: const BoxDecoration(
              color: PrismTheme.navy,
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                initials,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: TextStyle(
                    fontSize: 17,
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
                    fontSize: 13,
                    color: isDark
                        ? PrismTheme.textMuted
                        : PrismTheme.textSecondary,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 6),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: PrismTheme.success.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.shield_outlined,
                          size: 12, color: PrismTheme.success),
                      SizedBox(width: 4),
                      Flexible(
                        child: Text(
                          'Verified Policyholder',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: PrismTheme.success,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTextField({
    required String label,
    TextEditingController? controller,
    String? initialValue,
    bool readOnly = false,
    VoidCallback? onTap,
    TextInputType? keyboardType,
    IconData? prefixIcon,
    IconData? suffixIcon,
    String? hintText,
    String? helperText,
    String? Function(String?)? validator,
    required bool isDark,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: isDark ? Colors.white70 : PrismTheme.textPrimary,
          ),
        ),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          initialValue: initialValue,
          readOnly: readOnly,
          onTap: onTap,
          keyboardType: keyboardType,
          validator: validator,
          style: TextStyle(
            fontSize: 14,
            color: readOnly
                ? (isDark ? Colors.white54 : Colors.black54)
                : (isDark ? Colors.white : PrismTheme.textPrimary),
          ),
          decoration: InputDecoration(
            hintText: hintText,
            helperText: helperText,
            helperStyle: TextStyle(
              fontSize: 11,
              color: isDark ? PrismTheme.textMuted : PrismTheme.textSecondary,
            ),
            prefixIcon: prefixIcon != null
                ? Icon(prefixIcon,
                    size: 18,
                    color: isDark
                        ? PrismTheme.textMuted
                        : PrismTheme.textSecondary)
                : null,
            suffixIcon: suffixIcon != null
                ? Icon(suffixIcon,
                    size: 18,
                    color: isDark
                        ? PrismTheme.textMuted
                        : PrismTheme.textSecondary)
                : null,
            filled: true,
            fillColor: readOnly
                ? (isDark
                    ? Colors.white.withValues(alpha: 0.04)
                    : const Color(0xFFF9FAFB))
                : (isDark ? PrismTheme.cardDark : Colors.white),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide(
                color: isDark ? PrismTheme.borderDark : PrismTheme.borderSubtle,
              ),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide(
                color: isDark ? PrismTheme.borderDark : PrismTheme.borderSubtle,
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(
                color: PrismTheme.primaryBlue,
                width: 1.5,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildAccountMetadataCard(BuildContext context, bool isDark) {
    final memberSince = _profile?.createdAt != null
        ? '${_profile!.createdAt!.day}/${_profile!.createdAt!.month}/${_profile!.createdAt!.year}'
        : 'Active Session';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? PrismTheme.cardDark : Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isDark ? PrismTheme.borderDark : PrismTheme.borderSubtle,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.lock_outline,
                  size: 16, color: PrismTheme.primaryBlue),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Security & Ownership',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: isDark ? Colors.white : PrismTheme.navy,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          _buildMetaRow('Member Since', memberSince, isDark),
          const SizedBox(height: 6),
          _buildMetaRow('Authorization', 'Supabase RLS', isDark),
          const SizedBox(height: 6),
          _buildMetaRow('Session ID',
              '${_profile?.id.substring(0, 8) ?? 'prism'}...', isDark),
        ],
      ),
    );
  }

  Widget _buildMetaRow(String label, String value, bool isDark) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          flex: 2,
          child: Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: isDark ? PrismTheme.textMuted : PrismTheme.textSecondary,
            ),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          flex: 3,
          child: Text(
            value,
            textAlign: TextAlign.end,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: isDark ? Colors.white70 : PrismTheme.textPrimary,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  Widget _buildErrorBanner(BuildContext context, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFFEE2E2),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFFCA5A5)),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline, color: PrismTheme.error, size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              _errorMessage!,
              style: const TextStyle(
                color: Color(0xFF991B1B),
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
