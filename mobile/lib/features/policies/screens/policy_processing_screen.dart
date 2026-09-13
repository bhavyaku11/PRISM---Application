import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../app/theme.dart';
import '../models/policy_model.dart';
import '../services/policy_service.dart';
import '../services/policy_upload_service.dart';

class PolicyProcessingScreen extends StatefulWidget {
  final String policyId;
  final String? documentId;
  final String? initialStatus;
  final PolicyService? policyService;
  final PolicyUploadService? uploadService;

  const PolicyProcessingScreen({
    super.key,
    required this.policyId,
    this.documentId,
    this.initialStatus,
    this.policyService,
    this.uploadService,
  });

  @override
  State<PolicyProcessingScreen> createState() => _PolicyProcessingScreenState();
}

class _PolicyProcessingScreenState extends State<PolicyProcessingScreen> {
  late final PolicyService _policyService;
  late final PolicyUploadService _uploadService;

  PolicyModel? _policy;
  Map<String, dynamic>? _document;
  String? _documentId;
  String _status = 'pending';
  String? _errorMessage;
  bool _isLoading = true;
  bool _isRetrying = false;

  Map<String, int>? _metrics;
  Timer? _pollingTimer;
  int _pollCount = 0;
  static const int _maxPolls = 60; // 60 * 2.5s = 150 seconds max polling

  @override
  void initState() {
    super.initState();
    _policyService = widget.policyService ?? PolicyService();
    _uploadService = widget.uploadService ?? PolicyUploadService();
    _documentId = widget.documentId;
    if (widget.initialStatus != null) {
      _status = widget.initialStatus!;
    }
    _loadInitialData();
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }

