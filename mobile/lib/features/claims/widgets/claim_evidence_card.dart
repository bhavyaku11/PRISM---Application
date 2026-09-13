import 'package:flutter/material.dart';
import '../../../app/theme.dart';
import '../models/claim_model.dart';
import '../services/claim_service.dart';

class ClaimEvidenceCard extends StatefulWidget {
  final ClaimModel claim;
  final List<PolicyEvidenceItem>? initialEvidence;
  final ClaimService? claimService;

  const ClaimEvidenceCard({
    super.key,
    required this.claim,
    this.initialEvidence,
    this.claimService,
  });

  @override
  State<ClaimEvidenceCard> createState() => _ClaimEvidenceCardState();
}

class _ClaimEvidenceCardState extends State<ClaimEvidenceCard> {
  late final ClaimService _claimService;

  String _selectedTopicId = 'general';
  List<PolicyEvidenceItem> _evidenceList = [];
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _claimService = widget.claimService ?? ClaimService();

    if (widget.initialEvidence != null) {
      _evidenceList = widget.initialEvidence!;
    } else {
      _loadEvidence();
    }
  }

  Future<void> _loadEvidence([String? topicId]) async {
    final tId = topicId ?? _selectedTopicId;
    final topic = kClaimEvidenceTopics.firstWhere(
      (t) => t.id == tId,
      orElse: () => kClaimEvidenceTopics.first,
    );

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final items = await _claimService.getPolicyEvidence(
        policyId: widget.claim.policyId,
        claimType: widget.claim.claimType,
        claim: widget.claim,
        topicQuery: topic.querySuffix,
      );

      if (!mounted) return;
      setState(() {
        _evidenceList = items;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _errorMessage = 'Could not load policy evidence. Please try again.';
      });
    }
  }

  void _showFullClauseModal(BuildContext context, PolicyEvidenceItem item) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          constraints: BoxConstraints(
            maxHeight: MediaQuery.of(ctx).size.height * 0.8,
          ),
          decoration: BoxDecoration(
            color: isDark ? PrismTheme.navyDark : Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: SafeArea(
            top: false,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Center(
                  child: Container(
                    margin: const EdgeInsets.only(top: 12, bottom: 8),
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: isDark ? Colors.white24 : Colors.black12,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              item.sectionTitle,
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: isDark ? Colors.white : PrismTheme.textPrimary,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Page ${item.pageNumber ?? "N/A"} · ${(item.similarity * 100).toStringAsFixed(1)}% match',
                              style: TextStyle(
                                fontSize: 12,
                                color: isDark ? PrismTheme.textSecondaryDark : PrismTheme.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, size: 20),
                        onPressed: () => Navigator.of(ctx).pop(),
                      ),
                    ],
                  ),
                ),
                const Divider(height: 1),
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(20),
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF090F1A) : const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isDark ? PrismTheme.navyBorder : const Color(0xFFE2E8F0),
                        ),
                      ),
                      child: SelectableText(
                        item.content,
                        style: TextStyle(
                          fontSize: 13,
                          height: 1.55,
                          fontFamily: 'monospace',
                          color: isDark ? const Color(0xFFCBD5E1) : const Color(0xFF334155),
                        ),
                      ),
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  child: OutlinedButton(
                    onPressed: () => Navigator.of(ctx).pop(),
                    style: OutlinedButton.styleFrom(
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text('Close'),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section Header
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'POTENTIALLY RELEVANT POLICY EVIDENCE',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.8,
                    color: isDark ? PrismTheme.textSecondaryDark : PrismTheme.textSecondary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Grounded clauses from your policy document',
                  style: TextStyle(
                    fontSize: 12,
                    color: isDark ? PrismTheme.textSecondaryDark : PrismTheme.textSecondary,
                  ),
                ),
              ],
            ),
            IconButton(
              icon: const Icon(Icons.refresh, size: 18),
              tooltip: 'Refresh evidence',
              onPressed: () => _loadEvidence(),
            ),
          ],
        ),
        const SizedBox(height: 12),

        // Topic selector horizontal chips
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: kClaimEvidenceTopics.map((topic) {
              final isSelected = topic.id == _selectedTopicId;
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: ChoiceChip(
                  label: Text(topic.label),
                  labelStyle: TextStyle(
                    fontSize: 11,
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                    color: isSelected
                        ? Colors.white
                        : (isDark ? Colors.white70 : PrismTheme.textPrimary),
                  ),
                  selected: isSelected,
                  selectedColor: PrismTheme.primaryBlue,
                  backgroundColor: isDark ? PrismTheme.navySurface : const Color(0xFFF1F5F9),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                    side: BorderSide(
                      color: isSelected
                          ? PrismTheme.primaryBlue
                          : (isDark ? PrismTheme.navyBorder : const Color(0xFFCBD5E1)),
                    ),
                  ),
                  onSelected: (val) {
                    if (val) {
                      setState(() {
                        _selectedTopicId = topic.id;
                      });
                      _loadEvidence(topic.id);
                    }
                  },
                ),
              );
            }).toList(),
          ),
        ),
        const SizedBox(height: 16),

        // Loading or Error or Evidence Cards List
        if (_isLoading)
          const Center(
            child: Padding(
              padding: EdgeInsets.all(24),
              child: CircularProgressIndicator(
                strokeWidth: 2.5,
                valueColor: AlwaysStoppedAnimation<Color>(PrismTheme.primaryBlue),
              ),
            ),
          )
        else if (_errorMessage != null)
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF450A0A) : const Color(0xFFFEE2E2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                const Icon(Icons.error_outline, size: 16, color: Color(0xFFDC2626)),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    _errorMessage!,
                    style: TextStyle(
                      fontSize: 12,
                      color: isDark ? const Color(0xFFFCA5A5) : const Color(0xFF991B1B),
                    ),
                  ),
                ),
              ],
            ),
          )
        else if (_evidenceList.isEmpty)
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: isDark ? PrismTheme.navySurface : const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: isDark ? PrismTheme.navyBorder : const Color(0xFFE2E8F0),
              ),
            ),
            child: Center(
              child: Column(
                children: [
                  Icon(
                    Icons.find_in_page_outlined,
                    size: 32,
                    color: isDark ? Colors.white38 : PrismTheme.textMuted,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'No policy clauses matched this topic.',
                    style: TextStyle(
                      fontSize: 12.5,
                      color: isDark ? PrismTheme.textSecondaryDark : PrismTheme.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          )
        else
          ..._evidenceList.map((item) {
            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(16),
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
                  // Row 1: Section Title & Similarity Match Badge
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          item.sectionTitle,
                          style: TextStyle(
                            fontSize: 13.5,
                            fontWeight: FontWeight.bold,
                            color: isDark ? Colors.white : PrismTheme.textPrimary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                        decoration: BoxDecoration(
                          color: isDark ? Colors.white10 : const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          '${(item.similarity * 100).toStringAsFixed(1)}% match',
                          style: const TextStyle(
                            fontSize: 10,
                            fontFamily: 'monospace',
                            fontWeight: FontWeight.bold,
                            color: PrismTheme.primaryBlue,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),

                  // Row 2: Page Citation Chip
                  Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF162032) : const Color(0xFFEFF6FF),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(
                        color: isDark ? PrismTheme.navyBorder : const Color(0xFFDBEAFE),
                      ),
                    ),
                    child: Text(
                      'Page ${item.pageNumber ?? "N/A"}',
                      style: const TextStyle(
                        fontSize: 10.5,
                        fontWeight: FontWeight.w700,
                        color: PrismTheme.primaryBlue,
                      ),
                    ),
                  ),

                  // Row 3: Why It Matters Rationale Box
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: isDark ? PrismTheme.navyBorder : const Color(0xFFE2E8F0),
                      ),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(
                          Icons.lightbulb_outline,
                          size: 14,
                          color: PrismTheme.softCyan,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            item.whyItMatters,
                            style: TextStyle(
                              fontSize: 11.5,
                              height: 1.4,
                              color: isDark ? Colors.white70 : const Color(0xFF334155),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 10),

                  // Row 4: Verbatim Content Preview
                  Text(
                    item.content,
                    style: TextStyle(
                      fontSize: 12,
                      height: 1.45,
                      color: isDark ? PrismTheme.textSecondaryDark : PrismTheme.textSecondary,
                    ),
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 6),

                  // Row 5: View full clause action
                  TextButton(
                    onPressed: () => _showFullClauseModal(context, item),
                    style: TextButton.styleFrom(
                      padding: EdgeInsets.zero,
                      minimumSize: const Size(0, 24),
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                    child: const Text(
                      'View full clause excerpt →',
                      style: TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w600,
                        color: PrismTheme.primaryBlue,
                      ),
                    ),
                  ),
                ],
              ),
            );
          }),
      ],
    );
  }
}
