import 'package:intl/intl.dart';
import '../../policies/models/policy_model.dart';

export 'package:intl/intl.dart';

/// Supported claim types in PRISM
const List<String> kClaimTypes = [
  'Hospitalization',
  'Day Care',
  'Pre/Post Hospitalization',
  'Other',
];

/// Valid database status constraints for the `claims` table
const List<String> kClaimStatuses = [
  'preparing',
  'review',
  'submitted',
  'closed',
  'archived',
];

const Map<String, String> kClaimStatusDisplayMap = {
  'preparing': 'Preparing',
  'review': 'Ready for Review',
  'submitted': 'Submitted (Manual)',
  'closed': 'Resolved / Closed',
  'archived': 'Archived',
};

String formatClaimStatus(String? status) {
  if (status == null || status.isEmpty) return 'Preparing';
  final normalized = status.toLowerCase().trim();
  return kClaimStatusDisplayMap[normalized] ?? status;
}

/// Represents a Health Insurance Claim in PRISM
class ClaimModel {
  final String id;
  final String userId;
  final String policyId;
  final String claimName;
  final String claimType;
  final String? insuredMember;
  final String? hospitalName;
  final String? admissionDate;
  final String? dischargeDate;
  final num? estimatedExpense;
  final String currency;
  final String status;
  final int preparationProgress;
  final String? notes;
  final String createdAt;
  final String updatedAt;
  final PolicyModel? policy;

  const ClaimModel({
    required this.id,
    required this.userId,
    required this.policyId,
    required this.claimName,
    this.claimType = 'Hospitalization',
    this.insuredMember,
    this.hospitalName,
    this.admissionDate,
    this.dischargeDate,
    this.estimatedExpense,
    this.currency = 'INR',
    this.status = 'preparing',
    this.preparationProgress = 0,
    this.notes,
    this.createdAt = '',
    this.updatedAt = '',
    this.policy,
  });

  factory ClaimModel.fromJson(Map<String, dynamic> json, {PolicyModel? policy}) {
    final rawProgress = json['preparation_progress'];
    final progress = rawProgress is num ? rawProgress.toInt() : 0;

    PolicyModel? resolvedPolicy = policy;
    if (resolvedPolicy == null && json['policies'] != null) {
      final p = json['policies'];
      if (p is Map<String, dynamic>) {
        resolvedPolicy = PolicyModel.fromJson(p);
      } else if (p is List && p.isNotEmpty && p.first is Map<String, dynamic>) {
        resolvedPolicy = PolicyModel.fromJson(p.first as Map<String, dynamic>);
      }
    }

    return ClaimModel(
      id: json['id'] as String? ?? '',
      userId: json['user_id'] as String? ?? '',
      policyId: json['policy_id'] as String? ?? '',
      claimName: json['claim_name'] as String? ?? 'Untitled Claim',
      claimType: json['claim_type'] as String? ?? 'Hospitalization',
      insuredMember: json['insured_member'] as String?,
      hospitalName: json['hospital_name'] as String?,
      admissionDate: json['admission_date'] as String?,
      dischargeDate: json['discharge_date'] as String?,
      estimatedExpense: json['estimated_expense'] as num?,
      currency: json['currency'] as String? ?? 'INR',
      status: (json['status'] as String? ?? 'preparing').toLowerCase(),
      preparationProgress: progress,
      notes: json['notes'] as String?,
      createdAt: json['created_at'] as String? ?? '',
      updatedAt: json['updated_at'] as String? ?? '',
      policy: resolvedPolicy,
    );
  }

