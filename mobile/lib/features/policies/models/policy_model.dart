import 'package:intl/intl.dart';

class PolicyModel {
  final String id;
  final String userId;
  final String policyName;
  final String? policyNumber;
  final String? insurerName;
  final String? policyType;
  final String? insuredMember;
  final num? sumInsured;
  final num? premium;
  final String premiumCurrency;
  final String? startDate;
  final String? endDate;
  final String status;
  final num? understandingScore;
  final String createdAt;
  final String? updatedAt;

  PolicyModel({
    required this.id,
    required this.userId,
    required this.policyName,
    this.policyNumber,
    this.insurerName,
    this.policyType,
    this.insuredMember,
    this.sumInsured,
    this.premium,
    this.premiumCurrency = 'INR',
    this.startDate,
    this.endDate,
    this.status = 'active',
    this.understandingScore,
    this.createdAt = '',
    this.updatedAt,
  });

  factory PolicyModel.fromJson(Map<String, dynamic> json) {
    return PolicyModel(
      id: json['id'] as String? ?? '',
      userId: json['user_id'] as String? ?? '',
      policyName: json['policy_name'] as String? ?? 'Health Insurance Policy',
      policyNumber: json['policy_number'] as String?,
      insurerName: json['insurer_name'] as String?,
      policyType: json['policy_type'] as String? ?? 'Health',
      insuredMember: json['insured_member'] as String?,
      sumInsured: json['sum_insured'] as num?,
      premium: json['premium'] as num?,
      premiumCurrency: json['premium_currency'] as String? ?? 'INR',
      startDate: (json['policy_start_date'] ?? json['start_date']) as String?,
      endDate: (json['policy_end_date'] ?? json['end_date']) as String?,
      status: json['status'] as String? ?? 'active',
      understandingScore: json['understanding_score'] as num?,
      createdAt: json['created_at'] as String? ?? '',
      updatedAt: json['updated_at'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'policy_name': policyName,
      'policy_number': policyNumber,
      'insurer_name': insurerName,
      'policy_type': policyType,
      'insured_member': insuredMember,
      'sum_insured': sumInsured,
      'premium': premium,
      'premium_currency': premiumCurrency,
      'policy_start_date': startDate,
      'policy_end_date': endDate,
      'status': status,
      'understanding_score': understandingScore,
      'created_at': createdAt,
      'updated_at': updatedAt,
    };
  }

  bool get isProcessing => status == 'processing' || status == 'pending';
  bool get isProcessed => status == 'processed' || status == 'active';
  bool get isFailed => status == 'failed' || status == 'error';

  String get statusBadgeLabel {
    switch (status.toLowerCase()) {
      case 'processed':
      case 'active':
        return 'Ready to explore';
      case 'processing':
        return 'Analyzing policy';
      case 'pending':
        return 'Processing pending';
      case 'failed':
      case 'error':
        return 'Needs attention';
      default:
        return status;
    }
  }

  String get formattedSumInsured {
    if (sumInsured == null) return 'Not provided';
    final format =
        NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);
    return format.format(sumInsured);
  }

  String get formattedPremium {
    if (premium == null) return 'Not provided';
    final format =
        NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);
    return format.format(premium);
  }

  String formattedDate(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return 'Not recorded';
    try {
      final d = DateTime.parse(dateStr);
      return DateFormat('dd MMM yyyy').format(d);
    } catch (_) {
      return dateStr;
    }
  }

  String get formattedStartDate => formattedDate(startDate);
  String get formattedEndDate => formattedDate(endDate);
}
