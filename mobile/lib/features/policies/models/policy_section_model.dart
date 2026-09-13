class PolicySectionModel {
  final String id;
  final String userId;
  final String policyId;
  final String? documentId;
  final String sectionType;
  final String title;
  final String content;
  final int pageStart;
  final int pageEnd;
  final double? confidence;
  final Map<String, dynamic>? metadata;
  final String createdAt;

  PolicySectionModel({
    required this.id,
    required this.userId,
    required this.policyId,
    this.documentId,
    required this.sectionType,
    required this.title,
    required this.content,
    required this.pageStart,
    required this.pageEnd,
    this.confidence,
    this.metadata,
    this.createdAt = '',
  });

  factory PolicySectionModel.fromJson(Map<String, dynamic> json) {
    return PolicySectionModel(
      id: json['id'] as String? ?? '',
      userId: json['user_id'] as String? ?? '',
      policyId: json['policy_id'] as String? ?? '',
      documentId: json['document_id'] as String?,
      sectionType: json['section_type'] as String? ?? 'general',
      title: json['title'] as String? ?? 'Policy Section',
      content: json['content'] as String? ?? '',
      pageStart: (json['page_start'] as num?)?.toInt() ?? 1,
      pageEnd: (json['page_end'] as num?)?.toInt() ?? 1,
      confidence: (json['confidence'] as num?)?.toDouble(),
      metadata: json['metadata'] as Map<String, dynamic>?,
      createdAt: json['created_at'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'policy_id': policyId,
      'document_id': documentId,
      'section_type': sectionType,
      'title': title,
      'content': content,
      'page_start': pageStart,
      'page_end': pageEnd,
      'confidence': confidence,
      'metadata': metadata,
      'created_at': createdAt,
    };
  }

  String get pageRangeText {
    if (pageEnd > pageStart) {
      return 'Pages $pageStart–$pageEnd';
    }
    return 'Page $pageStart';
  }

  bool get isLowConfidence => confidence != null && confidence! < 0.70;

  String get humanSectionType {
    switch (sectionType.toLowerCase()) {
      case 'coverage':
        return 'Coverage Benefit';
      case 'exclusions':
        return 'Exclusion';
      case 'waiting_period':
        return 'Waiting Period';
      case 'copayment':
        return 'Co-Payment';
      case 'deductible':
        return 'Deductible';
      case 'limits':
        return 'Limit / Sub-Limit';
      case 'conditions':
        return 'Condition';
      case 'claims':
        return 'Claim Procedure';
      default:
        return 'General Clause';
    }
  }
}
