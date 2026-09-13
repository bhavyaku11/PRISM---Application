import 'dart:io';
import 'dart:typed_data';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import '../../../app/theme.dart';
import '../models/claim_model.dart';
import '../services/claim_service.dart';

class ClaimDocumentChecklist extends StatefulWidget {
  final ClaimModel claim;
  final List<ClaimDocumentModel> claimDocuments;
  final ClaimService? claimService;
  final VoidCallback onDocumentsChanged;

  const ClaimDocumentChecklist({
    super.key,
    required this.claim,
    required this.claimDocuments,
    this.claimService,
    required this.onDocumentsChanged,
  });

  @override
  State<ClaimDocumentChecklist> createState() => _ClaimDocumentChecklistState();
}

class _ClaimDocumentChecklistState extends State<ClaimDocumentChecklist> {
  late final ClaimService _claimService;

  bool _isUploading = false;
  String? _uploadingCategory;
  String? _actionError;

  @override
  void initState() {
    super.initState();
    _claimService = widget.claimService ?? ClaimService();
  }

  ClaimDocumentModel? _findMatchingDocument(String categoryId) {
    for (final doc in widget.claimDocuments) {
      if (doc.category.toLowerCase() == categoryId.toLowerCase()) {
        return doc;
      }
      final notes = (doc.notes ?? '').toLowerCase();
      if (notes.contains(categoryId.toLowerCase())) {
        return doc;
      }
    }
    return null;
  }