  static bool isValidStatus(String status) => kClaimStatuses.contains(status);
  String get statusLabel => formatClaimStatus(status);
  String? get policyName => policy?.policyName;
  String? get insurerName => policy?.insurerName;

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'policy_id': policyId,
      'claim_name': claimName,
      'claim_type': claimType,
      'insured_member': insuredMember,
      'hospital_name': hospitalName,
      'admission_date': admissionDate,
      'discharge_date': dischargeDate,
      'estimated_expense': estimatedExpense,
      'currency': currency,
      'status': status,
      'preparation_progress': preparationProgress,
      'notes': notes,
      'created_at': createdAt,
      'updated_at': updatedAt,
    };
  }

  ClaimModel copyWith({
    String? claimName,
    String? claimType,
    String? insuredMember,
    String? hospitalName,
    String? admissionDate,
    String? dischargeDate,
    num? estimatedExpense,
    String? status,
    int? preparationProgress,
    String? notes,
    PolicyModel? policy,
  }) {
    return ClaimModel(
      id: id,
      userId: userId,
      policyId: policyId,
      claimName: claimName ?? this.claimName,
      claimType: claimType ?? this.claimType,
      insuredMember: insuredMember ?? this.insuredMember,
      hospitalName: hospitalName ?? this.hospitalName,
      admissionDate: admissionDate ?? this.admissionDate,
      dischargeDate: dischargeDate ?? this.dischargeDate,
      estimatedExpense: estimatedExpense ?? this.estimatedExpense,
      currency: currency,
      status: status ?? this.status,
      preparationProgress: preparationProgress ?? this.preparationProgress,
      notes: notes ?? this.notes,
      createdAt: createdAt,
      updatedAt: updatedAt,
      policy: policy ?? this.policy,
    );
  }

  String get formattedExpense {
    if (estimatedExpense == null || estimatedExpense == 0) {
      return 'Pending estimation';
    }
    final formatter = NumberFormat.currency(
      locale: 'en_IN',
      symbol: '₹',
      decimalDigits: 0,
    );
    return formatter.format(estimatedExpense);
  }

  String get formattedAdmissionDate {
    if (admissionDate == null || admissionDate!.isEmpty) return 'Not set';
    try {
      final d = DateTime.parse(admissionDate!);
      return DateFormat('dd MMM yyyy').format(d);
    } catch (_) {
      return admissionDate!;
    }
  }

  String get formattedDischargeDate {
    if (dischargeDate == null || dischargeDate!.isEmpty) return 'Not set';
    try {
      final d = DateTime.parse(dischargeDate!);
      return DateFormat('dd MMM yyyy').format(d);
    } catch (_) {
      return dischargeDate!;
    }
  }
}

/// Category metadata for claim documents
class ClaimCategoryOption {
  final String id;
  final String label;
  final String description;
  final bool isMandatory;

  const ClaimCategoryOption({
    required this.id,
    required this.label,
    required this.description,
    required this.isMandatory,
  });
}

const List<ClaimCategoryOption> kClaimDocumentCategories = [
  ClaimCategoryOption(
    id: 'discharge_summary',
    label: 'Discharge Summary',
    description: 'Hospital summary with diagnosis, clinical course, treating doctor signature and stamp.',
    isMandatory: true,
  ),
  ClaimCategoryOption(
    id: 'hospital_bill',
    label: 'Hospital Final Bill & Tax Invoice',
    description: 'Detailed bill with line-item breakdown for room rent, nursing, ICU, and diagnostics.',
    isMandatory: true,
  ),
  ClaimCategoryOption(
    id: 'claim_form',
    label: 'Claim Form (Part A & Part B)',
    description: 'Insurer claim form signed by the policyholder and attending hospital authorities.',
    isMandatory: true,
  ),
  ClaimCategoryOption(
    id: 'diagnostic_reports',
    label: 'Diagnostic & Lab Reports',
    description: 'Pathology, radiology (X-Ray, CT/MRI, ultrasound) and investigation findings.',
    isMandatory: true,
  ),
  ClaimCategoryOption(
    id: 'doctor_prescription',
    label: 'Doctor Prescriptions & Advice',
    description: 'Original physician consultations, treatment orders and medication sheets.',
    isMandatory: false,
  ),
  ClaimCategoryOption(
    id: 'pharmacy_bills',
    label: 'Pharmacy Bills & Receipts',
    description: 'Medicine invoices and payment receipts with batch details and GST numbers.',
    isMandatory: false,
  ),
  ClaimCategoryOption(
    id: 'id_proof',
    label: 'KYC & Insured ID Proof',
    description: 'Government photo identity proof of the patient (Aadhaar, PAN, Voter ID).',
    isMandatory: false,
  ),
  ClaimCategoryOption(
    id: 'insurance_card',
    label: 'Health Insurance Card / Schedule',
    description: 'TPA electronic health card, policy schedule copy, or member ID card.',
    isMandatory: false,
  ),
  ClaimCategoryOption(
    id: 'medical_reports',
    label: 'Additional Hospital Records',
    description: 'Indoor case papers (ICP), temperature charts, or operation theater notes.',
    isMandatory: false,
  ),
  ClaimCategoryOption(
    id: 'other',
    label: 'Other Supporting Document',
    description: 'Any additional query response or hospital certificate.',
    isMandatory: false,
  ),
];

