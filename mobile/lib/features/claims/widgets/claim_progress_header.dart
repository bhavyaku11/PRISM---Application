import 'package:flutter/material.dart';
import '../../../app/theme.dart';
import '../models/claim_model.dart';

class ClaimProgressHeader extends StatelessWidget {
  final ClaimModel claim;
  final int attachedDocumentsCount;
  final ClaimReadiness readiness;

  const ClaimProgressHeader({
    super.key,
    required this.claim,
    required this.attachedDocumentsCount,
    required this.readiness,
  });

  Color _getProgressColor(int progress) {
    if (progress >= 85) return const Color(0xFF10B981);
    if (progress >= 50) return PrismTheme.primaryBlue;
    return const Color(0xFFF59E0B);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final progress = claim.preparationProgress;
    final progressColor = _getProgressColor(progress);

    final hasHospital = claim.hospitalName != null && claim.hospitalName!.isNotEmpty;
    final hasExpense = claim.estimatedExpense != null && claim.estimatedExpense! > 0;
    final hasDetails = claim.claimName.isNotEmpty && hasHospital;
    final hasNotes = claim.notes != null && claim.notes!.isNotEmpty;

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: isDark ? PrismTheme.navySurface : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? PrismTheme.navyBorder : const Color(0xFFE2E8F0),
        ),
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
          Row(
            children: [
              // Circular Progress Indicator
              Stack(
                alignment: Alignment.center,
                children: [
                  SizedBox(
                    width: 58,
                    height: 58,
                    child: CircularProgressIndicator(
                      value: (progress / 100).clamp(0.0, 1.0),
                      strokeWidth: 6,
                      backgroundColor: isDark ? Colors.white12 : const Color(0xFFE2E8F0),
                      valueColor: AlwaysStoppedAnimation<Color>(progressColor),
                    ),
                  ),
                  Text(
                    '$progress%',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: isDark ? Colors.white : PrismTheme.textPrimary,
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 16),
              // Header description
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Preparation Progress',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: isDark ? Colors.white : PrismTheme.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      '${readiness.uploadedMandatoryCount} of ${readiness.totalMandatoryCount} mandatory documents ready',
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
          const SizedBox(height: 12),

          // Milestone Badges Row
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _buildMilestonePill(
                label: 'Details',
                isDone: hasDetails && hasExpense,
                isDark: isDark,
              ),
              _buildMilestonePill(
                label: 'Mandatory Docs (${readiness.uploadedMandatoryCount}/${readiness.totalMandatoryCount})',
                isDone: readiness.uploadedMandatoryCount == readiness.totalMandatoryCount,
                isDark: isDark,
              ),
              _buildMilestonePill(
                label: 'Notes & Reminders',
                isDone: hasNotes,
                isDark: isDark,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMilestonePill({
    required String label,
    required bool isDone,
    required bool isDark,
  }) {
    final color = isDone
        ? (isDark ? const Color(0xFF34D399) : const Color(0xFF059669))
        : (isDark ? Colors.white38 : PrismTheme.textSecondary);
    final bg = isDone
        ? (isDark ? const Color(0xFF064E3B) : const Color(0xFFECFDF5))
        : (isDark ? Colors.white10 : const Color(0xFFF1F5F9));

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: isDone
              ? color.withValues(alpha: 0.4)
              : (isDark ? PrismTheme.navyBorder : const Color(0xFFCBD5E1)),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            isDone ? Icons.check_circle : Icons.radio_button_unchecked,
            size: 13,
            color: color,
          ),
          const SizedBox(width: 5),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}
