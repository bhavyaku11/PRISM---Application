import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../../app/theme.dart';
import '../services/policy_upload_service.dart';

class ScannedDocumentResult {
  final Uint8List pdfBytes;
  final int pageCount;
  final String fileName;

  const ScannedDocumentResult({
    required this.pdfBytes,
    required this.pageCount,
    required this.fileName,
  });
}

class CameraScanScreen extends StatefulWidget {
  final ImagePicker? imagePicker;
  final List<Uint8List>? initialPages;
  final PolicyUploadService? uploadService;

  const CameraScanScreen({
    super.key,
    this.imagePicker,
    this.initialPages,
    this.uploadService,
  });

  @override
  State<CameraScanScreen> createState() => _CameraScanScreenState();
}

class _CameraScanScreenState extends State<CameraScanScreen> {
  late final ImagePicker _picker;
  late final PolicyUploadService _uploadService;
  final List<Uint8List> _pages = [];
  bool _isConverting = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _picker = widget.imagePicker ?? ImagePicker();
    _uploadService = widget.uploadService ?? PolicyUploadService();

    if (widget.initialPages != null) {
      _pages.addAll(widget.initialPages!);
    } else {
      // Prompt camera capture on screen open
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _capturePage();
      });
    }
  }

  Future<void> _capturePage() async {
    setState(() {
      _errorMessage = null;
    });

    try {
      final photo = await _picker.pickImage(
        source: ImageSource.camera,
        imageQuality: 85,
        maxWidth: 1800,
        maxHeight: 2400,
      );

      if (photo != null) {
        final bytes = await photo.readAsBytes();
        if (mounted) {
          setState(() {
            _pages.add(bytes);
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage =
              'Camera permission is required to scan a policy. Please grant permission in settings or upload a PDF document.';
        });
      }
    }
  }

  void _removePage(int index) {
    if (index >= 0 && index < _pages.length) {
      setState(() {
        _pages.removeAt(index);
      });
    }
  }

  Future<void> _confirmAndCompilePdf() async {
    if (_pages.isEmpty) {
      setState(() {
        _errorMessage = 'Please scan at least one page before confirming.';
      });
      return;
    }

    setState(() {
      _isConverting = true;
      _errorMessage = null;
    });

    try {
      final pdfBytes = await _uploadService.convertImagesToPdf(_pages);
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final fileName = 'scanned_policy_$timestamp.pdf';

      if (mounted) {
        Navigator.pop(
          context,
          ScannedDocumentResult(
            pdfBytes: pdfBytes,
            pageCount: _pages.length,
            fileName: fileName,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isConverting = false;
          _errorMessage = 'Failed to compile scanned pages into a PDF: $e';
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
        title: const Text('Scan Policy Pages'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          tooltip: 'Cancel',
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: _buildBody(isDark),
    );
  }

  Widget _buildBody(bool isDark) {
    return Column(
      children: [
        // Error banner if any
        if (_errorMessage != null)
          Container(
            width: double.infinity,
            margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFFEF2F2),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFFECACA)),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.info_outline, color: Color(0xFFDC2626), size: 18),
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

        // Scanned Pages List / Empty state
        Expanded(
          child: _pages.isEmpty
              ? _buildEmptyScanView(isDark)
              : _buildPagesGridView(isDark),
        ),

        // Bottom Actions Bar
        _buildBottomBar(isDark),
      ],
    );
  }

  Widget _buildEmptyScanView(bool isDark) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: PrismTheme.primaryBlue.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.camera_alt_outlined, color: PrismTheme.primaryBlue, size: 32),
            ),
            const SizedBox(height: 16),
            Text(
              'No Pages Captured Yet',
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w700,
                color: isDark ? Colors.white : PrismTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'Capture clear photos of your policy pages. You can capture multiple pages before confirming.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13,
                color: isDark ? Colors.white60 : PrismTheme.textSecondary,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: _capturePage,
              icon: const Icon(Icons.camera_alt, size: 18),
              label: const Text('Capture First Page'),
              style: ElevatedButton.styleFrom(
                backgroundColor: PrismTheme.primaryBlue,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPagesGridView(bool isDark) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'CAPTURED PAGES (${_pages.length})',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.8,
                color: isDark ? Colors.white54 : PrismTheme.textSecondary,
              ),
            ),
            TextButton.icon(
              onPressed: _capturePage,
              icon: const Icon(Icons.add, size: 16),
              label: const Text('Add Page', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
            ),
          ],
        ),
        const SizedBox(height: 12),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 0.72,
          ),
          itemCount: _pages.length,
          itemBuilder: (context, index) {
            final pageBytes = _pages[index];
            return Container(
              decoration: BoxDecoration(
                color: isDark ? PrismTheme.navySurface : Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isDark ? PrismTheme.navyBorder : PrismTheme.borderSubtle,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.04),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Stack(
                fit: StackFit.expand,
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(11),
                    child: Image.memory(
                      pageBytes,
                      fit: BoxFit.cover,
                    ),
                  ),
                  // Page number pill
                  Positioned(
                    top: 8,
                    left: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.75),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        'Page ${index + 1}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                  // Delete button
                  Positioned(
                    top: 6,
                    right: 6,
                    child: InkWell(
                      onTap: () => _removePage(index),
                      child: Container(
                        padding: const EdgeInsets.all(5),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.75),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.delete_outline, size: 16, color: Colors.white),
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildBottomBar(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? PrismTheme.navySurface : Colors.white,
        border: Border(
          top: BorderSide(
            color: isDark ? PrismTheme.navyBorder : PrismTheme.borderSubtle,
          ),
        ),
      ),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: _isConverting ? null : _capturePage,
                icon: const Icon(Icons.add_a_photo_outlined, size: 18),
                label: const Text('Add Page'),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              flex: 2,
              child: ElevatedButton(
                onPressed: _pages.isEmpty || _isConverting ? null : _confirmAndCompilePdf,
                style: ElevatedButton.styleFrom(
                  backgroundColor: PrismTheme.primaryBlue,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: _isConverting
                    ? const SizedBox(
                        height: 18,
                        width: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : Text(
                        _pages.isEmpty
                            ? 'Capture Pages'
                            : 'Confirm Scan (${_pages.length} ${_pages.length == 1 ? 'page' : 'pages'})',
                        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
