import 'dart:typed_data';
import 'package:pdf/widgets.dart' as pw;
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/errors/app_error.dart';
import '../../../core/network/api_client.dart';
import '../models/policy_model.dart';

class ValidationResult {
  final bool isValid;
  final String? errorMessage;

  const ValidationResult.valid()
      : isValid = true,
        errorMessage = null;

  const ValidationResult.invalid(this.errorMessage) : isValid = false;
}

class PolicyCreationResult {
  final PolicyModel policy;
  final String documentId;
  final String storagePath;

  const PolicyCreationResult({
    required this.policy,
    required this.documentId,
    required this.storagePath,
  });
}

class PolicyUploadService {
  final SupabaseClient _supabaseClient;
  final ApiClient _apiClient;

  static const int maxPdfSizeBytes = 25 * 1024 * 1024; // 25 MB authoritative ceiling

  PolicyUploadService({
    SupabaseClient? supabaseClient,
    ApiClient? apiClient,
  })  : _supabaseClient = supabaseClient ?? _getSafeSupabaseClient(),
        _apiClient = apiClient ?? ApiClient();

  static SupabaseClient _getSafeSupabaseClient() {
    try {
      return Supabase.instance.client;
    } catch (_) {
      return SupabaseClient(
        'https://dummy.supabase.co',
        'dummy-key',
        authOptions: const AuthClientOptions(autoRefreshToken: false),
      );
    }
  }

  /// Inspects magic bytes and file size to ensure the file is legitimately a readable PDF.
  ValidationResult validatePdfBytes(Uint8List bytes) {
    if (bytes.isEmpty) {
      return const ValidationResult.invalid(
        'The selected PDF file is empty. Please select a valid document.',
      );
    }

    if (bytes.length > maxPdfSizeBytes) {
      return const ValidationResult.invalid(
        'Document exceeds the maximum allowed limit of 25 MB.',
      );
    }

    // PDF magic bytes: %PDF (0x25, 0x50, 0x44, 0x46)
    if (bytes.length < 4 ||
        bytes[0] != 0x25 ||
        bytes[1] != 0x50 ||
        bytes[2] != 0x44 ||
        bytes[3] != 0x46) {
      return const ValidationResult.invalid(
        'Please select a valid PDF policy document.',
      );
    }

    return const ValidationResult.valid();
  }

  /// Compiles a list of captured camera page images into a valid multi-page PDF document.
  Future<Uint8List> convertImagesToPdf(List<Uint8List> imageBytesList) async {
    if (imageBytesList.isEmpty) {
      throw const ValidationError('No scanned pages to compile.');
    }

    final doc = pw.Document();
    for (final bytes in imageBytesList) {
      final image = pw.MemoryImage(bytes);
      doc.addPage(
        pw.Page(
          build: (pw.Context context) {
            return pw.Center(
              child: pw.Image(image, fit: pw.BoxFit.contain),
            );
          },
        ),
      );
    }

    return doc.save();
  }

  String sanitizeFilename(String filename) {
    final sanitized = filename.replaceAll(RegExp(r'[^a-zA-Z0-9._-]'), '_');
    return sanitized.isEmpty ? 'policy_document.pdf' : sanitized;
  }

