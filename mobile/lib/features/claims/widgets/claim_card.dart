import 'package:flutter/material.dart';
import '../../../app/theme.dart';
import '../models/claim_model.dart';

class ClaimCard extends StatelessWidget {
  final ClaimModel claim;
  final VoidCallback onTap;

  const ClaimCard({
    super.key,
    required this.claim,
    required this.onTap,
  });

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
    final statusColor = _getStatusColor(claim.status, isDark);
    final statusBg = _getStatusBg(claim.status, isDark);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Container(
        decoration: BoxDecoration(
          color: isDark ? PrismTheme.navySurface : Colors.white,
          borderRadius: BorderRadius.circular(18),
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
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Row 1: Claim Type & Status Badge
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Flexible(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF1E293B) : const Color(0xFFEFF6FF),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: isDark ? PrismTheme.navyBorder : const Color(0xFFDBEAFE),
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.medical_services_outlined,
                          size: 12,
                          color: PrismTheme.primaryBlue,
                        ),
                        const SizedBox(width: 4),
                        Flexible(
                          child: Text(
                            claim.claimType.toUpperCase(),
                            style: const TextStyle(
                              fontSize: 9.5,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 0.5,
                              color: PrismTheme.primaryBlue,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
                  decoration: BoxDecoration(
                    color: statusBg,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: statusColor.withValues(alpha: 0.4)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 5.5,
                        height: 5.5,
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
            ),
            const SizedBox(height: 12),

            // Row 2: Claim Name
            Text(
              claim.claimName,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                letterSpacing: -0.2,
                color: isDark ? Colors.white : PrismTheme.textPrimary,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 6),

            // Row 3: Associated Policy
            if (claim.policy != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Row(
                  children: [
                    Icon(
                      Icons.shield_outlined,
                      size: 14,
                      color: isDark ? PrismTheme.softCyan : PrismTheme.primaryBlue,
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        '${claim.policy!.policyName}${claim.policy!.insurerName != null ? " (${claim.policy!.insurerName})" : ""}',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: isDark ? Colors.white70 : PrismTheme.textSecondary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),

            // Row 4: Hospital & Patient Info
            Wrap(
              spacing: 14,
              runSpacing: 6,
              children: [
                if (claim.hospitalName != null && claim.hospitalName!.isNotEmpty)
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.local_hospital_outlined,
                        size: 13,
                        color: isDark ? Colors.white54 : PrismTheme.textSecondary,
                      ),
                      const SizedBox(width: 4),
                      ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 160),
                        child: Text(
                          claim.hospitalName!,
                          style: TextStyle(
                            fontSize: 11.5,
                            color: isDark ? Colors.white70 : PrismTheme.textSecondary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                if (claim.insuredMember != null && claim.insuredMember!.isNotEmpty)
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.person_outline,
                        size: 13,
                        color: isDark ? Colors.white54 : PrismTheme.textSecondary,
                      ),
                      const SizedBox(width: 4),
                      ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 130),
                        child: Text(
                          claim.insuredMember!,
                          style: TextStyle(
                            fontSize: 11.5,
                            color: isDark ? Colors.white70 : PrismTheme.textSecondary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
              ],
            ),
            const SizedBox(height: 12),
            const Divider(height: 1),
            const SizedBox(height: 12),

            // Row 5: Expense & Preparation Progress
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'ESTIMATED EXPENSE',
                        style: TextStyle(
                          fontSize: 9.5,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.5,
                          color: isDark ? Colors.white38 : PrismTheme.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        claim.formattedExpense,
                        style: TextStyle(
                          fontSize: 13.5,
                          fontWeight: FontWeight.bold,
                          color: isDark ? Colors.white : PrismTheme.textPrimary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 10),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          '${claim.preparationProgress}%',
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: PrismTheme.primaryBlue,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          'prepared',
                          style: TextStyle(
                            fontSize: 10,
                            color: isDark ? Colors.white38 : PrismTheme.textSecondary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    SizedBox(
                      width: 90,
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: (claim.preparationProgress / 100).clamp(0.0, 1.0),
                          minHeight: 5,
                          backgroundColor: isDark ? Colors.white12 : const Color(0xFFE2E8F0),
                          valueColor: AlwaysStoppedAnimation<Color>(
                            claim.preparationProgress >= 80
                                ? const Color(0xFF10B981)
                                : PrismTheme.primaryBlue,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