String getCategoryLabel(String? categoryId) {
  if (categoryId == null || categoryId.isEmpty) return 'Claim Document';
  final match = kClaimDocumentCategories.firstWhere(
    (c) => c.id == categoryId,
    orElse: () => ClaimCategoryOption(
      id: categoryId,
      label: categoryId.replaceAll('_', ' ').split(' ').map((w) {
        if (w.isEmpty) return '';
        return w[0].toUpperCase() + w.substring(1).toLowerCase();
      }).join(' '),
      description: '',
      isMandatory: false,
    ),
  );
  return match.label;
}

/// Represents a document attached to a claim
class ClaimDocumentModel {
  final String id;
  final String userId;
  final String claimId;
  final String documentId;
  final String? notes;
  final String createdAt;
  final String? documentName;
  final String? documentType;
  final String? storagePath;
  final int? fileSize;
  final String? mimeType;

  const ClaimDocumentModel({
    required this.id,
    required this.userId,
    required this.claimId,
    required this.documentId,
    this.notes,
    this.createdAt = '',
    this.documentName,
    this.documentType,
    this.storagePath,
    this.fileSize,
    this.mimeType,
  });

  factory ClaimDocumentModel.fromJson(Map<String, dynamic> json) {
    Map<String, dynamic>? docMap;
    final rawDocs = json['documents'];
    if (rawDocs is Map<String, dynamic>) {
      docMap = rawDocs;
    } else if (rawDocs is List && rawDocs.isNotEmpty && rawDocs.first is Map<String, dynamic>) {
      docMap = rawDocs.first as Map<String, dynamic>;
    }

    return ClaimDocumentModel(
      id: json['id'] as String? ?? '',
      userId: json['user_id'] as String? ?? '',
      claimId: json['claim_id'] as String? ?? '',
      documentId: json['document_id'] as String? ?? '',
      notes: json['notes'] as String?,
      createdAt: json['created_at'] as String? ?? '',
      documentName: docMap?['document_name'] as String?,
      documentType: docMap?['document_type'] as String?,
      storagePath: docMap?['storage_path'] as String?,
      fileSize: (docMap?['file_size'] as num?)?.toInt(),
      mimeType: docMap?['mime_type'] as String?,
    );
  }

  String get category {
    if (notes != null && notes!.startsWith('[') && notes!.contains(']')) {
      final end = notes!.indexOf(']');
      return notes!.substring(1, end);
    }
    return documentType ?? 'other';
  }

  String get displayName => documentName ?? 'Claim Document';

  String get formattedFileSize {
    if (fileSize == null || fileSize! <= 0) return '';
    if (fileSize! < 1024) return '$fileSize B';
    if (fileSize! < 1024 * 1024) {
      return '${(fileSize! / 1024).toStringAsFixed(1)} KB';
    }
    return '${(fileSize! / (1024 * 1024)).toStringAsFixed(1)} MB';
  }
}

/// Readiness outcome for mandatory health claim documents
class ClaimReadiness {
  final int score;
  final int uploadedMandatoryCount;
  final int totalMandatoryCount;
  final List<ClaimCategoryOption> missingMandatoryCategories;

  const ClaimReadiness({
    required this.score,
    required this.uploadedMandatoryCount,
    required this.totalMandatoryCount,
    required this.missingMandatoryCategories,
  });
}