  /// Creates a Policy record, uploads PDF bytes to private Supabase Storage,
  /// creates the Document record, and optionally triggers processing.
  Future<PolicyCreationResult> createPolicyAndUpload({
    required String policyName,
    required String insurerName,
    String? policyNumber,
    String? policyType,
    String? insuredMember,
    String? startDate,
    String? endDate,
    num? sumInsured,
    num? premium,
    required String fileName,
    required Uint8List fileBytes,
    void Function(String stepMessage)? onProgress,
  }) async {
    // 1. Authenticate user
    final user = _supabaseClient.auth.currentUser;
    if (user == null) {
      throw const AuthError('Your session has expired. Please sign in again.');
    }

    // 2. Validate PDF bytes
    final validation = validatePdfBytes(fileBytes);
    if (!validation.isValid) {
      throw ValidationError(validation.errorMessage!);
    }

    onProgress?.call('Creating policy record...');

    // 3. Insert Policy Record in public.policies
    Map<String, dynamic>? policyData;
    try {
      final res = await _supabaseClient
          .from('policies')
          .insert({
            'user_id': user.id,
            'policy_name': policyName.trim(),
            'insurer_name': insurerName.trim(),
            'policy_number': policyNumber?.trim().isNotEmpty == true ? policyNumber!.trim() : null,
            'policy_type': policyType?.trim().isNotEmpty == true ? policyType!.trim() : 'Health Insurance',
            'insured_member': insuredMember?.trim().isNotEmpty == true ? insuredMember!.trim() : null,
            'policy_start_date': startDate?.isNotEmpty == true ? startDate : null,
            'policy_end_date': endDate?.isNotEmpty == true ? endDate : null,
            'sum_insured': sumInsured,
            'premium': premium,
            'premium_currency': 'INR',
            'status': 'processing',
            'understanding_score': null,
          })
          .select()
          .single();

      policyData = res;
    } catch (e) {
      throw ServerError('Could not save policy information. Please check the values and try again.', e);
    }

    final policy = PolicyModel.fromJson(policyData);
    final policyId = policy.id;

    // 4. Upload PDF to private Supabase Storage bucket `policy-documents`
    onProgress?.call('Uploading document to private vault...');
    final uniqueSuffix = '${DateTime.now().millisecondsSinceEpoch}_${policyId.substring(0, policyId.length > 6 ? 6 : policyId.length)}';
    final safeFileName = '${uniqueSuffix}_${sanitizeFilename(fileName)}';
    final storagePath = '${user.id}/$policyId/$safeFileName';

    try {
      await _supabaseClient.storage.from('policy-documents').uploadBinary(
            storagePath,
            fileBytes,
            fileOptions: const FileOptions(
              contentType: 'application/pdf',
              upsert: false,
            ),
          );
    } catch (uploadError) {
      // Rollback policy to prevent orphaned policy records
      await _rollbackPolicy(policyId);
      throw NetworkError(
        'We could not upload your policy document to secure storage. Please check your connection and try again.',
        uploadError,
      );
    }

    // 5. Create Document record in public.documents
    onProgress?.call('Recording document index...');
    Map<String, dynamic>? docData;
    try {
      final docRes = await _supabaseClient
          .from('documents')
          .insert({
            'user_id': user.id,
            'policy_id': policyId,
            'document_name': fileName,
            'document_type': 'policy',
            'storage_path': storagePath,
            'mime_type': 'application/pdf',
            'file_size': fileBytes.length,
            'page_count': null,
            'processing_status': 'pending',
            'processing_error': null,
            'extracted_text': null,
            'metadata': {
              'original_filename': fileName,
              'uploaded_at': DateTime.now().toIso8601String(),
            },
          })
          .select()
          .single();

      docData = docRes;
    } catch (docError) {
      // Rollback both storage file and policy record
      await _rollbackStorage(storagePath);
      await _rollbackPolicy(policyId);
      throw ServerError('Failed to record the uploaded document in PRISM database.', docError);
    }

    final documentId = docData['id'] as String;

    return PolicyCreationResult(
      policy: policy,
      documentId: documentId,
      storagePath: storagePath,
    );
  }

  /// Triggers the existing FastAPI backend processing pipeline for the uploaded document.
  Future<Map<String, dynamic>> triggerProcessing(String documentId) async {
    try {
      final res = await _apiClient.post('/api/documents/$documentId/process');
      return res is Map<String, dynamic> ? res : <String, dynamic>{};
    } catch (e) {
      if (e is AppError) rethrow;
      throw NetworkError('Unable to connect to document processing engine.', e);
    }
  }

  /// Polls the document processing status.
  Future<Map<String, dynamic>> getDocumentStatus(String documentId) async {
    try {
      final res = await _apiClient.get('/api/documents/$documentId/status');
      if (res is Map<String, dynamic>) {
        return res;
      }
    } catch (_) {
      // Fallback to Supabase directly if backend status endpoint is unreachable
    }

    try {
      final user = _supabaseClient.auth.currentUser;
      if (user == null) {
        throw const AuthError('Session expired.');
      }
      final res = await _supabaseClient
          .from('documents')
          .select('*')
          .eq('id', documentId)
          .eq('user_id', user.id)
          .maybeSingle();

      return res ?? <String, dynamic>{};
    } catch (e) {
      if (e is AppError) rethrow;
      throw NetworkError('Unable to check processing status.', e);
    }
  }

  Future<void> _rollbackPolicy(String policyId) async {
    try {
      await _supabaseClient.from('policies').delete().eq('id', policyId);
    } catch (_) {}
  }

  Future<void> _rollbackStorage(String storagePath) async {
    try {
      await _supabaseClient.storage.from('policy-documents').remove([storagePath]);
    } catch (_) {}
  }
}
