import 'dart:io';
import 'dart:typed_data';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../app/theme.dart';
import '../services/policy_upload_service.dart';
import 'camera_scan_screen.dart';

class AddPolicyScreen extends StatefulWidget {
  final PolicyUploadService? uploadService;
  final Uint8List? initialFileBytes;
  final String? initialFileName;

  const AddPolicyScreen({
    super.key,
    this.uploadService,
    this.initialFileBytes,
    this.initialFileName,
  });

  @override
  State<AddPolicyScreen> createState() => _AddPolicyScreenState();
}

class _AddPolicyScreenState extends State<AddPolicyScreen> {
  late final PolicyUploadService _uploadService;

  final _formKey = GlobalKey<FormState>();
  final _policyNameController = TextEditingController();
  final _insurerNameController = TextEditingController();
  final _policyNumberController = TextEditingController();
  final _policyTypeController = TextEditingController(text: 'Health Insurance');
  final _insuredMemberController = TextEditingController();
  final _sumInsuredController = TextEditingController();

  Uint8List? _selectedFileBytes;
  String? _selectedFileName;
  int? _scannedPageCount;

  bool _isUploading = false;
  String _uploadStepMessage = 'Preparing document...';
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _uploadService = widget.uploadService ?? PolicyUploadService();

    if (widget.initialFileBytes != null && widget.initialFileName != null) {
      _selectedFileBytes = widget.initialFileBytes;
      _selectedFileName = widget.initialFileName;
    }
  }

  @override
  void dispose() {
    _policyNameController.dispose();
    _insurerNameController.dispose();
    _policyNumberController.dispose();
    _policyTypeController.dispose();
    _insuredMemberController.dispose();
    _sumInsuredController.dispose();
    super.dispose();
  }

  String _formatFileSize(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(2)} MB';
  }

  Future<void> _pickPdfFile() async {
    setState(() {
      _errorMessage = null;
    });

    try {
      final file = await FilePicker.pickFile(
        type: FileType.custom,
        allowedExtensions: ['pdf'],
      );

      if (file != null) {
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
          setState(() {
            _errorMessage = 'Could not read the selected file. Please try again.';
          });
          return;
        }

        final validation = _uploadService.validatePdfBytes(bytes);
        if (!validation.isValid) {
          setState(() {
            _errorMessage = validation.errorMessage;
          });
          return;
        }

        setState(() {
          _selectedFileBytes = bytes;
          _selectedFileName = file.name;
          _scannedPageCount = null;
          // Auto-suggest policy name if currently empty
          if (_policyNameController.text.trim().isEmpty) {
            final baseName = file.name.replaceAll(RegExp(r'\.pdf$', caseSensitive: false), '');
            _policyNameController.text = baseName.replaceAll('_', ' ');
          }
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'An error occurred while picking the file: $e';
      });
    }
  }

  Future<void> _openCameraScanner() async {
    setState(() {
      _errorMessage = null;
    });

    final result = await Navigator.push<ScannedDocumentResult>(
      context,
      MaterialPageRoute(
        builder: (context) => CameraScanScreen(
          uploadService: _uploadService,
        ),
      ),
    );

    if (result != null) {
      setState(() {
        _selectedFileBytes = result.pdfBytes;
        _selectedFileName = result.fileName;
        _scannedPageCount = result.pageCount;
        if (_policyNameController.text.trim().isEmpty) {
          _policyNameController.text = 'Scanned Health Policy';
        }
      });
    }
  }

  void _clearSelectedDocument() {
    setState(() {
      _selectedFileBytes = null;
      _selectedFileName = null;
      _scannedPageCount = null;
    });
  }

  Future<void> _handleSubmit() async {
    setState(() {
      _errorMessage = null;
    });

    if (_selectedFileBytes == null || _selectedFileName == null) {
      setState(() {
        _errorMessage = 'Please select a PDF policy document or scan pages with your camera.';
      });
      return;
    }

    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isUploading = true;
      _uploadStepMessage = 'Validating document...';
    });

    try {
      num? sumInsured;
      final sumStr = _sumInsuredController.text.replaceAll(',', '').trim();
      if (sumStr.isNotEmpty) {
        sumInsured = num.tryParse(sumStr);
      }

      final result = await _uploadService.createPolicyAndUpload(
        policyName: _policyNameController.text.trim(),
        insurerName: _insurerNameController.text.trim(),
        policyNumber: _policyNumberController.text.trim(),
        policyType: _policyTypeController.text.trim(),
        insuredMember: _insuredMemberController.text.trim(),
        sumInsured: sumInsured,
        fileName: _selectedFileName!,
        fileBytes: _selectedFileBytes!,
        onProgress: (step) {
          if (mounted) {
            setState(() {
              _uploadStepMessage = step;
            });
          }
        },
      );

      // Trigger processing endpoint in background/transition
      _uploadService.triggerProcessing(result.documentId).catchError((_) => <String, dynamic>{});

      if (mounted) {
        context.go('/policies/${result.policy.id}/processing');
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isUploading = false;
          _errorMessage = e.toString().replaceFirst('Exception: ', '');
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? PrismTheme.navyDark : PrismTheme.backgroundLight,
      appBar: AppBar(
        title: const Text('Add Policy'),
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
      ),
      body: _isUploading
          ? _buildUploadingView(isDark)
          : ListView(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
              children: [
                // Header text
                Text(
                  'Add your health policy',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                    color: isDark ? Colors.white : PrismTheme.textPrimary,
                    letterSpacing: -0.3,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Upload your policy document so PRISM can organize and explain your coverage.',
                  style: TextStyle(
                    fontSize: 13,
                    color: isDark ? Colors.white60 : PrismTheme.textSecondary,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 20),

                // Error Message
                if (_errorMessage != null) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEF2F2),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFFECACA)),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.error_outline, color: Color(0xFFDC2626), size: 18),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _errorMessage!,
                            style: const TextStyle(fontSize: 12, color: Color(0xFF991B1B), height: 1.3),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // 1. Document Selection / Preview Card
                if (_selectedFileBytes == null)
                  _buildSelectionOptions(isDark)
                else
                  _buildSelectedDocumentPreview(isDark),

                const SizedBox(height: 24),

                // 2. Policy Details Form
                Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'POLICY DETAILS',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.8,
                          color: isDark ? Colors.white54 : PrismTheme.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 12),

                      // Policy Name (Required)
                      TextFormField(
                        controller: _policyNameController,
                        decoration: const InputDecoration(
                          labelText: 'Policy Name *',
                          hintText: 'e.g. Optima Secure Individual',
                        ),
                        validator: (val) {
                          if (val == null || val.trim().isEmpty) {
                            return 'Please enter policy name';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 14),

                      // Insurer Name (Required)
                      TextFormField(
                        controller: _insurerNameController,
                        decoration: const InputDecoration(
                          labelText: 'Insurer Company *',
                          hintText: 'e.g. HDFC ERGO, Star Health, Care',
                        ),
                        validator: (val) {
                          if (val == null || val.trim().isEmpty) {
                            return 'Please enter the insurance company name';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 14),

                      // Policy Number (Optional)
                      TextFormField(
                        controller: _policyNumberController,
                        decoration: const InputDecoration(
                          labelText: 'Policy Number (Optional)',
                          hintText: 'e.g. 2828/3321/99201',
                        ),
                      ),
                      const SizedBox(height: 14),

                      // Insured Member (Optional)
                      TextFormField(
                        controller: _insuredMemberController,
                        decoration: const InputDecoration(
                          labelText: 'Insured Member (Optional)',
                          hintText: 'e.g. Self, Spouse, Parents',
                        ),
                      ),
                      const SizedBox(height: 14),

                      // Sum Insured (Optional)
                      TextFormField(
                        controller: _sumInsuredController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                          labelText: 'Sum Insured (₹ Optional)',
                          hintText: 'e.g. 1000000',
                          prefixText: '₹ ',
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 32),

                // Submit Action CTA
                ElevatedButton(
                  onPressed: _handleSubmit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: PrismTheme.primaryBlue,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  child: const FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.lock_outline, size: 16),
                        SizedBox(width: 8),
                        Text(
                          'Upload & Start Processing',
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 14),
                Text(
                  'Your document is securely stored in a private vault with end-to-end access control.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 11,
                    color: isDark ? Colors.white38 : PrismTheme.textMuted,
                  ),
                ),
              ],
            ),
    );
  }

  // ===========================================================================
  // DOCUMENT SELECTION CARDS
  // ===========================================================================
  Widget _buildSelectionOptions(bool isDark) {
    return Column(
      children: [
        // Option 1: PDF Upload Card
        InkWell(
          onTap: _pickPdfFile,
          borderRadius: BorderRadius.circular(16),
          child: Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: isDark ? PrismTheme.navySurface : Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isDark ? PrismTheme.navyBorder : PrismTheme.borderSubtle,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.03),
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
                  decoration: BoxDecoration(
                    color: PrismTheme.primaryBlue.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.picture_as_pdf_outlined, color: PrismTheme.primaryBlue, size: 24),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Upload PDF Document',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: isDark ? Colors.white : PrismTheme.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Select official policy schedule or wording PDF (Up to 25 MB)',
                        style: TextStyle(
                          fontSize: 12,
                          color: isDark ? Colors.white60 : PrismTheme.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(
                  Icons.arrow_forward_ios,
                  size: 14,
                  color: isDark ? Colors.white38 : PrismTheme.textMuted,
                ),
              ],
            ),
          ),
        ),

        const SizedBox(height: 12),

        // Option 2: Camera Scanner Card
        InkWell(
          onTap: _openCameraScanner,
          borderRadius: BorderRadius.circular(16),
          child: Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: isDark ? PrismTheme.navySurface : Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isDark ? PrismTheme.navyBorder : PrismTheme.borderSubtle,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.03),
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
                  decoration: BoxDecoration(
                    color: const Color(0xFF10B981).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.document_scanner_outlined, color: Color(0xFF059669), size: 24),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Scan with Camera',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: isDark ? Colors.white : PrismTheme.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Capture photos of physical policy pages directly',
                        style: TextStyle(
                          fontSize: 12,
                          color: isDark ? Colors.white60 : PrismTheme.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(
                  Icons.arrow_forward_ios,
                  size: 14,
                  color: isDark ? Colors.white38 : PrismTheme.textMuted,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // ===========================================================================
  // SELECTED DOCUMENT PREVIEW CARD
  // ===========================================================================
  Widget _buildSelectedDocumentPreview(bool isDark) {
    final isCamera = _scannedPageCount != null;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? PrismTheme.navySurface : const Color(0xFFF0FDF4),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? const Color(0xFF065F46) : const Color(0xFFA7F3D0),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: const Color(0xFF059669).withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              isCamera ? Icons.document_scanner_outlined : Icons.picture_as_pdf,
              color: const Color(0xFF059669),
              size: 22,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _selectedFileName ?? 'Policy Document',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: isDark ? Colors.white : PrismTheme.textPrimary,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Row(
                  children: [
                    Text(
                      _formatFileSize(_selectedFileBytes!.length),
                      style: TextStyle(
                        fontSize: 12,
                        color: isDark ? Colors.white60 : PrismTheme.textSecondary,
                      ),
                    ),
                    if (isCamera) ...[
                      const SizedBox(width: 6),
                      Flexible(
                        child: Text(
                          '• $_scannedPageCount pages scanned',
                          style: const TextStyle(
                            fontSize: 12,
                            color: Color(0xFF059669),
                            fontWeight: FontWeight.w600,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.close, size: 18),
            tooltip: 'Remove',
            onPressed: _clearSelectedDocument,
          ),
        ],
      ),
    );
  }

  // ===========================================================================
  // UPLOADING PROGRESS VIEW
  // ===========================================================================
  Widget _buildUploadingView(bool isDark) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const SizedBox(
              width: 56,
              height: 56,
              child: CircularProgressIndicator(
                strokeWidth: 3,
                color: PrismTheme.primaryBlue,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Uploading Policy',
              style: TextStyle(
                fontSize: 19,
                fontWeight: FontWeight.w700,
                color: isDark ? Colors.white : PrismTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _uploadStepMessage,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 14,
                color: PrismTheme.primaryBlue,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Please do not close the app while we securely store and index your policy document.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 12,
                color: isDark ? Colors.white54 : PrismTheme.textSecondary,
                height: 1.4,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