  Future<void> _pickAndUploadFile([String? targetCategory]) async {
    setState(() {
      _actionError = null;
    });

    try {
      String categoryToUse = targetCategory ?? 'other';
      if (targetCategory == null) {
        final chosen = await _showCategoryPickerDialog(context);
        if (chosen == null) return;
        categoryToUse = chosen;
      }

      final file = await FilePicker.pickFile(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'],
      );

      if (file == null) return;

      Uint8List? bytes;
      try {
        bytes = await file.readAsBytes();
      } catch (_) {
        if (file.path != null) {
          try {
            bytes = await File(file.path!).readAsBytes();
          } catch (_) {}
        }
      }

      if (bytes == null || bytes.isEmpty) {
        if (!mounted) return;
        setState(() {
          _actionError = 'Could not read file data. Please try another file.';
        });
        return;
      }

      if (!mounted) return;
      setState(() {
        _isUploading = true;
        _uploadingCategory = categoryToUse;
      });

      await _claimService.uploadClaimDocument(
        claimId: widget.claim.id,
        policyId: widget.claim.policyId,
        fileName: file.name,
        fileBytes: bytes,
        category: categoryToUse,
      );

      if (!mounted) return;
      setState(() {
        _isUploading = false;
        _uploadingCategory = null;
      });
      widget.onDocumentsChanged();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isUploading = false;
        _uploadingCategory = null;
        _actionError = e.toString().replaceFirst('Exception: ', '');
      });
    }
  }

  Future<String?> _showCategoryPickerDialog(BuildContext context) async {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return showDialog<String>(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          backgroundColor: isDark ? PrismTheme.navyDark : Colors.white,
          title: const Text('Select Document Category', style: TextStyle(fontSize: 16)),
          content: SizedBox(
            width: double.maxFinite,
            child: ListView.separated(
              shrinkWrap: true,
              itemCount: kClaimDocumentCategories.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (context, idx) {
                final cat = kClaimDocumentCategories[idx];
                return ListTile(
                  dense: true,
                  contentPadding: EdgeInsets.zero,
                  title: Text(cat.label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                  subtitle: Text(
                    cat.isMandatory ? 'Mandatory' : 'Optional',
                    style: TextStyle(
                      fontSize: 11,
                      color: cat.isMandatory ? Colors.amber[800] : Colors.grey,
                    ),
                  ),
                  onTap: () => Navigator.of(ctx).pop(cat.id),
                );
              },
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('Cancel'),
            ),
          ],
        );
      },
    );
  }

  Future<void> _handleDeleteDocument(ClaimDocumentModel doc) async {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: isDark ? PrismTheme.navyDark : Colors.white,
        title: const Text('Remove Document?', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        content: Text(
          'Are you sure you want to remove "${doc.displayName}" from this claim?',
          style: const TextStyle(fontSize: 13),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFDC2626),
              foregroundColor: Colors.white,
            ),
            child: const Text('Remove'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    try {
      await _claimService.deleteClaimDocument(doc.id, claimId: widget.claim.id);
      if (!mounted) return;
      widget.onDocumentsChanged();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _actionError = 'Could not remove document. Please try again.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final readiness = calculateClaimReadiness(widget.claimDocuments);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Error Notice
        if (_actionError != null)
          Container(
            margin: const EdgeInsets.only(bottom: 16),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF450A0A) : const Color(0xFFFEE2E2),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isDark ? const Color(0xFF991B1B) : const Color(0xFFFCA5A5),
              ),
            ),
            child: Row(
              children: [
                const Icon(Icons.error_outline, size: 16, color: Color(0xFFDC2626)),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    _actionError!,
                    style: TextStyle(
                      fontSize: 12,
                      color: isDark ? const Color(0xFFFCA5A5) : const Color(0xFF991B1B),
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close, size: 16),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                  onPressed: () => setState(() => _actionError = null),
                ),
              ],
            ),
          ),

        // Section 1 Header & General Upload Button
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'DOCUMENT CHECKLIST',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.8,
                    color: isDark ? PrismTheme.textSecondaryDark : PrismTheme.textSecondary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '${readiness.uploadedMandatoryCount} of ${readiness.totalMandatoryCount} Mandatory Items Uploaded',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: readiness.uploadedMandatoryCount == readiness.totalMandatoryCount
                        ? const Color(0xFF10B981)
                        : (isDark ? Colors.white70 : PrismTheme.textPrimary),
                  ),
                ),
              ],
            ),
            OutlinedButton.icon(
              onPressed: _isUploading ? null : () => _pickAndUploadFile(),
              icon: _isUploading && _uploadingCategory == 'other'
                  ? const SizedBox(
                      width: 14,
                      height: 14,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.upload_file_outlined, size: 16),
              label: const Text('Add Document', style: TextStyle(fontSize: 12)),
              style: OutlinedButton.styleFrom(
                foregroundColor: PrismTheme.primaryBlue,
                side: const BorderSide(color: PrismTheme.primaryBlue),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),

        // Section 2: Standard Requirements Checklist
        ...kClaimDocumentCategories.map((cat) {
          final matchedDoc = _findMatchingDocument(cat.id);
          final isReady = matchedDoc != null;
          final isThisUploading = _isUploading && _uploadingCategory == cat.id;

          return Container(
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: isDark ? PrismTheme.navySurface : Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: isReady
                    ? (isDark ? const Color(0xFF047857) : const Color(0xFFA7F3D0))
                    : (isDark ? PrismTheme.navyBorder : const Color(0xFFE2E8F0)),
              ),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Status Icon
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: isReady
                        ? (isDark ? const Color(0xFF064E3B) : const Color(0xFFECFDF5))
                        : (cat.isMandatory
                            ? (isDark ? const Color(0xFF451A03) : const Color(0xFFFFFBEB))
                            : (isDark ? Colors.white10 : const Color(0xFFF1F5F9))),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    isReady
                        ? Icons.check
                        : (cat.isMandatory ? Icons.priority_high : Icons.help_outline),
                    size: 14,
                    color: isReady
                        ? const Color(0xFF10B981)
                        : (cat.isMandatory ? const Color(0xFFF59E0B) : Colors.grey),
                  ),
                ),
                const SizedBox(width: 12),

                // Content
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              cat.label,
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                color: isDark ? Colors.white : PrismTheme.textPrimary,
                              ),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                            decoration: BoxDecoration(
                              color: isReady
                                  ? (isDark ? const Color(0xFF064E3B) : const Color(0xFFECFDF5))
                                  : (cat.isMandatory
                                      ? (isDark ? const Color(0xFF451A03) : const Color(0xFFFFFBEB))
                                      : (isDark ? Colors.white10 : const Color(0xFFF1F5F9))),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              isReady
                                  ? 'READY'
                                  : (cat.isMandatory ? 'REQUIRED' : 'OPTIONAL'),
                              style: TextStyle(
                                fontSize: 9,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 0.4,
                                color: isReady
                                    ? const Color(0xFF10B981)
                                    : (cat.isMandatory ? const Color(0xFFF59E0B) : Colors.grey),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 3),
                      Text(
                        isReady
                            ? 'Attached: ${matchedDoc.displayName} (${matchedDoc.formattedFileSize})'
                            : cat.description,
                        style: TextStyle(
                          fontSize: 11,
                          color: isReady
                              ? (isDark ? const Color(0xFF6EE7B7) : const Color(0xFF047857))
                              : (isDark ? PrismTheme.textSecondaryDark : PrismTheme.textSecondary),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),

                // Upload or Remove action
                if (!isReady)
                  IconButton(
                    icon: isThisUploading
                        ? const SizedBox(
                            width: 14,
                            height: 14,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.file_upload_outlined, size: 18),
                    tooltip: 'Upload ${cat.label}',
                    color: PrismTheme.primaryBlue,
                    onPressed: _isUploading ? null : () => _pickAndUploadFile(cat.id),
                  )
                else
                  IconButton(
                    icon: const Icon(Icons.delete_outline, size: 18),
                    tooltip: 'Remove document',
                    color: Colors.red[400],
                    onPressed: () => _handleDeleteDocument(matchedDoc),
                  ),
              ],
            ),
          );
        }),

        // Section 3: All Attached Files Summary
        if (widget.claimDocuments.isNotEmpty) ...[
          const SizedBox(height: 16),
          Text(
            'ATTACHED VAULT DOCUMENTS (${widget.claimDocuments.length})',
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.8,
              color: isDark ? PrismTheme.textSecondaryDark : PrismTheme.textSecondary,
            ),
          ),
          const SizedBox(height: 10),
          ...widget.claimDocuments.map((doc) {
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: isDark ? PrismTheme.navySurface : const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isDark ? PrismTheme.navyBorder : const Color(0xFFE2E8F0),
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.description_outlined,
                    size: 18,
                    color: isDark ? PrismTheme.softCyan : PrismTheme.primaryBlue,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          doc.displayName,
                          style: TextStyle(
                            fontSize: 12.5,
                            fontWeight: FontWeight.w600,
                            color: isDark ? Colors.white : PrismTheme.textPrimary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          '${getCategoryLabel(doc.category)} · ${doc.formattedFileSize}',
                          style: TextStyle(
                            fontSize: 10.5,
                            color: isDark ? PrismTheme.textSecondaryDark : PrismTheme.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.delete_outline, size: 16),
                    color: Colors.red[400],
                    tooltip: 'Delete document',
                    onPressed: () => _handleDeleteDocument(doc),
                  ),
                ],
              ),
            );
          }),
        ],
      ],
    );
  }
}