/// Reusable deterministic calculation of mandatory document readiness.
ClaimReadiness calculateClaimReadiness(List<ClaimDocumentModel> claimDocs) {
  final mandatoryCategories =
      kClaimDocumentCategories.where((c) => c.isMandatory).toList();
  final totalMandatoryCount = mandatoryCategories.length; // 4

  final uploadedCategories = <String>{};
  for (final cd in claimDocs) {
    final docType = (cd.documentType ?? '').toLowerCase();
    final notes = (cd.notes ?? '').toLowerCase();
    final name = (cd.documentName ?? '').toLowerCase();

    for (final cat in mandatoryCategories) {
      if (docType == cat.id ||
          docType == cat.label.toLowerCase() ||
          notes.contains(cat.id) ||
          notes.contains(cat.label.toLowerCase()) ||
          (cat.id == 'discharge_summary' &&
              (name.contains('discharge') || notes.contains('discharge'))) ||
          (cat.id == 'hospital_bill' &&
              (name.contains('bill') ||
                  name.contains('invoice') ||
                  notes.contains('bill'))) ||
          (cat.id == 'claim_form' &&
              (name.contains('form') || notes.contains('form'))) ||
          (cat.id == 'diagnostic_reports' &&
              (name.contains('report') ||
                  name.contains('lab') ||
                  name.contains('ultrasound') ||
                  notes.contains('diagnostic')))) {
        uploadedCategories.add(cat.id);
      }
    }
  }

  final uploadedMandatoryCount = uploadedCategories.length;
  final rawScore = ((uploadedMandatoryCount / totalMandatoryCount) * 100).round();
  final score = rawScore.clamp(0, 100);
  final missingMandatoryCategories = mandatoryCategories
      .where((c) => !uploadedCategories.contains(c.id))
      .toList();

  return ClaimReadiness(
    score: score,
    uploadedMandatoryCount: uploadedMandatoryCount,
    totalMandatoryCount: totalMandatoryCount,
    missingMandatoryCategories: missingMandatoryCategories,
  );
}

/// Reusable deterministic calculation of claim preparation progress (0-100%).
/// Replicates PRISM web logic:
/// 1. Claim Core Details: 25% (Name 10%, Hospital 5%, Admission 5%, Expense 5%)
/// 2. Mandatory Documents: up to 45% (target 3 documents: Math.min(45, (docs / 3) * 45))
/// 3. Policy Evidence Reviewed: 15%
/// 4. User Preparation Notes / Review: 15%
int calculatePreparationProgress({
  required ClaimModel claim,
  required int attachedDocumentsCount,
  bool hasReviewedEvidence = false,
  bool hasNotes = false,
}) {
  int score = 0;

  // 1. Core details (25%)
  int detailsPoints = 0;
  if (claim.claimName.trim().isNotEmpty) detailsPoints += 10;
  if (claim.hospitalName != null && claim.hospitalName!.trim().isNotEmpty) {
    detailsPoints += 5;
  }
  if (claim.admissionDate != null && claim.admissionDate!.isNotEmpty) {
    detailsPoints += 5;
  }
  if (claim.estimatedExpense != null && claim.estimatedExpense! > 0) {
    detailsPoints += 5;
  }
  score += detailsPoints;

  // 2. Documents (up to 45%)
  const int targetDocs = 3;
  final int docPoints = ((attachedDocumentsCount / targetDocs) * 45).round();
  score += docPoints.clamp(0, 45);

  // 3. Policy Evidence Reviewed (15%)
  if (hasReviewedEvidence) {
    score += 15;
  }

  // 4. Notes & Checklist review (15%)
  if (hasNotes || (claim.notes != null && claim.notes!.trim().isNotEmpty)) {
    score += 15;
  }

  return score.clamp(0, 100);
}

/// Topic filter option for claim policy evidence search
class ClaimEvidenceTopic {
  final String id;
  final String label;
  final String querySuffix;
  final String description;

  const ClaimEvidenceTopic({
    required this.id,
    required this.label,
    required this.querySuffix,
    required this.description,
  });
}

