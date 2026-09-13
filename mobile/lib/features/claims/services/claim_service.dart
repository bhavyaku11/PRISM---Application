import 'dart:typed_data';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/errors/app_error.dart';
import '../../../core/network/api_client.dart';
import '../../policies/models/policy_model.dart';
import '../models/claim_model.dart';

class ClaimService {
  final SupabaseClient _supabaseClient;
  final ApiClient _apiClient;

  ClaimService({
    SupabaseClient? supabaseClient,
    ApiClient? apiClient,
  })  : _supabaseClient = supabaseClient ?? _getSafeClient(),
        _apiClient = apiClient ?? ApiClient();

  static SupabaseClient _getSafeClient() {
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

  User? get _currentUser => _supabaseClient.auth.currentUser;

  // ===========================================================================
  // 1. CLAIMS LIST & DETAILS
  // ===========================================================================

  /// Fetches all claims belonging to the authenticated user with policy metadata.
  Future<List<ClaimModel>> getClaims() async {
    final user = _currentUser;
    if (user == null) {
      throw const AuthError('You must be signed in to view claims.');
    }

    try {
      final res = await _supabaseClient
          .from('claims')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', ascending: false);

      final rawList = res as List<dynamic>;

      if (rawList.isEmpty) return const [];

      // Fetch user's policies to join with claims
      final policiesRes = await _supabaseClient
          .from('policies')
          .select('*')
          .eq('user_id', user.id);

      final policiesMap = <String, PolicyModel>{};
      for (final p in (policiesRes as List<dynamic>)) {
        final model = PolicyModel.fromJson(p as Map<String, dynamic>);
        policiesMap[model.id] = model;
      }

      return rawList.map((c) {
        final claimMap = c as Map<String, dynamic>;
        final policyId = claimMap['policy_id'] as String? ?? '';
        return ClaimModel.fromJson(claimMap, policy: policiesMap[policyId]);
      }).toList();
    } on PostgrestException catch (e) {
      throw ServerError(e.message, e);
    } catch (e) {
      if (e is AppError) rethrow;
      throw NetworkError(
        'Unable to load claims. Please check your internet connection.',
        e,
      );
    }
  }

  /// Fetches a single claim workspace by ID, verifying user ownership.
  Future<ClaimModel?> getClaimById(String id) async {
    final user = _currentUser;
    if (user == null) {
      throw const AuthError('You must be signed in to view claim details.');
    }

    try {
      final res = await _supabaseClient
          .from('claims')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .maybeSingle();

      if (res == null) return null;

      final claimJson = res;
      final policyId = claimJson['policy_id'] as String? ?? '';

      PolicyModel? policy;
      if (policyId.isNotEmpty) {
        final polRes = await _supabaseClient
            .from('policies')
            .select('*')
            .eq('id', policyId)
            .eq('user_id', user.id)
            .maybeSingle();
        if (polRes != null) {
          policy = PolicyModel.fromJson(polRes);
        }
      }

      return ClaimModel.fromJson(claimJson, policy: policy);
    } on PostgrestException catch (e) {
      throw ServerError(e.message, e);
    } catch (e) {
      if (e is AppError) rethrow;
      throw NetworkError('Error loading claim workspace.', e);
    }
  }

  // ===========================================================================
  // 2. CREATE & UPDATE CLAIMS
  // ===========================================================================

  /// Creates a new claim workspace initialized in 'preparing' state.
  Future<ClaimModel> createClaim({
    required String policyId,
    required String claimName,
    String claimType = 'Hospitalization',
    String? insuredMember,
    String? hospitalName,
    String? admissionDate,
    String? dischargeDate,
    num? estimatedExpense,
    String? notes,
  }) async {
    final user = _currentUser;
    if (user == null) {
      throw const AuthError('You must be signed in to create a claim.');
    }

    final cleanName = claimName.trim();
    if (cleanName.isEmpty) {
      throw const ValidationError('Claim name cannot be empty.');
    }

    if (policyId.trim().isEmpty) {
      throw const ValidationError('A health policy must be selected.');
    }

    final initialProgress = calculatePreparationProgress(
      claim: ClaimModel(
        id: '',
        userId: user.id,
        policyId: policyId,
        claimName: cleanName,
        hospitalName: hospitalName?.trim(),
        admissionDate: admissionDate,
        estimatedExpense: estimatedExpense,
        notes: notes?.trim(),
      ),
      attachedDocumentsCount: 0,
      hasReviewedEvidence: false,
      hasNotes: notes != null && notes.trim().isNotEmpty,
    );

    final payload = <String, dynamic>{
      'user_id': user.id,
      'policy_id': policyId,
      'claim_name': cleanName,
      'claim_type': claimType,
      'insured_member': insuredMember?.trim().isNotEmpty == true
          ? insuredMember!.trim()
          : null,
      'hospital_name': hospitalName?.trim().isNotEmpty == true
          ? hospitalName!.trim()
          : null,
      'admission_date': admissionDate?.trim().isNotEmpty == true
          ? admissionDate!.trim()
          : null,
      'discharge_date': dischargeDate?.trim().isNotEmpty == true
          ? dischargeDate!.trim()
          : null,
      'estimated_expense': estimatedExpense != null && estimatedExpense > 0
          ? estimatedExpense
          : null,
      'currency': 'INR',
      'status': 'preparing', // Strict adherence to DB constraint
      'preparation_progress': initialProgress,
      'notes': notes?.trim().isNotEmpty == true ? notes!.trim() : null,
    };

    try {
      final res = await _supabaseClient
          .from('claims')
          .insert(payload)
          .select()
          .single();

      return ClaimModel.fromJson(res);
    } on PostgrestException catch (e) {
      throw ServerError('Database error creating claim: ${e.message}', e);
    } catch (e) {
      if (e is AppError) rethrow;
      throw NetworkError('Failed to create claim workspace.', e);
    }
  }

  /// Updates existing claim metadata and recomputes progress.
  Future<ClaimModel> updateClaimDetails({
    required String claimId,
    String? claimName,
    String? claimType,
    String? insuredMember,
    String? hospitalName,
    String? admissionDate,
    String? dischargeDate,
    num? estimatedExpense,
    String? notes,
    int? preparationProgress,
    String? status,
  }) async {
    final user = _currentUser;
    if (user == null) {
      throw const AuthError('You must be signed in to update a claim.');
    }

    final payload = <String, dynamic>{
      'updated_at': DateTime.now().toIso8601String(),
    };

    if (claimName != null) payload['claim_name'] = claimName.trim();
    if (claimType != null) payload['claim_type'] = claimType;
    if (insuredMember != null) {
      payload['insured_member'] = insuredMember.trim().isNotEmpty ? insuredMember.trim() : null;
    }
    if (hospitalName != null) {
      payload['hospital_name'] = hospitalName.trim().isNotEmpty ? hospitalName.trim() : null;
    }
    if (admissionDate != null) {
      payload['admission_date'] = admissionDate.trim().isNotEmpty ? admissionDate.trim() : null;
    }
    if (dischargeDate != null) {
      payload['discharge_date'] = dischargeDate.trim().isNotEmpty ? dischargeDate.trim() : null;
    }
    if (estimatedExpense != null) {
      payload['estimated_expense'] = estimatedExpense > 0 ? estimatedExpense : null;
    }
    if (notes != null) {
      payload['notes'] = notes.trim().isNotEmpty ? notes.trim() : null;
    }
    if (preparationProgress != null) {
      payload['preparation_progress'] = preparationProgress.clamp(0, 100);
    }
    if (status != null && kClaimStatuses.contains(status.toLowerCase())) {
      payload['status'] = status.toLowerCase();
    }

    try {
      final res = await _supabaseClient
          .from('claims')
          .update(payload)
          .eq('id', claimId)
          .eq('user_id', user.id)
          .select()
          .single();

      return ClaimModel.fromJson(res);
    } on PostgrestException catch (e) {
      throw ServerError('Error updating claim details: ${e.message}', e);
    } catch (e) {
      if (e is AppError) rethrow;
      throw NetworkError('Network error updating claim.', e);
    }
  }

  // ===========================================================================
  // 3. CLAIM DOCUMENTS & PRIVATE STORAGE
  // ===========================================================================

  /// Fetches all documents attached to a specific claim.
  Future<List<ClaimDocumentModel>> getClaimDocuments(String claimId) async {
    final user = _currentUser;
    if (user == null) return const [];

    try {
      final res = await _supabaseClient
          .from('claim_documents')
          .select('id, user_id, claim_id, document_id, notes, created_at, documents(*)')
          .eq('claim_id', claimId)
          .eq('user_id', user.id)
          .order('created_at', ascending: false);

      final list = (res as List<dynamic>)
          .map((item) => ClaimDocumentModel.fromJson(item as Map<String, dynamic>))
          .toList();

      return list;
    } catch (_) {
      return const [];
    }
  }

  /// Uploads a claim document into private storage and records it in documents & claim_documents.
  Future<ClaimDocumentModel> uploadClaimDocument({
    required String claimId,
    required String policyId,
    required String fileName,
    required Uint8List fileBytes,
    required String category,
    String? customNotes,
    String? mimeType,
  }) async {
    final user = _currentUser;
    if (user == null) {
      throw const AuthError('Session expired. Please sign in again.');
    }

    // 1. Generate storage path: ${userId}/${policyId}/claims/${claimId}/${timestamp}_${safeName}
    final safeName = fileName.replaceAll(RegExp(r'[^a-zA-Z0-9._-]'), '_');
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final storagePath = '$user.id/$policyId/claims/$claimId/${timestamp}_$safeName';
    final resolvedMime = mimeType ??
        (fileName.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');

    try {
      // 1. Upload to Supabase Storage in 'policy-documents' bucket
      await _supabaseClient.storage.from('policy-documents').uploadBinary(
            storagePath,
            fileBytes,
            fileOptions: FileOptions(
              contentType: resolvedMime,
              upsert: false,
            ),
          );

      // 2. Insert into documents table
      final docInsert = await _supabaseClient
          .from('documents')
          .insert({
            'user_id': user.id,
            'policy_id': policyId,
            'document_name': fileName,
            'document_type': category,
            'storage_path': storagePath,
            'mime_type': resolvedMime,
            'file_size': fileBytes.length,
            'processing_status': 'processed',
            'metadata': {
              'claim_id': claimId,
              'category': category,
              'original_filename': fileName,
              'uploaded_at': DateTime.now().toIso8601String(),
              'notes': customNotes ?? '',
            },
          })
          .select()
          .single();

      final newDocId = docInsert['id'] as String;

      // 3. Link into claim_documents table
      final noteTag = '[$category]${customNotes?.isNotEmpty == true ? " $customNotes" : ""}';
      final linkRes = await _supabaseClient
          .from('claim_documents')
          .insert({
            'user_id': user.id,
            'claim_id': claimId,
            'document_id': newDocId,
            'notes': noteTag,
          })
          .select('id, user_id, claim_id, document_id, notes, created_at, documents(*)')
          .single();

      // 4. Update preparation progress in background
      _syncClaimProgressAfterDocChange(claimId);

      return ClaimDocumentModel.fromJson(linkRes);
    } on StorageException catch (e) {
      throw ServerError('Storage upload failed: ${e.message}', e);
    } on PostgrestException catch (e) {
      throw ServerError('Database error recording document: ${e.message}', e);
    } catch (e) {
      if (e is AppError) rethrow;
      throw NetworkError('Failed to upload document. Please check connection.', e);
    }
  }

  /// Removes an attached document from a claim workspace.
  Future<void> deleteClaimDocument(String claimDocId, {required String claimId}) async {
    final user = _currentUser;
    if (user == null) return;

    try {
      await _supabaseClient
          .from('claim_documents')
          .delete()
          .eq('id', claimDocId)
          .eq('user_id', user.id);

      // Recalculate preparation score
      _syncClaimProgressAfterDocChange(claimId);
    } on PostgrestException catch (e) {
      throw ServerError('Could not delete claim attachment: ${e.message}', e);
    } catch (e) {
      if (e is AppError) rethrow;
      throw NetworkError('Network error removing document.', e);
    }
  }

  Future<void> _syncClaimProgressAfterDocChange(String claimId) async {
    try {
      final claim = await getClaimById(claimId);
      if (claim == null) return;

      final docs = await getClaimDocuments(claimId);
      final newProgress = calculatePreparationProgress(
        claim: claim,
        attachedDocumentsCount: docs.length,
        hasReviewedEvidence: true,
        hasNotes: claim.notes != null && claim.notes!.trim().isNotEmpty,
      );

      await _supabaseClient.from('claims').update({
        'preparation_progress': newProgress,
        'updated_at': DateTime.now().toIso8601String(),
      }).eq('id', claimId);
    } catch (_) {
      // Non-critical background sync
    }
  }

  // ===========================================================================
  // 4. POLICY EVIDENCE RETRIEVAL VIA FASTAPI
  // ===========================================================================

  /// Calls the existing FastAPI hybrid retrieval endpoint `POST /api/retrieval/search`
  /// to fetch ranked policy evidence relevant to the claim and topic.
  Future<List<PolicyEvidenceItem>> getPolicyEvidence({
    required String policyId,
    required String claimType,
    ClaimModel? claim,
    String? topicQuery,
  }) async {
    if (policyId.trim().isEmpty) return const [];

    final queryStr = '$claimType ${topicQuery ?? "inpatient hospitalization room rent ICU limits claim procedure exclusions"}';

    try {
      final res = await _apiClient.post(
        '/api/retrieval/search',
        body: {
          'query': queryStr,
          'policy_id': policyId,
          'top_k': 5,
        },
      );

      if (res is Map<String, dynamic> && res['results'] is List) {
        final rawResults = res['results'] as List<dynamic>;
        return rawResults
            .map((item) => PolicyEvidenceItem.fromJson(
                  item as Map<String, dynamic>,
                  claim: claim,
                ))
            .toList();
      }

      return const [];
    } catch (_) {
      return const [];
    }
  }
}