  Future<void> _loadInitialData() async {
    setState(() => _isLoading = true);

    try {
      final policy = await _policyService.getPolicyById(widget.policyId);
      final doc = await _policyService.getPolicyDocument(widget.policyId);

      if (mounted) {
        setState(() {
          _policy = policy;
          _document = doc;
          if (doc != null && doc['id'] != null) {
            _documentId = doc['id'] as String;
          }

          final backendDocStatus = doc?['processing_status'] as String?;
          if (backendDocStatus != null && backendDocStatus.isNotEmpty) {
            _status = backendDocStatus;
          }

          final backendError = doc?['processing_error'] as String?;
          if (backendError != null && backendError.isNotEmpty) {
            _errorMessage = backendError;
          }

          _extractMetricsFromDoc(doc);
          _isLoading = false;
        });

        // Trigger processing if pending or start polling if actively processing
        if (_status == 'pending' || _status == 'processing') {
          _triggerOrPoll();
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _status = 'failed';
          _errorMessage = 'Could not load policy details. Please check connection.';
        });
      }
    }
  }

  void _extractMetricsFromDoc(Map<String, dynamic>? doc) {
    if (doc == null) return;
    final metadata = doc['metadata'];
    if (metadata is Map) {
      _metrics = {
        'page_count': (metadata['page_count'] as num?)?.toInt() ?? (doc['page_count'] as num?)?.toInt() ?? 0,
        'pages_with_text': (metadata['pages_with_text'] as num?)?.toInt() ?? 0,
        'pages_without_text': (metadata['pages_without_text'] as num?)?.toInt() ?? 0,
        'chunks_created': (metadata['chunks_created'] as num?)?.toInt() ?? 0,
        'sections_detected': (metadata['sections_detected'] as num?)?.toInt() ?? 0,
      };
    }
  }

  void _triggerOrPoll() {
    if (_documentId == null) return;

    if (_status == 'pending') {
      _startBackendProcessing();
    } else if (_status == 'processing') {
      _startPolling();
    }
  }

  Future<void> _startBackendProcessing() async {
    final docId = _documentId;
    if (docId == null) return;

    setState(() {
      _status = 'processing';
      _errorMessage = null;
    });

    try {
      final res = await _uploadService.triggerProcessing(docId);
      if (res.isNotEmpty && mounted) {
        final newStatus = res['processing_status'] as String? ?? res['status'] as String? ?? 'processed';
        setState(() {
          _status = newStatus;
          _metrics = {
            'page_count': (res['page_count'] as num?)?.toInt() ?? 0,
            'pages_with_text': (res['pages_with_text'] as num?)?.toInt() ?? 0,
            'pages_without_text': (res['pages_without_text'] as num?)?.toInt() ?? 0,
            'chunks_created': (res['chunks_created'] as num?)?.toInt() ?? 0,
            'sections_detected': (res['sections_detected'] as num?)?.toInt() ?? 0,
          };
          if (newStatus == 'failed') {
            _errorMessage = res['error'] as String? ?? 'Document processing failed.';
          }
        });

        if (newStatus == 'processing') {
          _startPolling();
        }
      }
    } catch (_) {
      // Backend may be asynchronous, start polling status
      _startPolling();
    }
  }

  void _startPolling() {
    _pollingTimer?.cancel();
    _pollCount = 0;
    _pollingTimer = Timer.periodic(const Duration(milliseconds: 2500), (timer) async {
      _pollCount++;
      if (_pollCount > _maxPolls) {
        timer.cancel();
        if (mounted && _status == 'processing') {
          setState(() {
            _status = 'failed';
            _errorMessage = 'Processing timed out. Please check back later or retry.';
          });
        }
        return;
      }

      final docId = _documentId;
      if (docId == null) return;

      try {
        final statusRes = await _uploadService.getDocumentStatus(docId);
        final currentStatus = statusRes['processing_status'] as String? ?? statusRes['status'] as String?;

        if (currentStatus != null && currentStatus != _status && mounted) {
          setState(() {
            _status = currentStatus;
            if (currentStatus == 'failed') {
              _errorMessage = statusRes['processing_error'] as String? ?? statusRes['error'] as String? ?? 'Document extraction failed.';
              timer.cancel();
            } else if (currentStatus == 'processed') {
              _extractMetricsFromDoc(statusRes);
              timer.cancel();
            }
          });
        } else if (currentStatus == 'processed' && mounted) {
          _extractMetricsFromDoc(statusRes);
          timer.cancel();
        }
      } catch (_) {
        // Polling error silently tolerated up to timeout
      }
    });
  }

  Future<void> _handleRetry() async {
    final docId = _documentId;
    if (docId == null) return;

    setState(() {
      _isRetrying = true;
      _errorMessage = null;
      _status = 'processing';
    });

    try {
      final res = await _uploadService.triggerProcessing(docId);
      if (mounted) {
        setState(() {
          _isRetrying = false;
          final newStatus = res['processing_status'] as String? ?? res['status'] as String? ?? 'processed';
          _status = newStatus;
          if (newStatus == 'processed') {
            _metrics = {
              'page_count': (res['page_count'] as num?)?.toInt() ?? 0,
              'pages_with_text': (res['pages_with_text'] as num?)?.toInt() ?? 0,
              'pages_without_text': (res['pages_without_text'] as num?)?.toInt() ?? 0,
              'chunks_created': (res['chunks_created'] as num?)?.toInt() ?? 0,
              'sections_detected': (res['sections_detected'] as num?)?.toInt() ?? 0,
            };
          } else if (newStatus == 'failed') {
            _errorMessage = res['error'] as String? ?? 'Document processing failed. Please try again.';
          } else {
            _startPolling();
          }
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isRetrying = false;
          _status = 'failed';
          _errorMessage = e.toString().replaceFirst('Exception: ', '');
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isComplete = _status == 'processed';
    final isProcessing = _status == 'processing' || _status == 'pending';
    final isFailed = _status == 'failed';

    return Scaffold(
      backgroundColor: isDark ? PrismTheme.navyDark : PrismTheme.backgroundLight,
      appBar: AppBar(
        title: const Text('Policy Processing'),
        centerTitle: false,
        backgroundColor: isDark ? PrismTheme.navySurface : Colors.white,
        elevation: 0,
        scrolledUnderElevation: 1,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go('/policies');
            }
          },
        ),
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(
                strokeWidth: 2.5,
                color: PrismTheme.primaryBlue,
              ),
            )
          : RefreshIndicator(
              onRefresh: _loadInitialData,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Status Hero Card
                    _buildHeroCard(context, isDark, isComplete, isProcessing, isFailed),
                    const SizedBox(height: 16),

                    // Metrics Card (when completed)
                    if (isComplete && _metrics != null) ...[
                      _buildMetricsCard(context, isDark),
                      const SizedBox(height: 16),
                    ],

                    // Document & Policy Summary Card
                    _buildSummaryCard(context, isDark),
                    const SizedBox(height: 16),

                    // Step Pipeline Breakdown
                    _buildPipelineCard(context, isDark, isComplete, isProcessing, isFailed),
                    const SizedBox(height: 24),

                    // Action Buttons
                    _buildActions(context, isDark, isComplete, isFailed),
                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildHeroCard(
    BuildContext context,
    bool isDark,
    bool isComplete,
    bool isProcessing,
    bool isFailed,
  ) {
    Color iconBg;
    Widget iconWidget;
    String badgeText;
    Color badgeBg;
    Color badgeTextColor;
    String titleText;
    String descText;

    if (isComplete) {
      iconBg = isDark ? const Color(0xFF064E3B).withValues(alpha: 0.4) : const Color(0xFFECFDF5);
      iconWidget = const Icon(Icons.check_circle_outline, size: 32, color: PrismTheme.success);
      badgeText = 'Document Processed & Indexed';
      badgeBg = isDark ? const Color(0xFF064E3B).withValues(alpha: 0.3) : const Color(0xFFD1FAE5);
      badgeTextColor = isDark ? const Color(0xFF6EE7B7) : const Color(0xFF047857);
      titleText = 'Your policy is ready for PRISM';
      descText = 'PyMuPDF has completed page-by-page text extraction and structured chunking. Your document is ready for evidence retrieval.';
    } else if (isFailed) {
      iconBg = isDark ? const Color(0xFF7F1D1D).withValues(alpha: 0.4) : const Color(0xFFFEF2F2);
      iconWidget = const Icon(Icons.error_outline, size: 32, color: PrismTheme.error);
      badgeText = 'Processing Failed';
      badgeBg = isDark ? const Color(0xFF7F1D1D).withValues(alpha: 0.3) : const Color(0xFFFEE2E2);
      badgeTextColor = isDark ? const Color(0xFFFCA5A5) : const Color(0xFFB91C1C);
      titleText = 'Could not process document';
      descText = _errorMessage ?? 'We were unable to extract text from this PDF. Please verify the document and try again.';
    } else {
      iconBg = isDark ? const Color(0xFF1E3A8A).withValues(alpha: 0.4) : const Color(0xFFEFF6FF);
      iconWidget = const SizedBox(
        width: 28,
        height: 28,
        child: CircularProgressIndicator(
          strokeWidth: 2.5,
          color: PrismTheme.primaryBlue,
        ),
      );
      badgeText = 'Processing Policy Document';
      badgeBg = isDark ? const Color(0xFF1E3A8A).withValues(alpha: 0.3) : const Color(0xFFDBEAFE);
      badgeTextColor = isDark ? const Color(0xFF93C5FD) : const Color(0xFF1D4ED8);
      titleText = 'Processing your policy';
      descText = 'PRISM is organizing your policy so you can explore its coverage, waiting periods, exclusions, and important limits.';
    }

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: isDark ? PrismTheme.navySurface : PrismTheme.surfaceWhite,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? PrismTheme.navyBorder : PrismTheme.borderSubtle,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.25 : 0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          // Icon Box
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: iconBg,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Center(child: iconWidget),
          ),
          const SizedBox(height: 16),

          // Status Badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              color: badgeBg,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              badgeText,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: badgeTextColor,
                letterSpacing: 0.3,
              ),
            ),
          ),
          const SizedBox(height: 12),

          // Title
          Text(
            titleText,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: isDark ? Colors.white : PrismTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 8),

          // Description
          Text(
            descText,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 13,
              height: 1.4,
              color: isDark ? PrismTheme.textMuted : PrismTheme.textSecondary,
            ),
          ),

          // Retry Button if Failed
          if (isFailed) ...[
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: _isRetrying ? null : _handleRetry,
              icon: _isRetrying
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Icon(Icons.refresh, size: 18),
              label: Text(_isRetrying ? 'Retrying...' : 'Retry Document Processing'),
              style: ElevatedButton.styleFrom(
                backgroundColor: PrismTheme.error,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildMetricsCard(BuildContext context, bool isDark) {
    final m = _metrics!;
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? PrismTheme.navySurface : PrismTheme.surfaceWhite,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isDark ? const Color(0xFF065F46) : const Color(0xFFA7F3D0),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  'Extraction & Chunking Results',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: isDark ? const Color(0xFF6EE7B7) : const Color(0xFF047857),
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF064E3B) : const Color(0xFFD1FAE5),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'Active',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: isDark ? const Color(0xFF6EE7B7) : const Color(0xFF047857),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              _metricTile(context, isDark, '${m['page_count'] ?? 0}', 'Total Pages'),
              const SizedBox(width: 8),
              _metricTile(context, isDark, '${m['pages_with_text'] ?? 0}', 'Pages w/ Text', color: PrismTheme.success),
              const SizedBox(width: 8),
              _metricTile(context, isDark, '${m['sections_detected'] ?? 0}', 'Sections', color: PrismTheme.primaryBlue),
              const SizedBox(width: 8),
              _metricTile(context, isDark, '${m['chunks_created'] ?? 0}', 'Page Chunks'),
            ],
          ),
          if ((m['pages_without_text'] ?? 0) > 0) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF451A03).withValues(alpha: 0.5) : const Color(0xFFFEF3C7),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: isDark ? const Color(0xFF78350F) : const Color(0xFFFDE68A),
                ),
              ),
              child: Text(
                'Note: ${m['pages_without_text']} page(s) contained scans or no extractable text. They will be queued for OCR processing in a future update.',
                style: TextStyle(
                  fontSize: 11,
                  color: isDark ? const Color(0xFFFCD34D) : const Color(0xFF92400E),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _metricTile(BuildContext context, bool isDark, String value, String label, {Color? color}) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
        decoration: BoxDecoration(
          color: isDark ? PrismTheme.navyDark : const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isDark ? PrismTheme.navyBorder : const Color(0xFFE2E8F0),
          ),
        ),
        child: Column(
          children: [
            Text(
              value,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: color ?? (isDark ? Colors.white : PrismTheme.textPrimary),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w500,
                color: isDark ? PrismTheme.textMuted : PrismTheme.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryCard(BuildContext context, bool isDark) {
    final policy = _policy;
    final doc = _document;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? PrismTheme.navySurface : PrismTheme.surfaceWhite,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isDark ? PrismTheme.navyBorder : PrismTheme.borderSubtle,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  'Uploaded Policy Details',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.5,
                    color: isDark ? PrismTheme.textMuted : PrismTheme.textSecondary,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: isDark ? PrismTheme.navyDark : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'Status: $_status',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: isDark ? Colors.white : PrismTheme.textPrimary,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _detailRow(context, isDark, 'Policy Name', policy?.policyName ?? 'Loading...'),
          const Divider(height: 16),
          _detailRow(context, isDark, 'Insurer', policy?.insurerName ?? 'Loading...'),
          const Divider(height: 16),
          _detailRow(context, isDark, 'Policy Type', policy?.policyType ?? 'Health Insurance'),
          if (policy?.policyNumber != null) ...[
            const Divider(height: 16),
            _detailRow(context, isDark, 'Policy Number', policy!.policyNumber!),
          ],
          if (policy?.sumInsured != null) ...[
            const Divider(height: 16),
            _detailRow(context, isDark, 'Sum Insured', '₹${policy!.sumInsured!.toStringAsFixed(0)}'),
          ],
          if (doc != null && doc['document_name'] != null) ...[
            const Divider(height: 16),
            _detailRow(context, isDark, 'Document Name', doc['document_name'].toString()),
          ],
        ],
      ),
    );
  }

  Widget _detailRow(BuildContext context, bool isDark, String label, String value) {
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
              color: isDark ? Colors.white : PrismTheme.textPrimary,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPipelineCard(
    BuildContext context,
    bool isDark,
    bool isComplete,
    bool isProcessing,
    bool isFailed,
  ) {
    final steps = [
      {
        'title': 'PDF Uploaded to Private Storage',
        'desc': 'Stored securely in user-scoped policy-documents bucket',
        'status': 'complete',
      },
      {
        'title': 'Policy & Document Records Created',
        'desc': 'Indexed in Supabase PostgreSQL with RLS',
        'status': 'complete',
      },
      {
        'title': 'Page-Aware Extraction & Section Detection',
        'desc': isComplete
            ? 'PyMuPDF parsed pages and identified insurance sections'
            : isFailed
                ? 'Extraction could not be completed'
                : isProcessing
                    ? 'Extracting text and identifying insurance clauses...'
                    : 'Scheduled for processing',
        'status': isComplete ? 'complete' : isFailed ? 'failed' : isProcessing ? 'active' : 'upcoming',
      },
      {
        'title': 'Page-Aware Chunking & Vault Storage',
        'desc': isComplete
            ? '${_metrics?['chunks_created'] ?? 0} page-aware chunks stored in document_chunks'
            : isProcessing
                ? 'Generating chunks with page citations...'
                : 'Waiting for text extraction',
        'status': isComplete ? 'complete' : isProcessing ? 'active' : 'upcoming',
      },
      {
        'title': 'PRISM Evidence Retrieval & Analysis',
        'desc': 'Scheduled for Ask PRISM and Intelligence features',
        'status': 'upcoming',
      },
    ];

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? PrismTheme.navySurface : PrismTheme.surfaceWhite,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isDark ? PrismTheme.navyBorder : PrismTheme.borderSubtle,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'PRISM Ingestion Pipeline',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.5,
              color: isDark ? PrismTheme.textMuted : PrismTheme.textSecondary,
            ),
          ),
          const SizedBox(height: 16),
          ...steps.asMap().entries.map((entry) {
            final idx = entry.key;
            final item = entry.value;
            return _pipelineStepItem(context, isDark, idx + 1, item['title']!, item['desc']!, item['status']!);
          }),
        ],
      ),
    );
  }

  Widget _pipelineStepItem(
    BuildContext context,
    bool isDark,
    int stepNumber,
    String title,
    String desc,
    String status,
  ) {
    Widget indicator;
    if (status == 'complete') {
      indicator = Container(
        width: 24,
        height: 24,
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF064E3B) : const Color(0xFFECFDF5),
          shape: BoxShape.circle,
          border: Border.all(color: PrismTheme.success),
        ),
        child: const Center(
          child: Icon(Icons.check, size: 14, color: PrismTheme.success),
        ),
      );
    } else if (status == 'active') {
      indicator = Container(
        width: 24,
        height: 24,
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1E3A8A) : const Color(0xFFEFF6FF),
          shape: BoxShape.circle,
          border: Border.all(color: PrismTheme.primaryBlue),
        ),
        child: const Center(
          child: SizedBox(
            width: 12,
            height: 12,
            child: CircularProgressIndicator(strokeWidth: 2, color: PrismTheme.primaryBlue),
          ),
        ),
      );
    } else if (status == 'failed') {
      indicator = Container(
        width: 24,
        height: 24,
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF7F1D1D) : const Color(0xFFFEF2F2),
          shape: BoxShape.circle,
          border: Border.all(color: PrismTheme.error),
        ),
        child: const Center(
          child: Icon(Icons.close, size: 14, color: PrismTheme.error),
        ),
      );
    } else {
      indicator = Container(
        width: 24,
        height: 24,
        decoration: BoxDecoration(
          color: isDark ? PrismTheme.navyDark : const Color(0xFFF1F5F9),
          shape: BoxShape.circle,
        ),
        child: Center(
          child: Text(
            '$stepNumber',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: isDark ? PrismTheme.textMuted : PrismTheme.textSecondary,
            ),
          ),
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          indicator,
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: isDark ? Colors.white : PrismTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  desc,
                  style: TextStyle(
                    fontSize: 11,
                    color: isDark ? PrismTheme.textMuted : PrismTheme.textSecondary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActions(BuildContext context, bool isDark, bool isComplete, bool isFailed) {
    return Column(
      children: [
        if (isComplete) ...[
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton.icon(
              onPressed: () => context.go('/policies/${widget.policyId}'),
              icon: const Icon(Icons.description_outlined),
              label: const Text(
                'Explore Policy Details',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: PrismTheme.primaryBlue,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
            ),
          ),
          const SizedBox(height: 12),
        ],
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () => context.go('/policies'),
                style: OutlinedButton.styleFrom(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  side: BorderSide(
                    color: isDark ? PrismTheme.navyBorder : PrismTheme.borderSubtle,
                  ),
                ),
                child: Text(
                  'My Policies',
                  style: TextStyle(
                    color: isDark ? Colors.white : PrismTheme.textPrimary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: OutlinedButton(
                onPressed: () => context.push('/policies/add'),
                style: OutlinedButton.styleFrom(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  side: BorderSide(
                    color: isDark ? PrismTheme.navyBorder : PrismTheme.borderSubtle,
                  ),
                ),
                child: Text(
                  '+ Add Another',
                  style: TextStyle(
                    color: isDark ? Colors.white : PrismTheme.textPrimary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}