const List<ClaimEvidenceTopic> kClaimEvidenceTopics = [
  ClaimEvidenceTopic(
    id: 'general',
    label: 'All Claim Context',
    querySuffix:
        'inpatient hospitalization room rent ICU limits claim procedure exclusions waiting period eligible expenses',
    description: 'Surfaces comprehensive clauses matching hospitalization, limits, procedures, and exclusions.',
  ),
  ClaimEvidenceTopic(
    id: 'room_rent',
    label: 'Hospitalization & Room Rent',
    querySuffix:
        'room rent limit daily capping ICU intensive care charges boarding nursing proportionate deduction single private room',
    description: 'Checks room rent categories, ICU daily limits, and proportionate billing clauses.',
  ),
  ClaimEvidenceTopic(
    id: 'pre_post',
    label: 'Pre/Post Hospitalization',
    querySuffix:
        'pre-hospitalization post-hospitalization medical expenses doctor consultations pharmacy medicines 60 days 180 days',
    description: 'Covers diagnostic and pharmacy expenses incurred before admission and after discharge.',
  ),
  ClaimEvidenceTopic(
    id: 'procedure',
    label: 'Claim Procedure & Notice',
    querySuffix:
        'claim notification notice intimation timeline emergency admission 24 hours 48 hours settlement documents submission form',
    description: 'Details insurer intimation windows, required forms, and timeline for bill submission.',
  ),
  ClaimEvidenceTopic(
    id: 'exclusions',
    label: 'Waiting Periods & Exclusions',
    querySuffix:
        'waiting period pre-existing disease specific illness exclusions permanent exceptions not payable not covered',
    description: 'Identifies waiting period requirements, specific illness moratoriums, and standard exclusions.',
  ),
  ClaimEvidenceTopic(
    id: 'copay',
    label: 'Co-pay & Deductibles',
    querySuffix:
        'co-payment deductible voluntary deductible zone copay proportionate deduction sublimit capping',
    description: 'Reviews policyholder cost-sharing, zone co-pays, and deductible clauses.',
  ),
];

/// Policy Evidence Item retrieved from pgvector
class PolicyEvidenceItem {
  final String chunkId;
  final String? documentId;
  final String? policyId;
  final int? pageNumber;
  final String sectionTitle;
  final String content;
  final double similarity;
  final String whyItMatters;

  const PolicyEvidenceItem({
    required this.chunkId,
    this.documentId,
    this.policyId,
    this.pageNumber,
    required this.sectionTitle,
    required this.content,
    required this.similarity,
    required this.whyItMatters,
  });

  factory PolicyEvidenceItem.fromJson(
    Map<String, dynamic> json, {
    ClaimModel? claim,
  }) {
    final title = json['section_title'] as String? ?? 'General Clause';
    final content = json['content'] as String? ?? '';
    final sim = (json['similarity'] as num?)?.toDouble() ?? 0.0;
    final why = _generateWhyItMatters(title, content, claim);

    return PolicyEvidenceItem(
      chunkId: json['chunk_id'] as String? ?? json['id'] as String? ?? '',
      documentId: json['document_id'] as String?,
      policyId: json['policy_id'] as String?,
      pageNumber: (json['page_number'] as num?)?.toInt(),
      sectionTitle: title,
      content: content,
      similarity: sim,
      whyItMatters: why,
    );
  }

  static String _generateWhyItMatters(
    String clauseTitle,
    String content,
    ClaimModel? claim,
  ) {
    final title = clauseTitle.toLowerCase();
    final text = content.toLowerCase();
    final hospital = claim?.hospitalName != null && claim!.hospitalName!.isNotEmpty
        ? 'at ${claim.hospitalName}'
        : 'during hospitalization';
    final claimType = claim?.claimType ?? 'hospitalization';

    if (title.contains('room') ||
        title.contains('rent') ||
        text.contains('room rent') ||
        text.contains('icu')) {
      return 'This clause appears relevant because your claim involves $claimType expenses $hospital. Review room category eligibility and daily capping limits before submitting.';
    }
    if (title.contains('waiting') ||
        title.contains('pre-existing') ||
        text.contains('waiting period')) {
      return 'Waiting period clauses govern coverage admissibility for pre-existing or specific illnesses. Check the duration requirement against your treatment onset date.';
    }
    if (title.contains('exclusion') || text.contains('not covered') || text.contains('excluded')) {
      return 'Reviewing standard exclusions ensures that treatments, medications, and consumable charges match admissible policy criteria.';
    }
    if (title.contains('procedure') ||
        title.contains('notice') ||
        text.contains('intimation') ||
        text.contains('hours')) {
      return 'Notification and document submission timelines must be observed strictly to avoid insurer queries or settlement delays.';
    }
    if (title.contains('copay') || title.contains('deductible') || text.contains('co-payment')) {
      return 'Co-payment clauses define policyholder cost-sharing percentages applicable to hospital bills or specific geographic zones.';
    }

    return 'This policy clause contains verified evidence that may impact coverage determination, room limits, or admissible claims documentation.';
  }
}
